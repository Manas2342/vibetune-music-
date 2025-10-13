import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import NodeCache from 'node-cache';
import sharp from 'sharp';

interface StoredTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  audioUrl: string;
  imageUrl: string;
  quality: string;
  format: string;
  size: number;
  createdAt: Date;
  lastAccessed: Date;
}

interface StorageStats {
  totalTracks: number;
  totalSize: number;
  availableSpace: number;
  cacheHitRate: number;
}

class CloudStorageService {
  private s3: S3Client | null = null;
  private cache: NodeCache;
  private readonly localStoragePath = path.join(process.cwd(), 'storage');
  private readonly maxLocalStorageGB: number;
  private readonly bucket: string;

  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
    this.maxLocalStorageGB = parseInt(process.env.MAX_CACHE_SIZE_GB || '10');
    this.bucket = process.env.S3_BUCKET || 'vibetune-music-cache';

    // Initialize AWS S3 if credentials are provided
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3 = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    }

    // Ensure local storage directories exist
    this.initializeLocalStorage();
  }

  private initializeLocalStorage() {
    const dirs = [
      this.localStoragePath,
      path.join(this.localStoragePath, 'audio'),
      path.join(this.localStoragePath, 'images'),
      path.join(this.localStoragePath, 'metadata')
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Store music track with audio and metadata
   */
  async storeTrack(
    trackId: string,
    audioBuffer: Buffer,
    metadata: {
      title: string;
      artist: string;
      album: string;
      duration: number;
      imageUrl?: string;
      quality: string;
      format: string;
    }
  ): Promise<StoredTrack> {
    const trackData: StoredTrack = {
      id: trackId,
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      duration: metadata.duration,
      audioUrl: '',
      imageUrl: metadata.imageUrl || '',
      quality: metadata.quality,
      format: metadata.format,
      size: audioBuffer.length,
      createdAt: new Date(),
      lastAccessed: new Date()
    };

    try {
      // Store audio file
      const audioUrl = await this.storeAudioFile(trackId, audioBuffer, metadata.format);
      trackData.audioUrl = audioUrl;

      // Store album art if provided
      if (metadata.imageUrl) {
        const imageUrl = await this.storeImage(trackId, metadata.imageUrl);
        trackData.imageUrl = imageUrl;
      }

      // Store metadata
      await this.storeMetadata(trackId, trackData);

      // Cache the track data
      this.cache.set(`track_${trackId}`, trackData);

      console.log(`✅ Stored track: ${metadata.title} by ${metadata.artist}`);
      return trackData;
    } catch (error) {
      console.error('Error storing track:', error);
      throw error;
    }
  }

  /**
   * Retrieve track data
   */
  async getTrack(trackId: string): Promise<StoredTrack | null> {
    // Check cache first
    const cached = this.cache.get<StoredTrack>(`track_${trackId}`);
    if (cached) {
      cached.lastAccessed = new Date();
      return cached;
    }

    try {
      // Try to load from local metadata
      const metadataPath = path.join(this.localStoragePath, 'metadata', `${trackId}.json`);
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        metadata.lastAccessed = new Date();
        
        // Update last accessed time
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        
        // Cache and return
        this.cache.set(`track_${trackId}`, metadata);
        return metadata;
      }

      // Try to load from S3 if available
      if (this.s3) {
        try {
          const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: `metadata/${trackId}.json`
          });
          const s3Object = await this.s3.send(command);

          if (s3Object.Body) {
            const bodyString = await s3Object.Body.transformToString();
            const metadata = JSON.parse(bodyString);
            metadata.lastAccessed = new Date();
            
            // Cache locally
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
            this.cache.set(`track_${trackId}`, metadata);
            
            return metadata;
          }
        } catch (s3Error) {
          console.log('Track not found in S3:', trackId);
        }
      }

      return null;
    } catch (error) {
      console.error('Error retrieving track:', error);
      return null;
    }
  }

  /**
   * Store audio file locally and optionally in S3
   */
  private async storeAudioFile(trackId: string, audioBuffer: Buffer, format: string): Promise<string> {
    const filename = `${trackId}.${format}`;
    const localPath = path.join(this.localStoragePath, 'audio', filename);
    
    // Store locally
    fs.writeFileSync(localPath, audioBuffer);

    // Store in S3 if available
    if (this.s3) {
      try {
        const s3Key = `audio/${filename}`;
        const upload = new Upload({
          client: this.s3,
          params: {
            Bucket: this.bucket,
            Key: s3Key,
            Body: audioBuffer,
            ContentType: this.getAudioContentType(format),
            Metadata: {
              trackId,
              format,
              size: audioBuffer.length.toString()
            }
          }
        });
        
        await upload.done();

        return `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
      } catch (error) {
        console.error('Failed to upload to S3:', error);
      }
    }

    return `file://${localPath}`;
  }

  /**
   * Store image (album art) with optimization
   */
  private async storeImage(trackId: string, imageUrl: string): Promise<string> {
    try {
      // Download image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());
      
      // Optimize image with Sharp
      const optimizedBuffer = await sharp(imageBuffer)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toBuffer();

      const filename = `${trackId}_cover.jpg`;
      const localPath = path.join(this.localStoragePath, 'images', filename);
      
      // Store locally
      fs.writeFileSync(localPath, optimizedBuffer);

      // Store in S3 if available
      if (this.s3) {
        try {
          const s3Key = `images/${filename}`;
          const upload = new Upload({
            client: this.s3,
            params: {
              Bucket: this.bucket,
              Key: s3Key,
              Body: optimizedBuffer,
              ContentType: 'image/jpeg',
              Metadata: {
                trackId,
                originalUrl: imageUrl
              }
            }
          });
          
          await upload.done();

          return `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
        } catch (error) {
          console.error('Failed to upload image to S3:', error);
        }
      }

      return `file://${localPath}`;
    } catch (error) {
      console.error('Error storing image:', error);
      return imageUrl; // Return original URL as fallback
    }
  }

  /**
   * Store metadata locally and in S3
   */
  private async storeMetadata(trackId: string, metadata: StoredTrack): Promise<void> {
    const filename = `${trackId}.json`;
    const localPath = path.join(this.localStoragePath, 'metadata', filename);
    
    // Store locally
    fs.writeFileSync(localPath, JSON.stringify(metadata, null, 2));

    // Store in S3 if available
    if (this.s3) {
      try {
        const s3Key = `metadata/${filename}`;
        const upload = new Upload({
          client: this.s3,
          params: {
            Bucket: this.bucket,
            Key: s3Key,
            Body: JSON.stringify(metadata, null, 2),
            ContentType: 'application/json',
            Metadata: {
              trackId,
              title: metadata.title,
              artist: metadata.artist
            }
          }
        });
        
        await upload.done();
      } catch (error) {
        console.error('Failed to upload metadata to S3:', error);
      }
    }
  }

  /**
   * Get audio stream URL
   */
  async getAudioStreamUrl(trackId: string): Promise<string | null> {
    const track = await this.getTrack(trackId);
    if (!track) {
      return null;
    }

    // Update last accessed time
    track.lastAccessed = new Date();
    this.cache.set(`track_${trackId}`, track);

    return track.audioUrl;
  }

  /**
   * Check if track exists in storage
   */
  async hasTrack(trackId: string): Promise<boolean> {
    // Check cache first
    if (this.cache.has(`track_${trackId}`)) {
      return true;
    }

    // Check local metadata
    const localPath = path.join(this.localStoragePath, 'metadata', `${trackId}.json`);
    if (fs.existsSync(localPath)) {
      return true;
    }

    // Check S3 if available
    if (this.s3) {
      try {
        const command = new HeadObjectCommand({
          Bucket: this.bucket,
          Key: `metadata/${trackId}.json`
        });
        await this.s3.send(command);
        return true;
      } catch (error) {
        return false;
      }
    }

    return false;
  }

  /**
   * Delete track from storage
   */
  async deleteTrack(trackId: string): Promise<void> {
    // Remove from cache
    this.cache.del(`track_${trackId}`);

    // Delete local files
    const files = [
      path.join(this.localStoragePath, 'metadata', `${trackId}.json`),
      path.join(this.localStoragePath, 'audio', `${trackId}.mp3`),
      path.join(this.localStoragePath, 'audio', `${trackId}.mp4`),
      path.join(this.localStoragePath, 'audio', `${trackId}.webm`),
      path.join(this.localStoragePath, 'images', `${trackId}_cover.jpg`)
    ];

    for (const file of files) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }

    // Delete from S3 if available
    if (this.s3) {
      const s3Keys = [
        `metadata/${trackId}.json`,
        `audio/${trackId}.mp3`,
        `audio/${trackId}.mp4`,
        `audio/${trackId}.webm`,
        `images/${trackId}_cover.jpg`
      ];

      for (const key of s3Keys) {
        try {
          const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key
          });
          await this.s3.send(command);
        } catch (error) {
          // Ignore errors for non-existent objects
        }
      }
    }

    console.log(`🗑️ Deleted track: ${trackId}`);
  }

  /**
   * Clean up old tracks based on last accessed time
   */
  async cleanupOldTracks(maxAgeHours: number = 168): Promise<void> { // Default 1 week
    try {
      const metadataDir = path.join(this.localStoragePath, 'metadata');
      const files = fs.readdirSync(metadataDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(metadataDir, file);
        const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const lastAccessed = new Date(metadata.lastAccessed).getTime();

        if (now - lastAccessed > maxAge) {
          const trackId = metadata.id;
          await this.deleteTrack(trackId);
          console.log(`🧹 Cleaned up old track: ${metadata.title}`);
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const metadataDir = path.join(this.localStoragePath, 'metadata');
      const files = fs.readdirSync(metadataDir);
      
      let totalTracks = 0;
      let totalSize = 0;
      let cacheHits = 0;

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(metadataDir, file);
        const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        totalTracks++;
        totalSize += metadata.size || 0;
        
        if (this.cache.has(`track_${metadata.id}`)) {
          cacheHits++;
        }
      }

      const maxStorageBytes = this.maxLocalStorageGB * 1024 * 1024 * 1024;
      const availableSpace = maxStorageBytes - totalSize;
      const cacheHitRate = totalTracks > 0 ? (cacheHits / totalTracks) * 100 : 0;

      return {
        totalTracks,
        totalSize,
        availableSpace,
        cacheHitRate
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalTracks: 0,
        totalSize: 0,
        availableSpace: 0,
        cacheHitRate: 0
      };
    }
  }

  /**
   * Search stored tracks
   */
  async searchTracks(query: string, limit: number = 20): Promise<StoredTrack[]> {
    try {
      const metadataDir = path.join(this.localStoragePath, 'metadata');
      const files = fs.readdirSync(metadataDir);
      const results: StoredTrack[] = [];
      const searchTerm = query.toLowerCase();

      for (const file of files) {
        if (!file.endsWith('.json') || results.length >= limit) continue;

        const filePath = path.join(metadataDir, file);
        const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (
          metadata.title.toLowerCase().includes(searchTerm) ||
          metadata.artist.toLowerCase().includes(searchTerm) ||
          metadata.album.toLowerCase().includes(searchTerm)
        ) {
          results.push(metadata);
        }
      }

      return results.sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime());
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  }

  private getAudioContentType(format: string): string {
    switch (format.toLowerCase()) {
      case 'mp3':
        return 'audio/mpeg';
      case 'mp4':
      case 'm4a':
        return 'audio/mp4';
      case 'webm':
        return 'audio/webm';
      default:
        return 'audio/mpeg';
    }
  }

  /**
   * Sync local storage with cloud storage
   */
  async syncWithCloud(): Promise<void> {
    if (!this.s3) {
      console.log('S3 not configured, skipping cloud sync');
      return;
    }

    try {
      // List all objects in S3
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: 'metadata/'
      });
      const s3Objects = await this.s3.send(command);

      if (!s3Objects.Contents) return;

      for (const object of s3Objects.Contents) {
        if (!object.Key?.endsWith('.json')) continue;

        const trackId = path.basename(object.Key, '.json');
        const localPath = path.join(this.localStoragePath, 'metadata', `${trackId}.json`);

        // Download if not exists locally or S3 version is newer
        if (!fs.existsSync(localPath) || (object.LastModified && object.LastModified > fs.statSync(localPath).mtime)) {
          console.log(`📥 Downloading metadata for track: ${trackId}`);
          
          const getCommand = new GetObjectCommand({
            Bucket: this.bucket,
            Key: object.Key
          });
          const s3Object = await this.s3.send(getCommand);

          if (s3Object.Body) {
            const bodyString = await s3Object.Body.transformToString();
            fs.writeFileSync(localPath, bodyString);
          }
        }
      }

      console.log('✅ Cloud sync completed');
    } catch (error) {
      console.error('Error syncing with cloud:', error);
    }
  }
}

export default new CloudStorageService();
export { CloudStorageService };
export type { StoredTrack, StorageStats };
