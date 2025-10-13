// Audio Preview Service
// Finds playable audio previews from various sources

export interface AudioPreview {
  url: string;
  duration: number;
  source: string;
  quality: 'high' | 'medium' | 'low';
}

class AudioPreviewService {
  
  // Find audio previews for a track
  async findAudioPreviews(artist: string, title: string, spotifyId?: string): Promise<AudioPreview[]> {
    const previews: AudioPreview[] = [];
    
    try {
      // 1. Try Spotify Preview URL (30-second previews)
      if (spotifyId) {
        const spotifyPreview = await this.getSpotifyPreview(spotifyId);
        if (spotifyPreview) {
          previews.push(spotifyPreview);
        }
      }
      
      // 2. Try Free Music Archive
      const fmaPreview = await this.getFreeArchivePreview(artist, title);
      if (fmaPreview) {
        previews.push(fmaPreview);
      }
      
      // 3. Try Jamendo (Creative Commons music)
      const jamendoPreview = await this.getJamendoPreview(artist, title);
      if (jamendoPreview) {
        previews.push(jamendoPreview);
      }
      
      // 4. Try sample audio files (for demo purposes)
      const samplePreview = this.getSampleAudio(artist, title);
      if (samplePreview) {
        previews.push(samplePreview);
      }
      
    } catch (error) {
      console.error('Error finding audio previews:', error);
    }
    
    // Sort by quality (high first)
    return previews.sort((a, b) => {
      const qualityOrder = { high: 3, medium: 2, low: 1 };
      return qualityOrder[b.quality] - qualityOrder[a.quality];
    });
  }
  
  // Get Spotify preview URL
  private async getSpotifyPreview(spotifyId: string): Promise<AudioPreview | null> {
    try {
      // In a real app, you'd call the Spotify API here
      // For now, we'll construct a potential preview URL
      const previewUrl = `https://p.scdn.co/mp3-preview/${spotifyId}`;
      
      // Test if the URL is accessible
      const isAccessible = await this.testAudioUrl(previewUrl);
      if (isAccessible) {
        return {
          url: previewUrl,
          duration: 30000, // 30 seconds
          source: 'Spotify',
          quality: 'high'
        };
      }
    } catch (error) {
      console.error('Spotify preview error:', error);
    }
    return null;
  }
  
  // Get Free Music Archive preview
  private async getFreeArchivePreview(artist: string, title: string): Promise<AudioPreview | null> {
    try {
      // Free Music Archive has public domain and Creative Commons music
      // This is a simplified example - in practice you'd use their API
      const query = encodeURIComponent(`${artist} ${title}`);
      
      // Example URLs for demonstration
      const potentialUrls = [
        `https://freemusicarchive.org/track/${query}`,
        `https://archive.org/download/${query.toLowerCase()}/`
      ];
      
      // Note: These are example URLs and may not work
      // In production, integrate with actual FMA API
      
    } catch (error) {
      console.error('Free Archive preview error:', error);
    }
    return null;
  }
  
  // Get Jamendo preview (Creative Commons)
  private async getJamendoPreview(artist: string, title: string): Promise<AudioPreview | null> {
    try {
      // Jamendo has Creative Commons licensed music
      // Example API call (you'd need API key)
      const query = encodeURIComponent(`${artist} ${title}`);
      
      // In practice, call their API:
      // const response = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=YOUR_KEY&search=${query}`);
      
    } catch (error) {
      console.error('Jamendo preview error:', error);
    }
    return null;
  }
  
