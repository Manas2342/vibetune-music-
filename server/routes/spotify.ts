import { RequestHandler } from 'express';
import spotifyService from '../services/spotifyService';
import musicService from '../services/musicService';
import { AuthenticatedRequest, optionalAuthenticate } from '../middleware/auth';

// Search for music content (using YouTube but presented as Spotify)
export const search: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { q, type = 'track,album,artist,playlist', limit = 20, offset = 0 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Prefer real Spotify search. Use user token if present; otherwise use client credentials.
    let accessToken = req.user?.spotifyAccessToken;
    if (!accessToken) {
      const clientToken = await spotifyService.getClientCredentialsToken();
      accessToken = clientToken.access_token;
    }

    const results = await spotifyService.search(
      q as string,
      type as string,
      accessToken,
      Number(limit),
      Number(offset)
    );

    res.json(results);
  } catch (error) {
    console.error('Error searching music:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
};

// Get track by ID (using Spotify data)
export const getTrack: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    let accessToken = req.user?.spotifyAccessToken;
    if (!accessToken) {
      const clientToken = await spotifyService.getClientCredentialsToken();
      accessToken = clientToken.access_token;
    }
    
    const track = await spotifyService.getTrack(id, accessToken);
    res.json(track);
  } catch (error) {
    console.error('Error getting track:', error);
    res.status(500).json({ error: 'Failed to get track' });
  }
};

// Get multiple tracks by IDs
export const getTracks: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ error: 'Track IDs are required' });
    }

    let accessToken = req.user?.spotifyAccessToken;

    if (!accessToken) {
      const clientToken = await spotifyService.getClientCredentialsToken();
      accessToken = clientToken.access_token;
    }

    const trackIds = (ids as string).split(',');
    const tracks = await spotifyService.getTracks(trackIds, accessToken);
    res.json(tracks);
  } catch (error) {
    console.error('Error getting tracks:', error);
    res.status(500).json({ error: 'Failed to get tracks' });
  }
};

// Get album by ID
export const getAlbum: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    let accessToken = req.user?.spotifyAccessToken;

    if (!accessToken) {
      const clientToken = await spotifyService.getClientCredentialsToken();
      accessToken = clientToken.access_token;
    }

    const album = await spotifyService.getAlbum(id, accessToken);
    res.json(album);
  } catch (error) {
    console.error('Error getting album:', error);
    res.status(500).json({ error: 'Failed to get album' });
  }
};

// Get album tracks
export const getAlbumTracks: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    let accessToken = req.user?.spotifyAccessToken;

    if (!accessToken) {
      const clientToken = await spotifyService.getClientCredentialsToken();
      accessToken = clientToken.access_token;
    }

    const tracks = await spotifyService.getAlbumTracks(
      id,
      accessToken,
      Number(limit),
      Number(offset)
    );
    res.json(tracks);
  } catch (error) {
    console.error('Error getting album tracks:', error);
    res.status(500).json({ error: 'Failed to get album tracks' });
  }
};

// Get artist by ID
export const getArtist: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    let accessToken = req.user?.spotifyAccessToken;

    if (!accessToken) {
      const clientToken = await spotifyService.getClientCredentialsToken();
      accessToken = clientToken.access_token;
    }

    const artist = await spotifyService.getArtist(id, accessToken);
    res.json(artist);
  } catch (error) {
    console.error('Error getting artist:', error);
    res.status(500).json({ error: 'Failed to get artist' });
  }
};

// Get artist's top tracks
export const getArtistTopTracks: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { market = 'US' } = req.query;
    
    let accessToken = req.user?.spotifyAccessToken;

    if (!accessToken) {
      const clientToken = await spotifyService.getClientCredentialsToken();
      accessToken = clientToken.access_token;
    }

    const tracks = await spotifyService.getArtistTopTracks(id, market as string, accessToken);
    res.json(tracks);
  } catch (error) {
    console.error('Error getting artist top tracks:', error);
    res.status(500).json({ error: 'Failed to get artist top tracks' });
  }
};

// Get artist's albums
export const getArtistAlbums: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0, include_groups = 'album,single' } = req.query;
    
    let accessToken = req.user?.spotifyAccessToken;

    if (!accessToken) {
      const clientToken = await spotifyService.getClientCredentialsToken();
      accessToken = clientToken.access_token;
    }

    const albums = await spotifyService.getArtistAlbums(
      id,
      accessToken,
      Number(limit),
      Number(offset),
      include_groups as string
    );
    res.json(albums);
  } catch (error) {
    console.error('Error getting artist albums:', error);
    res.status(500).json({ error: 'Failed to get artist albums' });
  }
};

