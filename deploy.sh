#!/bin/bash

# Deployment script for Online Assistant
# Usage: ./deploy.sh

echo "🚀 Starting deployment..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SERVER_USER="root"
SERVER_IP="WPISZ_IP_DROPLETA"
APP_DIR="/var/www/onlineassistant"

echo -e "${BLUE}Step 1: Building frontend...${NC}"
cd client
npm install
npm run build
cd ..

if [ ! -d "client/dist" ]; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully${NC}"

echo -e "${BLUE}Step 2: Installing backend dependencies...${NC}"
cd server
npm install --production
cd ..

echo -e "${GREEN}✅ Backend dependencies installed${NC}"

echo -e "${BLUE}Step 3: Uploading files to server...${NC}"

# Upload backend
echo "Uploading backend..."
scp -r server $SERVER_USER@$SERVER_IP:$APP_DIR/

# Upload frontend dist
echo "Uploading frontend..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $APP_DIR/client"
scp -r client/dist $SERVER_USER@$SERVER_IP:$APP_DIR/client/

# Upload PM2 config
echo "Uploading PM2 config..."
scp ecosystem.config.js $SERVER_USER@$SERVER_IP:$APP_DIR/

echo -e "${GREEN}✅ Files uploaded${NC}"

echo -e "${BLUE}Step 4: Restarting application on server...${NC}"

ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /var/www/onlineassistant
pm2 restart onlineassistant || pm2 start ecosystem.config.js
pm2 save
ENDSSH

echo -e "${GREEN}✅ Application restarted${NC}"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}Visit: https://sobit.uk${NC}"