  // Get sample audio for demo purposes
  private getSampleAudio(artist: string, title: string): AudioPreview | null {
    try {
      // Use working audio samples from freesound.org and other free sources
      const samples = [
        {
          url: 'https://www.kozco.com/tech/LRMonoPhase4.wav', // Working test audio
          genre: 'classical',
          tempo: 'slow'
        },
        {
          url: 'https://www.kozco.com/tech/piano2.wav', // Working piano sample
          genre: 'rock',
          tempo: 'fast'
        },
        {
          url: 'https://www.kozco.com/tech/organfinale.wav', // Working organ sample
          genre: 'ambient',
          tempo: 'slow'
        },
        // Fallback to data URLs if external sources fail
        {
          url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEWAjOH0fPTgjMGHm7A7+OZURE',
          genre: 'electronic',
          tempo: 'medium'
        }
      ];
      
      // Select a sample based on genre/artist
      let selectedSample = samples[0];
      
      if (artist.toLowerCase().includes('rock') || title.toLowerCase().includes('rock')) {
        selectedSample = samples.find(s => s.genre === 'rock') || samples[0];
      } else if (artist.toLowerCase().includes('classical')) {
        selectedSample = samples.find(s => s.genre === 'classical') || samples[0];
      } else if (artist.toLowerCase().includes('electronic') || title.toLowerCase().includes('electronic')) {
        selectedSample = samples.find(s => s.genre === 'electronic') || samples[0];
      }
      
      return {
        url: selectedSample.url,
        duration: 30000, // 30 seconds
        source: 'Demo Audio',
        quality: 'medium'
      };
      
    } catch (error) {
      console.error('Sample audio error:', error);
    }
    return null;
  }
  
  // Test if an audio URL is accessible
  private async testAudioUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors' // To avoid CORS issues for testing
      });
      return response.ok;
    } catch (error) {
      // If HEAD request fails, try creating an audio element
      try {
        return new Promise((resolve) => {
          const audio = new Audio();
          const timeout = setTimeout(() => {
            resolve(false);
          }, 3000); // 3 second timeout
          
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
  }
  
  // Create a realistic audio tone based on track info
  createRealisticTone(artist: string, title: string): Promise<string> {
    return new Promise((resolve) => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const duration = 30; // 30 seconds
        const sampleRate = audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        
        const buffer = audioContext.createBuffer(2, frameCount, sampleRate);
        
        // Generate different waveforms based on artist/title
        const waveType = this.getWaveTypeFromTrack(artist, title);
        const baseFreq = this.getBaseFrequencyFromTrack(artist, title);
        
        for (let channel = 0; channel < 2; channel++) {
          const channelData = buffer.getChannelData(channel);
          
          for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            // Create more musical tones
            switch (waveType) {
              case 'chord':
                sample = Math.sin(2 * Math.PI * baseFreq * t) * 0.3 +
                        Math.sin(2 * Math.PI * (baseFreq * 1.25) * t) * 0.2 +
                        Math.sin(2 * Math.PI * (baseFreq * 1.5) * t) * 0.1;
                break;
              case 'melody':
                const melodyFreq = baseFreq + Math.sin(t * 2) * 50;
                sample = Math.sin(2 * Math.PI * melodyFreq * t) * 0.4;
                break;
              default:
                sample = Math.sin(2 * Math.PI * baseFreq * t) * 0.3;
            }
            
            // Add envelope (fade in/out)
            const fadeTime = 0.1; // 100ms fade
            if (t < fadeTime) {
              sample *= t / fadeTime;
            } else if (t > duration - fadeTime) {
              sample *= (duration - t) / fadeTime;
            }
            
            channelData[i] = sample;
          }
        }
        
        // Convert buffer to blob URL
        this.bufferToWav(buffer).then(blob => {
          const url = URL.createObjectURL(blob);
          resolve(url);
        });
        
      } catch (error) {
        console.error('Error creating realistic tone:', error);
        resolve('');
      }
    });
  }
  
  private getWaveTypeFromTrack(artist: string, title: string): 'chord' | 'melody' | 'simple' {
    const text = (artist + ' ' + title).toLowerCase();
    if (text.includes('classical') || text.includes('orchestra')) return 'chord';
    if (text.includes('pop') || text.includes('melody')) return 'melody';
    return 'simple';
  }
  
  private getBaseFrequencyFromTrack(artist: string, title: string): number {
    // Use string hash to get consistent frequency for same track
    let hash = 0;
    const str = artist + title;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff;
    }
    
    // Map to musical frequencies (C4 to C6)
    const frequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    return frequencies[Math.abs(hash) % frequencies.length];
  }
  
  // Convert AudioBuffer to WAV blob
  private async bufferToWav(buffer: AudioBuffer): Promise<Blob> {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let sample, offset = 0, pos = 0;
    
    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };
    
    // WAV header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);
    
    // Write audio data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }
}

export const audioPreviewService = new AudioPreviewService();
