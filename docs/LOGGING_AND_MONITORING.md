# Logging and Monitoring Setup

## Overview

The application uses **Pino** for high-performance JSON logging with automatic log rotation via systemd's journald.

## Current Configuration

### Machine Resources
- **Disk**: 29GB total, 5GB used (18% usage), 23GB available
- **Memory**: 3.7GB total, ~500MB used, 3GB available
- **CPU**: 4 cores (Raspberry Pi)
- **Swap**: None configured

### Pino Logging

#### Features
- **Development**: Pretty-printed colored logs for readability
- **Production**: JSON-structured logs captured by journald
- **Auto-logging**: HTTP requests automatically logged with pino-http
- **Request filtering**: Only API routes logged (static assets ignored)
- **Log levels**: Automatically set based on response codes
  - 500+: error
  - 400-499: warn
  - 200-399: info

#### Configuration

Located in `server/logger.ts`:
- Development uses `pino-pretty` transport for human-readable output
- Production logs JSON to stdout (captured by journald)
- Customizable via `LOG_LEVEL` environment variable
- Module-based child loggers for different components

#### Usage in Code

```typescript
import { createLogger } from './logger';
const logger = createLogger('my-module');

logger.info('Something happened');
logger.warn({ data }, 'Warning message');
logger.error({ err }, 'Error occurred');
```

### Resource Monitoring

Automated system resource monitoring in `server/monitoring.ts`:

#### Metrics Collected
- **Memory**: System & process usage, heap statistics
- **CPU**: Core count, load averages, process uptime
- **Disk**: Total, used, available space, usage percentage

#### Monitoring Schedule
- **Production**: Every 5 minutes
- **Development**: Every 15 minutes

#### Alert Thresholds
- Memory usage >90%: WARNING
- Memory usage >80%: INFO
- Disk usage >90%: ERROR
- Disk usage >80%: WARNING
- CPU load per core >2: WARNING
- Process RSS >1GB: WARNING

### Log Rotation

#### Systemd/Journald (Recommended - Already Configured)

The application logs to stdout, which systemd captures via journald. Journald automatically handles rotation.

**View logs:**
```bash
# All logs
sudo journalctl -u nameswipe -f

# Last 100 lines
sudo journalctl -u nameswipe -n 100

# Logs since yesterday
sudo journalctl -u nameswipe --since yesterday

# Errors only
sudo journalctl -u nameswipe -p err

# With JSON pretty-print
sudo journalctl -u nameswipe -f -o json-pretty
```

**Configure journald rotation** (if needed):
Edit `/etc/systemd/journald.conf`:
```ini
[Journal]
SystemMaxUse=500M      # Max disk space for all logs
SystemMaxFileSize=50M  # Max size per log file
MaxRetentionSec=7d     # Keep logs for 7 days
```

Then reload:
```bash
sudo systemctl restart systemd-journald
```

**Current journald status:**
```bash
journalctl --disk-usage
```

#### File-based Rotation (Alternative)

If you prefer file-based logging instead of journald, add to systemd service:

1. Update `/etc/systemd/system/nameswipe.service`:
```ini
Environment="LOG_FILE=/var/log/nameswipe/app.log"
```

2. Create log directory:
```bash
sudo mkdir -p /var/log/nameswipe
sudo chown ubuntu:ubuntu /var/log/nameswipe
```

3. Setup logrotate at `/etc/logrotate.d/nameswipe`:
```
/var/log/nameswipe/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 ubuntu ubuntu
    sharedscripts
    postrotate
        systemctl reload nameswipe
    endscript
}
```

### Environment Variables

Add to systemd service or `.env`:

```bash
# Logging
LOG_LEVEL=info          # debug, info, warn, error
LOG_FILE=/path/to/log   # Optional: file-based logging

# Node environment
NODE_ENV=production
```

## Monitoring Commands

### View Real-time Logs
```bash
sudo journalctl -u nameswipe -f
```

### Check Resource Usage
```bash
# Disk space
df -h /

# Memory
free -h

# CPU and processes
top

# Application-specific
htop -p $(pgrep -f "bun run start")
```

### Export Logs
```bash
# Export last 24 hours to file
sudo journalctl -u nameswipe --since "24 hours ago" > nameswipe-logs.txt

# Export as JSON
sudo journalctl -u nameswipe -o json > nameswipe-logs.json
```

## Best Practices

1. **Use structured logging** with Pino:
   ```typescript
   logger.info({ userId, sessionId }, 'User joined session');
   ```

2. **Don't log sensitive data** (passwords, tokens, full request bodies)

3. **Use appropriate log levels**:
   - `debug`: Development/troubleshooting
   - `info`: Normal operations
   - `warn`: Something unexpected but handled
   - `error`: Failures requiring attention

4. **Monitor disk space regularly**:
   ```bash
   df -h /
   sudo journalctl --disk-usage
   ```

5. **Set up alerts** for resource thresholds (already built into monitoring.ts)

## Troubleshooting

### High log volume
```bash
# Check log size
sudo journalctl --disk-usage

# Vacuum old logs (keep last 3 days)
sudo journalctl --vacuum-time=3d

# Vacuum by size (keep last 500M)
sudo journalctl --vacuum-size=500M
```

### View specific errors
```bash
# Errors in last hour
sudo journalctl -u nameswipe --since "1 hour ago" -p err

# Filter by module
sudo journalctl -u nameswipe | grep '"module":"routes"'
```

### Performance testing
```bash
# Pino is extremely fast (benchmarks show ~30k+ ops/sec)
# Much faster than console.log or other loggers
```

## Implementation Details

### Files Modified
- `server/logger.ts` - Pino configuration and logger factory
- `server/monitoring.ts` - Resource monitoring system
- `server/index.ts` - Integrated pino-http middleware
- `server/vite.ts` - Updated logging to use Pino
- `server/routes.ts` - Added logger instance

### Dependencies Added
- `pino` - Core logging library
- `pino-http` - Express/HTTP request logging
- `pino-pretty` - Development-mode pretty printing
