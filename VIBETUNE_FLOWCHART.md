# VibeTune4 Project Flowchart Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "User Interface Layer"
        UI[React Frontend]
        CAM[Webcam Interface]
        PLAYER[Music Player]
        AUTH[Authentication UI]
    end
    
    subgraph "Client Services"
        ES[Emotion Detection Service]
        SS[Spotify Service] 
        YS[YouTube Service]
        AS[Audio Preview Service]
    end
    
    subgraph "Machine Learning"
        ML[Face-API.js Models]
        ED[Emotion Detection]
        FB[Face Bounding Boxes]
        FE[Facial Expressions]
    end
    
    subgraph "Backend Services"
        API[Express Server]
        AUTH_API[Authentication Routes]
        SPOTIFY_API[Spotify API Routes]
        YOUTUBE_API[YouTube API Routes]
    end
    
    subgraph "External APIs"
        SPOTIFY[Spotify Web API]
        YOUTUBE_EXT[YouTube Data API]
        OAUTH[OAuth 2.0 Services]
    end
    
    subgraph "Data Storage"
        SESSION[Session Storage]
        CACHE[Browser Cache]
        MODELS[ML Models Storage]
    end

    UI --> CAM
    UI --> PLAYER
    UI --> AUTH
    
    CAM --> ES
    ES --> ML
    ML --> ED
    ED --> FB
    ED --> FE
    
    ES --> YS
    ES --> SS
    
    SS --> API
    YS --> API
    AUTH --> AUTH_API
    
    API --> SPOTIFY_API
    API --> YOUTUBE_API
    API --> AUTH_API
    
    SPOTIFY_API --> SPOTIFY
    YOUTUBE_API --> YOUTUBE_EXT
    AUTH_API --> OAUTH
    
    ML --> MODELS
    SS --> CACHE
    YS --> CACHE
    AUTH --> SESSION
```

## User Journey Flow

```mermaid
flowchart TD
    START([User Opens VibeTune]) --> LANDING{First Time User?}
    
    LANDING -->|Yes| SIGNUP[Sign Up Page]
    LANDING -->|No| LOGIN[Login Page]
    
    SIGNUP --> AUTH_SPOTIFY[Connect Spotify Account]
    LOGIN --> AUTH_SPOTIFY
    
    AUTH_SPOTIFY --> DASHBOARD[Main Dashboard]
    
    DASHBOARD --> WEBCAM_PERM[Request Webcam Permission]
    WEBCAM_PERM --> CAM_ACCESS{Permission Granted?}
    
    CAM_ACCESS -->|No| MANUAL_MODE[Manual Music Browsing]
    CAM_ACCESS -->|Yes| LOAD_MODELS[Load ML Models]
    
    LOAD_MODELS --> MODEL_STATUS{Models Loaded?}
    MODEL_STATUS -->|No| FALLBACK_EMOTION[Use Fallback Emotion Detection]
    MODEL_STATUS -->|Yes| REAL_EMOTION[Real-time Emotion Detection]
    
    FALLBACK_EMOTION --> EMOTION_RESULT[Detected Emotion]
    REAL_EMOTION --> EMOTION_RESULT
    
    EMOTION_RESULT --> MUSIC_REC[Generate Music Recommendations]
    MUSIC_REC --> DISPLAY_SONGS[Display Song List]
    
    DISPLAY_SONGS --> USER_ACTION{User Action}
    USER_ACTION -->|Play Song| PLAY_MUSIC[Play Music via Spotify/YouTube]
    USER_ACTION -->|Like Song| SAVE_LIBRARY[Save to Library]
    USER_ACTION -->|Skip| NEXT_REC[Next Recommendation]
    USER_ACTION -->|Change Emotion| EMOTION_RESULT
    
    PLAY_MUSIC --> MUSIC_CONTROLS[Music Player Controls]
    SAVE_LIBRARY --> MUSIC_CONTROLS
    NEXT_REC --> MUSIC_REC
    
    MUSIC_CONTROLS --> CONTINUOUS_EMOTION[Continue Emotion Monitoring]
    CONTINUOUS_EMOTION --> EMOTION_RESULT
    
    MANUAL_MODE --> BROWSE[Browse Music Manually]
    BROWSE --> SEARCH[Search Songs/Artists]
    SEARCH --> DISPLAY_SONGS
