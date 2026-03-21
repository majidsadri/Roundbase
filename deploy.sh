#!/usr/bin/env bash
set -euo pipefail

# ─── Configuration ────────────────────────────────────────────
SERVER="ubuntu@18.215.164.114"
SSH_KEY="$HOME/.ssh/id_rsa"
REMOTE_DIR="/mnt/roundbase"
DOMAIN="www.roundbase.net"
PORT=5004
NODE_BIN="/home/ubuntu/.nvm/versions/node/v20.20.1/bin"
SSH_CMD="ssh -o StrictHostKeyChecking=no -i $SSH_KEY $SERVER"
RSYNC_SSH="ssh -i $SSH_KEY"

echo "╔══════════════════════════════════════╗"
echo "║     Deploying Roundbase              ║"
echo "╚══════════════════════════════════════╝"

# ─── Step 1: Build locally ────────────────────────────────────
echo ""
echo "▶ [1/8] Building Next.js standalone..."
npx prisma generate
npm run build

# ─── Step 2: Pre-flight checks ───────────────────────────────
echo ""
echo "▶ [2/8] Pre-flight checks..."
$SSH_CMD "sudo mkdir -p $REMOTE_DIR/data $REMOTE_DIR/app/public/uploads && sudo chown -R ubuntu:ubuntu $REMOTE_DIR"

# Check disk space — abort if less than 200MB free
AVAIL=$($SSH_CMD "df / --output=avail | tail -1 | tr -d ' '")
AVAIL_MB=$((AVAIL / 1024))
echo "   Disk available: ${AVAIL_MB}MB"
if [ "$AVAIL_MB" -lt 200 ]; then
  echo "   ⚠ Low disk space — running cleanup..."
  $SSH_CMD "sudo journalctl --vacuum-size=10M 2>/dev/null; sudo apt clean 2>/dev/null; sudo rm -rf /var/lib/snapd/cache/* /home/ubuntu/.npm/_npx /home/ubuntu/.cache 2>/dev/null; true"
  AVAIL=$($SSH_CMD "df / --output=avail | tail -1 | tr -d ' '")
  AVAIL_MB=$((AVAIL / 1024))
  echo "   Disk after cleanup: ${AVAIL_MB}MB"
  if [ "$AVAIL_MB" -lt 100 ]; then
    echo "   ✗ Not enough disk space to deploy (need at least 100MB free). Aborting."
    exit 1
  fi
fi

# ─── Step 3: Stop service before syncing ────────────────────
echo ""
echo "▶ [3/8] Stopping service..."
$SSH_CMD "sudo systemctl stop roundbase.service 2>/dev/null || true"

# ─── Step 4: Sync build to server ────────────────────────────
echo ""
echo "▶ [4/8] Syncing standalone build to server..."

# Standalone app (includes traced node_modules)
# Exclude linux native binary (installed separately) and uploads (created on server)
rsync -avz --delete \
  --exclude='node_modules/@libsql/linux-x64-gnu' \
  --exclude='public/uploads' \
  -e "$RSYNC_SSH" \
  .next/standalone/ \
  "$SERVER:$REMOTE_DIR/app/"

# Static assets (standalone doesn't include these — sync immediately after)
rsync -avz --delete \
  -e "$RSYNC_SSH" \
  .next/static/ \
  "$SERVER:$REMOTE_DIR/app/.next/static/"

# Verify static assets landed
REMOTE_CSS=$($SSH_CMD "ls $REMOTE_DIR/app/.next/static/css/*.css 2>/dev/null | head -1")
if [ -z "$REMOTE_CSS" ]; then
  echo "   ✗ Static CSS not found on server after sync. Retrying..."
  rsync -avz --delete \
    -e "$RSYNC_SSH" \
    .next/static/ \
    "$SERVER:$REMOTE_DIR/app/.next/static/"
fi

# Public directory (preserve existing uploads with no --delete)
rsync -avz \
  -e "$RSYNC_SSH" \
  public/ \
  "$SERVER:$REMOTE_DIR/app/public/"

# Prisma schema + generated client (needed at runtime)
rsync -avz \
  -e "$RSYNC_SSH" \
  prisma/ \
  "$SERVER:$REMOTE_DIR/app/prisma/"

# ─── Step 4.5: Sync env vars ────────────────────────────
echo ""
echo "▶ [4.5/8] Syncing environment variables..."
rsync -avz \
  -e "$RSYNC_SSH" \
  .env.local \
  "$SERVER:$REMOTE_DIR/.env"

