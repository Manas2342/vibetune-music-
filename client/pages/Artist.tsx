import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Heart, MoreHorizontal, ArrowLeft, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/contexts/EnhancedMusicPlayerContext";
import { useLibrary } from "@/contexts/LibraryContext";
import { useToast } from "@/hooks/use-toast";
import spotifyService from "@/services/spotifyService";

interface Track {
  id: string;
  name: string;
  artists: { name: string; id: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  preview_url?: string;
  external_urls: { spotify: string };
}

interface Artist {
  id: string;
  name: string;
  images?: { url: string }[];
  followers?: { total: number };
  genres?: string[];
  external_urls: { spotify: string };
}

export default function Artist() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useMusicPlayer();
  const { toggleLike, isLiked } = useLibrary();
  const { toast } = useToast();

  useEffect(() => {
    const loadArtistData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        
        // Load artist info and top tracks in parallel
        const [artistData, tracksData] = await Promise.all([
          spotifyService.getArtist(id),
          spotifyService.getArtistTopTracks(id, 'US')
        ]);

        setArtist(artistData);
        setTracks(tracksData.tracks || []);
      } catch (error) {
        console.error('Error loading artist data:', error);
        toast({
          title: "❌ Error",
          description: "Failed to load artist. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadArtistData();
  }, [id, toast]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayTrack = async (track: Track) => {
    try {
      const trackData = {
        id: track.id,
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        image: track.album.images[0]?.url || '/placeholder.svg',
        previewUrl: track.preview_url,
        duration: track.duration_ms,
        url: track.external_urls.spotify,
        isSpotifyTrack: true,
        spotifyId: track.id
      };

      await playTrack(trackData);
      toast({
        title: "🎵 Now Playing",
        description: `${track.name} by ${track.artists.map(a => a.name).join(', ')}`,
      });
    } catch (error) {
      console.error('Error playing track:', error);
      toast({
        title: "❌ Error",
        description: "Failed to play track. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePlayAll = async () => {
    if (tracks.length === 0) return;
    
    try {
      // Play the first track
      await handlePlayTrack(tracks[0]);
      toast({
        title: "🎵 Playing Artist",
        description: `Starting ${artist?.name}...`,
      });
    } catch (error) {
      console.error('Error playing artist:', error);
      toast({
        title: "❌ Error",
        description: "Failed to play artist. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-b from-vibetune-gray/20 to-vibetune-dark min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading artist...</div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="p-6 bg-gradient-to-b from-vibetune-gray/20 to-vibetune-dark min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Artist not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-b from-vibetune-gray/20 to-vibetune-dark min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-vibetune-text-muted hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-white">Artist</h1>
      </div>

      {/* Artist Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-shrink-0">
          {artist.images?.[0]?.url ? (
            <img 
              src={artist.images[0].url} 
              alt={artist.name}
              className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg">
              <Music className="w-16 h-16 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col justify-end">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">{artist.name}</h2>
          
          {artist.followers && (
            <p className="text-vibetune-text-muted text-lg mb-2">
              {artist.followers.total.toLocaleString()} followers
            </p>
          )}
          
          {artist.genres && artist.genres.length > 0 && (
            <p className="text-vibetune-text-muted text-sm mb-4">
              {artist.genres.slice(0, 3).join(' • ')}
            </p>
          )}
          
          <div className="flex gap-3">
            <Button
              onClick={handlePlayAll}
              className="bg-vibetune-green hover:bg-vibetune-green-dark text-black font-semibold px-8 py-3 rounded-full"
            >
              <Play className="w-5 h-5 mr-2" />
              Play
            </Button>
            
            <Button
              variant="outline"
              className="border-vibetune-text-muted text-vibetune-text-muted hover:text-white hover:border-white px-6 py-3 rounded-full"
            >
              <Heart className="w-5 h-5 mr-2" />
              Follow
            </Button>
          </div>
        </div>
      </div>

      {/* Top Tracks */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white mb-4">Popular Tracks</h3>
        <div className="space-y-2">
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-vibetune-gray/30 transition-colors group cursor-pointer"
              onClick={() => handlePlayTrack(track)}
            >
              <div className="w-8 text-vibetune-text-muted text-sm font-medium">
                {index + 1}
              </div>
              
              <div className="flex-1 flex items-center gap-4">
                <div className="w-12 h-12 flex-shrink-0">
                  {track.album.images[0]?.url ? (
                    <img 
                      src={track.album.images[0].url} 
                      alt={track.album.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded flex items-center justify-center">
                      <Music className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">{track.name}</h4>
                  <p className="text-sm text-vibetune-text-muted truncate">
                    {track.artists.map(a => a.name).join(', ')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-vibetune-text-muted">
                  {formatDuration(track.duration_ms)}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-vibetune-text-muted hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayTrack(track);
                  }}
                >
                  <Play className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-vibetune-text-muted hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle like functionality
                  }}
                >
                  <Heart className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-vibetune-text-muted hover:text-white"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