// Get related artists
export const getRelatedArtists: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    let accessToken = req.user?.spotifyAccessToken;

    if (!accessToken) {
      const clientToken = await spotifyService.getClientCredentialsToken();
      accessToken = clientToken.access_token;
    }

    const artists = await spotifyService.getRelatedArtists(id, accessToken);
    res.json(artists);
  } catch (error) {
    console.error('Error getting related artists:', error);
    res.status(500).json({ error: 'Failed to get related artists' });
  }
};

// Get playlist by ID
export const getPlaylist: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const playlist = await spotifyService.getPlaylist(id, req.user.spotifyAccessToken);
    res.json(playlist);
  } catch (error) {
    console.error('Error getting playlist:', error);
    res.status(500).json({ error: 'Failed to get playlist' });
  }
};

// Get playlist tracks
export const getPlaylistTracks: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tracks = await spotifyService.getPlaylistTracks(
      id,
      req.user.spotifyAccessToken,
      Number(limit),
      Number(offset)
    );
    res.json(tracks);
  } catch (error) {
    console.error('Error getting playlist tracks:', error);
    res.status(500).json({ error: 'Failed to get playlist tracks' });
  }
};

// Get user's playlists
export const getUserPlaylists: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const playlists = await spotifyService.getUserPlaylists(
      req.user.spotifyAccessToken,
      Number(limit),
      Number(offset)
    );
    res.json(playlists);
  } catch (error) {
    console.error('Error getting user playlists:', error);
    res.status(500).json({ error: 'Failed to get user playlists' });
  }
};

// Get user's saved tracks
export const getSavedTracks: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tracks = await spotifyService.getSavedTracks(
      req.user.spotifyAccessToken,
      Number(limit),
      Number(offset)
    );
    res.json(tracks);
  } catch (error) {
    console.error('Error getting saved tracks:', error);
    res.status(500).json({ error: 'Failed to get saved tracks' });
  }
};

// Get user's saved albums
export const getSavedAlbums: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = req.user.spotifyAccessToken;
    const response = await fetch('https://api.spotify.com/v1/me/albums?' + new URLSearchParams({ limit: String(limit), offset: String(offset) }), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error getting saved albums:', error);
    res.status(500).json({ error: 'Failed to get saved albums' });
  }
};

// Get user's followed artists
export const getFollowedArtists: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = 20, after } = req.query;
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const params = new URLSearchParams({ type: 'artist', limit: String(limit) });
    if (after) params.append('after', String(after));
    const token = req.user.spotifyAccessToken;
    const response = await fetch('https://api.spotify.com/v1/me/following?' + params.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error getting followed artists:', error);
    res.status(500).json({ error: 'Failed to get followed artists' });
  }
};

// Get user's top tracks or artists
export const getTopItems: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { type } = req.params; // 'tracks' or 'artists'
    const { limit = 20, offset = 0, time_range = 'medium_term' } = req.query;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (type !== 'tracks' && type !== 'artists') {
      return res.status(400).json({ error: 'Type must be "tracks" or "artists"' });
    }

    const items = await spotifyService.getTopItems(
      type as 'tracks' | 'artists',
      req.user.spotifyAccessToken,
      Number(limit),
      Number(offset),
      time_range as 'short_term' | 'medium_term' | 'long_term'
    );
    res.json(items);
  } catch (error) {
    console.error('Error getting top items:', error);
    res.status(500).json({ error: 'Failed to get top items' });
  }
};

// Get user's top tracks
export const getTopTracks: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = 20, offset = 0, time_range = 'medium_term' } = req.query;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const items = await spotifyService.getTopItems(
      'tracks',
      req.user.spotifyAccessToken,
      Number(limit),
      Number(offset),
      time_range as 'short_term' | 'medium_term' | 'long_term'
    );
    res.json(items);
  } catch (error) {
    console.error('Error getting top tracks:', error);
    res.status(500).json({ error: 'Failed to get top tracks' });
  }
};

// Get user's top artists
export const getTopArtistsForUser: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = 20, offset = 0, time_range = 'medium_term' } = req.query;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const items = await spotifyService.getTopItems(
      'artists',
      req.user.spotifyAccessToken,
      Number(limit),
      Number(offset),
      time_range as 'short_term' | 'medium_term' | 'long_term'
    );
    res.json(items);
  } catch (error) {
    console.error('Error getting top artists:', error);
    res.status(500).json({ error: 'Failed to get top artists' });
  }
};

