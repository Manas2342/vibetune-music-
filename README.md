# 🎵 VibeTune - Advanced Music Streaming Platform

VibeTune is a comprehensive music streaming application that integrates Spotify API with YouTube audio streaming, providing users with a rich music discovery and playback experience. The platform features advanced audio streaming, cloud storage, real-time music controls, and intelligent recommendations.

## ✨ Features

### 🎧 Audio Streaming
- **Spotify Integration**: Full Spotify Web API integration with premium user support
- **YouTube Audio Fallback**: Automatic YouTube audio extraction for tracks not available on Spotify
- **Cloud Storage**: AWS S3 integration for audio caching and metadata storage
- **High-Quality Audio**: Multiple quality options (high/medium/low) with automatic quality detection
- **Offline Support**: Local caching for offline music playback

### 🎮 Music Player
- **Real-time Controls**: Play, pause, seek, volume control with millisecond precision
- **Queue Management**: Add, remove, reorder tracks with smart queue management
- **Shuffle & Repeat**: Advanced shuffle with repeat modes (none/track/playlist)
- **Spotify Web Playback SDK**: Direct Spotify playback for premium users
- **Cross-platform Audio**: Seamless fallback between Spotify and YouTube audio

### 🔍 Search & Discovery
- **Universal Search**: Search across Spotify catalog with YouTube audio fallback
- **Smart Recommendations**: AI-powered music recommendations based on listening habits
- **Trending Music**: Real-time trending tracks and popular searches
- **Genre Exploration**: Browse music by categories and genres
- **Artist Discovery**: Related artists and album exploration