```

## Technical Component Flow

```mermaid
graph LR
    subgraph "Frontend Components"
        APP[App.tsx]
        LAYOUT[Layout Components]
        PAGES[Page Components]
        WEBCAM_COMP[Webcam Components]
        MUSIC_COMP[Music Components]
    end
    
    subgraph "State Management"
        AUTH_CTX[AuthContext]
        MUSIC_CTX[MusicPlayerContext] 
        LIB_CTX[LibraryContext]
    end
    
    subgraph "Custom Hooks"
        WEBCAM_HOOK[useWebcam]
        FACE_HOOK[useWebcamWithFaceDetection]
        TOAST_HOOK[useToast]
    end
    
    subgraph "Services Layer"
        EMOTION_SVC[emotionDetection.ts]
        SPOTIFY_SVC[spotifyService.ts]
        YOUTUBE_SVC[youtubeService.ts]
        AUDIO_SVC[audioPreviewService.ts]
    end
    
    APP --> LAYOUT
    LAYOUT --> PAGES
    PAGES --> WEBCAM_COMP
    PAGES --> MUSIC_COMP
    
    WEBCAM_COMP --> WEBCAM_HOOK
    WEBCAM_HOOK --> FACE_HOOK
    FACE_HOOK --> EMOTION_SVC
    
    MUSIC_COMP --> MUSIC_CTX
    MUSIC_CTX --> SPOTIFY_SVC
    MUSIC_CTX --> YOUTUBE_SVC
    
    EMOTION_SVC --> SPOTIFY_SVC
    EMOTION_SVC --> YOUTUBE_SVC
    
    AUTH_CTX --> AUTH_CTX
    LIB_CTX --> LIB_CTX
    
    PAGES --> AUTH_CTX
    PAGES --> MUSIC_CTX
    PAGES --> LIB_CTX
```

## Emotion Detection Pipeline

```mermaid
flowchart TD
    VIDEO_STREAM[Video Stream from Webcam] --> FRAME_CAPTURE[Capture Video Frame]
    
    FRAME_CAPTURE --> MODEL_CHECK{Face-API Models Available?}
    
    MODEL_CHECK -->|Yes| FACE_DETECT[Face Detection with TinyFaceDetector]
    MODEL_CHECK -->|No| FALLBACK_DETECT[Time-based Fallback Detection]
    
    FACE_DETECT --> LANDMARKS[Extract Facial Landmarks]
    LANDMARKS --> EXPRESSIONS[Analyze Facial Expressions]
    
    EXPRESSIONS --> EMOTION_SCORES[
        Generate Emotion Scores:
        - Happy: 0.0-1.0
        - Sad: 0.0-1.0  
        - Angry: 0.0-1.0
        - Surprised: 0.0-1.0
        - Fearful: 0.0-1.0
        - Disgusted: 0.0-1.0
        - Neutral: 0.0-1.0
    ]
    
    FALLBACK_DETECT --> TIME_WEIGHTS[
        Time-based Emotion Weights:
        - Morning: More Happy/Energetic
        - Afternoon: Balanced
        - Evening: Relaxed
        - Night: Tired/Sad
    ]
    
    TIME_WEIGHTS --> FALLBACK_SCORES[Generate Weighted Random Emotion]
    FALLBACK_SCORES --> EMOTION_SCORES
    
    EMOTION_SCORES --> DOMINANT[Select Dominant Emotion]
    DOMINANT --> CONFIDENCE[Calculate Confidence Score]
    
    CONFIDENCE --> THRESHOLD{Confidence > 30%?}
    THRESHOLD -->|Yes| MUSIC_SEARCH[Search Music by Emotion]
    THRESHOLD -->|No| RETRY[Continue Detection Loop]
    
    MUSIC_SEARCH --> EMOTION_PLAYLIST[
        Generate Emotion-based Playlist:
        - Happy: Upbeat, Pop, Dance
        - Sad: Slow, Acoustic, Ballads  
        - Angry: Rock, Metal, Aggressive
        - Neutral: Mixed genres
        - Surprised: Energetic, Unexpected
        - Fearful: Calming, Ambient
        - Disgusted: Cleansing, Fresh
    ]
    
    RETRY --> FRAME_CAPTURE
    EMOTION_PLAYLIST --> DISPLAY_UI[Display in Recommendations UI]
