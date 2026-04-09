# 🚀 VibeTune - Quick Reference Guide

## 📋 Project Summary (30 seconds)
**VibeTune** is an AI-powered music streaming platform with emotion detection, Spotify integration, offline mode, and social features. Built with React, TypeScript, Node.js, Express, and SQLite.

---

## 🎯 Key Features (One-liners)

- 🎵 **Music Streaming**: Spotify API integration for full music catalog
- 🤖 **AI Emotion Detection**: Real-time face recognition for mood-based recommendations
- 💾 **Offline Mode**: Download and play music without internet
- 📊 **Analytics**: Listening insights and music statistics
- 🔍 **Discovery**: Artist discovery, trending tracks, recommendations
- 👥 **Social**: User following, activity feeds, track sharing
- 📱 **Responsive**: Works on all devices

---

## 🛠️ Tech Stack (Quick)

### Frontend
- React 18 + TypeScript
- Vite (Build tool)
- TailwindCSS (Styling)
- React Router (Routing)
- TanStack Query (Server state)
- Radix UI (Components)

### Backend
- Node.js + Express
- SQLite (Database)
- Socket.io (Real-time)
- JWT (Authentication)

### APIs & Services
- Spotify Web API
- YouTube API (Fallback)
- face-api.js (Emotion detection)

### Deployment
- Docker
- Render.com / Railway.app

---

## 📁 Project Structure (Quick)

```
vibetune4/
├── client/          # React frontend
├── server/          # Express backend
├── public/          # Static assets + ML models
├── storage/         # Local file storage
└── shared/          # Shared types
```

---

## 🔑 Key Concepts

### State Management
- **Client State**: React Context API (Auth, Player, Library)
- **Server State**: React Query (API data, caching)

### Authentication
- **JWT**: App authentication
- **OAuth 2.0**: Spotify integration

### Architecture
- **RESTful API**: Standard HTTP methods
- **Service Layer**: Business logic separation
- **Middleware**: Auth, validation, error handling

---

## 🎤 Common Questions & Answers

### Q: What is VibeTune?
**A**: AI-powered music streaming platform with emotion detection, Spotify integration, and offline mode.

### Q: How does emotion detection work?
**A**: Uses face-api.js in browser to detect emotions from webcam, then recommends music based on mood.

### Q: What technologies did you use?
**A**: React, TypeScript, Node.js, Express, SQLite, Spotify API, face-api.js, Docker.

### Q: How do you handle authentication?
**A**: JWT tokens for app auth, OAuth 2.0 for Spotify integration, automatic token refresh.

### Q: How does music streaming work?
**A**: Spotify API for primary source, local caching for performance, YouTube API as fallback.

### Q: What's the database?
**A**: SQLite for MVP (users, playlists, history, social features). Can scale to PostgreSQL.

### Q: How is it deployed?
**A**: Docker container on Render.com with auto-deploy on git push.

### Q: What makes it unique?
**A**: Real-time emotion detection, offline mode, social features, comprehensive analytics.

---

## 📊 Database Tables (Quick)

- `users` - User accounts
- `playlists` - User playlists
- `tracks` - Track metadata
- `playlist_tracks` - Playlist-track relationships
- `listening_history` - Playback history
- `user_follows` - Social following
- `offline_downloads` - Offline tracks

---

## 🔌 Main API Endpoints

### Auth
- `GET /api/auth/spotify/url` - Get OAuth URL
- `GET /api/auth/spotify/callback` - OAuth callback

### Music
- `GET /api/spotify/search` - Search music
- `GET /api/spotify/track/:id` - Get track
- `GET /api/spotify/recommendations` - Get recommendations

### Library
- `GET /api/library` - Get user library
- `POST /api/library/sync` - Sync with Spotify

### Offline
- `POST /api/offline/download` - Download track
- `GET /api/offline/tracks` - Get offline tracks

---

## 🚀 Deployment Checklist

- [ ] Environment variables set
- [ ] Spotify redirect URI configured
- [ ] Docker build successful
- [ ] Database initialized
- [ ] Health check working (`/api/ping`)
- [ ] HTTPS enabled
- [ ] CORS configured

---

## 💡 Key Implementation Details

1. **Emotion Detection**: Client-side using face-api.js (privacy-friendly)
2. **Audio Caching**: Multi-layer caching (memory, file system, S3)
3. **Token Management**: Automatic refresh for Spotify tokens
4. **Offline Mode**: Local file storage with metadata in database
5. **Real-time**: Socket.io for live updates
6. **Performance**: Code splitting, lazy loading, caching

---

## 🎯 Project Highlights

✅ Full-stack implementation
✅ AI/ML integration (emotion detection)
✅ Third-party API integration (Spotify)
✅ Real-time features (Socket.io)
✅ Offline capabilities
✅ Social features
✅ Analytics dashboard
✅ Production-ready deployment

---

## 📝 Quick Commands

```bash
# Development
npm run dev              # Start dev server

# Build
npm run build           # Build client + server
npm run build:client    # Build client only
npm run build:server    # Build server only

# Production
npm start               # Start production server

# Setup
npm install             # Install dependencies
npm run download-models # Download ML models
```

---

## 🔗 Important Files

- `PROJECT_NOTES.md` - Comprehensive project documentation
- `README.md` - Project overview
- `TECHNOLOGY_STACK.md` - Detailed tech stack
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `package.json` - Dependencies
- `Dockerfile` - Docker configuration

---

**Use this as a quick reference during interviews or presentations!**



