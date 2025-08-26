# Database Setup Guide

## Quick Start

```bash
# 1. Initial setup (first time only)
npm run db:setup

# 2. Start development with local PostgreSQL
npm run dev:local
```

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed

## Available Commands

### Database Management

- `npm run db:setup` - Complete database setup (container + migrations)
- `npm run db:start` - Start PostgreSQL container
- `npm run db:stop` - Stop PostgreSQL container
- `npm run db:logs` - View database logs
- `npm run db:reset` - Reset database (deletes all data)
- `npm run db:push` - Run database migrations

### Development

- `npm run dev:local` - Start dev server with local PostgreSQL
- `npm run dev` - Start dev server (requires DATABASE_URL env var)

## Database Connection

Local PostgreSQL runs on:
- **Host:** localhost
- **Port:** 5432
- **Database:** nameswipe
- **Username:** nameswipe
- **Password:** nameswipe_dev

Connection string:
```
postgresql://nameswipe:nameswipe_dev@localhost:5432/nameswipe
```

## Environment Variables

The `.env.local` file contains:
```env
DATABASE_URL=postgresql://nameswipe:nameswipe_dev@localhost:5432/nameswipe
PORT=5000
NODE_ENV=development
```

## Architecture

### Storage Adapters

The app supports two storage backends:
1. **PostgreSQL** (production) - Uses Drizzle ORM with Neon serverless driver
2. **In-Memory** (fallback) - Used when DATABASE_URL is not set

The storage adapter is automatically selected based on the DATABASE_URL environment variable.

### Database Schema

- `users` - User accounts with preferences
- `sessions` - Collaborative sessions (24-hour expiration)
- `user_sessions` - User-to-session relationships
- `swipe_actions` - Like/dislike actions on names
- `baby_names` - Database of baby names with metadata

### Data Persistence

With PostgreSQL:
- Sessions persist across server restarts
- Swipe history is permanently stored
- Baby names are initialized once and cached
- Automatic cleanup of expired sessions

## Troubleshooting

### Container won't start
```bash
# Check Docker status
docker ps -a

# View logs
npm run db:logs

# Reset and start fresh
npm run db:reset
```

### Connection refused
```bash
# Ensure container is running
docker ps | grep nameswipe-db

# Check PostgreSQL is ready
docker exec nameswipe-db pg_isready -U nameswipe
```

### Migration errors
```bash
# Reset database and re-run migrations
npm run db:reset
```

## Production Deployment

For production, use a managed PostgreSQL service like:
- [Neon](https://neon.tech) (recommended, serverless)
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)

Set the DATABASE_URL environment variable to your production database connection string.