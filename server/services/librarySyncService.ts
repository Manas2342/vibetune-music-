import SpotifyService from './spotifyService';
import { databaseService } from './databaseService';
import SpotifyWebApi from 'spotify-web-api-node';

interface SyncOptions {
  syncPlaylists?: boolean;
  syncSavedTracks?: boolean;
  syncSavedAlbums?: boolean;
  syncFollowedArtists?: boolean;
  batchSize?: number;
}

interface SyncProgress {
  stage: string;
  progress: number;
  total: number;
  message: string;
}

class LibrarySyncService {
  private syncProgressMap = new Map<string, SyncProgress>();

  constructor() {
    // SpotifyService is already instantiated as default export
  }

  // Get sync progress for a user
  getSyncProgress(userId: string): SyncProgress | null {
    return this.syncProgressMap.get(userId) || null;
  }

  // Main sync function
  async syncUserLibrary(
    userId: string, 
    accessToken: string, 
    options: SyncOptions = {}
  ): Promise<void> {
    const defaultOptions: SyncOptions = {
      syncPlaylists: true,
      syncSavedTracks: true,
      syncSavedAlbums: true,
      syncFollowedArtists: true,
      batchSize: 50,
      ...options
    };

    this.updateSyncProgress(userId, 'starting', 0, 100, 'Initializing synchronization...');

    try {
      const spotifyApi = new SpotifyWebApi();
      spotifyApi.setAccessToken(accessToken);

      // Get user profile first
      const userProfile = await spotifyApi.getMe();
      await this.syncUserProfile(userId, userProfile.body);

      let currentStep = 0;
      const totalSteps = 4;

      // Sync saved tracks
      if (defaultOptions.syncSavedTracks) {
        currentStep++;
        this.updateSyncProgress(
          userId, 
          'saved_tracks', 
          currentStep, 
          totalSteps, 
          'Syncing saved tracks...'
        );
        await this.syncSavedTracks(userId, spotifyApi, defaultOptions.batchSize!);
      }

      // Sync saved albums
      if (defaultOptions.syncSavedAlbums) {
        currentStep++;
        this.updateSyncProgress(
          userId, 
          'saved_albums', 
          currentStep, 
          totalSteps, 
          'Syncing saved albums...'
        );
        await this.syncSavedAlbums(userId, spotifyApi, defaultOptions.batchSize!);
      }

      // Sync playlists
      if (defaultOptions.syncPlaylists) {
        currentStep++;
        this.updateSyncProgress(
          userId, 
          'playlists', 
          currentStep, 
          totalSteps, 
          'Syncing playlists...'
        );
        await this.syncPlaylists(userId, spotifyApi, defaultOptions.batchSize!);
      }

      // Sync followed artists
      if (defaultOptions.syncFollowedArtists) {
        currentStep++;
        this.updateSyncProgress(
          userId, 
          'artists', 
          currentStep, 
          totalSteps, 
          'Syncing followed artists...'
        );
        await this.syncFollowedArtists(userId, spotifyApi, defaultOptions.batchSize!);
      }

      this.updateSyncProgress(
        userId, 
        'completed', 
        totalSteps, 
        totalSteps, 
        'Synchronization completed successfully!'
      );

      // Remove progress after completion
      setTimeout(() => {
        this.syncProgressMap.delete(userId);
      }, 10000); // Keep for 10 seconds

    } catch (error) {
      console.error('Library sync error:', error);
      this.updateSyncProgress(
        userId, 
        'error', 
        0, 
        100, 
        `Synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private updateSyncProgress(
    userId: string, 
    stage: string, 
    progress: number, 
    total: number, 
    message: string
  ): void {
    this.syncProgressMap.set(userId, {
      stage,
      progress,
      total,
      message
    });
  }

  private async syncUserProfile(userId: string, userProfile: any): Promise<void> {
    const userData = {
      id: userId,
      spotify_id: userProfile.id,
      display_name: userProfile.display_name,
      email: userProfile.email,
      country: userProfile.country,
      product: userProfile.product,
      images: userProfile.images,
      access_token: null, // Don't store tokens in database for security
      refresh_token: null,
      token_expires_at: null
    };

    await databaseService.createUser(userData);
  }

  private async syncSavedTracks(
    userId: string, 
    spotifyApi: SpotifyWebApi, 
    batchSize: number
  ): Promise<void> {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const savedTracks = await spotifyApi.getMySavedTracks({
          limit: batchSize,
          offset
        });

        if (savedTracks.body.items.length === 0) {
          hasMore = false;
          break;
        }

        const libraryItems = savedTracks.body.items.map(item => ({
          id: `track_${userId}_${item.track.id}`,
          spotifyId: item.track.id,
          name: item.track.name,
          type: 'track' as const,
          data: JSON.stringify({
            track: item.track,
            added_at: item.added_at
          }),
          syncedAt: new Date(),
          isOffline: false
        }));

        await databaseService.syncUserLibrary(userId, libraryItems);

        offset += batchSize;
        if (savedTracks.body.items.length < batchSize) {
          hasMore = false;
        }

        // Update progress
        this.updateSyncProgress(
          userId,
          'saved_tracks',
          offset,
          savedTracks.body.total,
          `Synced ${offset} of ${savedTracks.body.total} saved tracks`
        );

      } catch (error) {
        console.error('Error syncing saved tracks:', error);
        hasMore = false;
      }
    }
  }

  private async syncSavedAlbums(
    userId: string, 
    spotifyApi: SpotifyWebApi, 
    batchSize: number
  ): Promise<void> {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const savedAlbums = await spotifyApi.getMySavedAlbums({
          limit: batchSize,
          offset
        });

        if (savedAlbums.body.items.length === 0) {
          hasMore = false;
          break;
        }

        const libraryItems = savedAlbums.body.items.map(item => ({
          id: `album_${userId}_${item.album.id}`,
          spotifyId: item.album.id,
          name: item.album.name,
          type: 'album' as const,
          data: JSON.stringify({
            album: item.album,
            added_at: item.added_at
          }),
          syncedAt: new Date(),
          isOffline: false
        }));

        await databaseService.syncUserLibrary(userId, libraryItems);

        offset += batchSize;
        if (savedAlbums.body.items.length < batchSize) {
          hasMore = false;
        }

        this.updateSyncProgress(
          userId,
          'saved_albums',
          offset,
          savedAlbums.body.total,
          `Synced ${offset} of ${savedAlbums.body.total} saved albums`
        );

      } catch (error) {
        console.error('Error syncing saved albums:', error);
        hasMore = false;
      }
    }
  }

  private async syncPlaylists(
    userId: string, 
    spotifyApi: SpotifyWebApi, 
    batchSize: number
  ): Promise<void> {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const playlists = await spotifyApi.getUserPlaylists({
          limit: batchSize,
          offset
        });

        if (playlists.body.items.length === 0) {
          hasMore = false;
          break;
        }

        // Get detailed playlist data including tracks
        const playlistDetails = await Promise.all(
          playlists.body.items.map(async (playlist) => {
            try {
              const fullPlaylist = await spotifyApi.getPlaylist(playlist.id);
              return fullPlaylist.body;
            } catch (error) {
              console.error(`Error getting playlist ${playlist.id}:`, error);
              return playlist;
            }
          })
        );

        const libraryItems = playlistDetails.map(playlist => ({
          id: `playlist_${userId}_${playlist.id}`,
          spotifyId: playlist.id,
          name: playlist.name,
          type: 'playlist' as const,
          data: JSON.stringify(playlist),
          syncedAt: new Date(),
          isOffline: false
        }));

        await databaseService.syncUserLibrary(userId, libraryItems);

        offset += batchSize;
        if (playlists.body.items.length < batchSize) {
          hasMore = false;
        }

        this.updateSyncProgress(
          userId,
          'playlists',
          offset,
          playlists.body.total,
          `Synced ${offset} of ${playlists.body.total} playlists`
        );

      } catch (error) {
        console.error('Error syncing playlists:', error);
        hasMore = false;
      }
    }
  }

  private async syncFollowedArtists(
    userId: string, 
    spotifyApi: SpotifyWebApi, 
    batchSize: number
  ): Promise<void> {
    try {
      let after: string | undefined;
      let hasMore = true;
      let totalArtists = 0;

      while (hasMore) {
        const followedArtists = await spotifyApi.getFollowedArtists({
          limit: batchSize,
          after
        });

        if (followedArtists.body.artists.items.length === 0) {
          hasMore = false;
          break;
        }

        const libraryItems = followedArtists.body.artists.items.map(artist => ({
          id: `artist_${userId}_${artist.id}`,
          spotifyId: artist.id,
          name: artist.name,
          type: 'artist' as const,
          data: JSON.stringify(artist),
          syncedAt: new Date(),
          isOffline: false
        }));

        await databaseService.syncUserLibrary(userId, libraryItems);

        totalArtists += followedArtists.body.artists.items.length;
        
        if (followedArtists.body.artists.cursors?.after) {
          after = followedArtists.body.artists.cursors.after;
        } else {
          hasMore = false;
        }

        this.updateSyncProgress(
          userId,
          'artists',
          totalArtists,
          followedArtists.body.artists.total || totalArtists,
          `Synced ${totalArtists} followed artists`
        );
      }

    } catch (error) {
      console.error('Error syncing followed artists:', error);
    }
  }

  // Get synchronized library items
  async getUserLibrary(userId: string, type?: string): Promise<any[]> {
    const libraryItems = await databaseService.getUserLibrary(userId, type);
    return libraryItems.map(item => ({
      ...item,
      data: JSON.parse(item.data)
    }));
  }

  // Get library statistics
  async getLibraryStats(userId: string): Promise<any> {
    return await databaseService.getLibraryStats(userId);
  }

  // Force resync specific items
  async resyncPlaylist(userId: string, playlistId: string, accessToken: string): Promise<void> {
    const spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(accessToken);

    try {
      const playlist = await spotifyApi.getPlaylist(playlistId);
      
      const libraryItem = {
        id: `playlist_${userId}_${playlist.body.id}`,
        spotifyId: playlist.body.id,
        name: playlist.body.name,
        type: 'playlist' as const,
        data: JSON.stringify(playlist.body),
        syncedAt: new Date(),
        isOffline: false
      };

      await databaseService.addLibraryItem(userId, libraryItem);
    } catch (error) {
      console.error('Error resyncing playlist:', error);
      throw error;
    }
  }

  // Clear user library
  async clearUserLibrary(userId: string): Promise<void> {
    // Note: This would require a method in databaseService to clear library
    console.log(`Clearing library for user ${userId}`);
  }
}

export const librarySyncService = new LibrarySyncService();
export default librarySyncService;