# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BabySwipe (NameSwipe) is a collaborative baby name selection application that allows couples to swipe through baby names together (like Tinder) and discover matches in real-time. Built with React, TypeScript, Express, and WebSockets for real-time collaboration.

## Commands

**Note:** This project uses **Bun** as the runtime (not Node.js/npm). All commands should use `bun run` or just `bun`.

### Development
- `bun run dev` - Start development server with hot reload (runs server/index.ts)
- `bun run dev:node` - Start with Node.js/tsx (fallback)
- `bun run dev:local` - Start with local database
- `bun run check` - Run TypeScript type checking
- `bun run build` - Build for production (Vite for frontend, esbuild for backend)
- `bun run start` - Run production build

### Database
- `bun run db:push` - Push schema changes to PostgreSQL using Drizzle Kit
- `bun run db:setup` - Setup local database
- `bun run db:start` - Start PostgreSQL via Docker
- `bun run db:stop` - Stop PostgreSQL
- `bun run db:reset` - Reset database completely

## Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, TanStack Query, Wouter (routing), Framer Motion
- **Backend**: Express.js, WebSocket Server (ws), TypeScript
- **Database**: PostgreSQL via Neon serverless, Drizzle ORM
- **UI**: shadcn/ui components (Radix UI primitives + Tailwind CSS)
- **Validation**: Zod with React Hook Form

### Project Structure
- `/client` - React frontend
  - `/src/pages` - Route components (home, session, not-found)
  - `/src/components` - Reusable components and shadcn/ui library
  - `/src/hooks` - Custom hooks (useWebSocket, useSwipe, useMobile)
  - `/src/lib` - Utilities and configuration
- `/server` - Express backend
  - `index.ts` - Server entry point with logging middleware
  - `routes.ts` - API endpoints and WebSocket handlers
  - `storage.ts` - Database abstraction layer
- `/shared` - Shared code between client and server
  - `schema.ts` - Drizzle schema definitions and Zod validation schemas

### Key Features
1. **Real-time Collaboration**: WebSocket connections for live partner connectivity and match notifications
2. **Sessionless Design**: UUID-based user identification without traditional auth
3. **Database Schema**:
   - `sessions` - Collaborative sessions with 24-hour expiration
   - `swipeActions` - User swipe history (like/dislike)
   - `babyNames` - Comprehensive name database (gender, origin, meaning, rank)
4. **Path Aliases**:
   - `@/` → `client/src/`
   - `@shared/` → `shared/`

### API Endpoints
- `POST /api/sessions` - Create new collaborative session
- `GET /api/sessions/:id` - Get session details
- `GET /api/baby-names?gender=all|boy|girl` - Get filtered baby names
- `POST /api/swipe-actions` - Record swipe action
- `GET /api/sessions/:sessionId/users/:userId/swipes` - Get user's swipe history
- `GET /api/sessions/:sessionId/matches` - Get matched names for session

### WebSocket Protocol
- Endpoint: `/ws`
- Message types:
  - `join_session` - Join a collaborative session
  - `swipe_action` - Broadcast swipe to partner
  - `partner_connected/disconnected` - Connection status
  - `new_match` - Real-time match notification

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `PORT` - Server port (production: 5000, dev: varies)
- `NODE_ENV` - Environment mode (development/production)

## Development Notes
- Server runs on port specified by PORT env var (production uses 5000)
- Vite dev server is integrated with Express in development mode
- Production build outputs to `/dist` with static files in `/dist/public`
- WebSocket reconnection implements exponential backoff (max 5 attempts)
- Session data expires after 24 hours automatically
- The storage layer is abstracted for easy database integration

## Production Deployment

### Prerequisites
- Bun runtime installed
- PostgreSQL database (local or Neon)
- Nginx web server
- systemd for service management

### Deployment Steps

1. **Build the application**
   ```bash
   bun run build
   ```

2. **Update systemd service** (if needed)
   - Service file: `/etc/systemd/system/nameswipe.service`
   - Ensure PORT=5000 in environment variables
   - Verify DATABASE_URL is correct

3. **Reload and restart service**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart nameswipe
   sudo systemctl status nameswipe
   ```

4. **Verify nginx configuration**
   - Config file: `/etc/nginx/sites-available/nameswipe`
   - Proxy should point to `http://localhost:5000`
   - Test config: `sudo nginx -t`
   - Reload nginx: `sudo systemctl reload nginx`

5. **Check logs**
   ```bash
   sudo journalctl -u nameswipe -f
   ```

### Troubleshooting
- If database auth fails, reset password:
  ```bash
  echo "ALTER USER nameswipe WITH PASSWORD 'nameswipe_secure_password';" | sudo -u postgres psql -d nameswipe
  ```
- Ensure ports match: systemd service PORT=5000, nginx proxy to localhost:5000
- Check service status: `sudo systemctl status nameswipe nginx postgresql`