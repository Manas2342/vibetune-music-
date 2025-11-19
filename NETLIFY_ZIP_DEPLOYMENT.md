# 🚀 Complete Netlify Deployment Guide (From Zip File)

This guide will walk you through deploying your VibeTune app to Netlify from a zip file and setting up Spotify API integration.

## 📦 Step 1: Prepare Your Zip File

### 1.1 Extract and Verify Your Zip File

1. Extract your downloaded zip file
2. Make sure you have the `vibetune4` folder with all files
3. Verify these files exist:
   - `package.json`
   - `netlify.toml`
   - `netlify/functions/api.ts`
   - `server/` folder
   - `client/` folder

## 🌐 Step 2: Deploy to Netlify

### 2.1 Create Netlify Account

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"Sign up"** (free account)
3. Sign up with GitHub, Email, or Google

### 2.2 Deploy from Zip File

**Option A: Drag & Drop (Easiest)**

1. In Netlify dashboard, click **"Add new site"** → **"Deploy manually"**
2. You'll see a drag-and-drop area
3. **Important:** You need to zip the `vibetune4` folder contents (not the folder itself)
   - Go into the `vibetune4` folder
   - Select all files and folders inside
   - Create a zip file of these contents
4. Drag your zip file to the Netlify deploy area
5. Wait for upload to complete

**Option B: Connect GitHub (Recommended - Better for Updates)**

1. In Netlify dashboard, click **"Add new site"** → **"Import an existing project"**
2. Click **"Deploy with GitHub"**
3. Authorize Netlify to access your GitHub
4. Select repository: `vibetune-music-`
5. Configure build settings (see Step 2.3 below)

### 2.3 Configure Build Settings

**In Netlify deploy settings, set:**

- **Base directory:** `vibetune4` (if deploying from GitHub)
- **Build command:** `npm run build:client`
- **Publish directory:** `dist/spa`
- **Functions directory:** `netlify/functions`

**Note:** If deploying from zip, you may need to set these after initial deploy in Site Settings.

## 🔐 Step 3: Add Environment Variables

### 3.1 Go to Site Settings

1. After deployment starts, click on your site name
2. Go to **"Site settings"** (top menu)
3. Click **"Environment variables"** (left sidebar)
4. Click **"Add a variable"**

### 3.2 Add Required Variables

Add these one by one (click "Add variable" after each):

#### Required Variables:

```env
# Environment
NODE_ENV=production
PORT=8080

# Spotify API (REQUIRED - Get from Spotify Dashboard)
SPOTIFY_CLIENT_ID=c988ff755c9d4e2594da9e1440a890ea
SPOTIFY_CLIENT_SECRET=4b3328d89b494cebaa60ad77af98dd30
SPOTIFY_REDIRECT_URI=https://YOUR_SITE_NAME.netlify.app/callback

# JWT Secret (Generate a random string)
JWT_SECRET=your_random_secret_string_here_min_32_characters

# Database
DATABASE_URL=./vibetune.db

# Feature Flags
ENABLE_YOUTUBE_FALLBACK=true
ENABLE_CLOUD_CACHING=false
ENABLE_OFFLINE_MODE=true
ENABLE_ANALYTICS=true
ENABLE_SOCIAL_FEATURES=true
```

**⚠️ Important Notes:**
- Replace `YOUR_SITE_NAME` with your actual Netlify site name (you'll get this after first deploy)
- For `JWT_SECRET`, generate a random string (you can use: `openssl rand -hex 32`)

### 3.3 Generate JWT Secret (Optional)

If you want to generate a secure JWT secret, run this in terminal:

```bash
openssl rand -hex 32
```

Copy the output and use it as your `JWT_SECRET` value.

## 🎵 Step 4: Configure Spotify API

### 4.1 Get Your Netlify URL

1. After deployment completes, you'll see your site URL
2. It will look like: `https://your-app-12345.netlify.app`
3. **Copy this URL** - you'll need it!

### 4.2 Update Spotify Developer Dashboard

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click on your app (or create a new one if needed)
4. Click **"Edit Settings"** button

### 4.3 Add Redirect URI

1. Scroll down to **"Redirect URIs"** section
2. Click **"Add URI"**
3. Enter your Netlify callback URL:
   ```
   https://your-app-12345.netlify.app/callback
   ```
   (Replace `your-app-12345` with your actual Netlify site name)
4. Click **"Add"**
5. Click **"Save"** at the bottom

### 4.4 Update Netlify Environment Variable

1. Go back to Netlify → Your Site → **Site settings** → **Environment variables**
2. Find `SPOTIFY_REDIRECT_URI`
3. Click **"Edit"**
4. Update the value to match your actual Netlify URL:
   ```
   https://your-app-12345.netlify.app/callback
   ```
5. Click **"Save"**

### 4.5 Redeploy

1. After updating environment variables, go to **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Wait for redeploy to complete

## ✅ Step 5: Verify Deployment

### 5.1 Check Build Status

1. Go to **"Deploys"** tab in Netlify
2. Make sure the latest deploy shows **"Published"** (green checkmark)
3. If there are errors, click on the deploy to see logs

### 5.2 Test Your Site

1. Visit your Netlify URL: `https://your-app-12345.netlify.app`
2. The site should load
3. Click **"Connect with Spotify"** button
4. You should be redirected to Spotify login
5. After authorizing, you should be redirected back to your app

### 5.3 Troubleshooting

**If Spotify connection fails:**

1. **Check Redirect URI Match:**
   - Spotify Dashboard redirect URI must EXACTLY match Netlify env variable
   - Both must use `https://` (not `http://`)
   - No trailing slashes

2. **Check Environment Variables:**
   - Go to Site settings → Environment variables
   - Verify all Spotify variables are set correctly
   - Make sure `SPOTIFY_REDIRECT_URI` has your actual Netlify URL

3. **Check Build Logs:**
   - Go to Deploys tab
   - Click on latest deploy
   - Check for any errors in the build logs

4. **Check Function Logs:**
   - Go to Functions tab
   - Check if `api` function is deployed
   - Click on function to see logs

## 🔄 Step 6: Update Your Code (Future)

### If You Made Changes:

**Option 1: Re-upload Zip**
1. Make changes locally
2. Create new zip file
3. Drag and drop to Netlify (will create new deploy)

**Option 2: Connect GitHub (Better)**
1. Push your code to GitHub
2. In Netlify, go to Site settings → Build & deploy
3. Click "Link to Git provider"
4. Connect your GitHub repo
5. Future pushes will auto-deploy!

## 📋 Quick Checklist

- [ ] Zip file extracted and verified
- [ ] Netlify account created
- [ ] Site deployed to Netlify
- [ ] Build settings configured
- [ ] Environment variables added
- [ ] Netlify URL obtained
- [ ] Spotify redirect URI added in Spotify Dashboard
- [ ] `SPOTIFY_REDIRECT_URI` updated in Netlify
- [ ] Site redeployed
- [ ] Spotify connection tested and working

## 🎉 Success!

Your app should now be live on Netlify with full Spotify integration!

**Your live URL:** `https://your-app-12345.netlify.app`

## 🆘 Need Help?

- Check Netlify build logs for errors
- Verify all environment variables are set
- Make sure redirect URIs match exactly
- Check browser console for client-side errors

