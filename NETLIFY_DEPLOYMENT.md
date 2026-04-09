# 🚀 Netlify Deployment Guide for VibeTune

This guide will help you deploy your VibeTune app to Netlify with full Spotify API integration.

## 📋 Prerequisites

1. GitHub account with your code pushed
2. Netlify account (free at [netlify.com](https://netlify.com))
3. Spotify Developer account with app credentials

## 🔧 Step 1: Push to GitHub

### 1.1 Commit Your Changes

```bash
cd vibetune4
git add .
git commit -m "Add Netlify deployment configuration"
```

### 1.2 Push to GitHub

```bash
# If you haven't set up remote yet:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

## 🌐 Step 2: Deploy to Netlify

### 2.1 Connect to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub account
5. Select your repository
6. Select the branch: `main`

### 2.2 Configure Build Settings

**Important:** Set these in Netlify dashboard:

- **Base directory:** `vibetune4` (if your repo root is one level up)
- **Build command:** `npm run build:client`
- **Publish directory:** `dist/spa`
- **Functions directory:** `netlify/functions`

### 2.3 Add Environment Variables

In Netlify dashboard, go to **Site settings** → **Environment variables** and add:

#### Required Variables:

```env
NODE_ENV=production
PORT=8080

# Spotify API (REQUIRED)
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=https://YOUR_SITE_NAME.netlify.app/callback

# YouTube API (Optional)
YOUTUBE_API_KEY=your_youtube_api_key_here

# AWS S3 (Optional - for cloud caching)
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
S3_BUCKET=vibetune-music-cache

# JWT Secret (generate a random string)
JWT_SECRET=your_random_jwt_secret_here

# Database
DATABASE_URL=./vibetune.db

# Feature Flags
ENABLE_YOUTUBE_FALLBACK=true
ENABLE_CLOUD_CACHING=true
ENABLE_OFFLINE_MODE=true
ENABLE_ANALYTICS=true
ENABLE_SOCIAL_FEATURES=true
```

**⚠️ Important:** Replace `YOUR_SITE_NAME` with your actual Netlify site name (e.g., `vibetune-app.netlify.app`)

### 2.4 Update Spotify Redirect URI

After deploying, you'll get a Netlify URL like: `https://your-app-name.netlify.app`

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Click **"Edit Settings"**
4. Under **"Redirect URIs"**, add:
   ```
   https://your-app-name.netlify.app/callback
   ```
5. Click **"Add"** and **"Save"**
6. Update the `SPOTIFY_REDIRECT_URI` environment variable in Netlify with your actual URL

## 🔄 Step 3: Deploy

1. Click **"Deploy site"** in Netlify
2. Wait for the build to complete (usually 2-5 minutes)
3. Once deployed, you'll get a URL like: `https://your-app-name.netlify.app`

## ✅ Step 4: Verify Deployment

1. Visit your Netlify URL
2. Click **"Connect with Spotify"**
3. You should be redirected to Spotify login
4. After authorizing, you should be redirected back to your app

## 🐛 Troubleshooting

### Build Fails

- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version (should be 20)

### Spotify Connection Fails

- **HTTPS Error:** Make sure redirect URI in Spotify Dashboard uses `https://` (not `http://`)
- **Redirect URI Mismatch:** The redirect URI in Netlify env vars must exactly match the one in Spotify Dashboard
- **CORS Error:** Check that your Netlify domain is allowed in CORS settings

### API Routes Not Working

- Check Netlify Functions logs in dashboard
- Verify `netlify.toml` redirect rules are correct
- Ensure `netlify/functions/api.ts` exists

### Environment Variables Not Loading

- Make sure variables are set in Netlify dashboard (not just `.env` file)
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

## 🔐 Security Notes

- Never commit `.env` file to GitHub
- Keep `SPOTIFY_CLIENT_SECRET` secure
- Use Netlify's environment variables (not hardcoded)
- Enable HTTPS (automatic on Netlify)

## 📝 Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow instructions to configure DNS
4. Update `SPOTIFY_REDIRECT_URI` with your custom domain

## 🎉 Success!

Your app should now be live on Netlify with full Spotify integration!

**Next Steps:**
- Test all features
- Share your live URL
- Monitor usage in Netlify dashboard