# ─── Step 5: Database (first deploy only) ────────────────────
echo ""
echo "▶ [5/8] Checking database..."
$SSH_CMD "test -f $REMOTE_DIR/data/roundbase.db" && echo "   Database exists, skipping." || {
  echo "   First deploy — copying database..."
  rsync -avz \
    -e "$RSYNC_SSH" \
    dev.db \
    "$SERVER:$REMOTE_DIR/data/roundbase.db"
}

# ─── Step 6: Fix native binaries for Linux ───────────────────
echo ""
echo "▶ [6/8] Installing Linux native binary for libsql..."
$SSH_CMD "export PATH=$NODE_BIN:\$PATH && cd $REMOTE_DIR/app && npm install --no-save @libsql/linux-x64-gnu@0.5.22 2>&1 | tail -3"

# ─── Step 7: Setup systemd service and start ─────────────────
echo ""
echo "▶ [7/8] Setting up systemd service..."

$SSH_CMD "
# Unmask if previously masked
sudo systemctl unmask roundbase.service 2>/dev/null || true

cat > /tmp/roundbase.service << 'UNIT'
[Unit]
Description=Roundbase Next.js App
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/mnt/roundbase/app
Environment=NODE_ENV=production
Environment=PORT=5004
Environment=HOSTNAME=0.0.0.0
Environment=DATABASE_PATH=/mnt/roundbase/data/roundbase.db
EnvironmentFile=/mnt/roundbase/.env
ExecStart=/home/ubuntu/.nvm/versions/node/v20.20.1/bin/node server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

sudo cp /tmp/roundbase.service /etc/systemd/system/roundbase.service
rm /tmp/roundbase.service
sudo systemctl daemon-reload
sudo systemctl enable roundbase.service
sudo systemctl start roundbase.service
sleep 3
sudo systemctl status roundbase.service --no-pager"

# ─── Step 7.5: Health check ──────────────────────────────────
echo ""
echo "▶ [7.5/8] Health check..."
for i in 1 2 3; do
  HTTP_CODE=$($SSH_CMD "curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/ 2>/dev/null" || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✓ App responding (HTTP $HTTP_CODE)"
    # Also check that static CSS serves correctly
    CSS_FILE=$(ls .next/static/css/*.css | head -1 | xargs basename)
    CSS_CODE=$($SSH_CMD "curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/_next/static/css/$CSS_FILE 2>/dev/null" || echo "000")
    if [ "$CSS_CODE" = "200" ]; then
      echo "   ✓ Static assets serving correctly (CSS $CSS_CODE)"
    else
      echo "   ✗ Static CSS returning $CSS_CODE — restarting service..."
      $SSH_CMD "sudo systemctl restart roundbase.service"
      sleep 3
    fi
    break
  fi
  echo "   Attempt $i: HTTP $HTTP_CODE — waiting..."
  sleep 3
done

# ─── Step 8: Nginx + SSL ─────────────────────────────────────
echo ""
echo "▶ [8/8] Configuring nginx + HTTPS for $DOMAIN..."

ssh -o StrictHostKeyChecking=no -i $SSH_KEY $SERVER bash -s << 'REMOTE_SCRIPT'
sudo tee /etc/nginx/sites-available/roundbase > /dev/null << 'NGINX'
server {
    listen 80;
    server_name www.roundbase.net;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name www.roundbase.net;

    ssl_certificate /etc/letsencrypt/live/www.roundbase.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.roundbase.net/privkey.pem;

    location /uploads/ {
        alias /mnt/roundbase/app/public/uploads/;
        expires 30d;
    }

    location / {
        proxy_pass http://127.0.0.1:5004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}

server {
    listen 80;
    server_name roundbase.net;
    return 301 https://www.roundbase.net$request_uri;
}

server {
    listen 443 ssl;
    server_name roundbase.net;

    ssl_certificate /etc/letsencrypt/live/roundbase.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/roundbase.net/privkey.pem;

    return 301 https://www.roundbase.net$request_uri;
}
NGINX
sudo ln -sf /etc/nginx/sites-available/roundbase /etc/nginx/sites-enabled/roundbase
sudo nginx -t && sudo systemctl reload nginx
REMOTE_SCRIPT

echo ""
echo "════════════════════════════════════════"
echo "  Roundbase deployed!"
echo "  URL: https://$DOMAIN"
echo "════════════════════════════════════════"
