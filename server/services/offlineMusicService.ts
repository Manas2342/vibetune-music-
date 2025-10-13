import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { databaseService } from './databaseService';

const execAsync = promisify(exec);

interface DownloadOptions {
  quality: 'high' | 'medium' | 'low';
  format: 'mp3' | 'webm' | 'm4a';
}

interface DownloadProgress {
  trackId: string;
  progress: number;
  status: 'downloading' | 'converting' | 'completed' | 'error';
  message: string;
}

interface OfflineTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  filePath: string;
  fileSize: number;
  downloadDate: Date;
  quality: string;
}

class OfflineMusicService {
  private downloadDir: string;
  private activeDownloads: Map<string, DownloadProgress> = new Map();

  constructor() {
    this.downloadDir = process.env.OFFLINE_MUSIC_DIR || './offline-music';
    this.ensureDownloadDir();
  }

  private ensureDownloadDir(): void {
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
  }

  /**
   * Download track for offline listening
   * Note: This is a simplified version that works with direct audio URLs
   */
  async downloadTrack(
    userId: string,
    trackId: string,
    title: string,
    artist: string,
    audioUrl: string,
    options: DownloadOptions = { quality: 'high', format: 'mp3' }
  ): Promise<OfflineTrack> {
    try {
      // Check if track is already downloaded
      const existingTrack = await this.getOfflineTrack(userId, trackId);
      if (existingTrack) {
        return existingTrack;
      }

      // Start download progress
      this.activeDownloads.set(trackId, {
        trackId,
        progress: 0,
        status: 'downloading',
        message: 'Starting download...',
      });

      // Create user-specific directory
      const userDir = path.join(this.downloadDir, userId);
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      const fileName = `${trackId}.${options.format}`;
      const filePath = path.join(userDir, fileName);

      // Download the audio file
      await this.downloadAudioFile(audioUrl, filePath, trackId);

      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSizeBytes = stats.size;

      // Update progress
      this.activeDownloads.set(trackId, {
        trackId,
        progress: 100,
        status: 'completed',
        message: 'Download completed',
      });

      // Save to database
      await this.updateOfflineStatus(userId, trackId, filePath, fileSizeBytes);

      const offlineTrack: OfflineTrack = {
        id: trackId,
        title,
        artist,
        duration: 0, // Would need to extract from audio file
        filePath,
        fileSize: fileSizeBytes,
        downloadDate: new Date(),
        quality: options.quality,
      };

      // Clean up progress tracking
      this.activeDownloads.delete(trackId);

      return offlineTrack;
    } catch (error) {
      console.error('Error downloading track:', error);
      this.activeDownloads.set(trackId, {
        trackId,
        progress: 0,
        status: 'error',
        message: `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    }
  }

  /**
   * Download audio file from URL
   */
  private async downloadAudioFile(url: string, filePath: string, trackId: string): Promise<void> {
    try {
      // Use curl or wget to download the file
      const command = `curl -L -o "${filePath}" "${url}"`;
      
      await new Promise<void>((resolve, reject) => {
        const process = exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });

        // Update progress (simplified)
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 10;
          if (progress < 90) {
            this.activeDownloads.set(trackId, {
              trackId,
              progress,
              status: 'downloading',
              message: `Downloading... ${progress}%`,
            });
          }
        }, 1000);

        process.on('close', () => {
          clearInterval(progressInterval);
          this.activeDownloads.set(trackId, {
            trackId,
            progress: 90,
            status: 'converting',
            message: 'Processing audio...',
          });
        });
      });
    } catch (error) {
      console.error('Error downloading audio file:', error);
      throw error;
    }
  }

  /**
   * Get offline track by ID
   */
  async getOfflineTrack(userId: string, trackId: string): Promise<OfflineTrack | null> {
    try {
      const result = await databaseService.query(
        'SELECT * FROM offline_tracks WHERE user_id = ? AND track_id = ?',
        [userId, trackId]
      );

      if (result.length === 0) {
        return null;
      }

      const track = result[0];
      return {
        id: track.track_id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        filePath: track.file_path,
        fileSize: track.file_size,
        downloadDate: new Date(track.download_date),
        quality: track.quality,
      };
    } catch (error) {
      console.error('Error getting offline track:', error);
      return null;
    }
  }

  /**
   * Get all offline tracks for a user
   */
  async getOfflineTracks(userId: string): Promise<OfflineTrack[]> {
    try {
      const result = await databaseService.query(
        'SELECT * FROM offline_tracks WHERE user_id = ? ORDER BY download_date DESC',
        [userId]
      );

      return result.map((track: any) => ({
        id: track.track_id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        filePath: track.file_path,
        fileSize: track.file_size,
        downloadDate: new Date(track.download_date),
        quality: track.quality,
      }));
    } catch (error) {
      console.error('Error getting offline tracks:', error);
      return [];
    }
  }

  /**
   * Delete offline track
   */
  async deleteOfflineTrack(userId: string, trackId: string): Promise<boolean> {
    try {
      // Get track info first
      const track = await this.getOfflineTrack(userId, trackId);
      if (!track) {
        return false;
      }

      // Delete file
      if (fs.existsSync(track.filePath)) {
        fs.unlinkSync(track.filePath);
      }

      // Delete from database
      await databaseService.query(
        'DELETE FROM offline_tracks WHERE user_id = ? AND track_id = ?',
        [userId, trackId]
      );

      return true;
    } catch (error) {
      console.error('Error deleting offline track:', error);
      return false;
    }
  }

  /**
   * Get download progress
   */
  getDownloadProgress(trackId: string): DownloadProgress | null {
    return this.activeDownloads.get(trackId) || null;
  }

  /**
   * Update offline status in database
   */
  private async updateOfflineStatus(
    userId: string,
    trackId: string,
    filePath: string,
    fileSizeBytes: number
  ): Promise<void> {
    try {
      await databaseService.query(
        `INSERT OR REPLACE INTO offline_tracks 
         (user_id, track_id, title, artist, album, duration, file_path, file_size, download_date, quality)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          trackId,
          'Downloaded Track', // Would be passed as parameter
          'Unknown Artist',   // Would be passed as parameter
          null,
          0, // Duration would be extracted from audio file
          filePath,
          fileSizeBytes,
          new Date().toISOString(),
          'high',
        ]
      );
    } catch (error) {
      console.error('Error updating offline status:', error);
      throw error;
    }
  }

  /**
   * Get offline storage usage
   */
  async getStorageUsage(userId: string): Promise<{ totalSize: number; trackCount: number }> {
    try {
      const result = await databaseService.query(
        'SELECT SUM(file_size) as total_size, COUNT(*) as track_count FROM offline_tracks WHERE user_id = ?',
        [userId]
      );

      return {
        totalSize: result[0]?.total_size || 0,
        trackCount: result[0]?.track_count || 0,
      };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return { totalSize: 0, trackCount: 0 };
    }
  }

  /**
   * Clean up old downloads
   */
  async cleanupOldDownloads(userId: string, maxAgeDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

      const result = await databaseService.query(
        'SELECT * FROM offline_tracks WHERE user_id = ? AND download_date < ?',
        [userId, cutoffDate.toISOString()]
      );

      let deletedCount = 0;
      for (const track of result) {
        if (fs.existsSync(track.file_path)) {
          fs.unlinkSync(track.file_path);
        }
        await databaseService.query(
          'DELETE FROM offline_tracks WHERE user_id = ? AND track_id = ?',
          [userId, track.track_id]
        );
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old downloads:', error);
      return 0;
    }
  }
}

const offlineMusicService = new OfflineMusicService();
export { offlineMusicService };
export default offlineMusicService;