#!/bin/bash
# Deployment script for Messenger App

set -e

echo "🚀 Deploying Messenger App..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set up backend
echo "🔧 Setting up backend..."
cd backend

# Copy env if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Created .env from .env.example - please update with your values"
fi

# Generate Prisma client
npx prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Seed database (only in development)
if [ "$NODE_ENV" = "development" ]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
fi

cd ..

# Build frontend
echo "🏗️  Building frontend..."
cd frontend
npm run build
cd ..

# Build backend
echo "🏗️  Building backend..."
cd backend
npm run build
cd ..

echo "✅ Build complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your production values"
echo "2. Start the servers: npm run start"
echo "3. Or deploy to your hosting provider"
echo ""
echo "📚 See docs/API.md for API documentation"
echo "📚 See README.md for more information"