```

## API Integration Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Server
    participant Spotify
    participant YouTube
    participant FaceAPI
    
    User->>Frontend: Open VibeTune App
    Frontend->>Server: Request authentication status
    Server-->>Frontend: Authentication required
    
    User->>Frontend: Click "Connect Spotify"
    Frontend->>Server: GET /api/auth/spotify/url
    Server->>Spotify: Generate OAuth URL
    Spotify-->>Server: OAuth URL
    Server-->>Frontend: OAuth URL
    Frontend->>Spotify: Redirect to OAuth
    
    Spotify-->>Frontend: OAuth callback with code
    Frontend->>Server: GET /api/auth/spotify/callback?code=...
    Server->>Spotify: Exchange code for tokens
    Spotify-->>Server: Access & Refresh tokens
    Server-->>Frontend: Authentication success
    
    User->>Frontend: Enable webcam
    Frontend->>FaceAPI: Load ML models from /public/models/
    FaceAPI-->>Frontend: Models loaded
    
    Frontend->>FaceAPI: Start emotion detection
    FaceAPI-->>Frontend: Detected emotion: "happy"
    
    Frontend->>Server: GET /api/spotify/recommendations?mood=happy
    Server->>Spotify: Search tracks by mood
    Spotify-->>Server: Track recommendations
    Server-->>Frontend: Formatted track list
    
    Frontend->>Server: GET /api/youtube/search?emotion=happy
    Server->>YouTube: Search videos by emotion
    YouTube-->>Server: Video recommendations  
    Server-->>Frontend: Video playlist
    
    Frontend-->>User: Display combined recommendations
    
    User->>Frontend: Play track
    Frontend->>Server: GET /api/spotify/track/play
    Server->>Spotify: Initiate playback
    Spotify-->>Server: Playback started
    Server-->>Frontend: Playback confirmation
    Frontend-->>User: Music playing
```

## File Structure & Dependencies

