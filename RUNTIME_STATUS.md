# Runtime Status

**Last Updated:** 2025-09-30 10:32 UTC

## Current State

### Server
- **Status:** Running (background process ID: bf62a6)
- **Port:** 5000
- **Environment:** production
- **Command:** `DATABASE_URL="postgresql://nameswipe:nameswipe_dev@localhost:5432/nameswipe" PORT=5000 NODE_ENV=production bun run dist/server/index.js`
- **Storage:** PostgreSQL (local)
- **Build Location:** `/home/ubuntu/git/name-swipe/dist/`
- **Current JS Asset:** index-XPsIDR0E.js (1.0MB)

### Database (PostgreSQL)
- **Status:** Running (local PostgreSQL 12)
- **Database Name:** nameswipe
- **User:** nameswipe
- **Password:** nameswipe_dev
- **Host:** localhost
- **Port:** 5432
- **Connection String:** `postgresql://nameswipe:nameswipe_dev@localhost:5432/nameswipe`

### Tables Created
- ✅ users
- ✅ sessions
- ✅ baby_names
- ✅ swipe_actions
- ✅ user_sessions

### Port Forwarding
- **Local Port:** 5000
- **External Port:** 80 (configured in .replit)

## Verification Tests ✅

1. **HTML loads correctly** - Server returns proper index.html
2. **JavaScript asset accessible** - `/assets/index-XPsIDR0E.js` returns 200 OK (1.0MB)
3. **CSS asset accessible** - `/assets/index-C87ohQAj.css` returns 67KB
4. **API working** - `/api/baby-names?gender=all` returns JSON with baby names
5. **Database populated** - 3,672 baby names successfully initialized

## Recent Fixes

**2025-09-30 10:32 UTC - Fixed crypto.randomUUID() error:**
- Created UUID polyfill at `client/src/lib/uuid.ts`
- Updated `client/src/pages/home.tsx` to use `generateUUID()`
- Updated `client/src/pages/session.tsx` to use `generateUUID()`
- Rebuilt application and restarted server
- **Error:** `TypeError: crypto.randomUUID is not a function`
- **Solution:** Added fallback UUID generator for non-secure contexts

**2025-09-30 10:34 UTC - Fixed 500 errors on API endpoints:**
- **Error:** `Failed to create user` and `Failed to create session` (500 errors)
- **Root Cause:** Missing `users` and `sessions` tables in database
- **Solution:** Created both tables with proper schema including UUID generation
- **Result:** All API endpoints now working correctly

## To Restart Server

```bash
# Kill current process
kill $(ps aux | grep 'dist/server/index.js' | grep -v grep | awk '{print $2}')

# Start server
cd /home/ubuntu/git/name-swipe
DATABASE_URL="postgresql://nameswipe:nameswipe_dev@localhost:5432/nameswipe" PORT=5000 NODE_ENV=production bun run dist/server/index.js
```

## To Check Server Status

```bash
# View server output
ps aux | grep 'dist/server/index.js'

# Check if port 5000 is listening
netstat -tlnp | grep 5000

# Test server response
curl http://localhost:5000
```

## To Initialize Baby Names

```bash
cd /home/ubuntu/git/name-swipe
DATABASE_URL="postgresql://nameswipe:nameswipe_dev@localhost:5432/nameswipe" bun run scripts/init-db.ts
```