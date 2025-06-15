#!/bin/bash

echo "🚀 Deploying NF Trainer..."

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed."
    exit 1
fi

# Deploy Backend to Railway
echo "🚂 Deploying backend to Railway..."
cd backend

# Install Railway CLI if not present
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login and deploy
echo "🔐 Login to Railway (browser will open)..."
railway login

echo "🚀 Creating Railway project..."
railway project new nf-trainer-backend

echo "📦 Deploying backend..."
railway up

echo "🔧 Setting environment variables..."
echo "Please set your CLAUDE_API_KEY in Railway dashboard"
echo "Railway project URL will be your API_URL"

# Deploy Frontend to Vercel
echo "▲ Deploying frontend to Vercel..."
cd ../frontend

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build and deploy
echo "🔧 Please set VITE_API_URL to your Railway app URL in Vercel dashboard"
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your app is now live!"
echo ""
echo "📋 Post-deployment checklist:"
echo "1. Set CLAUDE_API_KEY in Railway dashboard"
echo "2. Set VITE_API_URL in Vercel dashboard"
echo "3. Test the health endpoint: YOUR_RAILWAY_URL/api/health"
echo "4. Upload a test PDF and try the training session"