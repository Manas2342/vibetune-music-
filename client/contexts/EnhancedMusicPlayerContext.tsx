import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from 'react';

// Spotify Web Playback SDK types
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: any;
    };
  }
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: number;
  url: string;
  spotifyId?: string;
  youtubeId?: string;
  previewUrl?: string;
  streamingUrl?: string;
  isSpotifyTrack?: boolean;
  quality?: 'high' | 'medium' | 'low';
  cached?: boolean;
}

interface MusicPlayerContextType {
  // Player State
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  progress: number;
  currentTime: number;
  duration: number;
  
  // Player Controls
  playTrack: (track: Track) => Promise<void>;
  pause: () => void;
  play: () => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
  
  // Queue Management
  queue: Track[];
  currentIndex: number;
  addToQueue: (tracks: Track | Track[]) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  skipToNext: () => void;
  skipToPrevious: () => void;
  
  // Shuffle & Repeat
  isShuffled: boolean;
  repeatMode: 'none' | 'track' | 'playlist';
  toggleShuffle: () => void;
  setRepeatMode: (mode: 'none' | 'track' | 'playlist') => void;
  
  // Navigation
  canPlayPrevious: boolean;
  canPlayNext: boolean;
  
  // Spotify Integration
  spotifyPlayer: any;
  isSpotifyConnected: boolean;
  connectSpotify: () => Promise<void>;
  disconnectSpotify: () => void;
  
  // Streaming
  getAudioStreamUrl: (track: Track) => Promise<string | null>;
  
  // Analytics
  playCount: Map<string, number>;
  lastPlayed: Map<string, Date>;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};

interface MusicPlayerProviderProps {
  children: ReactNode;
}

