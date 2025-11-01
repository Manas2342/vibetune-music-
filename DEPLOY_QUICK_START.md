# ⚡ Quick Deploy - 5 Minutes to Live!

Your app is ready to deploy! Choose one option below:

---

## 🎯 Recommended: Render.com (FREE)

### ⏱️ Takes: ~10 minutes

1. **Go to**: https://render.com → Sign up with GitHub

2. **Click**: "New +" → "Web Service"

3. **Connect**: GitHub repo `Manas2342/vibetune-music-`

4. **Settings**:
   - Name: `vibetune` (or your choice)
   - Branch: `main`
   - **Root Directory**: `vibetune4` ⚠️ Important!
   - Runtime: `Docker`

5. **Environment Variables** (click "Advanced"):
   ```
   NODE_ENV=production
   PORT=8084
   HOST=0.0.0.0
   SPOTIFY_CLIENT_ID=c988ff755c9d4e2594da9e1440a890ea
   SPOTIFY_CLIENT_SECRET=4b3328d89b494cebaa60ad77af98dd30
   SPOTIFY_REDIRECT_URI=https://YOUR-APP-NAME.onrender.com/callback
   JWT_SECRET=<generate-random>
   SESSION_SECRET=<generate-random>
   ```

   Generate secrets: `openssl rand -hex 32`

6. **Deploy**: Click "Create Web Service"

7. **Wait**: ~10 minutes for build

8. **Update Spotify**: Add redirect URI in Spotify dashboard

### ✅ Your Live Link: `https://YOUR-APP-NAME.onrender.com`

---

## 🚂 Alternative: Railway.app ($5/month but easier)

1. Go to: https://railway.app → Sign up
2. New Project → Deploy from GitHub
3. Select: `vibetune-music-`
4. Settings:
   - **Root Directory**: `vibetune4` ⚠️
   - Build: `npm run build`
   - Start: `npm start`
5. Add same environment variables above
6. Deploy!

### ✅ Your Live Link: `https://YOUR-APP.up.railway.app`

---

## 🔗 Your GitHub Repo

**https://github.com/Manas2342/vibetune-music-**

✅ Already pushed and ready!

---

## ⚠️ Important Notes

1. **Root Directory MUST be**: `vibetune4`
2. **Spotify Redirect URI** must match your deployment URL
3. Generate **unique JWT_SECRET** and **SESSION_SECRET**
4. First deploy takes 10-15 minutes

---

## 🆘 Need Help?

See [GITHUB_DEPLOYMENT.md](./GITHUB_DEPLOYMENT.md) for detailed instructions.

---

## 🎉 After Deploying

✅ Auto-deploy enabled! Every git push updates your live site automatically.

Your app will be live with:
- ✅ HTTPS (secure)
- ✅ Custom domain support
- ✅ Automatic SSL
- ✅ No server management

**Share your link and enjoy your music streaming app!** 🎵

