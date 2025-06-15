#!/bin/bash

echo "🚀 Setting up Regulatory Trainer for deployment..."

# Create project structure
mkdir -p regulatory-trainer/{frontend,backend,scripts}
cd regulatory-trainer

# Initialize frontend
cd frontend
npm create vite@latest . -- --template react
npm install lucide-react

# Initialize backend
cd ../backend
npm init -y
npm install express cors multer pdf-parse @anthropic-ai/sdk express-rate-limit

echo "✅ Project structure created!"
echo "📝 Next steps:"
echo "1. Copy the code files into their respective directories"
echo "2. Set up environment variables"
echo "3. Run ./scripts/deploy.sh"