// Get top artists (public endpoint using client credentials)
export const getTopArtists: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    // Get access token (user token if available, otherwise client credentials)
    let accessToken = req.user?.spotifyAccessToken;
    if (!accessToken) {
      const clientToken = await spotifyService.getClientCredentialsToken();
      accessToken = clientToken.access_token;
    }
    
    // Search for popular artists
    const searchResults = await spotifyService.search(
      'year:2024',
      'artist',
      accessToken,
      Number(limit),
      Number(offset)
    );
    
    res.json(searchResults);
  } catch (error) {
    console.error('Error getting top artists:', error);
    res.status(500).json({ error: 'Failed to get top artists' });
  }
};

// Get recently played tracks
export const getRecentlyPlayed: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = 20, after, before } = req.query;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tracks = await spotifyService.getRecentlyPlayed(
      req.user.spotifyAccessToken,
      Number(limit),
      after ? Number(after) : undefined,
      before ? Number(before) : undefined
    );
    res.json(tracks);
  } catch (error) {
    console.error('Error getting recently played:', error);
    res.status(500).json({ error: 'Failed to get recently played tracks' });
  }
};

// Get featured playlists (using Spotify data)
export const getFeaturedPlaylists: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    // Get access token (user token if available, otherwise client credentials)
    let accessToken = req.user?.spotifyAccessToken;
    if (!accessToken) {
      const clientToken = await spotifyService.getClientCredentialsToken();
      accessToken = clientToken.access_token;
    }
    
    console.log('🎵 Attempting to get featured playlists from Spotify...');
    
    try {
      // Try to get featured playlists first
      const playlists = await spotifyService.getFeaturedPlaylists(
        accessToken,
        Number(limit),
        Number(offset)
      );
      console.log('✅ Successfully got featured playlists from Spotify:', playlists?.playlists?.items?.length || 0, 'items');
      res.json(playlists);
    } catch (featuredError) {
      console.error('❌ Featured playlists API failed:', featuredError.response?.status, featuredError.response?.statusText);
      console.error('❌ Error details:', featuredError.response?.data);
      
      // Try to get new releases as fallback (albums can act as playlists)
      try {
        console.log('🎵 Trying new releases as playlist fallback...');
        const newReleases = await spotifyService.getNewReleases(accessToken, Number(limit), Number(offset));
        if (newReleases?.albums?.items?.length > 0) {
          // Transform albums to look like playlists
          const playlistLikeAlbums = newReleases.albums.items.map(album => ({
            id: album.id,
            name: album.name,
            description: `New album by ${album.artists.map(a => a.name).join(', ')}`,
            images: album.images,
            owner: { display_name: album.artists[0]?.name || 'Various Artists' },
            tracks: { total: album.total_tracks },
            type: 'album' // Mark as album so UI can handle differently if needed
          }));
          
          const response = {
            playlists: {
              items: playlistLikeAlbums,
              total: newReleases.albums.total,
              limit: newReleases.albums.limit,
              offset: newReleases.albums.offset
            }
          };
          
          console.log('✅ Successfully got new releases as playlist fallback:', playlistLikeAlbums.length, 'items');
          res.json(response);
          return;
        }
      } catch (newReleasesError) {
        console.error('❌ New releases fallback also failed:', newReleasesError);
      }
      
      console.log('🎵 Using demo playlists as final fallback...');
      // Final fallback: Return demo playlists
      const demoPlaylists = [
        {
          id: 'demo-1',
          name: 'Today\'s Top Hits',
          description: 'The most played songs right now',
          images: [{ url: 'https://i.scdn.co/image/ab67706f00000002f6f6b0b8b0b8b0b8b0b8b0b8' }],
          owner: { display_name: 'Spotify' }
        },
        {
          id: 'demo-2',
          name: 'Discover Weekly',
          description: 'Your weekly mixtape of fresh music',
          images: [{ url: 'https://i.scdn.co/image/ab67706f00000002f6f6b0b8b0b8b0b8b0b8b0b8' }],
          owner: { display_name: 'Spotify' }
        },
        {
          id: 'demo-3',
          name: 'Release Radar',
          description: 'Catch all the latest music from artists you follow',
          images: [{ url: 'https://i.scdn.co/image/ab67706f00000002f6f6b0b8b0b8b0b8b0b8b0b8' }],
          owner: { display_name: 'Spotify' }
        },
        {
          id: 'demo-4',
          name: 'Chill Hits',
          description: 'Kick back to the best new and recent chill hits',
          images: [{ url: 'https://i.scdn.co/image/ab67706f00000002f6f6b0b8b0b8b0b8b0b8b0b8' }],
          owner: { display_name: 'Spotify' }
        },
        {
          id: 'demo-5',
          name: 'Viva Latino',
          description: 'Today\'s top Latin hits, elevando tu música',
          images: [{ url: 'https://i.scdn.co/image/ab67706f00000002f6f6b0b8b0b8b0b8b0b8b0b8' }],
          owner: { display_name: 'Spotify' }
        },
        {
          id: 'demo-6',
          name: 'Rock Classics',
          description: 'Rock legends & epic songs that continue to inspire generations',
          images: [{ url: 'https://i.scdn.co/image/ab67706f00000002f6f6b0b8b0b8b0b8b0b8b0b8' }],
          owner: { display_name: 'Spotify' }
        }
      ];
      
      // Return in the same format as featured playlists
      res.json({
        playlists: {
          items: demoPlaylists.slice(0, Number(limit)),
          total: demoPlaylists.length
        }
      });
    }
  } catch (error) {
    console.error('Error getting featured playlists:', error);
    res.status(500).json({ error: 'Failed to get featured playlists' });
  }
};

