#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Setting up local PostgreSQL database for NameSwipe${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Function to run docker-compose with correct command
run_compose() {
    if docker compose version &> /dev/null 2>&1; then
        docker compose "$@"
    else
        docker-compose "$@"
    fi
}

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping any existing containers...${NC}"
run_compose down

# Start PostgreSQL container
echo -e "${YELLOW}🐘 Starting PostgreSQL container...${NC}"
run_compose up -d postgres

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
attempts=0
max_attempts=30

while [ $attempts -lt $max_attempts ]; do
    if docker exec nameswipe-db pg_isready -U nameswipe > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
        break
    fi
    attempts=$((attempts + 1))
    sleep 1
done

if [ $attempts -eq $max_attempts ]; then
    echo -e "${RED}❌ PostgreSQL failed to start in time${NC}"
    exit 1
fi

# Copy .env.local to .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file from .env.local...${NC}"
    cp .env.local .env
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists. Ensure DATABASE_URL is set correctly.${NC}"
    echo "   Expected: postgresql://nameswipe:nameswipe_dev@localhost:5432/nameswipe"
fi

# Run database migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
npm run db:push

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database migrations completed successfully!${NC}"
else
    echo -e "${RED}❌ Database migrations failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Local database setup complete!${NC}"
echo ""
echo "Database connection details:"
echo "  Host:     localhost"
echo "  Port:     5432"
echo "  Database: nameswipe"
echo "  Username: nameswipe"
echo "  Password: nameswipe_dev"
echo ""
echo "Connection string:"
echo "  postgresql://nameswipe:nameswipe_dev@localhost:5432/nameswipe"
echo ""
echo -e "${YELLOW}To start the development server with the database:${NC}"
echo "  npm run dev:local"
echo ""
echo -e "${YELLOW}To stop the database:${NC}"
echo "  npm run db:stop"
echo ""
echo -e "${YELLOW}To view database logs:${NC}"
echo "  npm run db:logs"