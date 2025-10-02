#!/bin/bash
# Setup journald log rotation for NameSwipe application

set -e

echo "Configuring journald log rotation..."

# Backup existing config if it exists
if [ -f /etc/systemd/journald.conf ]; then
    sudo cp /etc/systemd/journald.conf /etc/systemd/journald.conf.backup
    echo "Backed up existing journald.conf"
fi

# Configure journald with reasonable limits for a 29GB disk
sudo tee -a /etc/systemd/journald.conf > /dev/null <<'EOF'

# NameSwipe logging configuration
[Journal]
# Limit journal disk usage to 500MB (plenty for logs)
SystemMaxUse=500M

# Maximum size of individual journal files
SystemMaxFileSize=50M

# Keep logs for 14 days
MaxRetentionSec=2week

# Forward to syslog (optional)
#ForwardToSyslog=yes

# Compress logs
Compress=yes
EOF

echo "Journald configuration updated"
echo "Restarting journald..."

sudo systemctl restart systemd-journald

echo "✓ Journald configured successfully"
echo ""
echo "Current journal disk usage:"
journalctl --disk-usage
echo ""
echo "To view NameSwipe logs:"
echo "  sudo journalctl -u nameswipe -f"
echo ""
echo "To clean old logs:"
echo "  sudo journalctl --vacuum-time=7d"
echo "  sudo journalctl --vacuum-size=300M"
