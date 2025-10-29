#!/bin/bash

# VibeTune Deployment Script
# This script helps you deploy your application to various cloud platforms

set -e

echo "🎵 VibeTune Deployment Script"
echo "=============================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "⚠️  Git repository not initialized!"
    echo "Initializing git..."
    git init
    git add .
    git commit -m "Initial commit"
    echo "✅ Git initialized"
    echo ""
fi

# Ask user which platform to deploy to
echo "Which platform would you like to deploy to?"
echo "1) Render.com (Recommended - Free tier available)"
echo "2) Railway.app"
echo "3) DigitalOcean App Platform"
echo "4) Docker Build Only (for manual deployment)"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Deploying to Render.com"
        echo "=========================="
        echo ""
        echo "Steps to deploy:"
        echo "1. Go to https://render.com"
        echo "2. Sign up or login"
        echo "3. Click 'New +' → 'Web Service'"
        echo "4. Connect your GitHub repository"
        echo "5. Configure:"
        echo "   - Name: vibetune"
        echo "   - Runtime: Docker"
        echo "   - Dockerfile Path: ./Dockerfile"
        echo "6. Add environment variables (see DEPLOYMENT_GUIDE.md)"
        echo "7. Click 'Create Web Service'"
        echo ""
        echo "📝 Your GitHub repository URL:"
        git remote get-url origin 2>/dev/null || echo "Not configured. Add with: git remote add origin <your-repo-url>"
        ;;
    2)
        echo ""
        echo "🚂 Deploying to Railway.app"
        echo "=========================="
        echo ""
        echo "Prerequisites:"
        echo "- Install Railway CLI: npm i -g @railway/cli"
        echo "- Login: railway login"
        echo ""
        echo "Deploying now..."
        
        if command -v railway &> /dev/null; then
            railway login
            railway init
            railway up
            echo "✅ Deployment initiated!"
        else
            echo "⚠️  Railway CLI not installed"
            echo "Install with: npm i -g @railway/cli"
        fi
        ;;
    3)
        echo ""
        echo "🌊 Deploying to DigitalOcean App Platform"
        echo "=========================================="
        echo ""
        echo "Steps:"
        echo "1. Go to https://cloud.digitalocean.com/apps"
        echo "2. Create new app"
        echo "3. Connect GitHub repository"
        echo "4. Configure as Docker deployment"
        echo "5. Add environment variables"
        echo "6. Deploy!"
        ;;
    4)
        echo ""
        echo "🐳 Building Docker Image"
        echo "========================"
        echo ""
        
        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo "⚠️  Docker is not installed"
            echo "Install Docker from https://docker.com"
            exit 1
        fi
        
        # Build the image
        echo "Building Docker image..."
        docker build -t vibetune:latest .
        
        echo ""
        echo "✅ Build complete!"
        echo ""
        echo "To test locally:"
        echo "  docker run -p 8084:8084 -e NODE_ENV=production vibetune:latest"
        echo ""
        echo "To push to Docker Hub:"
        echo "  docker tag vibetune:latest YOUR_USERNAME/vibetune:latest"
        echo "  docker push YOUR_USERNAME/vibetune:latest"
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo ""
echo "🎉 Happy deploying!"