### 📱 User Experience
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark Theme**: Modern dark interface with customizable themes
- **Real-time Updates**: Live progress tracking and playback state synchronization
- **Analytics Dashboard**: Personal listening statistics and insights
- **Social Features**: Share tracks and collaborative playlists

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Spotify Developer Account
- YouTube Data API Key (optional)
- AWS Account (optional, for cloud storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd vibetune4
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with your credentials:
   ```env
   # Spotify API Configuration
   SPOTIFY_CLIENT_ID=c988ff755c9d4e2594da9e1440a890ea
   SPOTIFY_CLIENT_SECRET=4b3328d89b494cebaa60ad77af98dd30
   SPOTIFY_REDIRECT_URI=http://localhost:8080/callback

   # Server Configuration
   PORT=8084
   HOST=0.0.0.0

   # YouTube API Configuration (optional)
   YOUTUBE_API_KEY=your_youtube_api_key

   # Cloud Storage Configuration (optional)
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   AWS_REGION=us-east-1
   S3_BUCKET=vibetune-music-cache

   # App Configuration
   JWT_SECRET=your_jwt_secret
   SESSION_SECRET=your_session_secret
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## 🏗️ Architecture

### Backend Services

#### Audio Streaming Service
- **YouTube Audio Extraction**: Uses `ytdl-core` and `youtube-dl-exec` for high-quality audio extraction
- **Format Conversion**: FFmpeg integration for audio format conversion and optimization
- **Streaming Support**: Range request support for efficient mobile streaming
- **Quality Selection**: Automatic quality selection based on connection speed

#### Cloud Storage Service
- **Multi-tier Storage**: Local caching with S3 backup for scalability
- **Image Optimization**: Album art optimization using Sharp
- **Metadata Management**: Comprehensive track metadata with search capabilities
- **Cache Management**: Intelligent cache cleanup and space management

#### Spotify Service
- **Full API Coverage**: Complete Spotify Web API implementation
- **Token Management**: Automatic token refresh and scope management
- **Playback SDK**: Integration with Spotify Web Playback SDK
- **User Management**: Profile sync and preference management

### Frontend Architecture

#### Enhanced Music Player Context
- **Real-time State**: Advanced state management with React hooks
- **Queue Intelligence**: Smart queue management with shuffle memory
- **Audio Buffering**: Optimized audio loading and buffering strategies
- **Cross-platform Support**: Unified API for different audio sources

#### Component Library
- **Radix UI Components**: Accessible and customizable UI components
- **Tailwind Styling**: Utility-first CSS with custom design system
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Performance Optimized**: Lazy loading and virtualization for large lists

## 🎵 Usage Guide

### Getting Started
1. **Spotify Authentication**: Connect your Spotify account for full features
2. **Search Music**: Use the search bar to find your favorite tracks
3. **Play Music**: Click any track to start playback
4. **Build Playlists**: Create and manage your personal playlists
5. **Discover Music**: Explore recommendations and trending tracks

### Advanced Features

#### Premium Spotify Users
- **Full Track Playback**: Play complete tracks through Spotify Web Playback SDK
- **Offline Sync**: Sync your Spotify library for offline access
- **Cross-device Control**: Control playback across different devices

#### Audio Quality
- **Quality Selection**: Choose between high, medium, and low quality
- **Automatic Fallback**: Seamless fallback to alternative audio sources
- **Cache Management**: Intelligent caching for faster playback

#### Social Features
- **Share Tracks**: Share your favorite tracks with friends
- **Collaborative Playlists**: Create playlists with friends
- **Activity Feed**: See what your friends are listening to

## 🔧 API Endpoints

### Music Streaming
- `POST /api/audio/stream/:trackId` - Get audio stream URL
- `GET /api/audio/serve/:trackId` - Serve cached audio with range support
- `GET /api/audio/metadata/:trackId` - Get track metadata
- `GET /api/audio/search` - Search cached tracks
- `GET /api/audio/stats` - Get storage statistics

### Spotify API
- `GET /api/spotify/search` - Search Spotify catalog
- `GET /api/spotify/track/:id` - Get track details
- `GET /api/spotify/artist/:id` - Get artist information
- `GET /api/spotify/recommendations` - Get music recommendations
- `GET /api/spotify/me/playlists` - Get user playlists

### Authentication
- `GET /api/auth/spotify/url` - Get Spotify auth URL
- `GET /api/auth/spotify/callback` - Handle Spotify callback
- `GET /api/auth/user` - Get current user info
- `POST /api/auth/refresh` - Refresh access token

## 🎨 Customization

### Themes
The application supports custom themes through Tailwind CSS variables:
```css
:root {
  --vibetune-dark: #0a0a0a;
  --vibetune-gray: #1a1a1a;
  --vibetune-green: #1db954;
  --vibetune-text-muted: #b3b3b3;
}
```

### Audio Quality
Configure default audio quality in the environment:
```env
AUDIO_QUALITY=high
ENABLE_YOUTUBE_FALLBACK=true
ENABLE_SPOTIFY_PREMIUM=true
```

## 📊 Analytics

The application tracks:
- **Play Counts**: Track popularity and user preferences
- **Listening Time**: Total listening duration and session analytics
- **Search Patterns**: Popular searches and discovery trends
- **Cache Performance**: Cache hit rates and storage optimization
- **User Engagement**: Feature usage and interaction patterns

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "start"]
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Configure SSL certificates
- Set up CDN for static assets
- Configure database connections
- Set up monitoring and logging

## 🔒 Security

- **Token Security**: Secure token storage and automatic refresh
- **HTTPS Enforcement**: SSL/TLS encryption for all communications
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation and sanitization
- **CORS Configuration**: Proper cross-origin resource sharing setup

## 🎯 Performance Optimization

- **Audio Caching**: Intelligent caching strategies for faster playback
- **Code Splitting**: Lazy loading of components and routes
- **Image Optimization**: Automatic image compression and resizing
- **Bundle Optimization**: Tree shaking and dead code elimination
- **CDN Integration**: Global content delivery network setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Spotify Web API** for music metadata and streaming capabilities
- **YouTube** for audio content and fallback streaming
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for utility-first styling
- **React Query** for data fetching and state management
- **Vite** for fast development and building

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the [documentation](./docs)
- Join our [Discord community](https://discord.gg/vibetune)

---

**VibeTune** - Where music meets technology. Built with ❤️ for music lovers everywhere.