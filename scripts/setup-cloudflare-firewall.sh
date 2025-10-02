#!/bin/bash
# Setup firewall to only allow Cloudflare IPs to access port 5000

echo "Setting up firewall rules for Cloudflare IP ranges..."

# Check if ufw is installed
if ! command -v ufw &> /dev/null; then
    echo "Installing ufw..."
    sudo apt-get update
    sudo apt-get install -y ufw
fi

# Reset UFW to default
echo "Resetting UFW rules..."
sudo ufw --force reset

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (IMPORTANT: Don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow localhost
sudo ufw allow from 127.0.0.1

# Allow local network (adjust if your network is different)
sudo ufw allow from 192.168.0.0/16
sudo ufw allow from 10.0.0.0/8

# Cloudflare IPv4 ranges
echo "Adding Cloudflare IPv4 ranges..."
sudo ufw allow from 173.245.48.0/20 to any port 5000
sudo ufw allow from 103.21.244.0/22 to any port 5000
sudo ufw allow from 103.22.200.0/22 to any port 5000
sudo ufw allow from 103.31.4.0/22 to any port 5000
sudo ufw allow from 141.101.64.0/18 to any port 5000
sudo ufw allow from 108.162.192.0/18 to any port 5000
sudo ufw allow from 190.93.240.0/20 to any port 5000
sudo ufw allow from 188.114.96.0/20 to any port 5000
sudo ufw allow from 197.234.240.0/22 to any port 5000
sudo ufw allow from 198.41.128.0/17 to any port 5000
sudo ufw allow from 162.158.0.0/15 to any port 5000
sudo ufw allow from 104.16.0.0/13 to any port 5000
sudo ufw allow from 104.24.0.0/14 to any port 5000
sudo ufw allow from 172.64.0.0/13 to any port 5000
sudo ufw allow from 131.0.72.0/22 to any port 5000

# Cloudflare IPv6 ranges
echo "Adding Cloudflare IPv6 ranges..."
sudo ufw allow from 2400:cb00::/32 to any port 5000
sudo ufw allow from 2606:4700::/32 to any port 5000
sudo ufw allow from 2803:f800::/32 to any port 5000
sudo ufw allow from 2405:b500::/32 to any port 5000
sudo ufw allow from 2405:8100::/32 to any port 5000
sudo ufw allow from 2a06:98c0::/29 to any port 5000
sudo ufw allow from 2c0f:f248::/32 to any port 5000

# Enable UFW
echo "Enabling UFW..."
sudo ufw --force enable

# Show status
echo ""
echo "Firewall rules applied. Current status:"
sudo ufw status numbered

echo ""
echo "✅ Firewall configured to only allow Cloudflare IPs on port 5000"
echo "⚠️  Make sure SSH (port 22) remains accessible!"