#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting NameSwipe with local PostgreSQL${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if PostgreSQL container is running
if ! docker ps | grep -q nameswipe-db; then
    echo -e "${YELLOW}⚠️  PostgreSQL container is not running. Starting it now...${NC}"
    docker-compose up -d postgres
    
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
fi

# Load environment variables from .env.local
if [ -f .env.local ]; then
    # Save any existing PORT value
    SAVED_PORT=$PORT
    # Load environment variables properly
    set -a
    source .env.local
    set +a
    # Restore PORT if it was provided as an argument
    if [ ! -z "$SAVED_PORT" ]; then
        export PORT=$SAVED_PORT
    fi
    echo -e "${GREEN}✅ Environment variables loaded from .env.local${NC}"
else
    echo -e "${RED}❌ .env.local file not found${NC}"
    exit 1
fi

# Start the development server
echo -e "${GREEN}🚀 Starting development server...${NC}"
echo -e "${YELLOW}Database URL: ${DATABASE_URL}${NC}"
echo ""

NODE_ENV=development DATABASE_URL="${DATABASE_URL}" PORT="${PORT}" tsx server/index.ts