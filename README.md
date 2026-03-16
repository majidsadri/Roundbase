# Roundbase

Fundraising pipeline manager for startups. Track investors, manage projects, discover VCs, generate pitch decks, and run your fundraise like a pro.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (REST)
- **Database**: SQLite via Prisma 7 + libsql adapter
- **AI**: OpenAI GPT-4o-mini (pitch deck generation, VC discovery, team extraction)
- **Process Manager**: systemd
- **Reverse Proxy**: nginx + Certbot (Let's Encrypt SSL)

## Features

- **Investor Database** — Add, edit, import (CSV), bulk select/delete investors
- **Pipeline Board** — Kanban-style pipeline with drag-and-drop across 7 stages
- **Discover Investors** — Crawl VC websites, AI-powered VC discovery by project, NFX Signal import, quick lookup
- **Projects** — Manage fundraising projects with logo upload, pitch materials, files
- **Pitch Deck Generator** — AI-generated pitch decks with 5 themes, iterative refinement via comments, PDF export, save to files
- **Compose & Outreach** — Email templates (Cold Intro, Warm Intro, Follow Up, Meeting Confirm, Thank You), Gmail integration, activity logging
- **Dashboard** — Overview stats, overdue/upcoming follow-ups, pipeline breakdown

## Architecture

```
Browser → nginx (HTTPS :443) → Next.js standalone (port 5004) → SQLite (roundbase.db)
                ↓
        /uploads/ served directly by nginx
```

### API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/investors` | List all / create investor |
| DELETE | `/api/investors/[id]` | Delete investor |
| GET/POST | `/api/projects` | List all / create project |
| POST | `/api/projects/logo` | Upload logo or fetch from website |
| GET/POST | `/api/pipeline` | List / create pipeline entries (filter: `?projectId=`) |
| DELETE | `/api/pipeline/[id]` | Delete pipeline entry |
| GET/POST | `/api/activities` | List / create activities (filter: `?pipelineId=`) |
| POST | `/api/files/upload` | Upload file (multipart/form-data) |
| DELETE | `/api/files/[id]` | Delete file |
| POST | `/api/crawl` | Crawl a VC website for team members |
| POST | `/api/discover-vcs` | AI-powered VC discovery for a project |
| POST | `/api/generate-deck` | Generate or refine AI pitch deck |
| POST | `/api/generate-deck/save` | Save pitch deck HTML to project files |
| POST | `/api/parse-investors` | AI-parse investor text |
| POST | `/api/match-investors` | AI-match investors to project |

### Database

SQLite database managed by Prisma 7 with the libsql adapter.

**Schema** (`prisma/schema.prisma`):
- `Investor` — name, firm, role, email, LinkedIn, sectors, stage, check size, etc.
- `Project` — name, description, stage, raise amount, sectors, logo, files
- `ProjectFile` — uploaded pitch decks, one-pagers, generated decks (stored in `public/uploads/`)
- `PipelineEntry` — links investor to project with a pipeline stage
- `Activity` — activity log for pipeline entries (emails, calls, meetings)

**Common commands:**
```bash
npx prisma generate          # Generate Prisma client
npx prisma migrate dev       # Run migrations (development)
npx prisma studio            # Visual database browser
```

**Production database location:** `/mnt/roundbase/data/roundbase.db`
**Dev database location:** `./dev.db` (project root)

The database path is configurable via `DATABASE_PATH` environment variable.

## Local Development

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev                  # Starts on http://localhost:3001
```

### Environment Variables

Create `.env.local` in project root:
```
OPENAI_API_KEY=sk-...        # Required: enables AI pitch deck, VC discovery, crawl fallback
DATABASE_PATH=               # Optional: override database file path
```

## Deployment

### Server Info

- **Host**: AWS EC2 (Ubuntu 24.04), IP: `18.215.164.114`
- **URL**: https://www.roundbase.net
- **SSH**: `ssh -i ~/.ssh/id_rsa ubuntu@18.215.164.114`
- **App location**: `/mnt/roundbase/app/`
- **Database**: `/mnt/roundbase/data/roundbase.db`
- **Node**: v20.20.1 (via nvm)
- **Port**: 5004 (proxied by nginx on 443)

### How Deployment Works

The app uses Next.js **standalone output** mode, which produces a self-contained server with only the dependencies actually needed (~100MB vs ~660MB full node_modules).

**Deploy script** (`deploy.sh`):
1. Builds Next.js standalone locally (`npm run build`)
2. Rsyncs the standalone build to the server
3. Syncs static assets and public files
4. Copies database on first deploy only (preserves production data)
5. Installs Linux-specific native binary for libsql
6. Restarts the systemd service
7. Configures nginx reverse proxy + SSL certificate

### Deploy a New Version

```bash
./deploy.sh
```

That's it. The script handles building, syncing, and restarting.

### Systemd Service

```bash
sudo systemctl status roundbase     # Check status
sudo systemctl restart roundbase    # Restart
sudo systemctl stop roundbase       # Stop
sudo journalctl -u roundbase -f     # Live logs
```

Service file: `/etc/systemd/system/roundbase.service`

### Nginx Config

Site config: `/etc/nginx/sites-enabled/roundbase`

Nginx serves `/uploads/` directly from disk (bypassing Next.js) so dynamically uploaded logos and files are available immediately.

SSL certificate auto-renews via Certbot snap timer.

```bash
sudo nginx -t                       # Test config
sudo systemctl reload nginx         # Apply changes
sudo certbot renew --dry-run        # Test SSL renewal
```

### Other Apps on Same Server

| App | Port | Domain | Service |
|-----|------|--------|---------|
| Getjeeb Website | 443 | getjeeb.com | nginx (static) |
| Mireva Website | 443 | www.mireva.life | nginx (static) |
| Mireva Recipe API | 5003 | api.mireva.life | mireva-recipes.service |
| Reachr API | 5002/8080 | (IP:8080) | reachr.service |
| **Roundbase** | **5004** | **www.roundbase.net** | **roundbase.service** |

## File Uploads

Uploaded files (pitch decks, logos, generated decks, etc.) are stored at:
- **Dev**: `public/uploads/{projectId}/`
- **Production**: `/mnt/roundbase/app/public/uploads/{projectId}/`

Files are served by nginx directly at `/uploads/{projectId}/{filename}` (not through Next.js).
