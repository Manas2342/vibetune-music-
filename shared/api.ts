/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Spotify API related types
 */
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

export interface SpotifyUser {
  id: string;
  displayName: string;
  email?: string;
  country?: string;
  followers: number;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  product?: string;
}

export interface SpotifySearchResults {
  tracks?: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
  };
  albums?: {
    items: SpotifyAlbum[];
    total: number;
    limit: number;
    offset: number;
  };
  artists?: {
    items: SpotifyArtist[];
    total: number;
    limit: number;
    offset: number;
  };
  playlists?: {
    items: SpotifyPlaylist[];
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Authentication responses
 */
export interface AuthResponse {
  sessionToken: string;
  user: SpotifyUser;
  tokenExpiresIn: number;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}


/**
 * API Error response
 */
export interface ApiError {
  error: string;
  requiresRefresh?: boolean;
}
