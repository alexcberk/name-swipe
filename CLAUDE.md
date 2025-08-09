# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BabySwipe (NameSwipe) is a collaborative baby name selection application that allows couples to swipe through baby names together (like Tinder) and discover matches in real-time. Built with React, TypeScript, Express, and WebSockets for real-time collaboration.

## Commands

### Development
- `npm run dev` - Start development server with hot reload (runs server/index.ts)
- `npm run check` - Run TypeScript type checking
- `npm run build` - Build for production (Vite for frontend, esbuild for backend)
- `npm start` - Run production build

### Database
- `npm run db:push` - Push schema changes to PostgreSQL using Drizzle Kit

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
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)

## Development Notes
- Server runs on port specified by PORT env var (only non-firewalled port)
- Vite dev server is integrated with Express in development mode
- Production build outputs to `/dist` with static files in `/dist/public`
- WebSocket reconnection implements exponential backoff (max 5 attempts)
- Session data expires after 24 hours automatically
- The storage layer is abstracted for easy database integration