// Get new releases
export const getNewReleases: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = 20, offset = 0, country } = req.query;
    
    let accessToken = req.user?.spotifyAccessToken;

    if (!accessToken) {
      const clientToken = await spotifyService.getClientCredentialsToken();
      accessToken = clientToken.access_token;
    }

    const releases = await spotifyService.getNewReleases(
      accessToken,
      Number(limit),
      Number(offset),
      country as string
    );
    res.json(releases);
  } catch (error) {
    console.error('Error getting new releases:', error);
    res.status(500).json({ error: 'Failed to get new releases' });
  }
};

// Get categories
export const getCategories: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = 20, offset = 0, country } = req.query;
    
    let accessToken = req.user?.spotifyAccessToken;

    if (!accessToken) {
      const clientToken = await spotifyService.getClientCredentialsToken();
      accessToken = clientToken.access_token;
    }

    const categories = await spotifyService.getCategories(
      accessToken,
      Number(limit),
      Number(offset),
      country as string
    );
    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
};

// Get category playlists
export const getCategoryPlaylists: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0, country } = req.query;
    
    let accessToken = req.user?.spotifyAccessToken;

    if (!accessToken) {
      const clientToken = await spotifyService.getClientCredentialsToken();
      accessToken = clientToken.access_token;
    }

    const playlists = await spotifyService.getCategoryPlaylists(
      id,
      accessToken,
      Number(limit),
      Number(offset),
      country as string
    );
    res.json(playlists);
  } catch (error) {
    console.error('Error getting category playlists:', error);
    res.status(500).json({ error: 'Failed to get category playlists' });
  }
};

