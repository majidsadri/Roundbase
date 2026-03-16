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
echo "▶ [1/7] Building Next.js standalone..."
npx prisma generate
npm run build

# ─── Step 2: Setup remote directory ───────────────────────────
echo ""
echo "▶ [2/7] Setting up remote directories..."
$SSH_CMD "sudo mkdir -p $REMOTE_DIR/data $REMOTE_DIR/app/public/uploads && sudo chown -R ubuntu:ubuntu $REMOTE_DIR"

# ─── Step 3: Sync build to server ────────────────────────────
echo ""
echo "▶ [3/7] Syncing standalone build to server..."

# Standalone app (includes traced node_modules)
# Exclude linux native binary from delete (installed separately on server)
rsync -avz --delete \
  --exclude='node_modules/@libsql/linux-x64-gnu' \
  -e "$RSYNC_SSH" \
  .next/standalone/ \
  "$SERVER:$REMOTE_DIR/app/"

# Static assets (standalone doesn't include these)
rsync -avz --delete \
  -e "$RSYNC_SSH" \
  .next/static/ \
  "$SERVER:$REMOTE_DIR/app/.next/static/"

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

# ─── Step 4: Database (first deploy only) ────────────────────
echo ""
echo "▶ [4/7] Checking database..."
$SSH_CMD "test -f $REMOTE_DIR/data/roundbase.db" && echo "   Database exists, skipping." || {
  echo "   First deploy — copying database..."
  rsync -avz \
    -e "$RSYNC_SSH" \
    dev.db \
    "$SERVER:$REMOTE_DIR/data/roundbase.db"
}

# ─── Step 5: Fix native binaries for Linux ───────────────────
echo ""
echo "▶ [5/7] Installing Linux native binary for libsql..."
$SSH_CMD "export PATH=$NODE_BIN:\$PATH && cd $REMOTE_DIR/app && npm install --no-save @libsql/linux-x64-gnu@0.5.22 2>&1 | tail -3"

# ─── Step 6: Setup systemd service ───────────────────────────
echo ""
echo "▶ [6/7] Setting up systemd service..."

$SSH_CMD "cat > /tmp/roundbase.service << 'UNIT'
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

sudo mv /tmp/roundbase.service /etc/systemd/system/roundbase.service
sudo systemctl daemon-reload
sudo systemctl enable roundbase.service
sudo systemctl restart roundbase.service
sleep 2
sudo systemctl status roundbase.service --no-pager"

# ─── Step 7: Nginx + SSL ─────────────────────────────────────
echo ""
echo "▶ [7/7] Configuring nginx + HTTPS for $DOMAIN..."

$SSH_CMD "cat > /tmp/roundbase-nginx << 'NGINX'
server {
    listen 80;
    server_name www.roundbase.net;

    location /uploads/ {
        alias /mnt/roundbase/app/public/uploads/;
        expires 30d;
    }

    location / {
        proxy_pass http://127.0.0.1:5004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 50M;
    }
}
NGINX

sudo mv /tmp/roundbase-nginx /etc/nginx/sites-available/roundbase
sudo ln -sf /etc/nginx/sites-available/roundbase /etc/nginx/sites-enabled/roundbase
sudo nginx -t && sudo systemctl reload nginx

echo '   Getting SSL certificate with Certbot...'
sudo certbot --nginx -d www.roundbase.net --non-interactive --agree-tos --email admin@roundbase.net --redirect --expand 2>&1 | tail -5"

echo ""
echo "════════════════════════════════════════"
echo "  Roundbase deployed!"
echo "  URL: https://$DOMAIN"
echo "════════════════════════════════════════"
