import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { audioPreviewService } from '../services/audioPreviewService';

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
  previewUrl?: string;
  streamingUrl?: string;
  isSpotifyTrack?: boolean;
  quality?: 'high' | 'medium' | 'low';
  cached?: boolean;
}

interface MusicPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  progress: number;
  currentTime: number;
  duration: number;
  playTrack: (track: Track) => Promise<void>;
  pause: () => void;
  play: () => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
  skipToNext: () => void;
  skipToPrevious: () => void;
  addToQueue: (tracks: Track | Track[]) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  shuffleQueue: () => void;
  queue: Track[];
  currentIndex: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'track' | 'playlist';
  toggleShuffle: () => void;
  setRepeatMode: (mode: 'none' | 'track' | 'playlist') => void;
  canPlayPrevious: boolean;
  canPlayNext: boolean;
  spotifyPlayer: any;
  isSpotifyConnected: boolean;
  connectSpotify: () => Promise<void>;
  disconnectSpotify: () => void;
  getAudioStreamUrl: (track: Track) => Promise<string | null>;
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
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(75);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatModeState] = useState<'none' | 'track' | 'playlist'>('none');
  const [spotifyPlayer, setSpotifyPlayer] = useState<any>(null);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = 'anonymous';
    
    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration * 1000); // Convert to milliseconds
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime * 1000); // Convert to milliseconds
    };

    const handleEnded = () => {
      skipToNext();
    };

    const handleError = (e: any) => {
      console.error('Audio playback error:', e);
      // Try to find an alternative source or skip to next track
      skipToNext();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []);

  // Update audio volume when volume state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const playTrack = async (track: Track) => {
    if (!audioRef.current) return;

    if (track.url.startsWith('data:') || track.url.startsWith('http') || track.url.startsWith('blob:')) {
      // Regular audio URLs
      playRegularAudio(track);
    } else {
      // Try to find alternative audio source
      findAlternativeAudio(track);
    }

    setCurrentTrack(track);
    
    // Add to queue if not already there
    if (!queue.find(t => t.id === track.id)) {
      setQueue(prev => [...prev, track]);
    }
    
    // Set current index
    const index = queue.findIndex(t => t.id === track.id);
    if (index >= 0) {
      setCurrentIndex(index);
    }

    // Set duration
    setDuration(track.duration || 180000);
  };


  // Play regular audio files
  const playRegularAudio = async (track: Track) => {
    try {
      if (audioRef.current) {
        audioRef.current.src = track.url;
        audioRef.current.load();
        await audioRef.current.play();
        setIsPlaying(true);
        startProgressTracking();
      }
    } catch (error) {
      console.error('Regular audio playback failed:', error);
      findAlternativeAudio(track);
    }
  };

  // Find alternative audio sources
  const findAlternativeAudio = async (track: Track) => {
    try {
      // Use the audio preview service to find playable audio
      const previews = await audioPreviewService.findAudioPreviews(track.artist, track.title, track.id);
      
      if (previews.length > 0 && audioRef.current) {
        // Try each preview URL in order of quality
        for (const preview of previews) {
          try {
            console.log(`Trying ${preview.source} audio: ${preview.url}`);
            audioRef.current.src = preview.url;
            audioRef.current.load();
            await audioRef.current.play();
            setIsPlaying(true);
            startProgressTracking();
            console.log(`✅ Playing from ${preview.source}`);
            return;
          } catch (e) {
            console.log(`❌ ${preview.source} failed, trying next...`);
            continue;
          }
        }
      }
      
      // If no audio sources work, create a realistic musical preview
      console.log('🎵 Creating realistic audio preview...');
      await playRealisticPreview(track);
    } catch (error) {
      console.error('Alternative audio search failed:', error);
      await playRealisticPreview(track);
    }
  };

  // Play a realistic musical preview
  const playRealisticPreview = async (track: Track) => {
    try {
      const audioUrl = await audioPreviewService.createRealisticTone(track.artist, track.title);
      
      if (audioUrl && audioRef.current) {
        console.log(`🎼 Playing generated audio for "${track.title}"`);
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        await audioRef.current.play();
        setIsPlaying(true);
        startProgressTracking();
        
        // Show user-friendly message
        console.log(`🎵 Now playing: ${track.title} by ${track.artist}`);
        console.log('🎼 Generated audio preview - enjoy the musical representation!');
      } else {
        // Final fallback - just show track info
        simulatePlaybackWithMessage(track);
      }
    } catch (error) {
      console.error('Realistic preview failed:', error);
      simulatePlaybackWithMessage(track);
    }
  };


  // Search for alternative audio sources
  const searchAlternativeAudio = async (track: Track): Promise<string[]> => {
    const alternatives: string[] = [];
    
    try {
      // Try to find free music APIs or preview URLs
      const searchQuery = `${track.artist} ${track.title}`;
      
      // Add Spotify preview URL if available
      if (track.url.includes('spotify.com')) {
        // Extract Spotify track ID and try to get preview URL
        const spotifyId = track.url.match(/track\/([a-zA-Z0-9]+)/);
        if (spotifyId) {
          // In a real app, you'd call Spotify API here
          // alternatives.push(`https://p.scdn.co/mp3-preview/${spotifyId[1]}`);
        }
      }
      
      // Try Internet Archive or other free music sources
      // This is where you'd integrate with legal music APIs
      
      // For now, try some common audio file extensions
      const commonSources = [
        `https://archive.org/download/${encodeURIComponent(searchQuery.toLowerCase())}/`,
        // Add more legitimate sources here
      ];
      
      // Note: These URLs are examples and may not work
      // In production, use legitimate music APIs
      
    } catch (error) {
      console.error('Alternative search failed:', error);
    }
    
    return alternatives;
  };

  // Simulate playback with user message
  const simulatePlaybackWithMessage = (track: Track) => {
    console.log(`🎵 Now playing: ${track.title} by ${track.artist}`);
    console.log('📱 Audio preview not available - showing track info only');
    
    setIsPlaying(true);
    
    // Start a realistic progress simulation
    let startTime = Date.now();
    const updateProgress = () => {
      if (isPlaying && currentTrack?.id === track.id) {
        const elapsed = Date.now() - startTime;
        setCurrentTime(elapsed);
        
        if (elapsed < track.duration) {
          requestAnimationFrame(updateProgress);
        } else {
          setIsPlaying(false);
          skipToNext();
        }
      }
    };
    
    requestAnimationFrame(updateProgress);
    
    // Auto-stop after 30 seconds for demo
    setTimeout(() => {
      if (currentTrack?.id === track.id) {
        setIsPlaying(false);
      }
    }, 30000);
  };

  // Start progress tracking for real audio
  const startProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    progressInterval.current = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime * 1000);
      }
    }, 100);
  };

  // Create a demo audio experience for tracks
  const createDemoAudio = (track: Track) => {
    // Create an AudioContext for demo playback
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a simple tone for demo purposes
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set up a simple melody pattern based on track name
      const baseFreq = 220; // A3
      const melodyPattern = track.title.split('').map((char, index) => 
        baseFreq * Math.pow(2, (char.charCodeAt(0) % 12) / 12)
      );
      
      let noteIndex = 0;
      const playNextNote = () => {
        if (noteIndex < melodyPattern.length && isPlaying) {
          oscillator.frequency.setValueAtTime(melodyPattern[noteIndex], audioContext.currentTime);
          noteIndex = (noteIndex + 1) % melodyPattern.length;
          setTimeout(playNextNote, 500); // Change note every 500ms
        }
      };
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Low volume
      
      oscillator.start();
      setIsPlaying(true);
      
      // Stop after track duration or 3 minutes
      const duration = track.duration || 180000;
      setTimeout(() => {
        oscillator.stop();
        setIsPlaying(false);
        skipToNext();
      }, Math.min(duration, 30000)); // Max 30 seconds for demo
      
      // Start progress simulation
      let startTime = Date.now();
      const updateProgress = () => {
        if (isPlaying) {
          const elapsed = Date.now() - startTime;
          setCurrentTime(elapsed);
          if (elapsed < duration) {
            requestAnimationFrame(updateProgress);
          }
        }
      };
      updateProgress();
      
    } catch (error) {
      console.error('Demo audio creation failed:', error);
      // Fallback - just simulate playback
      simulatePlayback(track);
    }
  };

  // Fallback simulation method
  const simulatePlayback = (track: Track) => {
    setIsPlaying(true);
    const duration = track.duration || 180000;
    let elapsed = 0;
    
    const interval = setInterval(() => {
      elapsed += 1000;
      setCurrentTime(elapsed);
      
      if (elapsed >= Math.min(duration, 30000) || !isPlaying) {
        clearInterval(interval);
        setIsPlaying(false);
        skipToNext();
      }
    }, 1000);
  };

  const play = () => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error('Play failed:', error);
        });
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(100, newVolume)));
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time / 1000; // Convert from milliseconds
    }
  };

  const skipToNext = () => {
    if (queue.length > 0) {
      const nextIndex = (currentIndex + 1) % queue.length;
      setCurrentIndex(nextIndex);
      playTrack(queue[nextIndex]);
    }
  };

  const skipToPrevious = () => {
    if (queue.length > 0) {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
      setCurrentIndex(prevIndex);
      playTrack(queue[prevIndex]);
    }
  };

  const addToQueue = (tracks: Track | Track[]) => {
    const trackArray = Array.isArray(tracks) ? tracks : [tracks];
    setQueue(prev => {
      const newTracks = trackArray.filter(track => !prev.find(t => t.id === track.id));
      return [...prev, ...newTracks];
    });
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(0);
  };

  const shuffleQueue = () => {
    // Implement shuffle logic
    setQueue(prev => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
    setIsShuffled(true);
  };

  const toggleShuffle = () => {
    if (isShuffled) {
      setQueue(originalQueue);
      setIsShuffled(false);
    } else {
      shuffleQueue();
    }
  };

  const setRepeatMode = (mode: 'none' | 'track' | 'playlist') => {
    setRepeatModeState(mode);
  };

  const connectSpotify = async () => {
    // Implement Spotify connection logic
    console.log('Connecting to Spotify...');
  };

  const disconnectSpotify = () => {
    setSpotifyPlayer(null);
    setIsSpotifyConnected(false);
  };

  const getAudioStreamUrl = async (track: Track): Promise<string | null> => {
    // Implement audio stream URL logic
    return track.url || null;
  };

  const canPlayPrevious = currentIndex > 0 || repeatMode === 'playlist';
  const canPlayNext = currentIndex < queue.length - 1 || repeatMode === 'playlist';

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const contextValue: MusicPlayerContextType = {
    currentTrack,
    isPlaying,
    isLoading,
    volume,
    progress,
    currentTime,
    duration,
    playTrack,
    pause,
    play,
    togglePlayPause,
    setVolume,
    seekTo,
    skipToNext,
    skipToPrevious,
    addToQueue,
    removeFromQueue,
    clearQueue,
    shuffleQueue,
    queue,
    currentIndex,
    isShuffled,
    repeatMode,
    toggleShuffle,
    setRepeatMode,
    canPlayPrevious,
    canPlayNext,
    spotifyPlayer,
    isSpotifyConnected,
    connectSpotify,
    disconnectSpotify,
    getAudioStreamUrl,
  };

  return (
    <MusicPlayerContext.Provider value={contextValue}>
      {children}
    </MusicPlayerContext.Provider>
  );
};
