#!/bin/bash

# OCO Production Build Script
# Creates optimized builds for both frontend and backend

set -e  # Exit on any error

echo "🏗️  Starting OCO production build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/alive75/code/oco"

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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Step 1: Clean previous builds
print_step "Cleaning previous builds..."
cd "$PROJECT_DIR"
rm -rf backend/dist
rm -rf frontend/dist
print_status "✅ Previous builds cleaned"

# Step 2: Install backend dependencies
print_step "Installing backend dependencies..."
cd "$PROJECT_DIR/backend"
npm ci --only=production
print_status "✅ Backend dependencies installed"

# Step 3: Build backend
print_step "Building backend..."
npm run build
if [ $? -eq 0 ]; then
    print_status "✅ Backend build completed successfully"
    print_status "📦 Backend bundle size:"
    du -sh dist/
else
    print_error "❌ Backend build failed!"
    exit 1
fi

# Step 4: Install frontend dependencies
print_step "Installing frontend dependencies..."
cd "$PROJECT_DIR/frontend"
npm ci
print_status "✅ Frontend dependencies installed"

# Step 5: Build frontend
print_step "Building frontend..."
npm run build
if [ $? -eq 0 ]; then
    print_status "✅ Frontend build completed successfully"
    print_status "📦 Frontend bundle size:"
    du -sh dist/
    
    # Show bundle analysis
    print_status "📊 Bundle analysis:"
    ls -la dist/assets/ | grep -E '\.(js|css)$' | awk '{print $9, $5}' | column -t
else
    print_error "❌ Frontend build failed!"
    exit 1
fi

# Step 6: Verify builds
print_step "Verifying builds..."

# Check backend main.js exists
if [ -f "$PROJECT_DIR/backend/dist/main.js" ]; then
    print_status "✅ Backend main.js found"
else
    print_error "❌ Backend main.js not found!"
    exit 1
fi

# Check frontend index.html exists
if [ -f "$PROJECT_DIR/frontend/dist/index.html" ]; then
    print_status "✅ Frontend index.html found"
else
    print_error "❌ Frontend index.html not found!"
    exit 1
fi

# Step 7: Create build info
print_step "Creating build information..."
BUILD_DATE=$(date '+%Y-%m-%d %H:%M:%S')
BUILD_COMMIT=""
if [ -d "$PROJECT_DIR/.git" ]; then
    BUILD_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
fi

cat > "$PROJECT_DIR/build-info.json" << EOF
{
  "buildDate": "$BUILD_DATE",
  "commit": "$BUILD_COMMIT",
  "backendSize": "$(du -sb "$PROJECT_DIR/backend/dist" | cut -f1)",
  "frontendSize": "$(du -sb "$PROJECT_DIR/frontend/dist" | cut -f1)",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)"
}
EOF

print_status "✅ Build information saved to build-info.json"

# Step 8: Summary
print_step "Build Summary"
echo "=================================================="
echo "🎉 Production build completed successfully!"
echo ""
echo "📁 Build locations:"
echo "   Backend:  $PROJECT_DIR/backend/dist/"
echo "   Frontend: $PROJECT_DIR/frontend/dist/"
echo ""
echo "📊 Build sizes:"
echo "   Backend:  $(du -sh "$PROJECT_DIR/backend/dist" | cut -f1)"
echo "   Frontend: $(du -sh "$PROJECT_DIR/frontend/dist" | cut -f1)"
echo ""
echo "🚀 Ready for deployment!"
echo "   Run: ./scripts/deploy.sh"
echo "=================================================="