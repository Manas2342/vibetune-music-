import axios from 'axios';
import crypto from 'crypto';
import SpotifyWebApi from 'spotify-web-api-node';
import NodeCache from 'node-cache';

// Cache for tokens and API responses (30 minutes TTL)
const cache = new NodeCache({ stdTTL: 1800 });

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    release_date: string;
  };
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
  preview_url?: string;
  popularity: number;
  explicit: boolean;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album_type: string;
  total_tracks: number;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  release_date: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  public: boolean;
  collaborative: boolean;
  tracks: {
    href: string;
    total: number;
  };
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  owner: {
    id: string;
    display_name: string;
  };
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: {
    total: number;
  };
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email?: string;
  country?: string;
  followers: {
    total: number;
  };
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  product?: string;
  explicit_content?: {
    filter_enabled: boolean;
    filter_locked: boolean;
  };
}

class SpotifyService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly baseUrl = 'https://api.spotify.com/v1';
  private readonly authUrl = 'https://accounts.spotify.com/api/token';
  private readonly authorizeUrl = 'https://accounts.spotify.com/authorize';

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID || '';
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:8080/callback';

    if (!this.clientId || !this.clientSecret) {
      console.warn('Spotify credentials not found in environment variables');
    }
  }

  // Generate authorization URL for Spotify OAuth
  generateAuthUrl(state?: string): string {
    const scopes = [
      'streaming',
      'user-read-private',
      'user-read-email',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'user-read-playback-position',
      'user-top-read',
      'user-read-recently-played',
      'user-library-read',
      'user-library-modify',
      'playlist-read-private',
      'playlist-read-collaborative',
      'playlist-modify-private',
      'playlist-modify-public',
      'user-follow-read',
      'user-follow-modify'
    ];

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: scopes.join(' '),
      redirect_uri: this.redirectUri,
      state: state || crypto.randomBytes(16).toString('hex')
    });

    return `${this.authorizeUrl}?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<SpotifyTokenResponse> {
    const response = await axios.post(this.authUrl, 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }),
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<SpotifyTokenResponse> {
    const response = await axios.post(this.authUrl,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  }

  // Get client credentials token (for public data)
  async getClientCredentialsToken(): Promise<SpotifyTokenResponse> {
    const response = await axios.post(this.authUrl,
      new URLSearchParams({
        grant_type: 'client_credentials',
      }),
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  }

  // Get current user's profile
  async getCurrentUser(accessToken: string): Promise<SpotifyUser> {
    const response = await axios.get(`${this.baseUrl}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Search for tracks, albums, artists, playlists
  async search(
    query: string,
    type: string = 'track,album,artist,playlist',
    accessToken: string,
    limit: number = 20,
    offset: number = 0,
    market?: string
  ) {
    const params: Record<string, string | number> = {
      q: query,
      type,
      limit,
      offset,
    };
    if (market) params.market = market;

    const response = await axios.get(`${this.baseUrl}/search`, {
      params,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get track by ID
  async getTrack(trackId: string, accessToken: string): Promise<SpotifyTrack> {
    const response = await axios.get(`${this.baseUrl}/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get multiple tracks by IDs
  async getTracks(trackIds: string[], accessToken: string): Promise<{ tracks: SpotifyTrack[] }> {
    const response = await axios.get(`${this.baseUrl}/tracks`, {
      params: {
        ids: trackIds.join(','),
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get album by ID
  async getAlbum(albumId: string, accessToken: string): Promise<SpotifyAlbum> {
    const response = await axios.get(`${this.baseUrl}/albums/${albumId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get album tracks
  async getAlbumTracks(albumId: string, accessToken: string, limit: number = 20, offset: number = 0) {
    const response = await axios.get(`${this.baseUrl}/albums/${albumId}/tracks`, {
      params: {
        limit,
        offset,
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get artist by ID
  async getArtist(artistId: string, accessToken: string): Promise<SpotifyArtist> {
    const response = await axios.get(`${this.baseUrl}/artists/${artistId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get artist's top tracks
  async getArtistTopTracks(artistId: string, market: string = 'US', accessToken: string) {
    const response = await axios.get(`${this.baseUrl}/artists/${artistId}/top-tracks`, {
      params: {
        market,
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get artist's albums
  async getArtistAlbums(artistId: string, accessToken: string, limit: number = 20, offset: number = 0, includeGroups: string = 'album,single') {
    const response = await axios.get(`${this.baseUrl}/artists/${artistId}/albums`, {
      params: {
        include_groups: includeGroups,
        limit,
        offset,
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get related artists
  async getRelatedArtists(artistId: string, accessToken: string) {
    const response = await axios.get(`${this.baseUrl}/artists/${artistId}/related-artists`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get user's playlists
  async getUserPlaylists(accessToken: string, limit: number = 20, offset: number = 0) {
    const response = await axios.get(`${this.baseUrl}/me/playlists`, {
      params: {
        limit,
        offset,
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get playlist by ID
  async getPlaylist(playlistId: string, accessToken: string): Promise<SpotifyPlaylist> {
    const response = await axios.get(`${this.baseUrl}/playlists/${playlistId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get playlist tracks
  async getPlaylistTracks(playlistId: string, accessToken: string, limit: number = 50, offset: number = 0, market?: string) {
    const params: Record<string, number | string> = { limit, offset };
    if (market) params.market = market;

    const response = await axios.get(`${this.baseUrl}/playlists/${playlistId}/tracks`, {
      params,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  /** Batch get artists (max 50 ids per request). */
  async getArtists(artistIds: string[], accessToken: string): Promise<SpotifyArtist[]> {
    if (!artistIds.length) return [];
    const ids = artistIds.slice(0, 50).join(',');
    const response = await axios.get(`${this.baseUrl}/artists`, {
      params: { ids },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const list = response.data?.artists ?? [];
    return list.filter(Boolean);
  }

  /**
   * India trending: Spotify editorial lists for market IN (Top 50 India, Viral India, etc.).
   * Tries browse → known playlist IDs → playlist search until tracks load.
   */
  async getIndiaTrending(accessToken: string): Promise<{
    playlistId: string;
    playlistName: string;
    tracks: SpotifyTrack[];
    artists: Array<{
      id: string;
      name: string;
      popularity: number;
      trend: number;
      tracksOnTrendingList: number;
      imageUrl?: string;
    }>;
    genres: Array<{ name: string; count: number; trend: number }>;
  }> {
    const market = 'IN';
    /** Extra editorial IDs only if primary India list fails. */
    const extraPlaylistIds = ['37i9dQZEVXbLZrXZBAPIUK'];

    const playlistCandidates: Array<{ id: string; name?: string }> = [
      { id: '37i9dQZEVXbLRQDuF5jeBp', name: 'Top 50 – India' },
    ];

    try {
      const topLists = await this.getCategoryPlaylists('toplists', accessToken, 50, 0, market);
      const items = topLists?.playlists?.items ?? [];
      const indiaPick =
        items.find(
          (p: { name?: string }) =>
            /india/i.test(p.name || '') && /(top\s*50|viral\s*50|charts|hits)/i.test(p.name || '')
        ) ??
        items.find((p: { name?: string }) => /top\s*50.*india|india.*top\s*50/i.test(p.name || '')) ??
        items.find((p: { name?: string }) => /india/i.test(p.name || ''));
      if (indiaPick?.id && !playlistCandidates.some((p) => p.id === indiaPick.id)) {
        playlistCandidates.unshift({ id: indiaPick.id, name: indiaPick.name });
      }
    } catch {
      // continue with known IDs
    }

    for (const id of extraPlaylistIds) {
      if (!playlistCandidates.some((p) => p.id === id)) {
        playlistCandidates.push({ id });
      }
    }

    let data: { items?: Array<{ track?: SpotifyTrack | null }> } | null = null;
    let playlistId = '';
    let playlistName = 'Trending in India';
    let lastErr: unknown;

    for (const cand of playlistCandidates) {
      try {
        const chunk = await this.getPlaylistTracks(cand.id, accessToken, 50, 0, market);
        const withTracks = (chunk?.items ?? []).filter((i: { track?: { id?: string } }) => i?.track?.id);
        if (withTracks.length > 0) {
          data = chunk;
          playlistId = cand.id;
          playlistName = cand.name || playlistName;
          break;
        }
      } catch (e) {
        lastErr = e;
      }
    }

    if (!data?.items?.length) {
      const searchQueries = ['Top 50 India', 'Viral 50 India', 'India trending', 'Bollywood hits'];
      for (const q of searchQueries) {
        try {
          const searchRes = await this.search(q, 'playlist', accessToken, 15, 0, market);
          const playlists = searchRes?.playlists?.items ?? [];
          const pl =
            playlists.find((p: { name?: string }) => /india|indian|bollywood|desi/i.test(p.name || '')) ??
            playlists[0];
          if (pl?.id) {
            const chunk = await this.getPlaylistTracks(pl.id, accessToken, 50, 0, market);
            const withTracks = (chunk?.items ?? []).filter((i: { track?: { id?: string } }) => i?.track?.id);
            if (withTracks.length > 0) {
              data = chunk;
              playlistId = pl.id;
              playlistName = pl.name || playlistName;
              break;
            }
          }
        } catch (e) {
          lastErr = e;
        }
      }
    }

    if (!data?.items?.length) {
      try {
        const feat = await this.getFeaturedPlaylists(accessToken, 25, 0, market);
        const pls = feat?.playlists?.items ?? [];
        const pick =
          pls.find((p: { name?: string }) => /india|indian|bollywood|desi|today|hits/i.test(p.name || '')) ??
          pls[0];
        if (pick?.id) {
          const chunk = await this.getPlaylistTracks(pick.id, accessToken, 50, 0, market);
          const withTracks = (chunk?.items ?? []).filter((i: { track?: { id?: string } }) => i?.track?.id);
          if (withTracks.length > 0) {
            data = chunk;
            playlistId = pick.id;
            playlistName = pick.name || 'Featured in India';
          }
        }
      } catch (e) {
        lastErr = e;
      }
    }

    if (!data?.items?.length) {
      const msg =
        lastErr && typeof lastErr === 'object' && 'response' in lastErr
          ? (lastErr as { response?: { data?: { error?: { message?: string } } } }).response?.data
              ?.error?.message
          : undefined;
      throw new Error(msg || 'Could not load Spotify trending playlists for India');
    }

    const tracks: SpotifyTrack[] = [];

    const artistCounts = new Map<string, { id: string; name: string; count: number }>();
    for (const item of data.items ?? []) {
      const t = item?.track;
      if (!t?.id) continue;
      tracks.push(t);
      for (const a of t.artists ?? []) {
        if (!a?.id) continue;
        const prev = artistCounts.get(a.id);
        if (prev) prev.count += 1;
        else artistCounts.set(a.id, { id: a.id, name: a.name, count: 1 });
      }
    }

    const sortedArtists = [...artistCounts.values()].sort((a, b) => b.count - a.count).slice(0, 20);
    const artistDetails = await this.getArtists(
      sortedArtists.map((a) => a.id),
      accessToken
    );
    const detailById = new Map(artistDetails.map((a) => [a.id, a]));

    const artists = sortedArtists.map((row, i) => {
      const d = detailById.get(row.id);
      const popularity = d?.popularity ?? 0;
      return {
        id: row.id,
        name: row.name,
        popularity,
        trend: Math.max(5, 100 - i * 4),
        tracksOnTrendingList: row.count,
        imageUrl: d?.images?.[0]?.url,
      };
    });

    const genreMap = new Map<string, number>();
    for (const a of artistDetails) {
      for (const g of a.genres ?? []) {
        genreMap.set(g, (genreMap.get(g) || 0) + 1);
      }
    }
    const genres = Array.from(genreMap.entries())
      .map(([name, count]) => ({ name, count, trend: Math.min(100, count * 12) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      playlistId,
      playlistName,
      tracks,
      artists,
      genres,
    };
  }

  // Get user's saved tracks
  async getSavedTracks(accessToken: string, limit: number = 20, offset: number = 0) {
    const response = await axios.get(`${this.baseUrl}/me/tracks`, {
      params: {
        limit,
        offset,
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get user's top items (tracks or artists)
  async getTopItems(type: 'tracks' | 'artists', accessToken: string, limit: number = 20, offset: number = 0, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term') {
    const response = await axios.get(`${this.baseUrl}/me/top/${type}`, {
      params: {
        limit,
        offset,
        time_range: timeRange,
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get recently played tracks
  async getRecentlyPlayed(accessToken: string, limit: number = 20, after?: number, before?: number) {
    const params: any = { limit };
    if (after) params.after = after;
    if (before) params.before = before;

    const response = await axios.get(`${this.baseUrl}/me/player/recently-played`, {
      params,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get featured playlists
  async getFeaturedPlaylists(accessToken: string, limit: number = 20, offset: number = 0, country?: string) {
    const params: any = { limit, offset };
    if (country) params.country = country;

    const response = await axios.get(`${this.baseUrl}/browse/featured-playlists`, {
      params,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get new releases
  async getNewReleases(accessToken: string, limit: number = 20, offset: number = 0, country?: string) {
    const params: any = { limit, offset };
    if (country) params.country = country;

    const response = await axios.get(`${this.baseUrl}/browse/new-releases`, {
      params,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get categories
  async getCategories(accessToken: string, limit: number = 20, offset: number = 0, country?: string) {
    const params: any = { limit, offset };
    if (country) params.country = country;

    const response = await axios.get(`${this.baseUrl}/browse/categories`, {
      params,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get category playlists
  async getCategoryPlaylists(categoryId: string, accessToken: string, limit: number = 20, offset: number = 0, country?: string) {
    const params: any = { limit, offset };
    if (country) params.country = country;

    const response = await axios.get(`${this.baseUrl}/browse/categories/${categoryId}/playlists`, {
      params,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Get recommendations
  async getRecommendations(accessToken: string, seedArtists?: string[], seedGenres?: string[], seedTracks?: string[], limit: number = 20, targetValence?: number, targetEnergy?: number, targetDanceability?: number) {
    const params: any = { limit };
    
    if (seedArtists && seedArtists.length > 0) params.seed_artists = seedArtists.join(',');
    if (seedGenres && seedGenres.length > 0) params.seed_genres = seedGenres.join(',');
    if (seedTracks && seedTracks.length > 0) params.seed_tracks = seedTracks.join(',');
    if (targetValence !== undefined) params.target_valence = targetValence;
    if (targetEnergy !== undefined) params.target_energy = targetEnergy;
    if (targetDanceability !== undefined) params.target_danceability = targetDanceability;

    console.log('🎵 SpotifyService: Making API call to:', `${this.baseUrl}/recommendations`);
    console.log('🎵 SpotifyService: Parameters:', params);
    console.log('🎵 SpotifyService: Access token:', accessToken ? 'Present' : 'Missing');

    try {
      const response = await axios.get(`${this.baseUrl}/recommendations`, {
        params,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      console.log('🎵 SpotifyService: Response status:', response.status);
      console.log('🎵 SpotifyService: Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('🎵 SpotifyService: API call failed:', error.response?.status, error.response?.statusText);
      console.error('🎵 SpotifyService: Error details:', error.response?.data);
      throw error;
    }
  }

  // Get available genre seeds
  async getGenreSeeds(accessToken: string) {
    const response = await axios.get(`${this.baseUrl}/recommendations/available-genre-seeds`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Check if tracks are saved
  async checkSavedTracks(trackIds: string[], accessToken: string): Promise<boolean[]> {
    const response = await axios.get(`${this.baseUrl}/me/tracks/contains`, {
      params: {
        ids: trackIds.join(','),
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Save tracks
  async saveTracks(trackIds: string[], accessToken: string): Promise<void> {
    await axios.put(`${this.baseUrl}/me/tracks`, {
      ids: trackIds,
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Remove saved tracks
  async removeSavedTracks(trackIds: string[], accessToken: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/me/tracks`, {
      data: {
        ids: trackIds,
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }
}

export default new SpotifyService();
