import Database from 'sqlite3';
import { SpotifyTrack, SpotifyPlaylist, SpotifyAlbum } from './spotifyService';

interface UserLibrary {
  id: string;
  userId: string;
  spotifyId: string;
  name: string;
  type: 'track' | 'album' | 'playlist';
  data: string; // JSON stringified track/album/playlist data
  syncedAt: Date;
  isOffline: boolean;
  downloadPath?: string;
}

interface LibraryStats {
  totalTracks: number;
  totalPlaylists: number;
  totalAlbums: number;
  offlineTracks: number;
  lastSyncAt?: Date;
}

class DatabaseService {
  private db: Database.Database;

  constructor() {
    this.db = new Database.Database('./vibetune.db');
    this.initializeTables();
  }

  private initializeTables(): void {
    // Create users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        spotify_id TEXT UNIQUE,
        display_name TEXT,
        email TEXT,
        country TEXT,
        product TEXT,
        image_url TEXT,
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user library table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_library (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        spotify_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('track', 'album', 'playlist')),
        data TEXT NOT NULL,
        synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_offline BOOLEAN DEFAULT 0,
        download_path TEXT,
        file_size INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, spotify_id, type)
      )
    `);

    // Create listening analytics table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS listening_analytics (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        track_id TEXT NOT NULL,
        track_name TEXT NOT NULL,
        artist_name TEXT NOT NULL,
        album_name TEXT,
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        duration_ms INTEGER,
        skip_after_ms INTEGER,
        completed BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create social features tables
    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_follows (
        id TEXT PRIMARY KEY,
        follower_id TEXT NOT NULL,
        following_id TEXT NOT NULL,
        followed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(follower_id, following_id)
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS activity_feed (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        activity_type TEXT NOT NULL CHECK (activity_type IN ('play', 'like', 'playlist_create', 'share')),
        track_id TEXT,
        playlist_id TEXT,
        activity_data TEXT, -- JSON data for the activity
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables initialized successfully');
  }

  // User management
  async createUser(userData: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO users (
          id, spotify_id, display_name, email, country, product, image_url,
          access_token, refresh_token, token_expires_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run([
        userData.id,
        userData.spotify_id || userData.id,
        userData.display_name,
        userData.email,
        userData.country,
        userData.product,
        userData.images?.[0]?.url,
        userData.access_token,
        userData.refresh_token,
        userData.token_expires_at
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });

      stmt.finalize();
    });
  }

  async getUser(userId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  // Library synchronization
  async syncUserLibrary(userId: string, libraryItems: UserLibrary[]): Promise<void> {
    const promises = libraryItems.map(item => this.addLibraryItem(userId, item));
    await Promise.all(promises);
  }

  async addLibraryItem(userId: string, item: Omit<UserLibrary, 'userId'>): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO user_library (
          id, user_id, spotify_id, name, type, data, is_offline, download_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        item.id,
        userId,
        item.spotifyId,
        item.name,
        item.type,
        item.data,
        item.isOffline ? 1 : 0,
        item.downloadPath
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });

      stmt.finalize();
    });
  }

  async getUserLibrary(userId: string, type?: string): Promise<UserLibrary[]> {
    return new Promise((resolve, reject) => {
      const query = type 
        ? 'SELECT * FROM user_library WHERE user_id = ? AND type = ? ORDER BY synced_at DESC'
        : 'SELECT * FROM user_library WHERE user_id = ? ORDER BY synced_at DESC';
      
      const params = type ? [userId, type] : [userId];

      this.db.all(query, params, (err, rows: any[]) => {
        if (err) reject(err);
        else {
          const libraryItems = rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            spotifyId: row.spotify_id,
            name: row.name,
            type: row.type,
            data: row.data,
            syncedAt: new Date(row.synced_at),
            isOffline: Boolean(row.is_offline),
            downloadPath: row.download_path
          }));
          resolve(libraryItems);
        }
      });
    });
  }

  async getLibraryStats(userId: string): Promise<LibraryStats> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          type,
          COUNT(*) as count,
          SUM(CASE WHEN is_offline = 1 THEN 1 ELSE 0 END) as offline_count,
          MAX(synced_at) as last_sync
        FROM user_library 
        WHERE user_id = ? 
        GROUP BY type
      `, [userId], (err, rows: any[]) => {
        if (err) reject(err);
        else {
          const stats: LibraryStats = {
            totalTracks: 0,
            totalPlaylists: 0,
            totalAlbums: 0,
            offlineTracks: 0
          };

          rows.forEach(row => {
            switch (row.type) {
              case 'track':
                stats.totalTracks = row.count;
                stats.offlineTracks += row.offline_count;
                break;
              case 'playlist':
                stats.totalPlaylists = row.count;
                break;
              case 'album':
                stats.totalAlbums = row.count;
                break;
            }
            
            if (row.last_sync && (!stats.lastSyncAt || new Date(row.last_sync) > stats.lastSyncAt)) {
              stats.lastSyncAt = new Date(row.last_sync);
            }
          });

          resolve(stats);
        }
      });
    });
  }

  // Analytics
  async recordPlayback(userId: string, trackData: any, durationMs?: number, completed?: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO listening_analytics (
          id, user_id, track_id, track_name, artist_name, album_name, 
          duration_ms, completed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const analyticsId = `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      stmt.run([
        analyticsId,
        userId,
        trackData.id,
        trackData.name,
        trackData.artists?.[0]?.name || 'Unknown Artist',
        trackData.album?.name,
        durationMs || trackData.duration_ms,
        completed ? 1 : 0
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });

      stmt.finalize();
    });
  }

  async getListeningStats(userId: string, timeframe: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    return new Promise((resolve, reject) => {
      let dateCondition = '';
      switch (timeframe) {
        case 'week':
          dateCondition = "AND played_at >= datetime('now', '-7 days')";
          break;
        case 'month':
          dateCondition = "AND played_at >= datetime('now', '-30 days')";
          break;
        case 'year':
          dateCondition = "AND played_at >= datetime('now', '-365 days')";
          break;
      }

      this.db.all(`
        SELECT 
          track_name,
          artist_name,
          album_name,
          COUNT(*) as play_count,
          SUM(duration_ms) as total_duration,
          AVG(CASE WHEN skip_after_ms > 0 THEN skip_after_ms ELSE duration_ms END) as avg_listen_duration
        FROM listening_analytics 
        WHERE user_id = ? ${dateCondition}
        GROUP BY track_id, track_name, artist_name
        ORDER BY play_count DESC, total_duration DESC
        LIMIT 50
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Social features
  async followUser(followerId: string, followingId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const followId = `follow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO user_follows (id, follower_id, following_id) 
        VALUES (?, ?, ?)
      `);

      stmt.run([followId, followerId, followingId], function(err) {
        if (err) reject(err);
        else resolve();
      });

      stmt.finalize();
    });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?',
        [followerId, followingId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getUserFollowing(userId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT u.*, uf.followed_at
        FROM user_follows uf
        JOIN users u ON u.id = uf.following_id
        WHERE uf.follower_id = ?
        ORDER BY uf.followed_at DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async getUserFollowers(userId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT u.*, uf.followed_at
        FROM user_follows uf
        JOIN users u ON u.id = uf.follower_id
        WHERE uf.following_id = ?
        ORDER BY uf.followed_at DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async recordActivity(userId: string, activityType: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const stmt = this.db.prepare(`
        INSERT INTO activity_feed (
          id, user_id, activity_type, track_id, playlist_id, activity_data
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        activityId,
        userId,
        activityType,
        data.trackId || null,
        data.playlistId || null,
        JSON.stringify(data)
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });

      stmt.finalize();
    });
  }

  async getActivityFeed(userId: string, limit: number = 50): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT af.*, u.display_name, u.image_url
        FROM activity_feed af
        JOIN users u ON u.id = af.user_id
        WHERE af.user_id IN (
          SELECT following_id FROM user_follows WHERE follower_id = ?
          UNION SELECT ?
        )
        ORDER BY af.created_at DESC
        LIMIT ?
      `, [userId, userId, limit], (err, rows) => {
        if (err) reject(err);
        else {
          const activities = (rows || []).map((row: any) => ({
            ...row,
            activity_data: JSON.parse(row.activity_data || '{}')
          }));
          resolve(activities);
        }
      });
    });
  }

  close(): void {
    this.db.close();
  }
}

export const databaseService = new DatabaseService();
export default databaseService;