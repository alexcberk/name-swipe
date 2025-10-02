# Cloudflare IP Filtering Setup

This guide helps you restrict access to your app so only Cloudflare can reach it.

## Why Do This?

When using Cloudflare as a proxy/CDN:
- Hide your origin server IP
- Prevent direct attacks on your server
- Force all traffic through Cloudflare's protection
- Get DDoS protection and caching benefits

## Option 1: Server-Level Firewall (Recommended)

Run the automated script on your Ubuntu server:

```bash
cd /home/ubuntu/git/name-swipe
./scripts/setup-cloudflare-firewall.sh
```

This script will:
1. Install `ufw` (Ubuntu firewall) if needed
2. Block all incoming traffic by default
3. Allow SSH (port 22) so you don't get locked out
4. Allow local network traffic
5. Allow only Cloudflare IPs to access port 5000
6. Enable the firewall

### Manual UFW Configuration

If you prefer manual setup:

```bash
# Install UFW
sudo apt-get update && sudo apt-get install -y ufw

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow Cloudflare IPs to port 5000
sudo ufw allow from 173.245.48.0/20 to any port 5000
sudo ufw allow from 103.21.244.0/22 to any port 5000
# ... (add all ranges)

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status numbered
```

### Disable Firewall (if needed)

```bash
sudo ufw disable
```

## Option 2: Router-Level Filtering

Most home routers have limited firewall capabilities. Here's what to do:

### TP-Link Routers
1. Go to Security → Firewall
2. Enable "IP & MAC Binding"
3. Add Cloudflare IP ranges to allowlist

### ASUS Routers
1. Go to Firewall → Network Services Filter
2. Set filter mode to "Blacklist" with default deny
3. Add Cloudflare ranges to whitelist

### Netgear Routers
1. Go to Security → Access Control
2. Turn on Access Control
3. Set to "Allow only these IP addresses"
4. Add Cloudflare ranges

### Generic Router Setup
1. Log in to router admin (usually 192.168.1.1 or 192.168.0.1)
2. Find: Firewall, Security, or Access Control section
3. Look for: IP Filtering, Port Forwarding with IP restrictions
4. Add Cloudflare IP ranges as allowed sources

**⚠️ Warning:** Most home routers can only handle 10-50 firewall rules. You may need to use broader CIDR ranges or skip IPv6.

## Option 3: Application-Level Filtering

Add middleware to check incoming IPs in your Express app:

```javascript
// In server/index.ts or server/routes.ts
const CLOUDFLARE_IPS = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  // ... all ranges
];

app.use((req, res, next) => {
  const clientIP = req.headers['cf-connecting-ip'] ||
                   req.headers['x-forwarded-for'] ||
                   req.ip;

  // Check if IP is from Cloudflare
  if (!isCloudflareIP(clientIP)) {
    return res.status(403).send('Forbidden');
  }
  next();
});
```

## Cloudflare IP Ranges (Updated: 2024)

### IPv4 Ranges
```
173.245.48.0/20
103.21.244.0/22
103.22.200.0/22
103.31.4.0/22
141.101.64.0/18
108.162.192.0/18
190.93.240.0/20
188.114.96.0/20
197.234.240.0/22
198.41.128.0/17
162.158.0.0/15
104.16.0.0/13
104.24.0.0/14
172.64.0.0/13
131.0.72.0/22
```

### IPv6 Ranges
```
2400:cb00::/32
2606:4700::/32
2803:f800::/32
2405:b500::/32
2405:8100::/32
2a06:98c0::/29
2c0f:f248::/32
```

## Verify Setup

Test that only Cloudflare can access your server:

```bash
# From your local machine (should be blocked if not on Cloudflare)
curl http://your-server-ip:5000

# Through Cloudflare (should work)
curl http://your-domain.com
```

## Update Cloudflare IPs

Cloudflare occasionally adds new IP ranges. Update them:

```bash
# Get latest IPs
curl https://www.cloudflare.com/ips-v4
curl https://www.cloudflare.com/ips-v6

# Update your firewall rules accordingly
```

## Troubleshooting

### Can't access server after setup
```bash
# Disable firewall temporarily
sudo ufw disable

# Check SSH still works
sudo ufw allow 22/tcp
sudo ufw enable
```

### Need to allow specific IP temporarily
```bash
# Allow your current IP
sudo ufw allow from YOUR_IP_ADDRESS to any port 5000
```

### Check if firewall is blocking
```bash
# View all rules
sudo ufw status numbered

# View logs
sudo tail -f /var/log/ufw.log
```

## Security Best Practices

1. **Always allow SSH** - Don't lock yourself out!
2. **Test before production** - Verify you can still access the server
3. **Keep IPs updated** - Check Cloudflare's IP list quarterly
4. **Monitor logs** - Watch for blocked legitimate traffic
5. **Backup config** - Save your firewall rules before changes

## Additional Resources

- [Cloudflare IP Ranges](https://www.cloudflare.com/ips/)
- [UFW Documentation](https://help.ubuntu.com/community/UFW)
- [Cloudflare DNS Setup](https://developers.cloudflare.com/dns/)