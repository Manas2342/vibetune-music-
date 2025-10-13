import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import NodeCache from 'node-cache';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

interface StreamingOptions {
  quality?: 'highest' | 'high' | 'medium' | 'lowest';
  format?: 'mp3' | 'mp4' | 'webm';
  bitrate?: string;
}

interface AudioStream {
  url: string;
  type: 'direct' | 'cached';
  duration?: number;
  quality: string;
  metadata?: {
    title?: string;
    artist?: string;
    album?: string;
  };
}

class AudioStreamingService {
  private cache: NodeCache;
  private s3Client?: S3Client;
  private bucketName: string;
  private localCacheDir: string;
  private maxLocalStorageGB: number;

  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
    this.bucketName = process.env.AWS_S3_BUCKET || 'vibetune-audio-cache';
    this.localCacheDir = process.env.LOCAL_CACHE_DIR || './audio-cache';
    this.maxLocalStorageGB = parseInt(process.env.MAX_LOCAL_STORAGE_GB || '10');

    // Initialize S3 client if credentials are available
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    }

    // Ensure local cache directory exists
    if (!fs.existsSync(this.localCacheDir)) {
      fs.mkdirSync(this.localCacheDir, { recursive: true });
    }
  }

  /**
   * Get audio stream for a track
   * This service now focuses on serving cached audio and direct URLs
   */
  async getAudioStream(trackId: string, directUrl?: string, options: StreamingOptions = {}): Promise<AudioStream | null> {
    try {
      // Check cache first
      const cacheKey = `audio_${trackId}_${JSON.stringify(options)}`;
      const cached = this.cache.get<AudioStream>(cacheKey);
      if (cached) {
        return cached;
      }

      // Try to get from direct URL if provided
      if (directUrl && this.isValidAudioUrl(directUrl)) {
        const stream = await this.getDirectAudioStream(directUrl, options);
        if (stream) {
          this.cache.set(cacheKey, stream);
          return stream;
        }
      }

      // Try to find cached audio
      const cachedStream = await this.getCachedAudioStream(trackId, options);
      if (cachedStream) {
        this.cache.set(cacheKey, cachedStream);
        return cachedStream;
      }

      return null;
    } catch (error) {
      console.error('Error getting audio stream:', error);
      return null;
    }
  }

  /**
   * Get direct audio stream from URL
   */
  private async getDirectAudioStream(url: string, options: StreamingOptions): Promise<AudioStream | null> {
    try {
      return {
        url: url,
        type: 'direct',
        quality: options.quality || 'high',
        metadata: {
          title: 'Direct Audio Stream',
        },
      };
    } catch (error) {
      console.error('Error getting direct audio stream:', error);
      return null;
    }
  }

  /**
   * Get cached audio stream
   */
  private async getCachedAudioStream(trackId: string, options: StreamingOptions): Promise<AudioStream | null> {
    try {
      // Check local cache first
      const localPath = path.join(this.localCacheDir, `${trackId}.mp3`);
      if (fs.existsSync(localPath)) {
        const stats = fs.statSync(localPath);
        return {
          url: `/api/audio/cached/${trackId}`,
          type: 'cached',
          quality: options.quality || 'high',
          duration: this.getAudioDuration(localPath),
          metadata: {
            title: `Cached Track ${trackId}`,
          },
        };
      }

      // Check S3 cache if available
      if (this.s3Client) {
        const s3Key = `audio/${trackId}.mp3`;
        try {
          const command = new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: s3Key,
            MaxKeys: 1,
          });
          
          const response = await this.s3Client.send(command);
          if (response.Contents && response.Contents.length > 0) {
            return {
              url: `https://${this.bucketName}.s3.amazonaws.com/${s3Key}`,
              type: 'cached',
              quality: options.quality || 'high',
              metadata: {
                title: `S3 Cached Track ${trackId}`,
              },
            };
          }
        } catch (s3Error) {
          console.warn('S3 cache check failed:', s3Error);
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting cached audio stream:', error);
      return null;
    }
  }

  /**
   * Cache audio stream
   */
  async cacheAudioStream(trackId: string, audioData: Buffer, metadata?: any): Promise<void> {
    try {
      // Save to local cache
      const localPath = path.join(this.localCacheDir, `${trackId}.mp3`);
      fs.writeFileSync(localPath, audioData);

      // Save to S3 if available
      if (this.s3Client) {
        const s3Key = `audio/${trackId}.mp3`;
        const upload = new Upload({
          client: this.s3Client,
          params: {
            Bucket: this.bucketName,
            Key: s3Key,
            Body: audioData,
            ContentType: 'audio/mpeg',
            Metadata: metadata || {},
          },
        });

        await upload.done();
      }

      // Clean up old local files if storage is getting full
      await this.cleanupLocalCache();
    } catch (error) {
      console.error('Error caching audio stream:', error);
    }
  }

  /**
   * Get audio metadata
   */
  async getAudioMetadata(trackId: string): Promise<any> {
    try {
      const localPath = path.join(this.localCacheDir, `${trackId}.mp3`);
      if (fs.existsSync(localPath)) {
        const stats = fs.statSync(localPath);
        return {
          duration: this.getAudioDuration(localPath),
          size: stats.size,
          lastModified: stats.mtime,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting audio metadata:', error);
      return null;
    }
  }

  /**
   * Serve cached audio file
   */
  async serveCachedAudio(trackId: string, range?: string): Promise<{ stream: fs.ReadStream; headers: any; fileSize: number } | null> {
    try {
      const localPath = path.join(this.localCacheDir, `${trackId}.mp3`);
      
      if (!fs.existsSync(localPath)) {
        return null;
      }

      const stats = fs.statSync(localPath);
      const fileSize = stats.size;

      let start = 0;
      let end = fileSize - 1;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        start = parseInt(parts[0], 10);
        end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      }

      const chunkSize = (end - start) + 1;
      const stream = fs.createReadStream(localPath, { start, end });

      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'audio/mpeg',
      };

      return { stream, headers, fileSize };
    } catch (error) {
      console.error('Error serving cached audio:', error);
      return null;
    }
  }

  /**
   * Get audio duration using ffprobe
   */
  private getAudioDuration(filePath: string): number | undefined {
    try {
      // This would require ffprobe to be installed
      // For now, return undefined
      return undefined;
    } catch (error) {
      console.error('Error getting audio duration:', error);
      return undefined;
    }
  }

  /**
   * Check if URL is a valid audio URL
   */
  private isValidAudioUrl(url: string): boolean {
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
    const urlLower = url.toLowerCase();
    return audioExtensions.some(ext => urlLower.includes(ext)) || 
           urlLower.includes('audio') || 
           urlLower.includes('stream');
  }

  /**
   * Clean up old local cache files
   */
  private async cleanupLocalCache(): Promise<void> {
    try {
      const files = fs.readdirSync(this.localCacheDir);
      const fileStats = files.map(file => {
        const filePath = path.join(this.localCacheDir, file);
        const stats = fs.statSync(filePath);
        return { file, path: filePath, size: stats.size, mtime: stats.mtime };
      });

      // Sort by modification time (oldest first)
      fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

      // Calculate total size
      const totalSize = fileStats.reduce((sum, file) => sum + file.size, 0);
      const maxStorageBytes = this.maxLocalStorageGB * 1024 * 1024 * 1024;
      const availableSpace = maxStorageBytes - totalSize;

      // If we're using more than 80% of available space, clean up oldest files
      if (totalSize > maxStorageBytes * 0.8) {
        const filesToDelete = fileStats.slice(0, Math.floor(fileStats.length * 0.2));
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(file.path);
            console.log(`Cleaned up old cache file: ${file.file}`);
          } catch (error) {
            console.error(`Error deleting cache file ${file.file}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error cleaning up local cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    try {
      const files = fs.readdirSync(this.localCacheDir);
      const totalSize = files.reduce((sum, file) => {
        const filePath = path.join(this.localCacheDir, file);
        const stats = fs.statSync(filePath);
        return sum + stats.size;
      }, 0);

      return {
        localFiles: files.length,
        totalSizeBytes: totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        maxStorageGB: this.maxLocalStorageGB,
        s3Enabled: !!this.s3Client,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }
}

export default new AudioStreamingService();