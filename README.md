# 🎵 VibeTune - AI-Powered Music Streaming Platform

A modern, full-stack music streaming application with AI-powered features, Spotify integration, and emotion-based song recommendations.

## ✨ Features

- 🎵 **Spotify Integration** - Full Spotify API integration
- 🎨 **Beautiful UI** - Modern, responsive design with dark mode
- 🤖 **AI Features** - Emotion detection, face recognition
- 📊 **Analytics Dashboard** - Listening insights and music analytics
- 🔍 **Artist Discovery** - Discover new artists and related music
- 📈 **Trending Dashboard** - Real-time trending tracks and charts
- 💾 **Offline Mode** - Download and play music offline
- 🎤 **Webcam Studio** - Detect emotions and recommend music
- 📱 **Responsive Design** - Works on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Spotify Developer Account
- Webcam (for emotion detection)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/vibetune.git
cd vibetune

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your Spotify credentials

# Build the application
npm run build

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`

## 📖 For Deployment Instructions

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed cloud deployment instructions.

### Quick Deploy

Run the deployment script:
```bash
./deploy.sh
```

Or follow these simple steps for Render.com (Recommended):

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service
4. Connect your GitHub repository
5. Add environment variables
6. Deploy!

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Express, Node.js, SQLite
- **APIs**: Spotify Web API, YouTube API
- **AI/ML**: Face-API.js, Emotion Detection
- **Deployment**: Docker, Render, Railway

## 📁 Project Structure

```
vibetune4/
├── client/          # React frontend
│   ├── components/  # UI components
│   ├── pages/      # Page components
│   └── services/   # API services
├── server/         # Express backend
│   ├── routes/     # API routes
│   └── services/   # Business logic
├── public/         # Static assets
└── dist/          # Build output
```

## 🔑 Environment Variables

Required environment variables (see `env.example`):

```env
# Spotify API
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8080/callback

# App Configuration
NODE_ENV=production
PORT=8080
JWT_SECRET=your_random_secret
```

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [API Documentation](./docs/API.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Spotify for the amazing API
- All open-source contributors

## 📞 Support

For issues and questions:
- GitHub Issues: [Report Bug](https://github.com/YOUR_USERNAME/vibetune/issues)
- Email: support@vibetune.app

---

**Made with ❤️ by Manas Ranjan Seth**

