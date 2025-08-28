# NameSwipe Deployment Guide

## Overview
NameSwipe can be deployed in multiple ways - standalone VPS, Docker, or using managed services. This guide covers all deployment options.

## Prerequisites
- VPS with Ubuntu 22.04+ (for VPS deployment)
- Docker & Docker Compose (for container deployment)
- PostgreSQL database
- Domain name (optional, for SSL)

## 🚀 Quick Deploy Options

### Option 1: VPS Deployment with Script

1. **Upload files to your VPS:**
```bash
rsync -avz --exclude node_modules --exclude dist . user@your-server:/opt/nameswipe/
```

2. **Run deployment script:**
```bash
ssh user@your-server
cd /opt/nameswipe
sudo DB_PASSWORD=your-secure-password DOMAIN_NAME=yourdomain.com EMAIL=you@email.com ./deploy.sh
```

### Option 2: Docker Deployment

1. **Clone repository on server:**
```bash
git clone https://github.com/yourusername/nameswipe.git
cd nameswipe
```

2. **Set environment variables:**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Run with Docker Compose:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Manual Deployment

1. **Install Bun on server:**
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

2. **Install PostgreSQL:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

3. **Setup database:**
```bash
sudo -u postgres createdb nameswipe
sudo -u postgres createuser nameswipe -P
# Enter password when prompted
```

4. **Build and run:**
```bash
bun install --production
bun run build
PORT=3000 DATABASE_URL="postgresql://nameswipe:password@localhost/nameswipe" bun run start
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file with:

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://nameswipe:password@localhost:5432/nameswipe

# Optional: External database (e.g., Neon)
# DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
```

### Nginx Configuration
For production, use Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

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

### SSL with Certbot
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 📦 Build Options

### Standard Build
```bash
bun run build
```
Creates optimized client and server bundles in `dist/`

### Standalone Binary (Experimental)
```bash
bun run build:standalone
```
Creates a single executable file `nameswipe-server`

## 🐳 Docker Commands

### Build image:
```bash
docker build -t nameswipe .
```

### Run container:
```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host/db" \
  --name nameswipe \
  nameswipe
```

### Using Docker Compose:
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 🔍 Health Checks

The application provides health check endpoints:
- `GET /` - Basic health check
- `GET /api/health` - Detailed health status (if implemented)

## 📊 Monitoring

### View logs:
```bash
# Systemd service
journalctl -u nameswipe -f

# Docker
docker logs nameswipe -f

# PM2
pm2 logs nameswipe
```

### Check status:
```bash
# Systemd
systemctl status nameswipe

# Docker
docker ps
docker stats nameswipe
```

## 🔄 Updates

### Update application:
```bash
cd /opt/nameswipe
git pull
bun install --production
bun run build
sudo systemctl restart nameswipe
```

### Database migrations:
```bash
bun run db:push
```

## 🚨 Troubleshooting

### Port already in use:
```bash
# Find process using port
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Database connection issues:
- Check PostgreSQL is running: `systemctl status postgresql`
- Verify credentials: `psql -U nameswipe -d nameswipe`
- Check connection string format

### Build failures:
- Clear cache: `rm -rf node_modules dist`
- Reinstall: `bun install`
- Check Node/Bun version compatibility

## 🔐 Security

1. **Database**: Use strong passwords, restrict connections
2. **Firewall**: Only open necessary ports (80, 443, 22)
3. **SSL**: Always use HTTPS in production
4. **Updates**: Keep system and dependencies updated
5. **Secrets**: Never commit `.env` files or secrets

## 📝 Backup

### Database backup:
```bash
pg_dump nameswipe > backup_$(date +%Y%m%d).sql
```

### Restore backup:
```bash
psql nameswipe < backup_20240101.sql
```

## 🌐 Scaling

For high traffic:
1. Use a load balancer (nginx, HAProxy)
2. Run multiple app instances
3. Use PostgreSQL connection pooling
4. Consider Redis for session storage
5. Use CDN for static assets

## Support

For issues, check:
- Application logs
- PostgreSQL logs: `/var/log/postgresql/`
- Nginx logs: `/var/log/nginx/`
- System logs: `journalctl -xe`