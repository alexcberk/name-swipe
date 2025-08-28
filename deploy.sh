#!/bin/bash
# NameSwipe VPS Deployment Script

set -e

echo "🚀 NameSwipe VPS Deployment Script"
echo "=================================="

# Configuration
APP_NAME="nameswipe"
DEPLOY_DIR="/opt/$APP_NAME"
SERVICE_FILE="/etc/systemd/system/$APP_NAME.service"
NGINX_CONFIG="/etc/nginx/sites-available/$APP_NAME"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root or with sudo"
  exit 1
fi

# Function to install dependencies
install_dependencies() {
  echo "📦 Installing system dependencies..."
  
  # Update package list
  apt-get update
  
  # Install essential packages
  apt-get install -y curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx
  
  # Install Bun if not already installed
  if ! command -v bun &> /dev/null; then
    echo "📥 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
  else
    echo "✅ Bun already installed"
  fi
}

# Function to setup PostgreSQL
setup_database() {
  echo "🗄️ Setting up PostgreSQL database..."
  
  # Start PostgreSQL
  systemctl start postgresql
  systemctl enable postgresql
  
  # Create database and user
  sudo -u postgres psql <<EOF
CREATE USER $APP_NAME WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $APP_NAME OWNER $APP_NAME;
GRANT ALL PRIVILEGES ON DATABASE $APP_NAME TO $APP_NAME;
EOF
  
  echo "✅ Database setup complete"
}

# Function to deploy application
deploy_application() {
  echo "📂 Deploying application..."
  
  # Create deploy directory
  mkdir -p $DEPLOY_DIR
  
  # Copy application files
  cp -r . $DEPLOY_DIR/
  cd $DEPLOY_DIR
  
  # Install dependencies with Bun
  echo "📦 Installing Node dependencies..."
  bun install --production
  
  # Build the application
  echo "🔨 Building application..."
  bun run build
  
  # Create standalone binary
  echo "🎯 Creating standalone binary..."
  bun run build:standalone
  
  echo "✅ Application deployed"
}

# Function to setup systemd service
setup_service() {
  echo "⚙️ Setting up systemd service..."
  
  cat > $SERVICE_FILE <<EOF
[Unit]
Description=NameSwipe Baby Name Application
After=network.target postgresql.service

[Service]
Type=simple
User=$APP_NAME
WorkingDirectory=$DEPLOY_DIR
Environment="NODE_ENV=production"
Environment="DATABASE_URL=postgresql://$APP_NAME:$DB_PASSWORD@localhost:5432/$APP_NAME"
Environment="PORT=3000"
ExecStart=/usr/local/bin/bun run start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
  
  # Create system user for the app
  useradd -r -s /bin/false $APP_NAME || true
  chown -R $APP_NAME:$APP_NAME $DEPLOY_DIR
  
  # Reload systemd and start service
  systemctl daemon-reload
  systemctl enable $APP_NAME
  systemctl restart $APP_NAME
  
  echo "✅ Systemd service configured and started"
}

# Function to setup Nginx
setup_nginx() {
  echo "🌐 Setting up Nginx reverse proxy..."
  
  cat > $NGINX_CONFIG <<EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
  
  # Enable the site
  ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
  
  # Test and reload Nginx
  nginx -t
  systemctl reload nginx
  
  echo "✅ Nginx configured"
}

# Function to setup SSL with Let's Encrypt
setup_ssl() {
  echo "🔒 Setting up SSL certificate..."
  
  if [ -n "$DOMAIN_NAME" ] && [ -n "$EMAIL" ]; then
    certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos -m $EMAIL
    echo "✅ SSL certificate installed"
  else
    echo "⚠️ Skipping SSL setup - DOMAIN_NAME and EMAIL not provided"
  fi
}

# Function to setup firewall
setup_firewall() {
  echo "🔥 Configuring firewall..."
  
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
  
  echo "✅ Firewall configured"
}

# Main deployment flow
main() {
  # Check for required environment variables
  if [ -z "$DB_PASSWORD" ]; then
    echo "❌ DB_PASSWORD environment variable is required"
    exit 1
  fi
  
  echo "🚀 Starting deployment..."
  echo ""
  
  install_dependencies
  setup_database
  deploy_application
  setup_service
  setup_nginx
  setup_ssl
  setup_firewall
  
  echo ""
  echo "✨ Deployment complete!"
  echo ""
  echo "📝 Next steps:"
  echo "1. Check service status: systemctl status $APP_NAME"
  echo "2. View logs: journalctl -u $APP_NAME -f"
  echo "3. Access your app at: http://$DOMAIN_NAME (or http://your-server-ip)"
  echo ""
}

# Run main function
main