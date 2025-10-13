import {
  SpotifySearchResults,
  SpotifyTrack,
  SpotifyAlbum,
  SpotifyArtist,
  SpotifyPlaylist,
  SpotifyUser,
  AuthResponse,
  RefreshTokenResponse,
  ApiError,
} from '@shared/api';

class ClientSpotifyService {
  private baseUrl = '/api';
  private sessionToken: string | null = null;

  constructor() {
    // Load session token from localStorage on initialization
    this.sessionToken = localStorage.getItem('spotifySessionToken');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || 'Unknown error occurred');
    }
    return response.json();
  }

  // Authentication methods
  async getAuthUrl(): Promise<{ authUrl: string }> {
    const response = await fetch(`${this.baseUrl}/auth/spotify/url`);
    return this.handleResponse(response);
  }

  async handleCallback(code: string, state?: string): Promise<AuthResponse> {
    const params = new URLSearchParams({ code });
    if (state) params.append('state', state);

    const response = await fetch(`${this.baseUrl}/auth/spotify/callback?${params}`, {
      // Ensure server returns JSON instead of an HTML redirect
      headers: { Accept: 'application/json' },
    });
    const authResponse = await this.handleResponse<AuthResponse>(response);
    
    // Store session token
    this.sessionToken = authResponse.sessionToken;
    localStorage.setItem('spotifySessionToken', authResponse.sessionToken);
    
    return authResponse;
  }

  async refreshToken(): Promise<RefreshTokenResponse> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getCurrentUser(): Promise<{ user: SpotifyUser }> {
    const response = await fetch(`${this.baseUrl}/auth/user`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } finally {
      this.sessionToken = null;
      localStorage.removeItem('spotifySessionToken');
    }
  }

  // Spotify API methods
  async search(
    query: string,
    type: string = 'track,album,artist,playlist',
    limit: number = 20,
    offset: number = 0
  ): Promise<SpotifySearchResults> {
    const params = new URLSearchParams({
      q: query,
      type,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${this.baseUrl}/spotify/search?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getTrack(id: string): Promise<SpotifyTrack> {
    const response = await fetch(`${this.baseUrl}/spotify/track/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getTracks(ids: string[]): Promise<{ tracks: SpotifyTrack[] }> {
    const params = new URLSearchParams({
      ids: ids.join(','),
    });

    const response = await fetch(`${this.baseUrl}/spotify/tracks?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAlbum(id: string): Promise<SpotifyAlbum> {
    const response = await fetch(`${this.baseUrl}/spotify/album/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAlbumTracks(id: string, limit: number = 20, offset: number = 0): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${this.baseUrl}/spotify/album/${id}/tracks?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getArtist(id: string): Promise<SpotifyArtist> {
    const response = await fetch(`${this.baseUrl}/spotify/artist/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getArtistTopTracks(id: string, market: string = 'US'): Promise<any> {
    const params = new URLSearchParams({ market });

    const response = await fetch(`${this.baseUrl}/spotify/artist/${id}/top-tracks?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getArtistAlbums(
    id: string,
    limit: number = 20,
    offset: number = 0,
    includeGroups: string = 'album,single'
  ): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      include_groups: includeGroups,
    });

    const response = await fetch(`${this.baseUrl}/spotify/artist/${id}/albums?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getRelatedArtists(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/spotify/artist/${id}/related-artists`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getFeaturedPlaylists(
    limit: number = 20,
    offset: number = 0,
    country?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (country) params.append('country', country);

    const response = await fetch(`${this.baseUrl}/spotify/featured-playlists?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getNewReleases(
    limit: number = 20,
    offset: number = 0,
    country?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (country) params.append('country', country);

    const response = await fetch(`${this.baseUrl}/spotify/new-releases?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getTopArtists(
    limit: number = 20,
    offset: number = 0
  ): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${this.baseUrl}/spotify/top-artists?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getCategories(
    limit: number = 20,
    offset: number = 0,
    country?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (country) params.append('country', country);

    const response = await fetch(`${this.baseUrl}/spotify/categories?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getCategoryPlaylists(
    categoryId: string,
    limit: number = 20,
    offset: number = 0,
    country?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (country) params.append('country', country);

    const response = await fetch(`${this.baseUrl}/spotify/categories/${categoryId}/playlists?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getRecommendations(options: {
    seedArtists?: string[];
    seedGenres?: string[];
    seedTracks?: string[];
    limit?: number;
    targetValence?: number;
    targetEnergy?: number;
    targetDanceability?: number;
  }): Promise<any> {
    const params = new URLSearchParams();
    
    if (options.seedArtists?.length) {
      params.append('seed_artists', options.seedArtists.join(','));
    }
    if (options.seedGenres?.length) {
      params.append('seed_genres', options.seedGenres.join(','));
    }
    if (options.seedTracks?.length) {
      params.append('seed_tracks', options.seedTracks.join(','));
    }
    if (options.limit !== undefined) {
      params.append('limit', options.limit.toString());
    }
    if (options.targetValence !== undefined) {
      params.append('target_valence', options.targetValence.toString());
    }
    if (options.targetEnergy !== undefined) {
      params.append('target_energy', options.targetEnergy.toString());
    }
    if (options.targetDanceability !== undefined) {
      params.append('target_danceability', options.targetDanceability.toString());
    }

    const response = await fetch(`${this.baseUrl}/spotify/recommendations?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getGenreSeeds(): Promise<{ genres: string[] }> {
    const response = await fetch(`${this.baseUrl}/spotify/genre-seeds`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // User-specific methods (require authentication)
  async getUserPlaylists(limit: number = 20, offset: number = 0): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${this.baseUrl}/spotify/me/playlists?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getPlaylist(id: string): Promise<SpotifyPlaylist> {
    const response = await fetch(`${this.baseUrl}/spotify/playlist/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getPlaylistTracksAll(id: string, pageSize: number = 100): Promise<any[]> {
    let items: any[] = [];
    let offset = 0;
    // Pull multiple pages until done (API limit 100)
    for (let i = 0; i < 10; i++) { // cap to avoid runaway
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(offset) });
      const res = await fetch(`${this.baseUrl}/spotify/playlist/${id}/tracks?${params}`, { headers: this.getHeaders() });
      const data = await this.handleResponse<any>(res);
      items = items.concat(data.items || []);
      if (!data.items || data.items.length < pageSize) break;
      offset += pageSize;
    }
    return items;
  }

  async getPlaylistTracks(id: string, limit: number = 50, offset: number = 0): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${this.baseUrl}/spotify/playlist/${id}/tracks?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getSavedTracks(limit: number = 20, offset: number = 0): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${this.baseUrl}/spotify/me/tracks?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getSavedAlbums(limit: number = 20, offset: number = 0): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    const response = await fetch(`${this.baseUrl}/spotify/me/albums?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getFollowedArtists(limit: number = 20, after?: string): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      type: 'artist',
    });
    if (after) params.append('after', after);
    const response = await fetch(`${this.baseUrl}/spotify/me/following?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getTopItems(
    type: 'tracks' | 'artists',
    limit: number = 20,
    offset: number = 0,
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
  ): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      time_range: timeRange,
    });

    const response = await fetch(`${this.baseUrl}/spotify/me/top/${type}?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getRecentlyPlayed(limit: number = 20, after?: number, before?: number): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });
    if (after !== undefined) params.append('after', after.toString());
    if (before !== undefined) params.append('before', before.toString());

    const response = await fetch(`${this.baseUrl}/spotify/me/player/recently-played?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async checkSavedTracks(ids: string[]): Promise<boolean[]> {
    const params = new URLSearchParams({
      ids: ids.join(','),
    });

    const response = await fetch(`${this.baseUrl}/spotify/me/tracks/contains?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async saveTracks(ids: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/spotify/me/tracks`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ ids }),
    });
    await this.handleResponse(response);
  }

  async removeSavedTracks(ids: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/spotify/me/tracks`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ ids }),
    });
    await this.handleResponse(response);
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.sessionToken;
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  setSessionToken(token: string): void {
    this.sessionToken = token;
    localStorage.setItem('spotifySessionToken', token);
  }

  clearSession(): void {
    this.sessionToken = null;
    localStorage.removeItem('spotifySessionToken');
  }
}

export default new ClientSpotifyService();
