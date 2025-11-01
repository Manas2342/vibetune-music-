# 🔐 Render.com Environment Variables

Copy and paste these into your Render.com deployment settings:

## Required Variables

```env
NODE_ENV=production
PORT=8084
HOST=0.0.0.0

# Spotify API Credentials
SPOTIFY_CLIENT_ID=c988ff755c9d4e2594da9e1440a890ea
SPOTIFY_CLIENT_SECRET=4b3328d89b494cebaa60ad77af98dd30
SPOTIFY_REDIRECT_URI=https://YOUR-APP-NAME.onrender.com/callback

# Security Secrets (Already Generated)
JWT_SECRET=b2d8f22c519c7ad5a8a113d57469682e8dbbf532f9fff4bc732051004a270720
SESSION_SECRET=3149853244079645b3e2b4d4e4e259f2d4b65bf1ea08e1c3dd28863525553c2e

# App Configuration
ENABLE_YOUTUBE_FALLBACK=true
ENABLE_SPOTIFY_PREMIUM=true
MAX_CACHE_SIZE_GB=10
```

## ⚠️ Important Notes:

1. Replace `YOUR-APP-NAME` with your actual Render app name
2. After deploying, update the Spotify redirect URI in your Spotify Developer Dashboard
3. These secrets are already generated and secure - don't share them publicly!

## 🎯 After Deploying:

1. Get your app URL: `https://your-app-name.onrender.com`
2. Go to: https://developer.spotify.com/dashboard
3. Click on your app
4. Edit settings → Add redirect URI: `https://your-app-name.onrender.com/callback`
5. Save
6. Test your app!

## 📝 Optional Variables (Advanced):

```env
# Database (if using PostgreSQL)
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

**🚀 You're all set! Just copy the Required Variables above into Render!**

