// Demo Music Service
// Provides demo tracks with working audio for testing

export interface DemoTrack {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: number;
  url: string;
  previewUrl: string;
  genre: string;
}

class DemoMusicService {
  private demoTracks: DemoTrack[] = [
    {
      id: 'demo-1',
      title: 'Classical Piano',
      artist: 'Demo Artist',
      albumArt: '/placeholder.svg',
      duration: 30000,
      url: 'https://www.kozco.com/tech/piano2.wav',
      previewUrl: 'https://www.kozco.com/tech/piano2.wav',
      genre: 'classical'
    },
    {
      id: 'demo-2', 
      title: 'Organ Finale',
      artist: 'Demo Composer',
      albumArt: '/placeholder.svg',
      duration: 25000,
      url: 'https://www.kozco.com/tech/organfinale.wav',
      previewUrl: 'https://www.kozco.com/tech/organfinale.wav',
      genre: 'classical'
    },
    {
      id: 'demo-3',
      title: 'LR Mono Phase',
      artist: 'Test Audio',
      albumArt: '/placeholder.svg',
      duration: 20000,
      url: 'https://www.kozco.com/tech/LRMonoPhase4.wav',
      previewUrl: 'https://www.kozco.com/tech/LRMonoPhase4.wav',
      genre: 'electronic'
    }
  ];

  // Get demo tracks for testing
  getDemoTracks(): DemoTrack[] {
    return this.demoTracks;
  }

  // Get a random demo track
  getRandomTrack(): DemoTrack {
    const randomIndex = Math.floor(Math.random() * this.demoTracks.length);
    return this.demoTracks[randomIndex];
  }

  // Get tracks by emotion
  getTracksByEmotion(emotion: string): DemoTrack[] {
    // Return emotion-specific tracks for better demo experience
    const emotionTracks: Record<string, DemoTrack[]> = {
      happy: [
        {
          id: 'demo-happy-1',
          title: 'Upbeat Piano',
          artist: 'Demo Artist',
          albumArt: '/placeholder.svg',
          duration: 30000,
          url: 'https://www.kozco.com/tech/piano2.wav',
          previewUrl: 'https://www.kozco.com/tech/piano2.wav',
          genre: 'classical'
        }
      ],
      sad: [
        {
          id: 'demo-sad-1',
          title: 'Melancholy Organ',
          artist: 'Demo Composer',
          albumArt: '/placeholder.svg',
          duration: 25000,
          url: 'https://www.kozco.com/tech/organfinale.wav',
          previewUrl: 'https://www.kozco.com/tech/organfinale.wav',
          genre: 'classical'
        }
      ],
      angry: [
        {
          id: 'demo-angry-1',
          title: 'Intense Electronic',
          artist: 'Demo Producer',
          albumArt: '/placeholder.svg',
          duration: 20000,
          url: 'https://www.kozco.com/tech/LRMonoPhase4.wav',
          previewUrl: 'https://www.kozco.com/tech/LRMonoPhase4.wav',
          genre: 'electronic'
        }
      ],
      surprised: [
        {
          id: 'demo-surprised-1',
          title: 'Dramatic Piano',
          artist: 'Demo Artist',
          albumArt: '/placeholder.svg',
          duration: 30000,
          url: 'https://www.kozco.com/tech/piano2.wav',
          previewUrl: 'https://www.kozco.com/tech/piano2.wav',
          genre: 'classical'
        }
      ],
      fearful: [
        {
          id: 'demo-fearful-1',
          title: 'Atmospheric Organ',
          artist: 'Demo Composer',
          albumArt: '/placeholder.svg',
          duration: 25000,
          url: 'https://www.kozco.com/tech/organfinale.wav',
          previewUrl: 'https://www.kozco.com/tech/organfinale.wav',
          genre: 'ambient'
        }
      ],
      disgusted: [
        {
          id: 'demo-disgusted-1',
          title: 'Raw Electronic',
          artist: 'Demo Producer',
          albumArt: '/placeholder.svg',
          duration: 20000,
          url: 'https://www.kozco.com/tech/LRMonoPhase4.wav',
          previewUrl: 'https://www.kozco.com/tech/LRMonoPhase4.wav',
          genre: 'alternative'
        }
      ],
      neutral: [
        {
          id: 'demo-neutral-1',
          title: 'Chill Piano',
          artist: 'Demo Artist',
          albumArt: '/placeholder.svg',
          duration: 30000,
          url: 'https://www.kozco.com/tech/piano2.wav',
          previewUrl: 'https://www.kozco.com/tech/piano2.wav',
          genre: 'ambient'
        }
      ]
    };

    return emotionTracks[emotion] || this.demoTracks;
  }

  // Convert demo track to Track interface
  convertToTrack(demoTrack: DemoTrack) {
    return {
      id: demoTrack.id,
      title: demoTrack.title,
      artist: demoTrack.artist,
      albumArt: demoTrack.albumArt,
      duration: demoTrack.duration,
      url: demoTrack.url,
      previewUrl: demoTrack.previewUrl,
      quality: 'medium' as const,
      isSpotifyTrack: false
    };
  }

  // Test audio URL accessibility
  async testAudioUrl(url: string): Promise<boolean> {
    try {
      const audio = new Audio();
      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000);
        
        audio.oncanplaythrough = () => {
          clearTimeout(timeout);
          resolve(true);
        };
        
        audio.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
        
        audio.src = url;
      });
    } catch {
      return false;
    }
  }

  // Get working audio URL for a track
  async getWorkingAudioUrl(track: { title: string; artist: string }): Promise<string | null> {
    // Try demo tracks first
    for (const demoTrack of this.demoTracks) {
      const isWorking = await this.testAudioUrl(demoTrack.url);
      if (isWorking) {
        console.log(`🎵 Using working demo audio: ${demoTrack.title}`);
        return demoTrack.url;
      }
    }

    // Generate a simple tone as fallback
    return this.generateSimpleTone(track.title);
  }

  // Generate a simple audio tone
  private generateSimpleTone(title: string): string {
    try {
      // Create a simple sine wave tone
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const duration = 10; // 10 seconds
      const sampleRate = audioContext.sampleRate;
      const frameCount = sampleRate * duration;
      
      const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
      const channelData = buffer.getChannelData(0);
      
      // Generate tone based on title hash
      let hash = 0;
      for (let i = 0; i < title.length; i++) {
        hash = ((hash << 5) - hash + title.charCodeAt(i)) & 0xffffffff;
      }
      
      const frequency = 220 + (Math.abs(hash) % 440); // 220-660 Hz range
      
      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        channelData[i] = Math.sin(2 * Math.PI * frequency * t) * 0.3;
      }
      
      // Convert to data URL (simplified - would need proper WAV encoding)
      return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEWAjOH0fPTgjMGHm7A7+OZURE';
    } catch (error) {
      console.error('Failed to generate tone:', error);
      return '';
    }
  }
}

export const demoMusicService = new DemoMusicService();