// Get recommendations (using real Spotify API)
export const getRecommendations: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🎵 Server: getRecommendations called with query:', req.query);
    
    const {
      seed_artists,
      seed_genres,
      seed_tracks,
      limit = 20,
      target_valence,
      target_energy,
      target_danceability
    } = req.query;

    const seedArtists = seed_artists ? (seed_artists as string).split(',') : undefined;
    const seedGenres = seed_genres ? (seed_genres as string).split(',') : undefined;
    const seedTracks = seed_tracks ? (seed_tracks as string).split(',') : undefined;

    console.log('🎵 Server: Parsed parameters:', { seedArtists, seedGenres, seedTracks, limit });

    // Get access token
    let accessToken = req.user?.spotifyAccessToken;
    if (!accessToken) {
      console.log('🎵 Server: No user token, getting client credentials');
      const clientToken = await spotifyService.getClientCredentialsToken();
      accessToken = clientToken.access_token;
    }

    console.log('🎵 Server: Using access token:', accessToken ? 'Present' : 'Missing');

    // Use real Spotify recommendations API
    console.log('🎵 Server: Calling Spotify API...');
    console.log('🎵 Server: Parameters being passed:', {
      accessToken: accessToken ? 'Present' : 'Missing',
      seedArtists,
      seedGenres,
      seedTracks,
      limit: Number(limit),
      target_valence: target_valence ? Number(target_valence) : undefined,
      target_energy: target_energy ? Number(target_energy) : undefined,
      target_danceability: target_danceability ? Number(target_danceability) : undefined
    });
    
    try {
      const recommendations = await spotifyService.getRecommendations(
        accessToken,
        seedArtists,
        seedGenres,
        seedTracks,
        Number(limit),
        target_valence ? Number(target_valence) : undefined,
        target_energy ? Number(target_energy) : undefined,
        target_danceability ? Number(target_danceability) : undefined
      );
      
      console.log('✅ Server: Successfully got recommendations from Spotify API');
      res.json(recommendations);
    } catch (recommendationsError) {
      console.error('❌ Server: Recommendations API failed, trying fallback...');
      
      // Fallback: Use search to find similar tracks
      let fallbackTracks = [];
      
      try {
        if (seedGenres && seedGenres.length > 0) {
          // Search by genre
          const searchQuery = seedGenres[0];
          const searchResults = await spotifyService.search(searchQuery, 'track', accessToken, Number(limit), 0);
          fallbackTracks = searchResults.tracks?.items || [];
        } else if (seedArtists && seedArtists.length > 0) {
          // Search by artist name
          const artistId = seedArtists[0];
          const artist = await spotifyService.getArtist(artistId, accessToken);
          const searchResults = await spotifyService.search(artist.name, 'track', accessToken, Number(limit), 0);
          fallbackTracks = searchResults.tracks?.items || [];
        } else if (seedTracks && seedTracks.length > 0) {
          // Get the track and search for similar ones
          const trackId = seedTracks[0];
          const track = await spotifyService.getTrack(trackId, accessToken);
          const artistName = track.artists[0]?.name || '';
          const searchResults = await spotifyService.search(artistName, 'track', accessToken, Number(limit), 0);
          fallbackTracks = searchResults.tracks?.items || [];
        }
        
        if (fallbackTracks.length > 0) {
          const fallbackResponse = {
            tracks: fallbackTracks,
            seeds: [
              ...(seedArtists || []).map(id => ({ type: 'artist', id })),
              ...(seedGenres || []).map(genre => ({ type: 'genre', id: genre })),
              ...(seedTracks || []).map(id => ({ type: 'track', id }))
            ]
          };
          
          console.log('✅ Server: Successfully provided fallback recommendations:', fallbackTracks.length, 'tracks');
          res.json(fallbackResponse);
        } else {
          throw new Error('No fallback recommendations found');
        }
      } catch (fallbackError) {
        console.error('❌ Server: Fallback recommendations also failed:', fallbackError);
        throw recommendationsError; // Throw original error
      }
    }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({ error: 'Failed to get recommendations' });
    }
};

// Get available genre seeds
export const getGenreSeeds: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    let accessToken = req.user?.spotifyAccessToken;

    if (!accessToken) {
      const clientToken = await spotifyService.getClientCredentialsToken();
      accessToken = clientToken.access_token;
    }

    const genres = await spotifyService.getGenreSeeds(accessToken);
    res.json(genres);
  } catch (error) {
    console.error('Error getting genre seeds:', error);
    res.status(500).json({ error: 'Failed to get genre seeds' });
  }
};

// Check if tracks are saved
export const checkSavedTracks: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { ids } = req.query;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!ids) {
      return res.status(400).json({ error: 'Track IDs are required' });
    }

    const trackIds = (ids as string).split(',');
    const saved = await spotifyService.checkSavedTracks(trackIds, req.user.spotifyAccessToken);
    res.json(saved);
  } catch (error) {
    console.error('Error checking saved tracks:', error);
    res.status(500).json({ error: 'Failed to check saved tracks' });
  }
};

// Save tracks to library
export const saveTracks: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { ids } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Track IDs array is required' });
    }

    await spotifyService.saveTracks(ids, req.user.spotifyAccessToken);
    res.json({ message: 'Tracks saved successfully' });
  } catch (error) {
    console.error('Error saving tracks:', error);
    res.status(500).json({ error: 'Failed to save tracks' });
  }
};

// Remove saved tracks from library
export const removeSavedTracks: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { ids } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Track IDs array is required' });
    }

    await spotifyService.removeSavedTracks(ids, req.user.spotifyAccessToken);
    res.json({ message: 'Tracks removed successfully' });
  } catch (error) {
    console.error('Error removing saved tracks:', error);
    res.status(500).json({ error: 'Failed to remove saved tracks' });
  }
};