export const MusicPlayerProvider: React.FC<MusicPlayerProviderProps> = ({ children }) => {
  // Core state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(75);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Queue management
  const [queue, setQueue] = useState<Track[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatModeState] = useState<'none' | 'track' | 'playlist'>('none');
  
  // Spotify integration
  const [spotifyPlayer, setSpotifyPlayer] = useState<any>(null);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const connectSpotifyRef = useRef<null | (() => Promise<void>)>(null);
  
  // Analytics
  const [playCount, setPlayCount] = useState(new Map<string, number>());
  const [lastPlayed, setLastPlayed] = useState(new Map<string, Date>());
  
  // Audio refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Progress calculation
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Navigation helpers
  const canPlayNext = currentIndex < queue.length - 1 || repeatMode === 'playlist';
  const canPlayPrevious = currentIndex > 0 || repeatMode === 'playlist';

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
      
      const audio = audioRef.current;

      const handleLoadedMetadata = () => {
        setDuration(audio.duration * 1000);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime * 1000);
      };

      const handleEnded = () => {
        handleTrackEnd();
      };

      const handleError = (e: any) => {
        console.error('Audio playback error:', e);
        setIsLoading(false);
        setIsPlaying(false);
        // Try next track or alternative source
        skipToNext();
      };

      const handleCanPlay = () => {
        setIsLoading(false);
      };

      const handleWaiting = () => {
        setIsLoading(true);
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('waiting', handleWaiting);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('waiting', handleWaiting);
        audio.pause();
        audio.src = '';
      };
    }
  }, []);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
    if (spotifyPlayer) {
      spotifyPlayer.setVolume(volume / 100);
    }
  }, [volume, spotifyPlayer]);

  // Initialize Spotify SDK
  useEffect(() => {
    initializeSpotifySDK();
  }, []);

  const initializeSpotifySDK = () => {
    if (!window.Spotify && !document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('Spotify Web Playback SDK ready');
      setSdkReady(true);
    };
  };

  // Auto-connect once SDK reports ready and token exists
  useEffect(() => {
    const token = localStorage.getItem('spotify_access_token');
    if (sdkReady && token && !spotifyPlayer && connectSpotifyRef.current) {
      connectSpotifyRef.current().catch(() => {});
    }
  }, [sdkReady, spotifyPlayer]);

  // Transfer playback to this web player device
  const transferPlaybackToDevice = useCallback(async () => {
    try {
      if (!deviceId) return;
      const token = localStorage.getItem('spotify_access_token');
      if (!token) return;
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ device_ids: [deviceId], play: false })
      });
    } catch (e) {
      console.warn('Transfer playback failed', e);
    }
  }, [deviceId]);

  // (ensureSpotifyReady is defined after connectSpotify)

  // Get audio stream URL
  const getAudioStreamUrl = useCallback(async (track: Track): Promise<string | null> => {
    try {
      // For Spotify tracks, try Web Playback SDK first, then fallback to preview
      if (track.isSpotifyTrack && track.spotifyId) {
        console.log('🎵 Spotify track detected, checking available audio sources...');
        
        // Check if we have Spotify Web Playback SDK available
        const token = localStorage.getItem('spotify_access_token');
        if (token && spotifyPlayer && deviceId) {
          console.log('🎵 Spotify Web Playback SDK available - will try full audio');
          // Return a special marker that indicates we should use Spotify Web Playback SDK
          return `spotify:track:${track.spotifyId}`;
        } else {
          console.log('🎵 Spotify Web Playback SDK not ready, will try preview URL');
        }
      }

      // Use Spotify preview URL if available
      if (track.previewUrl) {
        console.log('🎵 Using Spotify preview URL:', track.previewUrl);
        return track.previewUrl;
      }

      // For any track without preview URL, try to create a fallback
      if (track.url && (track.url.startsWith('http') || track.url.startsWith('https'))) {
        console.log('🎵 Using track URL as fallback:', track.url);
        return track.url;
      }

      // For Spotify tracks without preview, ALWAYS try to get track details to find preview URL
      if (track.isSpotifyTrack && track.spotifyId) {
        try {
          console.log('🎵 Fetching track details for preview URL...');
          const response = await fetch(`/api/spotify/track/${track.spotifyId}`);
          if (response.ok) {
            const trackData = await response.json();
            if (trackData.preview_url) {
              console.log('🎵 Found preview URL from API:', trackData.preview_url);
              return trackData.preview_url;
                } else {
                  console.log('⚠️ Spotify preview not available for this track');
                }
          }
        } catch (error) {
          console.warn('Failed to fetch track details:', error);
        }
      } else if (track.id) {
        // Try fetching by track ID if it's not explicitly marked as Spotify
        try {
          console.log('🎵 Trying to fetch track by ID...');
          const response = await fetch(`/api/spotify/track/${track.id}`);
          if (response.ok) {
            const trackData = await response.json();
            if (trackData.preview_url) {
              console.log('🎵 Found preview URL from track ID:', trackData.preview_url);
              return trackData.preview_url;
            }
          }
        } catch (error) {
          console.warn('Failed to fetch by track ID:', error);
        }
      }

      // No Spotify audio available - try to force Web Playback SDK
      console.log('❌ No Spotify audio available for:', track.title);
      console.log('🎵 Attempting to use Spotify Web Playback SDK...');
      
      // For Spotify tracks, always try Web Playback SDK even without preview
      if (track.isSpotifyTrack && track.spotifyId) {
        console.log('🎵 Forcing Spotify Web Playback SDK for:', track.title);
        return `spotify:track:${track.spotifyId}`;
      }

      // Final fallback: return null
      console.log('❌ No audio source available for:', track.title);
      return null;

    } catch (error) {
      console.error('Error getting audio stream URL:', error);
      return null;
    }
  }, []);

  // Create demo audio for tracks without preview URLs
  const createDemoAudio = useCallback((track: Track) => {
    try {
      // Create a data URL with a short audio tone
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 2; // 2 seconds
      const length = sampleRate * duration;
      const buffer = audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Create a simple tone
      for (let i = 0; i < length; i++) {
        data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1; // 440Hz tone
      }
      
      // Convert to WAV
      const wav = new ArrayBuffer(44 + length * 2);
      const view = new DataView(wav);
      
      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + length * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, length * 2, true);
      
      // Convert float samples to 16-bit PCM
      let offset = 44;
      for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, data[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
      
      const blob = new Blob([wav], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating demo audio:', error);
      return null;
    }
  }, []);

  // Helper function to play audio stream
  const playAudioStream = useCallback(async (track: Track, streamUrl: string) => {
    if (audioRef.current) {
      console.log('🎵 Loading audio:', streamUrl);
      audioRef.current.src = streamUrl;
      audioRef.current.load();

      // Add user interaction handling for autoplay policies
      const playAudio = async () => {
        try {
          await audioRef.current!.play();
          setIsPlaying(true);
          console.log('✅ Audio playing successfully');

          // Show success message to user
          if (typeof window !== 'undefined' && 'toast' in window) {
            (window as any).toast?.success?.(`🎵 Now playing: ${track.title}`);
          }
        } catch (playError: any) {
          if (playError.name === 'NotAllowedError') {
            console.log('🔇 Autoplay prevented - user interaction required');
            setIsPlaying(false);
            // Show user-friendly message
            if (typeof window !== 'undefined' && 'toast' in window) {
              (window as any).toast?.info?.('🔇 Click the play button to start music');
            }
          } else {
            console.error('❌ Audio play failed:', playError);
            if (typeof window !== 'undefined' && 'toast' in window) {
              (window as any).toast?.error?.('❌ Failed to play audio');
            }
            throw playError;
          }
        }
      };

      await playAudio();
    }
  }, []);

  // Play track
  const playTrack = useCallback(async (track: Track) => {
    try {
      setIsLoading(true);
      setCurrentTrack(track);

      // Show development mode notice for preview tracks
      if (track.previewUrl) {
        console.log('🎵 Playing preview track (full duration)');
      } else if (track.isSpotifyTrack) {
        console.log('🎵 Playing Spotify track (full duration)');
      }

      // Update analytics
      const currentCount = playCount.get(track.id) || 0;
      setPlayCount(prev => new Map(prev.set(track.id, currentCount + 1)));
      setLastPlayed(prev => new Map(prev.set(track.id, new Date())));

      // Track in recently played service
      try {
        const { recentlyPlayedService } = await import('../services/recentlyPlayedService');
        recentlyPlayedService.addTrack(track);
      } catch (error) {
        console.warn('Failed to track in recently played:', error);
      }

          // Check if we should use Spotify Web Playback SDK for full audio
          const streamUrl = await getAudioStreamUrl(track);
          
          if (streamUrl && streamUrl.startsWith('spotify:track:')) {
            // Use Spotify Web Playback SDK for full-length audio
            try {
              console.log('🎵 Using Spotify Web Playback SDK for full audio:', streamUrl);
              
              // Ensure Spotify Web Playback SDK is ready
              const token = localStorage.getItem('spotify_access_token');
              if (!token) {
                throw new Error('No Spotify access token found');
              }
              
              // Try to initialize Spotify Web Playback SDK if not already done
              if (!spotifyPlayer) {
                console.log('🎵 Initializing Spotify Web Playback SDK...');
                await connectSpotify();
              }
              
              const ready = await ensureSpotifyReady();
              if (ready && deviceId) {
                console.log('🎵 Transferring playback to device:', deviceId);
                await transferPlaybackToDevice();
                
                console.log('🎵 Starting playback...');
                const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    uris: [streamUrl]
                  }),
                });
                
                if (response.ok) {
                  setIsPlaying(true);
                  console.log('✅ Spotify Web Playback SDK playing successfully');
                  
                  if (typeof window !== 'undefined' && 'toast' in window) {
                    (window as any).toast?.success?.(`🎵 Now playing full track: ${track.title}`);
                  }
                } else {
                  const errorData = await response.text();
                  console.error('Spotify API error:', response.status, errorData);
                  throw new Error(`Spotify API error: ${response.status}`);
                }
              } else {
                throw new Error('Spotify Web Playback SDK not ready or no device ID');
              }
            } catch (spotifyError) {
              console.error('Spotify Web Playback SDK failed:', spotifyError);
              console.log('🎵 Falling back to preview URL or demo audio...');
              
              // Try to get preview URL as fallback
              try {
                const response = await fetch(`/api/spotify/track/${track.spotifyId}`);
                if (response.ok) {
                  const trackData = await response.json();
                  if (trackData.preview_url) {
                    console.log('🎵 Found preview URL as fallback:', trackData.preview_url);
                    await playAudioStream(track, trackData.preview_url);
                    return;
                  }
                }
              } catch (previewError) {
                console.warn('Preview URL fallback failed:', previewError);
              }
              
              // Final fallback: show error
              setIsPlaying(false);
              if (typeof window !== 'undefined' && 'toast' in window) {
                (window as any).toast?.error?.(`❌ Cannot play: ${track.title}. Please ensure you have Spotify Premium and are connected.`);
              }
            }
          } else if (streamUrl) {
            // Use regular audio streaming (preview URLs or other sources)
            await playAudioStream(track, streamUrl);
          } else {
            // No audio source available - show message and skip
            console.log('⚠️ No audio source available for:', track.title);
            setIsPlaying(false);

            if (typeof window !== 'undefined' && 'toast' in window) {
              (window as any).toast?.error?.(`❌ Cannot play: ${track.title}. Please ensure you have Spotify Premium and are connected.`);
            }

            // Auto-skip to next track after a short delay
            setTimeout(() => {
              skipToNext();
            }, 1500);
          }

      // Update queue if not already in queue
      const queueIndex = queue.findIndex(t => t.id === track.id);
      if (queueIndex === -1) {
        addToQueue(track);
        setCurrentIndex(queue.length);
      } else {
        setCurrentIndex(queueIndex);
      }

    } catch (error) {
      console.error('Error playing track:', error);
      setIsPlaying(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [queue, spotifyPlayer, isSpotifyConnected, deviceId, playCount, getAudioStreamUrl]);

  // Play/Pause controls
  const play = useCallback(async () => {
    try {
      console.log('▶️ Play button clicked - isSpotifyConnected:', isSpotifyConnected, 'spotifyPlayer:', !!spotifyPlayer, 'audioRef:', !!audioRef.current);
      
      if (isSpotifyConnected && spotifyPlayer) {
        console.log('▶️ Resuming Spotify player');
        await spotifyPlayer.resume();
        setIsPlaying(true);
      } else if (audioRef.current) {
        // Handle case where audio source might not be loaded yet
        if (!audioRef.current.src && currentTrack) {
          console.log('▶️ No audio src, reloading track');
          // Reload the track
          await playTrack(currentTrack);
          return;
        }
        
        console.log('▶️ Playing audio element, current src:', audioRef.current.src);
        await audioRef.current.play();
        setIsPlaying(true);
        console.log('▶️ Audio playing successfully');
      } else {
        console.log('▶️ No audio element found to play');
      }
    } catch (error: any) {
      console.error('Play failed:', error);
      if (error.name === 'NotAllowedError') {
        console.log('🔇 User interaction required to play audio');
        // The UI should show that user needs to click to play
      }
      setIsPlaying(false);
    }
  }, [isSpotifyConnected, spotifyPlayer, currentTrack, playTrack]);

  const pause = useCallback(async () => {
    try {
      console.log('⏸️ Pause button clicked - isSpotifyConnected:', isSpotifyConnected, 'spotifyPlayer:', !!spotifyPlayer, 'audioRef:', !!audioRef.current);
      
      if (isSpotifyConnected && spotifyPlayer) {
        console.log('⏸️ Pausing Spotify player');
        await spotifyPlayer.pause();
      } else if (audioRef.current) {
        console.log('⏸️ Pausing audio element, current src:', audioRef.current.src);
        audioRef.current.pause();
        console.log('⏸️ Audio paused successfully');
      } else {
        console.log('⏸️ No audio element found to pause');
      }
      setIsPlaying(false);
      console.log('⏸️ Set isPlaying to false');
    } catch (error) {
      console.error('Pause failed:', error);
      setIsPlaying(false);
    }
  }, [isSpotifyConnected, spotifyPlayer]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Seek control
  const seekTo = useCallback(async (time: number) => {
    const seekTime = time / 1000; // Convert to seconds
    
    if (isSpotifyConnected && spotifyPlayer) {
      await spotifyPlayer.seek(time);
    } else if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
    
    setCurrentTime(time);
  }, [isSpotifyConnected, spotifyPlayer]);

  // Volume control
  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    localStorage.setItem('vibetune_volume', newVolume.toString());
  }, []);

  // Queue management
  const addToQueue = useCallback((tracks: Track | Track[]) => {
    const tracksArray = Array.isArray(tracks) ? tracks : [tracks];
    setQueue(prev => [...prev, ...tracksArray]);
    
    if (!isShuffled) {
      setOriginalQueue(prev => [...prev, ...tracksArray]);
    }
  }, [isShuffled]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    setOriginalQueue(prev => prev.filter((_, i) => i !== index));
    
    if (index === currentIndex) {
      // Current track was removed, stop playback
      pause();
      setCurrentTrack(null);
    } else if (index < currentIndex) {
      // Adjust current index if a previous track was removed
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, pause]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setOriginalQueue([]);
    setCurrentIndex(0);
    pause();
    setCurrentTrack(null);
  }, [pause]);

  // Navigation
  const skipToNext = useCallback(() => {
    let nextIndex = currentIndex + 1;
    
    if (repeatMode === 'track') {
      // Replay current track
      nextIndex = currentIndex;
    } else if (nextIndex >= queue.length) {
      if (repeatMode === 'playlist') {
        nextIndex = 0;
      } else {
        // End of queue
        pause();
        return;
      }
    }
    
    if (queue[nextIndex]) {
      setCurrentIndex(nextIndex);
      playTrack(queue[nextIndex]);
    }
  }, [currentIndex, queue, repeatMode, playTrack, pause]);

  const skipToPrevious = useCallback(() => {
    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      if (repeatMode === 'playlist') {
        prevIndex = queue.length - 1;
      } else {
        // Start of queue
        return;
      }
    }
    
    if (queue[prevIndex]) {
      setCurrentIndex(prevIndex);
      playTrack(queue[prevIndex]);
    }
  }, [currentIndex, queue, repeatMode, playTrack]);

  // Handle track end
  const handleTrackEnd = useCallback(() => {
    if (repeatMode === 'track') {
      // Replay current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      // Move to next track when current track ends naturally
      skipToNext();
    }
  }, [repeatMode, skipToNext]);

  // Shuffle functionality
  const shuffleArray = (array: Track[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const toggleShuffle = useCallback(() => {
    if (isShuffled) {
      // Turn off shuffle, restore original order
      setQueue(originalQueue);
      setIsShuffled(false);
      
      // Update current index to match original position
      if (currentTrack) {
        const originalIndex = originalQueue.findIndex(t => t.id === currentTrack.id);
        setCurrentIndex(originalIndex >= 0 ? originalIndex : 0);
      }
    } else {
      // Turn on shuffle
      setOriginalQueue(queue);
      const shuffledQueue = shuffleArray(queue);
      
      // Keep current track at the beginning of shuffled queue
      if (currentTrack) {
        const currentTrackIndex = shuffledQueue.findIndex(t => t.id === currentTrack.id);
        if (currentTrackIndex > 0) {
          [shuffledQueue[0], shuffledQueue[currentTrackIndex]] = [shuffledQueue[currentTrackIndex], shuffledQueue[0]];
        }
        setCurrentIndex(0);
      }
      
      setQueue(shuffledQueue);
      setIsShuffled(true);
    }
  }, [isShuffled, queue, originalQueue, currentTrack]);

  // Repeat mode
  const setRepeatMode = useCallback((mode: 'none' | 'track' | 'playlist') => {
    setRepeatModeState(mode);
    localStorage.setItem('vibetune_repeat_mode', mode);
  }, []);

  // Spotify connection
  const connectSpotify = useCallback(async () => {
    const token = localStorage.getItem('spotify_access_token');
    if (!token || !window.Spotify) {
      throw new Error('Spotify token not found or SDK not loaded');
    }

    try {
      const player = new window.Spotify.Player({
        name: 'VibeTune Web Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(token);
        },
        volume: volume / 100,
      });

      // Player event listeners
      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Spotify player ready with Device ID:', device_id);
        setDeviceId(device_id);
        setIsSpotifyConnected(true);
        setSpotifyPlayer(player);
      });

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline:', device_id);
        setIsSpotifyConnected(false);
      });

      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;

        const track = state.track_window.current_track;
        if (track && currentTrack?.spotifyId !== track.id) {
          setCurrentTrack({
            id: track.id,
            title: track.name,
            artist: track.artists.map((a: any) => a.name).join(', '),
            albumArt: track.album.images[0]?.url || '',
            duration: track.duration_ms,
            url: track.external_urls?.spotify || '',
            spotifyId: track.id,
            isSpotifyTrack: true,
          });
        }

        setCurrentTime(state.position);
        setDuration(state.duration);
        setIsPlaying(!state.paused);
      });

      // Connect to player
      await player.connect();
    } catch (error) {
      console.error('Failed to connect to Spotify:', error);
      throw error;
    }
  }, [volume, currentTrack]);

  // Provide a stable reference for early callers
  useEffect(() => {
    connectSpotifyRef.current = connectSpotify;
  }, [connectSpotify]);

  const disconnectSpotify = useCallback(() => {
    if (spotifyPlayer) {
      spotifyPlayer.disconnect();
      setSpotifyPlayer(null);
      setIsSpotifyConnected(false);
      setDeviceId(null);
    }
  }, [spotifyPlayer]);

  // Ensure Spotify player is initialized and device is ready (defined after connectSpotify)
  const ensureSpotifyReady = useCallback(async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('spotify_access_token');
      if (!token) return false;
      if (!spotifyPlayer && connectSpotifyRef.current) {
        await connectSpotifyRef.current();
      }
      const start = Date.now();
      while (!deviceId && Date.now() - start < 3000) {
        await new Promise(r => setTimeout(r, 100));
      }
      if (deviceId) {
        await transferPlaybackToDevice();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [spotifyPlayer, deviceId, connectSpotify, transferPlaybackToDevice]);

  // Load saved settings
  useEffect(() => {
    const savedVolume = localStorage.getItem('vibetune_volume');
    if (savedVolume) {
      setVolumeState(parseInt(savedVolume));
    }

    const savedRepeatMode = localStorage.getItem('vibetune_repeat_mode') as 'none' | 'track' | 'playlist';
    if (savedRepeatMode) {
      setRepeatModeState(savedRepeatMode);
    }
  }, []);

  const contextValue: MusicPlayerContextType = {
    // Player State
    currentTrack,
    isPlaying,
    isLoading,
    volume,
    progress,
    currentTime,
    duration,
    
    // Player Controls
    playTrack,
    pause,
    play,
    togglePlayPause,
    setVolume,
    seekTo,
    
    // Queue Management
    queue,
    currentIndex,
    addToQueue,
    removeFromQueue,
    clearQueue,
    skipToNext,
    skipToPrevious,
    
    // Shuffle & Repeat
    isShuffled,
    repeatMode,
    toggleShuffle,
    setRepeatMode,
    
    // Navigation
    canPlayPrevious,
    canPlayNext,
    
    // Spotify Integration
    spotifyPlayer,
    isSpotifyConnected,
    connectSpotify,
    disconnectSpotify,
    
    // Streaming
    getAudioStreamUrl,
    
    // Analytics
    playCount,
    lastPlayed,
  };

  return (
    <MusicPlayerContext.Provider value={contextValue}>
      {children}
    </MusicPlayerContext.Provider>
  );
};