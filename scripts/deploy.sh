#!/bin/bash

# OCO Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting OCO deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/alive75/code/oco"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_DIR="$PROJECT_DIR/logs"

# Create necessary directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Backup database
print_status "Creating database backup..."
if [ -f "$PROJECT_DIR/scripts/backup-database.sh" ]; then
    bash "$PROJECT_DIR/scripts/backup-database.sh"
else
    print_warning "Backup script not found, skipping database backup"
fi

# Step 2: Stop existing PM2 processes
print_status "Stopping existing PM2 processes..."
pm2 stop oco-api || print_warning "No existing PM2 process found"

# Step 3: Pull latest changes (if git repo)
if [ -d "$PROJECT_DIR/.git" ]; then
    print_status "Pulling latest changes from git..."
    cd "$PROJECT_DIR"
    git pull origin main
else
    print_warning "Not a git repository, skipping git pull"
fi

# Step 4: Install backend dependencies
print_status "Installing backend dependencies..."
cd "$PROJECT_DIR/backend"
npm ci --production

# Step 5: Build backend
print_status "Building backend application..."
npm run build

# Step 6: Build frontend
print_status "Building frontend application..."
cd "$PROJECT_DIR/frontend"
npm ci
npm run build

# Step 7: Start PM2 process
print_status "Starting OCO API with PM2..."
cd "$PROJECT_DIR"
pm2 start ecosystem.config.js --env production

# Step 8: Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Step 9: Health check
print_status "Performing health check..."
sleep 5  # Wait for service to start

if curl -f -s http://localhost:3000/health > /dev/null; then
    print_status "✅ Health check passed! OCO is running successfully."
else
    print_error "❌ Health check failed! Please check the logs."
    pm2 logs oco-api --lines 20
    exit 1
fi

# Step 10: Display status
print_status "Deployment completed successfully! 🎉"
print_status "API Health: http://localhost:3000/health"
print_status "API Docs: http://localhost:3000/api"
print_status ""
print_status "Useful commands:"
print_status "  pm2 status          - Check process status"
print_status "  pm2 logs oco-api    - View logs"
print_status "  pm2 monit           - Monitor processes"
print_status "  pm2 restart oco-api - Restart the API"