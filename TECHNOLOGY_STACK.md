# 🛠️ VibeTune Technology Stack

## Frontend: React.js, TypeScript, HTML, CSS

**React.js**: Builds a dynamic, responsive, and interactive user interface with component-based architecture for seamless user experience.

**TypeScript**: Provides type safety and enhanced developer experience for building robust and maintainable frontend code.

**HTML & CSS**: Structures and styles the web pages using Tailwind CSS for a clean, modern, and user-friendly design with responsive layouts.

---

## Backend: Node.js, Express

**Node.js**: Handles server-side logic, API requests, and connects the frontend to databases and external services.

**Express**: Provides a fast and minimalist web framework for building RESTful APIs and handling HTTP requests efficiently.

Provides real-time communication through Socket.io and efficient processing for music recommendations and audio streaming.

---

## Database: SQLite3

**SQLite3**: Stores user profiles, playlists, listening history, preferences, and social features in a lightweight, file-based SQL database.

Provides secure and scalable storage for application data with automatic table creation and foreign key constraints for data integrity.

---

## Music API: Spotify API, YouTube API

**Spotify API**: Fetches music tracks, playlists, albums, artists, and recommendations in real-time based on user mood and preferences.

**YouTube API**: Provides audio streaming fallback and video-to-audio conversion for tracks not available on Spotify.

Enables comprehensive music discovery, library synchronization, and personalized recommendations.

---

## Emotion Detection: face-api.js, Webcam, HTML5 Video API, Face Detection Models

**face-api.js**: Runs machine learning models in the browser for real-time emotion recognition and face detection.

**Webcam & HTML5 Video API**: Captures facial expressions from user's webcam for mood detection and emotion analysis.

**Face Detection Models**: Identifies emotions like happy, sad, calm, energetic, or romantic to provide personalized music recommendations based on user's current mood.

---

## Cloud Hosting: Netlify, Render, Railway

**Netlify**: Hosts and deploys the web application online with serverless functions, ensuring fast access, automatic builds, and scalability.

**Render / Railway**: Alternative deployment platforms that provide container-based hosting with Docker support for flexible and scalable application deployment.

---

## Cloud Storage: AWS S3, Local File System

**AWS S3**: Stores media files, audio cache, images, metadata, and other user-generated content securely in the cloud with high availability and scalability.

**Local File System**: Provides local caching and offline storage for audio files, images, and metadata when cloud storage is not configured or as a fallback option.

Ensures fast access to cached content and supports offline music playback capabilities.

---

## Authentication & Security: JWT, OAuth 2.0 (Spotify)

**JWT (JSON Web Tokens)**: Manages secure authentication tokens for user sessions and API access control.

**OAuth 2.0**: Enables secure login/signup through Spotify authentication and protects user data with industry-standard authorization flow.

Enables personalized user profiles, secure access control, and seamless integration with Spotify's authentication system.

---

## Additional Technologies

**Real-time Communication**: Socket.io for bidirectional real-time communication between client and server.

**3D Graphics**: Three.js for interactive 3D visualizations and immersive user experiences.

**Build Tools**: Vite for fast development and optimized production builds.

**UI Components**: Radix UI for accessible and customizable UI components.

**State Management**: React Context API and TanStack React Query for efficient state management and data fetching.

**Audio Processing**: fluent-ffmpeg and ytdl-core for audio streaming, conversion, and processing.

**Image Processing**: Sharp for efficient image optimization and processing.

---

*Last Updated: Based on package.json and codebase analysis*
