# ✅ Complete Netlify Setup Checklist

Follow these steps in order to deploy your VibeTune app to Netlify.

## 🎯 Quick Summary

1. **Deploy zip file to Netlify** → Get your URL
2. **Add environment variables** → Configure app settings
3. **Update Spotify Dashboard** → Add redirect URI
4. **Redeploy** → Apply changes
5. **Test** → Verify everything works

---

## 📦 STEP 1: Deploy to Netlify

### 1.1 Create Account
- Go to [app.netlify.com](https://app.netlify.com)
- Sign up (free)

### 1.2 Deploy Your Zip File

**Method 1: Drag & Drop (Quick)**
1. Click **"Add new site"** → **"Deploy manually"**
2. Prepare your zip:
   - Extract your downloaded zip
   - Go into `vibetune4` folder
   - Select ALL files and folders inside
   - Create a new zip of these contents
3. Drag the zip file to Netlify
4. Wait for upload

**Method 2: Connect GitHub (Recommended)**
1. Click **"Add new site"** → **"Import an existing project"**
2. Click **"Deploy with GitHub"**
3. Authorize and select: `vibetune-music-` repository
4. Configure:
   - Base directory: `vibetune4`
   - Build command: `npm run build:client`
   - Publish directory: `dist/spa`

### 1.3 Get Your URL
- After deploy, you'll see: `https://your-app-12345.netlify.app`
- **Copy this URL!** You'll need it.

---

## 🔐 STEP 2: Add Environment Variables

### 2.1 Go to Environment Variables
1. Click your site name
2. **Site settings** → **Environment variables**

### 2.2 Add These Variables

Click **"Add a variable"** for each:

```
NODE_ENV = production
```

```
PORT = 8080
```

```
SPOTIFY_CLIENT_ID = c988ff755c9d4e2594da9e1440a890ea
```

```
SPOTIFY_CLIENT_SECRET = 4b3328d89b494cebaa60ad77af98dd30
```

```
SPOTIFY_REDIRECT_URI = https://YOUR_SITE_NAME.netlify.app/callback
```
⚠️ Replace `YOUR_SITE_NAME` with your actual Netlify URL!

```
JWT_SECRET = [Generate random 32+ character string]
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

---

## 🎵 STEP 3: Configure Spotify API

### 3.1 Go to Spotify Dashboard
- Visit: [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
- Log in

### 3.2 Select Your App
- Click on your app (or create new one)

### 3.3 Add Redirect URI
1. Click **"Edit Settings"**
2. Scroll to **"Redirect URIs"**
3. Click **"Add URI"**
4. Enter: `https://your-app-12345.netlify.app/callback`
   (Use your actual Netlify URL!)
5. Click **"Add"**
6. Click **"Save"**

### 3.4 Update Netlify Variable
1. Go back to Netlify
2. **Site settings** → **Environment variables**
3. Find `SPOTIFY_REDIRECT_URI`
4. Click **"Edit"**
5. Update to: `https://your-app-12345.netlify.app/callback`
6. Click **"Save"**

---

## 🔄 STEP 4: Redeploy

### 4.1 Trigger New Deploy
1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"**
3. Select **"Clear cache and deploy site"**
4. Wait for deploy to complete (2-5 minutes)

---

## ✅ STEP 5: Test

### 5.1 Visit Your Site
- Go to: `https://your-app-12345.netlify.app`

### 5.2 Test Spotify Connection
1. Click **"Connect with Spotify"**
2. You should see Spotify login page
3. Authorize the app
4. You should be redirected back to your app
5. You should see your Spotify profile connected!

### 5.3 If It Doesn't Work

**Check:**
- ✅ Redirect URI in Spotify Dashboard matches Netlify URL exactly
- ✅ Both use `https://` (not `http://`)
- ✅ Environment variable `SPOTIFY_REDIRECT_URI` is correct
- ✅ Site was redeployed after adding variables
- ✅ Check browser console for errors
- ✅ Check Netlify function logs

---

## 🎉 Done!

Your app is now live with Spotify integration!

**Next Steps:**
- Share your URL
- Test all features
- Monitor usage in Netlify dashboard

---

## 📞 Quick Reference

**Your Netlify URL:** `https://your-app-12345.netlify.app`  
**Spotify Redirect URI:** `https://your-app-12345.netlify.app/callback`  
**Spotify Dashboard:** [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)  
**Netlify Dashboard:** [app.netlify.com](https://app.netlify.com)

