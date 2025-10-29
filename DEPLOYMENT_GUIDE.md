# 🚀 VibeTune Cloud Deployment Guide

This guide will help you deploy your VibeTune application to the cloud. We'll use **Render.com** as it's the easiest and most straightforward option.

## 📋 Prerequisites

1. **GitHub Account** - For code repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Spotify Developer Account** - You already have this set up

## 🎯 Deployment Options

### Option 1: Render.com (Recommended) - Easiest & Free Tier Available

### Option 2: Railway.app - Modern Platform, $5/month

### Option 3: DigitalOcean App Platform - Professional Platform

### Option 4: AWS/Docker - For Advanced Users

---

## 🚀 Quick Deploy to Render.com (Recommended)

### Step 1: Push Code to GitHub

```bash
# Navigate to project directory
cd "/Users/manasranjanseth/Desktop/MANAS CODING/Manas vibetune project/vibetune4/vibetune4"

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - VibeTune ready for deployment"

# Create repository on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/vibetune.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Render

1. **Go to Render.com** and sign up/login
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `vibetune`
   - **Region**: Choose closest to you (Oregon recommended)
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Context**: `.` (current directory)

5. **Add Environment Variables:**
   ```
   NODE_ENV=production
   PORT=8084
   HOST=0.0.0.0
   
   SPOTIFY_CLIENT_ID=c988ff755c9d4e2594da9e1440a890ea
   SPOTIFY_CLIENT_SECRET=4b3328d89b494cebaa60ad77af98dd30
   SPOTIFY_REDIRECT_URI=https://YOUR_APP_NAME.onrender.com/callback
   
   JWT_SECRET=<generate-a-random-string>
   SESSION_SECRET=<generate-a-random-string>
   
   ENABLE_YOUTUBE_FALLBACK=true
   ENABLE_SPOTIFY_PREMIUM=true
   MAX_CACHE_SIZE_GB=10
   ```

6. **Click "Create Web Service"**
7. **Wait for deployment** (takes 10-15 minutes on first deploy)

### Step 3: Update Spotify Redirect URI

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Edit your app settings
3. Add redirect URI: `https://YOUR_APP_NAME.onrender.com/callback`
4. Save

### Step 4: Access Your App

Your app will be live at: `https://YOUR_APP_NAME.onrender.com`

---

## 🚂 Deploy to Railway.app

### Prerequisites
- Railway account at [railway.app](https://railway.app)

### Steps

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Deploy:**
   ```bash
   cd "/Users/manasranjanseth/Desktop/MANAS CODING/Manas vibetune project/vibetune4/vibetune4"
   railway init
   railway up
   ```

4. **Add Environment Variables:**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=8084
   railway variables set SPOTIFY_CLIENT_ID=c988ff755c9d4e2594da9e1440a890ea
   railway variables set SPOTIFY_CLIENT_SECRET=4b3328d89b494cebaa60ad77af98dd30
   railway variables set SPOTIFY_REDIRECT_URI=https://your-app.railway.app/callback
   ```

5. **Your app will be live at:**
   ```
   https://your-app.railway.app
   ```

---

## 🐳 Deploy with Docker to Any Cloud Provider

### Build the Docker Image

```bash
cd "/Users/manasranjanseth/Desktop/MANAS CODING/Manas vibetune project/vibetune4/vibetune4"

# Build the image
docker build -t vibetune:latest .

# Test locally
docker run -p 8084:8084 -e NODE_ENV=production vibetune:latest
```

### Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag the image
docker tag vibetune:latest YOUR_USERNAME/vibetune:latest

# Push to Docker Hub
docker push YOUR_USERNAME/vibetune:latest
```

### Deploy to DigitalOcean

1. Create a new App Platform service
2. Connect to Docker Hub
3. Use image: `YOUR_USERNAME/vibetune:latest`
4. Add environment variables
5. Deploy!

### Deploy to AWS ECS/Fargate

1. Create ECS cluster
2. Create task definition using the Docker image
3. Create service
4. Configure load balancer
5. Deploy!

---

## 🔧 Environment Variables Reference

### Required Variables:

```bash
NODE_ENV=production
PORT=8084
HOST=0.0.0.0

# Spotify API
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=https://your-domain.com/callback

# Security
JWT_SECRET=your_random_secret_here
SESSION_SECRET=your_random_secret_here

# App Configuration
ENABLE_YOUTUBE_FALLBACK=true
ENABLE_SPOTIFY_PREMIUM=true
MAX_CACHE_SIZE_GB=10
```

### Optional Variables:

```bash
# Database (for production, use PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# AWS S3 (for music caching)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET=vibetune-music-cache

# YouTube API
YOUTUBE_API_KEY=your_youtube_key

# Analytics
ENABLE_ANALYTICS=true
ENABLE_SOCIAL_FEATURES=true
```

---

## 🛠️ Troubleshooting

### Build Fails

**Issue**: Docker build fails
**Solution**: 
```bash
# Clean rebuild
docker system prune -a
docker build --no-cache -t vibetune:latest .
```

### Environment Variables Not Working

**Issue**: App starts but Spotify doesn't work
**Solution**: 
- Check that all env vars are set in deployment platform
- Verify `SPOTIFY_REDIRECT_URI` matches your domain
- Check platform logs for errors

### Database Issues

**Issue**: SQLite errors in production
**Solution**: Use persistent volumes or switch to PostgreSQL:
```bash
# Add PostgreSQL service in Render
# Update DATABASE_URL in environment variables
```

### Build Timeout

**Issue**: Build times out (> 30 minutes)
**Solution**:
- Increase build timeout in settings
- Optimize Dockerfile (multi-stage build already implemented)
- Use build cache

---

## 📊 Monitoring & Logs

### Render.com
- View logs in the Render dashboard
- Automatic restarts on crash
- Built-in health checks

### Railway
- View logs: `railway logs`
- Real-time monitoring in dashboard

### Docker
- View logs: `docker logs <container_id>`
- Monitor: `docker stats <container_id>`

---

## 🔐 Security Best Practices

1. **Never commit secrets** to git
2. **Use environment variables** for all sensitive data
3. **Enable HTTPS** (Render and Railway do this automatically)
4. **Set up firewall rules** if using cloud VMs
5. **Regularly update dependencies**
6. **Use strong JWT secrets** (generate with `openssl rand -hex 32`)

---

## 🎯 Post-Deployment Checklist

- [ ] App is accessible via HTTPS
- [ ] Spotify OAuth redirect URI updated
- [ ] All environment variables set
- [ ] Database is persistent
- [ ] Health check endpoint working (`/api/ping`)
- [ ] SSL certificate active
- [ ] Monitoring set up
- [ ] Backups configured

---

## 🚀 Auto-Deploy on Git Push

Both Render and Railway support automatic deployments:

1. **Push to main branch** → Auto-deploy
2. **Create pull request** → Preview deployment
3. **Merge to main** → Production deployment

No manual steps needed after initial setup!

---

## 📞 Support

If you encounter issues:
1. Check platform logs
2. Review environment variables
3. Test locally with Docker
4. Check Spotify API status

---

## 🎉 Success!

Your VibeTune app is now live in the cloud! 🎊

Access it at: `https://your-app-url.com`

Enjoy your music! 🎵
