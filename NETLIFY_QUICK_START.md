# ⚡ Netlify Quick Start Guide

## ✅ Step 1: Code is Already on GitHub!

Your code has been pushed to: `https://github.com/Manas2342/vibetune-music-`

## 🚀 Step 2: Deploy to Netlify (5 minutes)

### 2.1 Create Netlify Account & Connect

1. Go to [app.netlify.com](https://app.netlify.com) and sign up (free)
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"Deploy with GitHub"**
4. Authorize Netlify to access GitHub
5. Select repository: `vibetune-music-`
6. Select branch: `main`

### 2.2 Configure Build Settings

**In the deploy settings, set:**

- **Base directory:** `vibetune4` ⚠️ (Important!)
- **Build command:** `npm run build:client`
- **Publish directory:** `dist/spa`
- **Functions directory:** `netlify/functions`

Click **"Show advanced"** to see these options.

### 2.3 Add Environment Variables

**Before deploying, click "Show advanced" → "New variable" and add:**

```env
NODE_ENV=production
SPOTIFY_CLIENT_ID=c988ff755c9d4e2594da9e1440a890ea
SPOTIFY_CLIENT_SECRET=4b3328d89b494cebaa60ad77af98dd30
SPOTIFY_REDIRECT_URI=https://YOUR_SITE_NAME.netlify.app/callback
JWT_SECRET=your_random_secret_here
```

**⚠️ Important:** You'll need to update `SPOTIFY_REDIRECT_URI` after deployment with your actual Netlify URL!

### 2.4 Deploy!

Click **"Deploy site"** and wait 2-5 minutes.

## 🔗 Step 3: Update Spotify Redirect URI

After deployment, you'll get a URL like: `https://your-app-12345.netlify.app`

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Click **"Edit Settings"**
4. Under **"Redirect URIs"**, add:
   ```
   https://your-app-12345.netlify.app/callback
   ```
   (Replace with your actual Netlify URL)
5. Click **"Add"** and **"Save"**
6. Go back to Netlify → **Site settings** → **Environment variables**
7. Update `SPOTIFY_REDIRECT_URI` with your actual Netlify URL
8. Click **"Trigger deploy"** → **"Clear cache and deploy site"**

## ✅ Step 4: Test!

1. Visit your Netlify URL
2. Click **"Connect with Spotify"**
3. Authorize on Spotify
4. You should be redirected back and connected! 🎉

## 🐛 Troubleshooting

**Build fails?**
- Check build logs in Netlify
- Make sure Base directory is set to `vibetune4`

**Spotify connection fails?**
- Make sure redirect URI in Spotify Dashboard matches Netlify URL exactly
- Use `https://` (not `http://`)
- Update environment variable after first deployment

**API not working?**
- Check Functions logs in Netlify dashboard
- Verify `netlify/functions/api.ts` exists

## 📚 Full Guide

See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for detailed instructions.

