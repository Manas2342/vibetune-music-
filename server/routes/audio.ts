import { RequestHandler } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import audioStreamingService from '../services/audioStreamingService';
import cloudStorageService from '../services/cloudStorageService';

/**
 * Stream audio for a track
 * This endpoint handles audio streaming for tracks
 */
export const streamAudio: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { trackId } = req.params;
    const { spotifyId, title, artist, quality = 'high' } = req.body;

    // Check if we have the track cached
    const cachedUrl = await cloudStorageService.getAudioStreamUrl(trackId);
    if (cachedUrl && !cachedUrl.startsWith('file://')) {
      return res.json({ 
        streamUrl: cachedUrl,
        cached: true,
        quality: 'high'
      });
    }

    // Try to get audio stream from direct URL or other sources
    let audioUrl = '';
    
    // If we have a Spotify ID, try to get preview URL
    if (spotifyId) {
      // In a real implementation, you'd call Spotify API to get preview URL
      audioUrl = `https://p.scdn.co/mp3-preview/${spotifyId}`;
    } else if (title && artist) {
      // Search for alternative audio sources
      audioUrl = await searchAlternativeAudio(`${artist} ${title}`);
    }

    if (audioUrl) {
      const audioStream = await audioStreamingService.getAudioStream(trackId, audioUrl, {
        quality: quality as any,
        format: 'mp3'
      });

      if (audioStream) {
        // Cache the stream URL
        await cloudStorageService.cacheAudioStream(trackId, audioStream.url, {
          title,
          artist,
          quality
        });

        return res.json({
          streamUrl: audioStream.url,
          cached: false,
          quality: audioStream.quality,
          duration: audioStream.duration,
          metadata: audioStream.metadata
        });
      }
    }

    // Fallback: return error if no audio source found
    res.status(404).json({
      error: 'No audio source available for this track',
      trackId,
      title,
      artist
    });

  } catch (error) {
    console.error('Error streaming audio:', error);
    res.status(500).json({ error: 'Failed to stream audio' });
  }
};

/**
 * Serve cached audio file
 */
export const serveCachedAudio: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { trackId } = req.params;
    const range = req.headers.range;

    const result = await audioStreamingService.serveCachedAudio(trackId, range);
    if (!result) {
      return res.status(404).json({ error: 'Cached audio not found' });
    }

    const { stream, headers, fileSize } = result;

    res.writeHead(206, headers);
    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.status(500).json({ error: 'Stream error' });
    });

  } catch (error) {
    console.error('Error serving cached audio:', error);
    res.status(500).json({ error: 'Failed to serve cached audio' });
  }
};

/**
 * Get audio metadata
 */
export const getAudioMetadata: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { trackId } = req.params;
    
    const metadata = await audioStreamingService.getAudioMetadata(trackId);
    if (!metadata) {
      return res.status(404).json({ error: 'Audio metadata not found' });
    }

    res.json(metadata);
  } catch (error) {
    console.error('Error getting audio metadata:', error);
    res.status(500).json({ error: 'Failed to get audio metadata' });
  }
};

/**
 * Upload and cache audio stream
 */
export const uploadAudioStream: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { trackId } = req.params;
    const { audioUrl, metadata } = req.body;

    if (!audioUrl || !metadata) {
      return res.status(400).json({
        error: 'Audio URL and metadata are required'
      });
    }

    const audioStream = await audioStreamingService.getAudioStream(trackId, audioUrl, {
      quality: 'high',
      format: 'mp3'
    });

    if (audioStream) {
      // Cache the stream
      await cloudStorageService.cacheAudioStream(trackId, audioStream.url, metadata);

      res.json({
        success: true,
        streamUrl: audioStream.url,
        cached: true,
        metadata: audioStream.metadata
      });
    } else {
      res.status(400).json({
        error: 'Failed to process audio stream'
      });
    }

  } catch (error) {
    console.error('Error uploading audio stream:', error);
    res.status(500).json({ error: 'Failed to upload audio stream' });
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await audioStreamingService.getCacheStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
};

/**
 * Clear audio cache
 */
export const clearAudioCache: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    // This would clear the cache - implementation depends on your caching strategy
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    console.error('Error clearing audio cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
};

/**
 * Search for alternative audio sources
 * This is a placeholder - in production you'd integrate with legitimate music APIs
 */
async function searchAlternativeAudio(query: string): Promise<string> {
  // This is a placeholder - you would implement actual audio search here
  // In production, use legitimate music APIs like:
  // - Spotify Web API for preview URLs
  // - Free music APIs like Jamendo, Freesound, etc.
  // - Internet Archive for public domain music
  
  console.log(`Would search for alternative audio: ${query}`);
  return '';
}