```mermaid
graph TD
    subgraph "Project Root"
        PKG[package.json]
        ENV[.env]
        CONFIG[Config Files]
    end
    
    subgraph "Client Folder"
        CLIENT_APP[App.tsx]
        
        subgraph "Pages"
            INDEX[Index.tsx]
            LOGIN[Login.tsx]
            PROFILE[Profile.tsx]
            WEBCAM_DEMO[WebcamDemo.tsx]
            CAMERA_TEST[CameraTest.tsx]
        end
        
        subgraph "Components"
            WEBCAM_CAP[WebcamCapture.tsx]
            FACE_DETECT[WebcamCaptureWithFaceDetection.tsx]
            EMOTION_REC[EmotionSongRecommendations.tsx]
            MUSIC_PLAYER[MusicPlayer.tsx]
            SIDEBAR[Sidebar.tsx]
        end
        
        subgraph "Services"
            EMOTION_SVC[emotionDetection.ts]
            SPOTIFY_SVC[spotifyService.ts]
            YOUTUBE_SVC[youtubeService.ts]
        end
        
        subgraph "Contexts"
            AUTH_CONTEXT[AuthContext.tsx]
            MUSIC_CONTEXT[MusicPlayerContext.tsx]
            LIB_CONTEXT[LibraryContext.tsx]
        end
        
        subgraph "Hooks"
            WEBCAM_HOOKS[useWebcam.ts]
            FACE_HOOKS[useWebcamWithFaceDetection.ts]
        end
    end
    
    subgraph "Server Folder"
        SERVER_INDEX[index.ts]
        
        subgraph "Routes"
            AUTH_ROUTE[auth.ts]
            SPOTIFY_ROUTE[spotify.ts]
            YOUTUBE_ROUTE[youtube.ts]
        end
        
        subgraph "Services"
            SERVER_SPOTIFY[spotifyService.ts]
            SERVER_YOUTUBE[youtubeService.ts]
            SERVER_MUSIC[musicService.ts]
        end
        
        subgraph "Middleware"
            AUTH_MIDDLEWARE[auth.ts]
        end
    end
    
    subgraph "Public Assets"
        MODELS[/models/ - ML Models]
        STATIC[Static Assets]
    end
    
    subgraph "Shared"
        API_TYPES[api.ts]
    end
    
    PKG --> CLIENT_APP
    PKG --> SERVER_INDEX
    
    CLIENT_APP --> PAGES
    PAGES --> COMPONENTS
    COMPONENTS --> SERVICES
    COMPONENTS --> CONTEXTS
    COMPONENTS --> HOOKS
    
    SERVICES --> EMOTION_SVC
    SERVICES --> SPOTIFY_SVC
    SERVICES --> YOUTUBE_SVC
    
    SERVER_INDEX --> AUTH_ROUTE
    SERVER_INDEX --> SPOTIFY_ROUTE
    SERVER_INDEX --> YOUTUBE_ROUTE
    
    AUTH_ROUTE --> AUTH_MIDDLEWARE
    SPOTIFY_ROUTE --> SERVER_SPOTIFY
    YOUTUBE_ROUTE --> SERVER_YOUTUBE
    
    EMOTION_SVC --> MODELS
    CLIENT_APP --> API_TYPES
    SERVER_INDEX --> API_TYPES
```

## Key Features & Capabilities

### 🎵 Core Features
- **Real-time Emotion Detection** via webcam and Face-API.js
- **Music Recommendations** based on detected emotions
- **Spotify Integration** for premium music streaming
- **YouTube Integration** for free music videos
- **Responsive UI** with Tailwind CSS and Radix UI components
- **User Authentication** via Spotify OAuth
- **Personal Music Library** management
- **Playlist Creation & Management**

### 🔧 Technical Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **ML/AI**: Face-API.js for facial emotion detection
- **APIs**: Spotify Web API + YouTube Data API
- **Deployment**: Netlify (with serverless functions)
- **Package Manager**: PNPM

### 🎯 Emotion-to-Music Mapping
- **Happy** → Upbeat, Pop, Dance, Feel-good tracks
- **Sad** → Slow, Acoustic, Ballads, Melancholic songs
- **Angry** → Rock, Metal, Aggressive, High-energy music
- **Surprised** → Energetic, Unexpected, Dynamic tracks
- **Fearful** → Calming, Ambient, Soothing music
- **Disgusted** → Cleansing, Fresh, Uplifting songs
- **Neutral** → Mixed genres, Popular tracks

### 🚀 Development Workflow
1. **Setup**: `pnpm install` + `npm run download-models`
2. **Development**: `pnpm dev` (runs both client & server)
3. **Build**: `pnpm build` (creates production bundle)
4. **Deploy**: Push to Git → Netlify auto-deployment

### 🔒 Security & Privacy
- **Local Processing**: Emotion detection happens entirely in browser
- **No Video Upload**: Webcam data never leaves the user's device
- **OAuth Security**: Secure Spotify authentication flow
- **Token Management**: Proper access/refresh token handling
- **CORS Protection**: Configured for production domains

---

*This flowchart represents the complete architecture and user flow of the VibeTune4 emotion-based music recommendation system.*
