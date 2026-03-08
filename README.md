# GoClick — Five in a Row / 五子棋

A two-player Gomoku web app with real-time room-based multiplayer and fun random missions.

## Tech Stack

- **Next.js 14** (App Router) · **TypeScript** · **Tailwind CSS**
- **SQLite** via **Prisma ORM**
- **iron-session** for server-side sessions
- **Short polling** (1.5 s) for real-time game sync

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Create environment file
```bash
cp .env.example .env
# Edit SESSION_SECRET with a random 32+ character string
```

### 3. Initialize the database
```bash
npx prisma migrate dev --name init
```

### 4. Seed test accounts
```bash
npm run db:seed
```

Test accounts:
| Phone | Password |
|---|---|
| `10000000001` | `test1` |
| `10000000002` | `test2` |

### 5. Start the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How to Play

1. **Player 1** logs in and clicks **Create Game** → gets a 6-character room code (e.g. `A3KF9Z`)
2. Share the room link or code with **Player 2** (works across devices and networks)
3. Player 2 opens the link and logs in → joins the waiting room
4. Both players click **Ready** → a coin flip decides who gets pink stones (first move)
5. Each player sees the board on their own device — only the active player can place a stone
6. **Missions** trigger randomly (~4.55% per move). The assigned player must click "Got it!" before play continues
7. First to get **5 in a row** wins!
8. After the game, click **Play Again** to start a rematch room (loser goes first)

## Deployment (Vercel — Recommended)

1. Push the project to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` — use a hosted SQLite provider (e.g. Turso) or switch to PostgreSQL
   - `SESSION_SECRET` — random 32+ char string
   - `NEXT_PUBLIC_BASE_URL` — your production URL, e.g. `https://goclick.com`
4. In **Domains**, bind your custom domain (e.g. `goclick.com` or `goclick.app`)
5. Vercel provides HTTPS automatically — no SSL configuration needed

### Self-hosted with Nginx + Certbot

```nginx
server {
    listen 80;
    server_name goclick.com;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name goclick.com;
    ssl_certificate /etc/letsencrypt/live/goclick.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/goclick.com/privkey.pem;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Install Certbot and get a certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d goclick.com
```

## Project Structure

```
app/
  api/
    auth/           login · register · logout · me · language
    room/           create · [roomCode]/join · ready · state
    game/[id]/      state · move · mission/ack · rematch
  (auth)/login · register
  (game)/lobby · room/[roomCode] · game/[id]
components/         Board · Stone · MissionModal · MissionLog · PlayerCard · WinOverlay · LanguageToggle
lib/
  prisma.ts         Singleton Prisma client
  auth.ts           iron-session helpers
  gameLogic.ts      Win detection · Box-Muller mission trigger
  missions.ts       20 bilingual missions (EN/ZH)
  useGamePolling.ts Client polling hook (1.5 s interval)
  i18n/             en.json · zh.json
prisma/schema.prisma · seed.ts
```
