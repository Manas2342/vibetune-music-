import { useState, useEffect } from 'react';
import { Play, RefreshCw, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DetectedEmotion } from '@/services/emotionDetection';
import { emotionDetectionService } from '@/services/emotionDetection';
import { cn } from '@/lib/utils';
import spotifyService from '@/services/spotifyService';
import { useMusicPlayer } from '@/contexts/EnhancedMusicPlayerContext';
import { demoMusicService } from '@/services/demoMusicService';

interface EmotionSongRecommendationsProps {
  emotion: DetectedEmotion | null;
  className?: string;
}

export function EmotionSongRecommendations({ emotion, className }: EmotionSongRecommendationsProps) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { playTrack } = useMusicPlayer();

  // Debug logging
  console.log('🎭 EmotionSongRecommendations received emotion:', emotion);

  useEffect(() => {
    console.log('🎭 useEffect triggered with emotion:', emotion);
    if (emotion && emotion.confidence > 0.3) {
      console.log(`🎭 Emotion detected: ${emotion.emotion} with confidence: ${emotion.confidence}`);
      fetchSongRecommendations(emotion.emotion);
    } else {
      console.log('🎭 No emotion or low confidence:', emotion);
    }
  }, [emotion?.emotion, emotion?.confidence]);

  const fetchSongRecommendations = async (emotionType: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const genre = emotionToGenre(emotionType);
      console.log(`🎵 Fetching ${emotionType} music recommendations for genre: ${genre}`);
      
      const data = await spotifyService.getRecommendations({ 
        seedGenres: [genre], 
        limit: 10 
      });
      
      console.log('📊 Spotify recommendations response:', data);
      
      if (data.tracks && data.tracks.length > 0) {
        setTracks(data.tracks);
        console.log(`✅ Found ${data.tracks.length} Spotify tracks for ${emotionType}`);
      } else {
        console.log('⚠️ No Spotify tracks found, using demo music');
        // Fallback to demo music
        const demoTracks = demoMusicService.getTracksByEmotion(emotionType);
        setTracks(demoTracks.map(demoMusicService.convertToTrack));
      }
    } catch (err) {
      console.error('❌ Spotify recommendations failed:', err);
      setError('Spotify recommendations failed, using demo music');
      
      // Fallback to demo music
      try {
        const demoTracks = demoMusicService.getTracksByEmotion(emotionType);
        setTracks(demoTracks.map(demoMusicService.convertToTrack));
        console.log(`🎵 Using ${demoTracks.length} demo tracks for ${emotionType}`);
      } catch (demoErr) {
        console.error('❌ Demo music fallback also failed:', demoErr);
        setError('Failed to load any music recommendations');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const emotionToGenre = (emo: string): string => {
    switch (emo) {
      case 'happy': return 'pop';
      case 'sad': return 'acoustic';
      case 'angry': return 'metal';
      case 'surprised': return 'dance';
      case 'disgusted': return 'alternative';
      case 'fearful': return 'ambient';
      case 'neutral': return 'indie';
      default: return 'pop';
    }
  };

  const handleRefreshRecommendations = () => {
    if (emotion) {
      fetchSongRecommendations(emotion.emotion);
    }
  };

  if (!emotion) {
    return (
      <div className={cn("bg-vibetune-gray/20 rounded-lg p-6", className)}>
        <div className="text-center">
          <Music className="w-12 h-12 text-vibetune-text-muted mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Music Recommendations</h3>
          <p className="text-vibetune-text-muted text-sm mb-4">
            Start the camera to get personalized song recommendations based on your emotions
          </p>
          {/* Debug buttons */}
          <div className="space-y-2">
            <p className="text-xs text-vibetune-text-muted">Debug: Test with demo emotions</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchSongRecommendations('happy')}
                className="text-xs"
              >
                Test Happy
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchSongRecommendations('sad')}
                className="text-xs"
              >
                Test Sad
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchSongRecommendations('angry')}
                className="text-xs"
              >
                Test Angry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (emotion.confidence < 0.3) {
    return (
      <div className={cn("bg-vibetune-gray/20 rounded-lg p-6", className)}>
        <div className="text-center">
          <Music className="w-12 h-12 text-vibetune-text-muted mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Analyzing Your Expression...</h3>
          <p className="text-vibetune-text-muted text-sm">
            Face the camera clearly for better emotion detection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-vibetune-gray/20 rounded-lg", className)}>
      <div className="p-4 border-b border-vibetune-gray/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: emotionDetectionService.getEmotionColor(emotion.emotion) }}
            />
            <div>
              <h3 className="text-white font-semibold flex items-center">
                <Music className="w-5 h-5 mr-2" />
                Songs for {emotion.emotion} mood
                <span className="ml-2 text-2xl">
                  {emotionDetectionService.getEmotionEmoji(emotion.emotion)}
                </span>
              </h3>
              <p className="text-vibetune-text-muted text-sm">
                Confidence: {Math.round(emotion.confidence * 100)}% • {tracks.length} results
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshRecommendations}
            disabled={isLoading}
            className="text-vibetune-text-muted hover:text-white"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-20 h-15 bg-vibetune-gray rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-vibetune-gray rounded animate-pulse" />
                  <div className="h-3 bg-vibetune-gray rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <Music className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={handleRefreshRecommendations} className="bg-vibetune-green hover:bg-vibetune-green-dark text-black">
              Try Again
            </Button>
          </div>
        ) : tracks.length > 0 ? (
          <div className="space-y-3">
            {tracks.map((t: any) => (
              <div 
                key={t.id}
                className="flex items-center space-x-3 p-3 bg-vibetune-gray/10 rounded-lg hover:bg-vibetune-gray/20 transition-colors group"
              >
                <div className="relative">
                  {t.album?.images?.[0]?.url ? (
                    <img src={t.album.images[0].url} alt={t.name} className="w-20 h-15 object-cover rounded" loading="lazy" />
                  ) : (
                    <div className="w-20 h-15 bg-vibetune-gray rounded" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm line-clamp-2 mb-1">{t.name}</h4>
                  <p className="text-vibetune-text-muted text-xs mb-2">{(t.artists || []).map((a: any) => a.name).join(', ')}</p>
                </div>

                <div className="flex flex-col space-y-1">
                  <Button
                    size="sm"
                    onClick={async () => {
                      await playTrack({
                        id: t.id,
                        title: t.name,
                        artist: (t.artists || []).map((a: any) => a.name).join(', '),
                        albumArt: t.album?.images?.[0]?.url || '',
                        duration: t.duration_ms,
                        url: t.preview_url || t.external_urls?.spotify || '',
                        spotifyId: t.id,
                        previewUrl: t.preview_url,
                        isSpotifyTrack: true,
                        quality: 'high'
                      });
                    }}
                    className="bg-vibetune-green hover:bg-vibetune-green-dark text-black"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Play
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-4 border-t border-vibetune-gray/20">
              <p className="text-vibetune-text-muted text-xs">Powered by your {emotion.emotion} emotion</p>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshRecommendations}
                  className="text-vibetune-text-muted hover:text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  More Songs
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Music className="w-12 h-12 text-vibetune-text-muted mx-auto mb-4" />
            <p className="text-vibetune-text-muted">
              {isLoading ? 'Loading music recommendations...' : 
               error ? `Error: ${error}` : 
               'No songs found for your current mood. Try a different expression!'}
            </p>
            {error && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshRecommendations}
                className="mt-2"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Try Again
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Emotion display component for showing current detected emotion
export function EmotionDisplay({ emotion }: { emotion: DetectedEmotion | null }) {
  if (!emotion) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 bg-vibetune-gray/20 rounded-lg px-3 py-2">
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: emotionDetectionService.getEmotionColor(emotion.emotion) }}
      />
      <span className="text-white font-medium capitalize">{emotion.emotion}</span>
      <span className="text-xl">{emotionDetectionService.getEmotionEmoji(emotion.emotion)}</span>
      <span className="text-vibetune-text-muted text-sm">
        {Math.round(emotion.confidence * 100)}%
      </span>
    </div>
  );
}

// Emotion bars component for showing all emotion scores
export function EmotionBars({ emotion }: { emotion: DetectedEmotion | null }) {
  if (!emotion) {
    return null;
  }

  const emotions = Object.entries(emotion.scores).sort(([,a], [,b]) => b - a);

  return (
    <div className="bg-vibetune-gray/20 rounded-lg p-4">
      <h4 className="text-white font-medium mb-3 flex items-center">
        <Music className="w-4 h-4 mr-2" />
        Emotion Analysis
      </h4>
      <div className="space-y-2">
        {emotions.map(([emotionType, score]) => (
          <div key={emotionType} className="flex items-center space-x-3">
            <span className="text-2xl">
              {emotionDetectionService.getEmotionEmoji(emotionType)}
            </span>
            <span className="text-vibetune-text-muted text-sm w-16 capitalize">
              {emotionType}
            </span>
            <div className="flex-1 bg-vibetune-gray rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${score * 100}%`,
                  backgroundColor: emotionDetectionService.getEmotionColor(emotionType),
                }}
              />
            </div>
            <span className="text-vibetune-text-muted text-xs w-8">
              {Math.round(score * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
