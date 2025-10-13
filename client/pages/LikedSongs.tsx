import { useState, useEffect } from 'react';
import { Play, Heart, Clock, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLibrary } from '@/contexts/LibraryContext';
import { useMusicPlayer } from '@/contexts/EnhancedMusicPlayerContext';
import { useToast } from '@/hooks/use-toast';

export default function LikedSongs() {
  const { likedSongs, toggleLike, isLiked } = useLibrary();
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePlay = async (track: any) => {
    if (playTrack) {
      try {
        await playTrack({
          id: track.id,
          title: track.title,
          artist: track.artist,
          albumArt: track.albumArt || '',
          duration: track.duration || 0,
          url: track.url || '',
          spotifyId: track.spotifyId,
          previewUrl: track.previewUrl,
          isSpotifyTrack: track.isSpotifyTrack || false,
          quality: track.quality || 'medium'
        });
        setSelectedTrack(track.id);
        toast({
          title: "🎵 Now Playing",
          description: `${track.title} by ${track.artist}`,
        });
      } catch (error) {
        console.error('Error playing track:', error);
        toast({
          title: "❌ Playback Error",
          description: "Could not play this track. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleLike = (track: any) => {
    toggleLike(track);
    toast({
      title: "❤️ Removed from Liked Songs",
      description: `${track.title} has been removed from your liked songs.`,
    });
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (likedSongs.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Heart className="w-16 h-16 text-vibetune-text-muted mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Liked Songs Yet</h2>
            <p className="text-vibetune-text-muted mb-6">
              Songs you like will appear here. Start exploring music and like your favorites!
            </p>
            <Button 
              className="bg-vibetune-green hover:bg-vibetune-green-dark text-black"
              onClick={() => window.location.href = '/search'}
            >
              Discover Music
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-48 h-48 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Heart className="w-24 h-24 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-vibetune-text-muted uppercase tracking-wider mb-2">Playlist</p>
            <h1 className="text-4xl font-bold text-white mb-2">Liked Songs</h1>
            <div className="flex items-center space-x-2 text-vibetune-text-muted">
              <span className="font-medium text-white">{likedSongs.length} songs</span>
              <span>•</span>
              <span>Your personal collection</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            size="lg"
            className="bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full px-8"
            onClick={() => likedSongs.length > 0 && handlePlay(likedSongs[0])}
          >
            <Play className="w-6 h-6 mr-2" />
            Play
          </Button>
        </div>
      </div>

      {/* Songs List */}
      <div className="space-y-1">
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-vibetune-text-muted text-sm border-b border-vibetune-gray/20">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-3">Artist</div>
          <div className="col-span-2">Date Added</div>
          <div className="col-span-1 text-right">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Songs */}
        {likedSongs.map((track, index) => (
          <div
            key={track.id}
            className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-md hover:bg-vibetune-gray/40 transition-colors group cursor-pointer ${
              selectedTrack === track.id ? 'bg-vibetune-gray/20' : ''
            }`}
            onClick={() => handlePlay(track)}
          >
            <div className="col-span-1 flex items-center justify-center">
              {selectedTrack === track.id && isPlaying ? (
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-1 h-4 bg-vibetune-green animate-pulse"></div>
                </div>
              ) : (
                <span className="text-vibetune-text-muted group-hover:hidden">
                  {index + 1}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlay(track);
                }}
              >
                <Play className="w-4 h-4 text-white" />
              </Button>
            </div>
            
            <div className="col-span-5 flex items-center space-x-3">
              <div className="w-10 h-10 bg-vibetune-gray rounded-md overflow-hidden">
                <img
                  src={track.albumArt || '/placeholder.svg'}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`font-medium truncate ${
                  selectedTrack === track.id ? 'text-vibetune-green' : 'text-white'
                }`}>
                  {track.title}
                </div>
              </div>
            </div>
            
            <div className="col-span-3 text-vibetune-text-muted truncate">
              {track.artist}
            </div>
            
            <div className="col-span-2 text-vibetune-text-muted text-sm">
              {track.dateAdded ? new Date(track.dateAdded).toLocaleDateString() : 'Recently'}
            </div>
            
            <div className="col-span-1 flex items-center justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className={`w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                  isLiked(track.id) ? 'text-vibetune-green' : 'text-vibetune-text-muted hover:text-white'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(track);
                }}
              >
                <Heart className={`w-4 h-4 ${isLiked(track.id) ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4 text-vibetune-text-muted" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
