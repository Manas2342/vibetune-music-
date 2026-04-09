# 🔧 Fix Spotify Connection on Netlify

Your site is deployed: https://vibetunemusicapp.netlify.app/

## ✅ Step-by-Step Fix

### Step 1: Add Environment Variables in Netlify

1. Go to your Netlify site: https://app.netlify.com/sites/vibetunemusicapp
2. Click **"Site settings"** (top menu)
3. Click **"Environment variables"** (left sidebar)
4. Click **"Add a variable"** and add these one by one:

```
NODE_ENV = production
```

```
SPOTIFY_CLIENT_ID = c0b1e3198a4148c79bcb4e104102e98a
```

```
SPOTIFY_CLIENT_SECRET = a8cd83592a534e3284f7111210ea9610
```

```
SPOTIFY_REDIRECT_URI = https://vibetunemusicapp.netlify.app/callback
```

```
PORT = 8080
```

```
JWT_SECRET = [generate a random 32+ character string]
```
💡 Generate one: Run `openssl rand -hex 32` in terminal

```
DATABASE_URL = ./vibetune.db
```

```
ENABLE_YOUTUBE_FALLBACK = true
```

```
ENABLE_CLOUD_CACHING = false
```

```
ENABLE_OFFLINE_MODE = true
```

```
ENABLE_ANALYTICS = true
```

```
ENABLE_SOCIAL_FEATURES = true
```

### Step 2: Update Spotify Dashboard

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Click on your app **"vibetune"**
3. Click **"Edit Settings"**
4. Under **"Redirect URIs"**, click **"Add URI"**
5. Add: `https://vibetunemusicapp.netlify.app/callback`
6. Click **"Add"** and **"Save"**

**Important:** Make sure this URL matches exactly with the `SPOTIFY_REDIRECT_URI` in Netlify!

### Step 3: Redeploy

1. In Netlify, go to **"Deploys"** tab
2. Click **"Trigger deploy"**
3. Select **"Clear cache and deploy site"**
4. Wait for deployment to complete (2-5 minutes)

### Step 4: Test

1. Visit: https://vibetunemusicapp.netlify.app/
2. Click **"Connect with Spotify"**
3. You should be redirected to Spotify login
4. After authorizing, you should be redirected back

## 🐛 Troubleshooting

### If it still doesn't work:

1. **Check Browser Console:**
   - Open your site
   - Press F12 (or right-click → Inspect)
   - Go to "Console" tab
   - Look for red error messages
   - Share the errors you see

2. **Check Netlify Function Logs:**
   - In Netlify, go to **"Functions"** tab
   - Click on **"api"** function
   - Check the logs for errors

3. **Verify Environment Variables:**
   - Make sure all variables are set correctly
   - Check for typos in variable names
   - Ensure `SPOTIFY_REDIRECT_URI` uses `https://` (not `http://`)

4. **Test API Endpoint:**
   - Try visiting: https://vibetunemusicapp.netlify.app/api/ping
   - Should return: `{"message":"ping"}`
   - If this fails, the Netlify function isn't working

## 📋 Quick Checklist

- [ ] Environment variables added in Netlify
- [ ] `SPOTIFY_REDIRECT_URI` matches Netlify URL exactly
- [ ] Redirect URI added in Spotify Dashboard
- [ ] Site redeployed after adding variables
- [ ] Browser console checked for errors
- [ ] API endpoint tested (`/api/ping`)



