// Global types already declared in EnhancedMusicPlayerContext

interface SpotifyPlayer {
  addListener(event: string, callback: (data: any) => void): boolean;
  removeListener(event: string, callback?: (data: any) => void): boolean;
  connect(): Promise<boolean>;
  disconnect(): void;
  getCurrentState(): Promise<SpotifyPlaybackState | null>;
  setName(name: string): Promise<void>;
  getVolume(): Promise<number>;
  setVolume(volume: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  togglePlay(): Promise<void>;
  seek(position_ms: number): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
}

interface SpotifyPlaybackState {
  context: {
    uri: string;
    metadata: any;
  };
  disallows: {
    pausing: boolean;
    peeking_next: boolean;
    peeking_prev: boolean;
    resuming: boolean;
    seeking: boolean;
    skipping_next: boolean;
    skipping_prev: boolean;
  };
  paused: boolean;
  position: number;
  repeat_mode: number;
  shuffle: boolean;
  track_window: {
    current_track: SpotifyTrack;
    next_tracks: SpotifyTrack[];
    previous_tracks: SpotifyTrack[];
  };
}

interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  duration_ms: number;
  artists: Array<{
    name: string;
    uri: string;
  }>;
  album: {
    name: string;
    uri: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
}

interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
}

class SpotifyWebPlaybackService {
  private player: SpotifyPlayer | null = null;
  private deviceId: string | null = null;
  private accessToken: string | null = null;
  private isReady: boolean = false;
  private eventCallbacks: Map<string, ((data: any) => void)[]> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadSDK();
  }

  private loadSDK(): void {
    if (document.querySelector('script[src*="spotify-player"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.head.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      this.initializePlayer();
    };
  }

  private async initializePlayer(): Promise<void> {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) {
      throw new Error('No Spotify access token found');
    }

    this.accessToken = token;

    this.player = new window.Spotify.Player({
      name: 'VibeTune Web Player',
      getOAuthToken: (cb: (token: string) => void) => {
        cb(this.accessToken!);
      },
      volume: 0.5
    });

    // Error handling
    this.player.addListener('initialization_error', ({ message }: { message: string }) => {
      console.error('Spotify initialization error:', message);
      this.emit('error', { type: 'initialization_error', message });
    });

    this.player.addListener('authentication_error', ({ message }: { message: string }) => {
      console.error('Spotify authentication error:', message);
      this.emit('error', { type: 'authentication_error', message });
      // Try to refresh token
      this.refreshToken();
    });

    this.player.addListener('account_error', ({ message }: { message: string }) => {
      console.error('Spotify account error:', message);
      this.emit('error', { type: 'account_error', message });
    });

    this.player.addListener('playback_error', ({ message }: { message: string }) => {
      console.error('Spotify playback error:', message);
      this.emit('error', { type: 'playback_error', message });
    });

    // Playback status updates
    this.player.addListener('player_state_changed', (state: SpotifyPlaybackState) => {
      if (state) {
        this.emit('player_state_changed', state);
        this.emit('track_changed', state.track_window.current_track);
        this.emit('playback_changed', {
          isPlaying: !state.paused,
          position: state.position,
          duration: state.track_window.current_track?.duration_ms || 0
        });
      }
    });

    // Ready
    this.player.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('Spotify Web Playback SDK is ready with Device ID:', device_id);
      this.deviceId = device_id;
      this.isReady = true;
      this.emit('ready', { device_id });
      this.startProgressTracking();
    });

    // Not Ready
    this.player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('Spotify Web Playback SDK has gone offline with Device ID:', device_id);
      this.isReady = false;
      this.emit('not_ready', { device_id });
      this.stopProgressTracking();
    });

    // Connect to the player
    const connected = await this.player.connect();
    if (!connected) {
      throw new Error('Failed to connect Spotify Web Playback SDK');
    }
  }

  private async refreshToken(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('spotify_refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('spotify_access_token', data.accessToken);
        this.accessToken = data.accessToken;
        
        // Reinitialize player with new token
        if (this.player) {
          this.player.disconnect();
        }
        await this.initializePlayer();
      }
    } catch (error) {
      console.error('Error refreshing Spotify token:', error);
      this.emit('error', { type: 'token_refresh_error', message: 'Failed to refresh access token' });
    }
  }

  private startProgressTracking(): void {
    this.checkInterval = setInterval(async () => {
      if (this.player && this.isReady) {
        try {
          const state = await this.player.getCurrentState();
          if (state && !state.paused) {
            this.emit('progress_update', {
              position: state.position,
              duration: state.track_window.current_track?.duration_ms || 0,
              track: state.track_window.current_track
            });
          }
        } catch (error) {
          console.error('Error getting current state:', error);
        }
      }
    }, 1000);
  }

  private stopProgressTracking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Event management
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Playback control methods
  async play(options?: { uris?: string[]; context_uri?: string; offset?: { position: number } }): Promise<boolean> {
    if (!this.isReady || !this.deviceId || !this.accessToken) {
      throw new Error('Spotify player not ready');
    }

    try {
      const body: any = {};
      
      if (options?.uris) {
        body.uris = options.uris;
      } else if (options?.context_uri) {
        body.context_uri = options.context_uri;
      }
      
      if (options?.offset) {
        body.offset = options.offset;
      }

      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
      });

      if (response.status === 204 || response.status === 200) {
        this.emit('play_started', options);
        return true;
      } else if (response.status === 403) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Playback failed - Premium required');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error starting playback:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    if (!this.player) {
      throw new Error('Player not initialized');
    }
    
    await this.player.pause();
    this.emit('paused', {});
  }

  async resume(): Promise<void> {
    if (!this.player) {
      throw new Error('Player not initialized');
    }
    
    await this.player.resume();
    this.emit('resumed', {});
  }

  async togglePlay(): Promise<void> {
    if (!this.player) {
      throw new Error('Player not initialized');
    }
    
    await this.player.togglePlay();
  }

  async seek(position_ms: number): Promise<void> {
    if (!this.player) {
      throw new Error('Player not initialized');
    }
    
    await this.player.seek(position_ms);
    this.emit('seeked', { position: position_ms });
  }

  async previousTrack(): Promise<void> {
    if (!this.player) {
      throw new Error('Player not initialized');
    }
    
    await this.player.previousTrack();
    this.emit('previous_track', {});
  }

  async nextTrack(): Promise<void> {
    if (!this.player) {
      throw new Error('Player not initialized');
    }
    
    await this.player.nextTrack();
    this.emit('next_track', {});
  }

  async setVolume(volume: number): Promise<void> {
    if (!this.player) {
      throw new Error('Player not initialized');
    }
    
    await this.player.setVolume(volume);
    this.emit('volume_changed', { volume });
  }

  async getVolume(): Promise<number> {
    if (!this.player) {
      throw new Error('Player not initialized');
    }
    
    return await this.player.getVolume();
  }

  async getCurrentState(): Promise<SpotifyPlaybackState | null> {
    if (!this.player) {
      return null;
    }
    
    return await this.player.getCurrentState();
  }

  async getDevices(): Promise<SpotifyDevice[]> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.devices;
    } else {
      throw new Error('Failed to fetch devices');
    }
  }

  async transferPlayback(device_id: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_ids: [device_id],
        play: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to transfer playback');
    }

    this.emit('playback_transferred', { device_id });
  }

  // Getters
  get ready(): boolean {
    return this.isReady;
  }

  get device(): string | null {
    return this.deviceId;
  }

  get connected(): boolean {
    return this.player !== null && this.isReady;
  }

  // Disconnect and cleanup
  disconnect(): void {
    this.stopProgressTracking();
    
    if (this.player) {
      this.player.disconnect();
      this.player = null;
    }
    
    this.isReady = false;
    this.deviceId = null;
    this.accessToken = null;
    this.eventCallbacks.clear();
    
    this.emit('disconnected', {});
  }
}

export const spotifyWebPlaybackService = new SpotifyWebPlaybackService();
export default spotifyWebPlaybackService;
export type { SpotifyPlaybackState, SpotifyTrack, SpotifyDevice };