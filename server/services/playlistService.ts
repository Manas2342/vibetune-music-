import fs from 'fs';
import path from 'path';
import NodeCache from 'node-cache';
import spotifyService from './spotifyService';
import { v4 as uuidv4 } from 'uuid';

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  isPublic: boolean;
  isCollaborative: boolean;
  tracks: PlaylistTrack[];
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  collaborators: string[];
  followers: number;
  totalDuration: number;
  createdAt: Date;
  updatedAt: Date;
  spotifyId?: string;
  syncWithSpotify: boolean;
}

export interface PlaylistTrack {
  id: string;
  spotifyId?: string;
  youtubeId?: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  albumArt: string;
  addedBy: string;
  addedAt: Date;
  position: number;
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  isCollaborative?: boolean;
  syncWithSpotify?: boolean;
}

export interface UpdatePlaylistRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  isCollaborative?: boolean;
  coverImage?: string;
}

class PlaylistService {
  private cache: NodeCache;
  private playlistsPath = path.join(process.cwd(), 'storage', 'playlists');
  private userPlaylistsPath = path.join(process.cwd(), 'storage', 'user-playlists');

  constructor() {
    this.cache = new NodeCache({ stdTTL: 1800 }); // 30 minutes cache
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const dirs = [this.playlistsPath, this.userPlaylistsPath];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Create a new playlist
   */
  async createPlaylist(userId: string, playlistData: CreatePlaylistRequest, accessToken?: string): Promise<Playlist> {
    const playlistId = uuidv4();
    
    const playlist: Playlist = {
      id: playlistId,
      name: playlistData.name,
      description: playlistData.description || '',
      coverImage: 'https://mosaic.scdn.co/300/default-playlist.png',
      isPublic: playlistData.isPublic || false,
      isCollaborative: playlistData.isCollaborative || false,
      tracks: [],
      owner: {
        id: userId,
        name: 'VibeTune User'
      },
      collaborators: [],
      followers: 0,
      totalDuration: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncWithSpotify: playlistData.syncWithSpotify || false
    };

    // Create on Spotify if user wants sync and has access token
    if (playlist.syncWithSpotify && accessToken) {
      try {
        const spotifyPlaylist = await this.createSpotifyPlaylist(userId, playlistData, accessToken);
        playlist.spotifyId = spotifyPlaylist.id;
        playlist.coverImage = spotifyPlaylist.images?.[0]?.url || playlist.coverImage;
      } catch (error) {
        console.error('Failed to create Spotify playlist:', error);
        // Continue with local playlist creation
      }
    }

    // Save playlist locally
    await this.savePlaylist(playlist);
    await this.addPlaylistToUser(userId, playlistId);

    // Cache the playlist
    this.cache.set(`playlist_${playlistId}`, playlist);

    console.log(`✅ Created playlist: ${playlist.name} for user ${userId}`);
    return playlist;
  }

  /**
   * Get playlist by ID
   */
  async getPlaylist(playlistId: string, userId?: string): Promise<Playlist | null> {
    // Check cache first
    const cached = this.cache.get<Playlist>(`playlist_${playlistId}`);
    if (cached) {
      return cached;
    }

    // Load from file
    const playlistPath = path.join(this.playlistsPath, `${playlistId}.json`);
    if (!fs.existsSync(playlistPath)) {
      return null;
    }

    try {
      const playlistData = JSON.parse(fs.readFileSync(playlistPath, 'utf8'));
      const playlist: Playlist = {
        ...playlistData,
        createdAt: new Date(playlistData.createdAt),
        updatedAt: new Date(playlistData.updatedAt),
        tracks: playlistData.tracks.map((track: any) => ({
          ...track,
          addedAt: new Date(track.addedAt)
        }))
      };

      // Cache the playlist
      this.cache.set(`playlist_${playlistId}`, playlist);

      return playlist;
    } catch (error) {
      console.error('Error loading playlist:', error);
      return null;
    }
  }

  /**
   * Get user's playlists
   */
  async getUserPlaylists(userId: string, includeSpotify: boolean = true, accessToken?: string): Promise<Playlist[]> {
    const playlists: Playlist[] = [];
    
    // Load local playlists
    const userPlaylistsFile = path.join(this.userPlaylistsPath, `${userId}.json`);
    if (fs.existsSync(userPlaylistsFile)) {
      try {
        const playlistIds = JSON.parse(fs.readFileSync(userPlaylistsFile, 'utf8'));
        
        for (const playlistId of playlistIds) {
          const playlist = await this.getPlaylist(playlistId);
          if (playlist) {
            playlists.push(playlist);
          }
        }
      } catch (error) {
        console.error('Error loading user playlists:', error);
      }
    }

    // Load Spotify playlists if requested
    if (includeSpotify && accessToken) {
      try {
        const spotifyPlaylists = await this.getSpotifyPlaylists(userId, accessToken);
        
        // Convert Spotify playlists to our format
        for (const spotifyPlaylist of spotifyPlaylists) {
          const existingPlaylist = playlists.find(p => p.spotifyId === spotifyPlaylist.id);
          if (!existingPlaylist) {
            const convertedPlaylist: Playlist = {
              id: `spotify_${spotifyPlaylist.id}`,
              name: spotifyPlaylist.name,
              description: spotifyPlaylist.description || '',
              coverImage: spotifyPlaylist.images?.[0]?.url || 'https://mosaic.scdn.co/300/default-playlist.png',
              isPublic: spotifyPlaylist.public,
              isCollaborative: spotifyPlaylist.collaborative,
              tracks: [], // Will be loaded when needed
              owner: {
                id: spotifyPlaylist.owner.id,
                name: spotifyPlaylist.owner.display_name || 'Spotify User'
              },
              collaborators: [],
              followers: spotifyPlaylist.followers?.total || 0,
              totalDuration: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              spotifyId: spotifyPlaylist.id,
              syncWithSpotify: true
            };
            playlists.push(convertedPlaylist);
          }
        }
      } catch (error) {
        console.error('Error loading Spotify playlists:', error);
      }
    }

    return playlists.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Update playlist
   */
  async updatePlaylist(playlistId: string, updates: UpdatePlaylistRequest, userId: string, accessToken?: string): Promise<Playlist | null> {
    const playlist = await this.getPlaylist(playlistId);
    if (!playlist) {
      throw new Error('Playlist not found');
    }

    // Check permissions
    if (playlist.owner.id !== userId && !playlist.collaborators.includes(userId)) {
      throw new Error('Insufficient permissions to update playlist');
    }

    // Update local playlist
    const updatedPlaylist: Playlist = {
      ...playlist,
      ...updates,
      updatedAt: new Date()
    };

    // Update on Spotify if synced
    if (playlist.syncWithSpotify && playlist.spotifyId && accessToken) {
      try {
        await this.updateSpotifyPlaylist(playlist.spotifyId, updates, accessToken);
      } catch (error) {
        console.error('Failed to update Spotify playlist:', error);
      }
    }

    await this.savePlaylist(updatedPlaylist);
    this.cache.set(`playlist_${playlistId}`, updatedPlaylist);

    return updatedPlaylist;
  }

  /**
   * Delete playlist
   */
  async deletePlaylist(playlistId: string, userId: string, accessToken?: string): Promise<void> {
    const playlist = await this.getPlaylist(playlistId);
    if (!playlist) {
      throw new Error('Playlist not found');
    }

    // Check permissions
    if (playlist.owner.id !== userId) {
      throw new Error('Only the playlist owner can delete the playlist');
    }

    // Delete from Spotify if synced
    if (playlist.syncWithSpotify && playlist.spotifyId && accessToken) {
      try {
        await this.deleteSpotifyPlaylist(playlist.spotifyId, accessToken);
      } catch (error) {
        console.error('Failed to delete Spotify playlist:', error);
      }
    }

    // Delete local files
    const playlistPath = path.join(this.playlistsPath, `${playlistId}.json`);
    if (fs.existsSync(playlistPath)) {
      fs.unlinkSync(playlistPath);
    }

    // Remove from user's playlist list
    await this.removePlaylistFromUser(userId, playlistId);

    // Clear cache
    this.cache.del(`playlist_${playlistId}`);

    console.log(`🗑️ Deleted playlist: ${playlist.name}`);
  }

  /**
   * Add track to playlist
   */
  async addTrackToPlaylist(playlistId: string, track: Omit<PlaylistTrack, 'addedAt' | 'position'>, userId: string, accessToken?: string): Promise<Playlist | null> {
    const playlist = await this.getPlaylist(playlistId);
    if (!playlist) {
      throw new Error('Playlist not found');
    }

    // Check permissions
    if (!playlist.isCollaborative && playlist.owner.id !== userId) {
      throw new Error('Insufficient permissions to add tracks');
    }

    const newTrack: PlaylistTrack = {
      ...track,
      addedAt: new Date(),
      position: playlist.tracks.length
    };

    playlist.tracks.push(newTrack);
    playlist.totalDuration += track.duration;
    playlist.updatedAt = new Date();

    // Add to Spotify if synced
    if (playlist.syncWithSpotify && playlist.spotifyId && track.spotifyId && accessToken) {
      try {
        await this.addTrackToSpotifyPlaylist(playlist.spotifyId, track.spotifyId, accessToken);
      } catch (error) {
        console.error('Failed to add track to Spotify playlist:', error);
      }
    }

    await this.savePlaylist(playlist);
    this.cache.set(`playlist_${playlistId}`, playlist);

    return playlist;
  }

  /**
   * Remove track from playlist
   */
  async removeTrackFromPlaylist(playlistId: string, trackIndex: number, userId: string, accessToken?: string): Promise<Playlist | null> {
    const playlist = await this.getPlaylist(playlistId);
    if (!playlist) {
      throw new Error('Playlist not found');
    }

    // Check permissions
    if (!playlist.isCollaborative && playlist.owner.id !== userId) {
      throw new Error('Insufficient permissions to remove tracks');
    }

    if (trackIndex < 0 || trackIndex >= playlist.tracks.length) {
      throw new Error('Invalid track index');
    }

    const removedTrack = playlist.tracks[trackIndex];
    playlist.tracks.splice(trackIndex, 1);
    playlist.totalDuration -= removedTrack.duration;
    playlist.updatedAt = new Date();

    // Update positions
    playlist.tracks.forEach((track, index) => {
      track.position = index;
    });

    // Remove from Spotify if synced
    if (playlist.syncWithSpotify && playlist.spotifyId && removedTrack.spotifyId && accessToken) {
      try {
        await this.removeTrackFromSpotifyPlaylist(playlist.spotifyId, removedTrack.spotifyId, accessToken);
      } catch (error) {
        console.error('Failed to remove track from Spotify playlist:', error);
      }
    }

    await this.savePlaylist(playlist);
    this.cache.set(`playlist_${playlistId}`, playlist);

    return playlist;
  }

  /**
   * Reorder tracks in playlist
   */
  async reorderPlaylistTracks(playlistId: string, fromIndex: number, toIndex: number, userId: string): Promise<Playlist | null> {
    const playlist = await this.getPlaylist(playlistId);
    if (!playlist) {
      throw new Error('Playlist not found');
    }

    // Check permissions
    if (!playlist.isCollaborative && playlist.owner.id !== userId) {
      throw new Error('Insufficient permissions to reorder tracks');
    }

    if (fromIndex < 0 || fromIndex >= playlist.tracks.length || toIndex < 0 || toIndex >= playlist.tracks.length) {
      throw new Error('Invalid track indices');
    }

    // Reorder tracks
    const [movedTrack] = playlist.tracks.splice(fromIndex, 1);
    playlist.tracks.splice(toIndex, 0, movedTrack);

    // Update positions
    playlist.tracks.forEach((track, index) => {
      track.position = index;
    });

    playlist.updatedAt = new Date();

    await this.savePlaylist(playlist);
    this.cache.set(`playlist_${playlistId}`, playlist);

    return playlist;
  }

  /**
   * Search playlists
   */
  async searchPlaylists(query: string, userId?: string, limit: number = 20): Promise<Playlist[]> {
    const results: Playlist[] = [];
    const searchTerm = query.toLowerCase();

    // Search local playlists
    if (fs.existsSync(this.playlistsPath)) {
      const playlistFiles = fs.readdirSync(this.playlistsPath);
      
      for (const file of playlistFiles) {
        if (results.length >= limit) break;
        if (!file.endsWith('.json')) continue;

        try {
          const playlistId = path.basename(file, '.json');
          const playlist = await this.getPlaylist(playlistId);
          
          if (playlist && (
            playlist.name.toLowerCase().includes(searchTerm) ||
            playlist.description.toLowerCase().includes(searchTerm) ||
            playlist.owner.name.toLowerCase().includes(searchTerm)
          )) {
            // Only include public playlists or user's own playlists
            if (playlist.isPublic || playlist.owner.id === userId) {
              results.push(playlist);
            }
          }
        } catch (error) {
          console.error('Error searching playlist:', error);
        }
      }
    }

    return results.sort((a, b) => b.followers - a.followers);
  }

  /**
   * Get featured playlists
   */
  async getFeaturedPlaylists(limit: number = 20): Promise<Playlist[]> {
    // This would typically come from a curated list or external API
    // For now, we'll return the most popular public playlists
    const allPlaylists: Playlist[] = [];

    if (fs.existsSync(this.playlistsPath)) {
      const playlistFiles = fs.readdirSync(this.playlistsPath);
      
      for (const file of playlistFiles) {
        if (!file.endsWith('.json')) continue;

        try {
          const playlistId = path.basename(file, '.json');
          const playlist = await this.getPlaylist(playlistId);
          
          if (playlist && playlist.isPublic && playlist.tracks.length > 0) {
            allPlaylists.push(playlist);
          }
        } catch (error) {
          console.error('Error loading featured playlist:', error);
        }
      }
    }

    return allPlaylists
      .sort((a, b) => (b.followers * b.tracks.length) - (a.followers * a.tracks.length))
      .slice(0, limit);
  }

  // Private helper methods

  private async savePlaylist(playlist: Playlist): Promise<void> {
    const playlistPath = path.join(this.playlistsPath, `${playlist.id}.json`);
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
  }

  private async addPlaylistToUser(userId: string, playlistId: string): Promise<void> {
    const userPlaylistsFile = path.join(this.userPlaylistsPath, `${userId}.json`);
    let playlists: string[] = [];

    if (fs.existsSync(userPlaylistsFile)) {
      playlists = JSON.parse(fs.readFileSync(userPlaylistsFile, 'utf8'));
    }

    if (!playlists.includes(playlistId)) {
      playlists.push(playlistId);
      fs.writeFileSync(userPlaylistsFile, JSON.stringify(playlists, null, 2));
    }
  }

  private async removePlaylistFromUser(userId: string, playlistId: string): Promise<void> {
    const userPlaylistsFile = path.join(this.userPlaylistsPath, `${userId}.json`);
    
    if (fs.existsSync(userPlaylistsFile)) {
      let playlists: string[] = JSON.parse(fs.readFileSync(userPlaylistsFile, 'utf8'));
      playlists = playlists.filter(id => id !== playlistId);
      fs.writeFileSync(userPlaylistsFile, JSON.stringify(playlists, null, 2));
    }
  }

  // Spotify integration methods

  private async createSpotifyPlaylist(userId: string, playlistData: CreatePlaylistRequest, accessToken: string): Promise<any> {
    const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: playlistData.name,
        description: playlistData.description || '',
        public: playlistData.isPublic || false,
        collaborative: playlistData.isCollaborative || false
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create Spotify playlist: ${response.statusText}`);
    }

    return response.json();
  }

  private async getSpotifyPlaylists(userId: string, accessToken: string): Promise<any[]> {
    const response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=50`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get Spotify playlists: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  private async updateSpotifyPlaylist(playlistId: string, updates: UpdatePlaylistRequest, accessToken: string): Promise<void> {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: updates.name,
        description: updates.description,
        public: updates.isPublic,
        collaborative: updates.isCollaborative
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update Spotify playlist: ${response.statusText}`);
    }
  }

  private async deleteSpotifyPlaylist(playlistId: string, accessToken: string): Promise<void> {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/followers`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to unfollow Spotify playlist: ${response.statusText}`);
    }
  }

  private async addTrackToSpotifyPlaylist(playlistId: string, trackId: string, accessToken: string): Promise<void> {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: [`spotify:track:${trackId}`]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to add track to Spotify playlist: ${response.statusText}`);
    }
  }

  private async removeTrackFromSpotifyPlaylist(playlistId: string, trackId: string, accessToken: string): Promise<void> {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tracks: [{ uri: `spotify:track:${trackId}` }]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to remove track from Spotify playlist: ${response.statusText}`);
    }
  }
}

export default new PlaylistService();