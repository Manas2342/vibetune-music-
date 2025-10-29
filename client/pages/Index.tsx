import { Play, MoreHorizontal, Camera, Music, Brain, Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WebcamModal } from "@/components/WebcamModal";
import { useEffect, useState, useMemo } from "react";
import spotifyService from "../services/spotifyService";
import { Link, useNavigate } from "react-router-dom";
import { useMusicPlayer } from "@/contexts/EnhancedMusicPlayerContext";
import { useLibrary } from "@/contexts/LibraryContext";
// Removed demoMusicService - now using real Spotify data
import { useToast } from "@/hooks/use-toast";

type NewRelease = { id: string; name: string; artists: { name: string }[]; images?: { url: string }[] };
type TopArtist = { id: string; name: string; images?: { url: string }[]; followers?: { total: number } };

type PlayedItem = { id: string; title: string; artist: string; image: string };

// Dynamic quick picks will be calculated in the component

export default function Index() {
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const navigate = useNavigate();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [newReleases, setNewReleases] = useState<NewRelease[]>([]);
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<PlayedItem[]>([]);
  const [vibetuneRecentlyPlayed, setVibetuneRecentlyPlayed] = useState<PlayedItem[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<any[]>([]);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const { playTrack } = useMusicPlayer();
  const { toggleLike, isLiked, likedSongs, playlists } = useLibrary();
  const { toast } = useToast();
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
  
  const handleWebcamCapture = (imageData: string) => {
    setCapturedImage(imageData);
  };

  const handleRemoveFromRecentlyPlayed = async (trackId: string) => {
    try {
      const { recentlyPlayedService } = await import('../services/recentlyPlayedService');
      recentlyPlayedService.removeTrack(trackId);
      
      // Refresh the recently played list
      const vibetuneTracks = recentlyPlayedService.getRecentlyPlayed(12);
      const vibetuneItems: PlayedItem[] = vibetuneTracks.map((track) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        image: track.image
      }));
      setVibetuneRecentlyPlayed(vibetuneItems);
      
      toast({
        title: "🗑️ Removed from Recently Played",
        description: "Track has been removed from your recently played list.",
      });
    } catch (error) {
      console.error('Error removing track from recently played:', error);
      toast({
        title: "❌ Error",
        description: "Failed to remove track from recently played.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const load = async () => {
      // Check Spotify connection status
      const sessionToken = localStorage.getItem('spotifySessionToken');
      const accessToken = localStorage.getItem('spotify_access_token');
      const connected = !!(sessionToken || accessToken);
      setIsSpotifyConnected(connected);

      try {
        const nr = await spotifyService.getNewReleases(12, 0);
        setNewReleases(nr.albums?.items || []);
      } catch {}
      try {
        const ta = await spotifyService.getTopArtists(12, 0);
        setTopArtists(ta.artists?.items || []);
      } catch {}
      try {
        const fp = await spotifyService.getFeaturedPlaylists(6, 0);
        setFeaturedPlaylists(fp.playlists?.items || []);
      } catch {}
      
      // Fetch real recently played tracks from Spotify (only if authenticated)
      if (connected) {
        try {
          console.log('🎵 Fetching recently played tracks from Spotify...');
          const rp = await spotifyService.getRecentlyPlayed(12);
          console.log('🎵 Recently played response:', rp);
          
          if (rp && rp.items && rp.items.length > 0) {
            const items: PlayedItem[] = rp.items.map((it: any) => ({
              id: it.track?.id,
              title: it.track?.name,
              artist: (it.track?.artists || []).map((a: any) => a.name).join(', '),
              image: it.track?.album?.images?.[0]?.url || '/placeholder.svg'
            })).filter((x: PlayedItem) => x.id);
            console.log('🎵 Processed recently played items:', items);
            setRecentlyPlayed(items);
          } else {
            console.log('🎵 No recently played tracks from Spotify');
            setRecentlyPlayed([]);
          }
        } catch (error) {
          console.error('❌ Error fetching recently played from Spotify:', error);
          console.log('🎵 Setting recently played to empty due to error');
          setRecentlyPlayed([]);
        }
      } else {
        console.log('🎵 User not connected to Spotify, skipping recently played fetch');
        setRecentlyPlayed([]);
      }

      // Fetch VibeTune recently played tracks
      try {
        console.log('🎵 Fetching VibeTune recently played tracks...');
        const { recentlyPlayedService } = await import('../services/recentlyPlayedService');
        const vibetuneTracks = recentlyPlayedService.getRecentlyPlayed(12);
        console.log('🎵 VibeTune recently played tracks:', vibetuneTracks);
        
        const vibetuneItems: PlayedItem[] = vibetuneTracks.map((track) => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          image: track.image
        }));
        
        setVibetuneRecentlyPlayed(vibetuneItems);
      } catch (error) {
        console.error('❌ Error fetching VibeTune recently played:', error);
        setVibetuneRecentlyPlayed([]);
      }
    };
    load();
  }, []);

  // Create dynamic quick picks based on real data
  const quickPicks = useMemo(() => {
    const combinedTracks = [...vibetuneRecentlyPlayed, ...recentlyPlayed];
    const uniqueTracks = combinedTracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id)
    );
    
    return [
      { 
        title: "Liked Songs", 
        count: `${likedSongs.length} song${likedSongs.length !== 1 ? 's' : ''}`, 
        color: "bg-gradient-to-br from-purple-600 to-blue-600" 
      },
      { 
        title: "Recently Played", 
        count: `${uniqueTracks.length} track${uniqueTracks.length !== 1 ? 's' : ''}`, 
        color: "bg-gradient-to-br from-orange-600 to-red-600" 
      },
      { 
        title: "My Playlists", 
        count: `${playlists.length} playlist${playlists.length !== 1 ? 's' : ''}`, 
        color: "bg-gradient-to-br from-pink-600 to-purple-600" 
      },
      { 
        title: "Jump Back In", 
        count: `${newReleases.length} album${newReleases.length !== 1 ? 's' : ''}`, 
        color: "bg-gradient-to-br from-yellow-600 to-orange-600" 
      },
      { 
        title: "Uniquely Yours", 
        count: "Mix", 
        color: "bg-gradient-to-br from-indigo-600 to-purple-600" 
      }
    ];
  }, [likedSongs.length, recentlyPlayed, vibetuneRecentlyPlayed, playlists.length, newReleases.length]);

  return (
    <div className="p-6 bg-gradient-to-b from-vibetune-gray/20 to-vibetune-dark">
      {/* Greeting Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">{greeting}</h1>
          <div className="flex space-x-3">
            <Button 
              onClick={() => setIsWebcamOpen(true)}
              className="bg-vibetune-green hover:bg-vibetune-green-dark text-black"
            >
              <Camera className="w-4 h-4 mr-2" />
              AI Camera
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/webcam'}
              className="border-vibetune-gray text-white hover:bg-vibetune-gray/40"
            >
              <Brain className="w-4 h-4 mr-2" />
              Emotion Music
            </Button>
          </div>
        </div>
        
        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {quickPicks.map((item, index) => (
            <div
              key={index}
              className="group bg-vibetune-gray/40 hover:bg-vibetune-gray/60 rounded-lg p-4 transition-all duration-300 cursor-pointer flex items-center space-x-4"
              onClick={() => {
                switch (item.title) {
                  case 'Liked Songs':
                    navigate('/liked');
                    break;
                  case 'Recently Played':
                    navigate('/search?type=recently-played');
                    break;
                  case 'My Playlists':
                    navigate('/library');
                    break;
                  case 'Jump Back In':
                    navigate('/search?type=new-releases');
                    break;
                  case 'Uniquely Yours':
                    navigate('/search?type=featured-playlists');
                    break;
                  default:
                    break;
                }
              }}
            >
              <div className={`w-16 h-16 rounded-lg ${item.color} flex items-center justify-center`}>
                <div className="w-8 h-8 bg-white/20 rounded"></div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-vibetune-text-muted">{item.count}</p>
              </div>
              <Button
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full w-12 h-12 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  // Same navigation as parent click
                  switch (item.title) {
                    case 'Liked Songs':
                      navigate('/liked');
                      break;
                    case 'Recently Played':
                      navigate('/search?type=recently-played');
                      break;
                    case 'Heavy Rotation':
                      navigate('/search?type=featured-playlists');
                      break;
                    case 'Jump Back In':
                      navigate('/search?type=new-releases');
                      break;
                    case 'Uniquely Yours':
                      navigate('/search?type=featured-playlists');
                      break;
                    default:
                      break;
                  }
                }}
              >
                <Play className="w-5 h-5 ml-0.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Playlists Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">🎵 Featured Playlists</h2>
          <p className="text-sm text-vibetune-text-muted">Curated playlists from Spotify</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {featuredPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              className="group bg-vibetune-gray/40 hover:bg-vibetune-gray/60 rounded-lg p-4 transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/playlist/${playlist.id}`)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-vibetune-green to-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
                  {playlist.images?.[0]?.url ? (
                    <img 
                      src={playlist.images[0].url} 
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{playlist.name}</h3>
                  <p className="text-sm text-vibetune-text-muted">{playlist.description}</p>
                  <p className="text-xs text-vibetune-text-muted">{playlist.tracks?.total || 0} tracks</p>
                </div>
                <Button
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full w-12 h-12 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/playlist/${playlist.id}`);
                  }}
                >
                  <Play className="w-5 h-5 ml-0.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Played */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Recently played</h2>
          <Button 
            variant="ghost" 
            className="text-vibetune-text-muted hover:text-white"
            onClick={() => navigate('/search?type=recently-played')}
          >
            Show all
          </Button>
        </div>
        {(() => {
          // Combine VibeTune and Spotify recently played, prioritizing VibeTune
          const combinedTracks = [...vibetuneRecentlyPlayed, ...recentlyPlayed];
          const uniqueTracks = combinedTracks.filter((track, index, self) => 
            index === self.findIndex(t => t.id === track.id)
          );
          
          return uniqueTracks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {uniqueTracks.slice(0, 12).map((item) => {
                const isVibetuneTrack = vibetuneRecentlyPlayed.some(vt => vt.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="group cursor-pointer"
                    onClick={async () => {
                      try {
                        if (isVibetuneTrack) {
                          // For VibeTune tracks, play directly
                          await playTrack({
                            id: item.id,
                            title: item.title,
                            artist: item.artist,
                            albumArt: item.image,
                            duration: 0,
                            url: '',
                            spotifyId: item.id,
                            isSpotifyTrack: true, // Mark as Spotify track
                            previewUrl: null,
                            quality: 'high'
                          });
                        } else {
                          // For Spotify tracks, get full track details
                          if (!item.id) return;
                          const tr = await spotifyService.getTrack(item.id);
                          await playTrack({
                            id: tr.id,
                            title: tr.name,
                            artist: (tr.artists || []).map((a: any) => a.name).join(', '),
                            albumArt: tr.album?.images?.[0]?.url || '',
                            duration: tr.duration_ms,
                            url: tr.preview_url || tr.external_urls?.spotify || '',
                            spotifyId: tr.id,
                            previewUrl: tr.preview_url,
                            isSpotifyTrack: true,
                            quality: 'high'
                          });
                        }
                      } catch (e) {
                        console.error('Error playing track:', e);
                      }
                    }}
                  >
                    <div className="relative mb-3">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full aspect-square object-cover rounded-md"
                      />
                      {isVibetuneTrack && (
                        <div className="absolute top-2 left-2 bg-vibetune-green text-black text-xs px-2 py-1 rounded-full font-medium">
                          VibeTune
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full w-12 h-12 p-0 shadow-lg"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            if (isVibetuneTrack) {
                              // For VibeTune tracks, play directly
                              await playTrack({
                                id: item.id,
                                title: item.title,
                                artist: item.artist,
                                albumArt: item.image,
                                duration: 0,
                                url: '',
                                spotifyId: item.id,
                                isSpotifyTrack: true, // Mark as Spotify track
                                previewUrl: null,
                                quality: 'high'
                              });
                            } else {
                              // For Spotify tracks, get full track details
                              if (!item.id) return;
                              const tr = await spotifyService.getTrack(item.id);
                              await playTrack({
                                id: tr.id,
                                title: tr.name,
                                artist: (tr.artists || []).map((a: any) => a.name).join(', '),
                                albumArt: tr.album?.images?.[0]?.url || '',
                                duration: tr.duration_ms,
                                url: tr.preview_url || tr.external_urls?.spotify || '',
                                spotifyId: tr.id,
                                previewUrl: tr.preview_url,
                                isSpotifyTrack: true,
                                quality: 'high'
                              });
                            }
                            
                            toast({
                              title: "🎵 Now Playing",
                              description: `${item.title} by ${item.artist}`,
                            });
                          } catch (error) {
                            console.error('Error playing track:', error);
                            toast({
                              title: "❌ Error",
                              description: "Failed to play track. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Play className="w-5 h-5 ml-0.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0 ${
                          isLiked(item.id) ? 'text-vibetune-green' : 'text-vibetune-text-muted hover:text-white'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const musicTrack = {
                            id: item.id,
                            title: item.title,
                            artist: item.artist,
                            albumArt: item.image,
                            duration: 0,
                            url: '',
                            dateAdded: new Date().toISOString()
                          };
                          toggleLike(musicTrack);
                          toast({
                            title: isLiked(item.id) ? "❤️ Removed from Liked Songs" : "❤️ Added to Liked Songs",
                            description: `${item.title} has been ${isLiked(item.id) ? 'removed from' : 'added to'} your liked songs.`,
                          });
                        }}
                      >
                        <Heart className={`w-4 h-4 ${isLiked(item.id) ? 'fill-current' : ''}`} />
                      </Button>
                      {isVibetuneTrack && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromRecentlyPlayed(item.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <h3 className="font-semibold text-white truncate">{item.title}</h3>
                    <p className="text-sm text-vibetune-text-muted truncate">{item.artist}</p>
                  </div>
                );
              })}
            </div>
          ) : (
          <div className="text-center py-8">
            <Music className="w-16 h-16 text-vibetune-text-muted mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">No recently played tracks</h3>
            <p className="text-vibetune-text-muted mb-4">
              Start playing music in VibeTune or connect your Spotify account to see your recently played tracks here
            </p>
            <div className="flex gap-3 justify-center">
              {!isSpotifyConnected && (
                <Button 
                  className="bg-vibetune-green hover:bg-vibetune-green-dark text-black"
                  onClick={() => window.location.reload()}
                >
                  Connect Spotify
                </Button>
              )}
              <Button 
                variant="outline"
                className="border-vibetune-green text-vibetune-green hover:bg-vibetune-green hover:text-black"
                onClick={() => navigate('/search')}
              >
                Discover Music
              </Button>
            </div>
          </div>
          );
        })()}
      </section>


      {/* Top Artists */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Top Artists</h2>
          <Button 
            variant="ghost" 
            className="text-vibetune-text-muted hover:text-white"
            onClick={() => navigate('/search?type=artists')}
          >
            Show all
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {topArtists.map((artist) => (
            <div 
              key={artist.id} 
              className="group cursor-pointer"
              onClick={async () => {
                try {
                  toast({
                    title: "🎵 Loading Artist",
                    description: `Loading ${artist.name}...`,
                  });
                  // Navigate to artist page or search for tracks
                  navigate(`/artist/${artist.id}`);
                } catch (error) {
                  console.error('Error loading artist:', error);
                  toast({
                    title: "❌ Error",
                    description: "Failed to load artist. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
            >
              <div className="relative mb-3">
                {artist.images?.[0]?.url ? (
                  <img src={artist.images[0].url} alt={artist.name} className="w-full aspect-square object-cover rounded-full" />
                ) : (
                  <div className="w-full aspect-square rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                )}
                <Button
                  size="sm"
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full w-12 h-12 p-0 shadow-lg"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      toast({
                        title: "🎵 Loading Artist",
                        description: `Loading ${artist.name} top tracks...`,
                      });
                      
                      // Get artist's top tracks and play the first one
                      const topTracks = await spotifyService.getArtistTopTracks(artist.id, 'US');
                      if (topTracks.tracks && topTracks.tracks.length > 0) {
                        const firstTrack = topTracks.tracks[0];
                        await playTrack({
                          id: firstTrack.id,
                          title: firstTrack.name,
                          artist: firstTrack.artists.map(a => a.name).join(', '),
                          albumArt: firstTrack.album.images[0]?.url || '',
                          duration: firstTrack.duration_ms,
                          url: firstTrack.preview_url || firstTrack.external_urls?.spotify || '',
                          spotifyId: firstTrack.id,
                          previewUrl: firstTrack.preview_url,
                          isSpotifyTrack: true,
                          quality: 'high'
                        });
                        
                        toast({
                          title: "🎵 Now Playing",
                          description: `${firstTrack.name} by ${firstTrack.artists.map(a => a.name).join(', ')}`,
                        });
                      } else {
                        toast({
                          title: "❌ No Tracks Found",
                          description: `No top tracks available for ${artist.name}`,
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      console.error('Error playing artist:', error);
                      toast({
                        title: "❌ Error",
                        description: "Failed to play artist. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Play className="w-5 h-5 ml-0.5" />
                </Button>
              </div>
              <h3 className="font-semibold text-white truncate">{artist.name}</h3>
              <p className="text-sm text-vibetune-text-muted truncate">
                {artist.followers?.total ? `${Math.floor(artist.followers.total / 1000)}K followers` : 'Artist'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Albums */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Popular albums</h2>
          <Button 
            variant="ghost" 
            className="text-vibetune-text-muted hover:text-white"
            onClick={() => navigate('/search?type=new-releases')}
          >
            Show all
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {newReleases.map((album, index) => (
            <div 
              key={album.id} 
              className="group cursor-pointer"
              onClick={async () => {
                try {
                  toast({
                    title: "🎵 Loading Album",
                    description: `Loading ${album.name}...`,
                  });
                  // Navigate to album page or search for tracks
                  navigate(`/album/${album.id}`);
                } catch (error) {
                  console.error('Error loading album:', error);
                  toast({
                    title: "❌ Error",
                    description: "Failed to load album. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
            >
              <div className="relative mb-3">
                {album.images?.[0]?.url ? (
                  <img src={album.images[0].url} alt={album.name} className="w-full aspect-square object-cover rounded-md" />
                ) : (
                  <img src="/placeholder.svg" alt={album.name} className="w-full aspect-square object-cover rounded-md" />
                )}
                <Button
                  size="sm"
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full w-12 h-12 p-0 shadow-lg"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      toast({
                        title: "🎵 Loading Album",
                        description: `Loading ${album.name} tracks...`,
                      });
                      
                      // Get album tracks and play the first one
                      const albumTracks = await spotifyService.getAlbumTracks(album.id);
                      if (albumTracks.items && albumTracks.items.length > 0) {
                        const firstTrack = albumTracks.items[0];
                        await playTrack({
                          id: firstTrack.id,
                          title: firstTrack.name,
                          artist: firstTrack.artists.map(a => a.name).join(', '),
                          albumArt: album.images[0]?.url || '',
                          duration: firstTrack.duration_ms,
                          url: firstTrack.preview_url || firstTrack.external_urls?.spotify || '',
                          spotifyId: firstTrack.id,
                          previewUrl: firstTrack.preview_url,
                          isSpotifyTrack: true,
                          quality: 'high'
                        });
                        
                        toast({
                          title: "🎵 Now Playing",
                          description: `${firstTrack.name} by ${firstTrack.artists.map(a => a.name).join(', ')}`,
                        });
                      } else {
                        toast({
                          title: "❌ No Tracks Found",
                          description: `No tracks available for ${album.name}`,
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      console.error('Error playing album:', error);
                      toast({
                        title: "❌ Error",
                        description: "Failed to play album. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Play className="w-5 h-5 ml-0.5" />
                </Button>
              </div>
              <h3 className="font-semibold text-white truncate">{album.name}</h3>
              <p className="text-sm text-vibetune-text-muted truncate">{(album.artists || []).map(a => a.name).join(', ')}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Webcam Modal */}
      <WebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={handleWebcamCapture}
        title="AI-Powered Camera"
        enableFaceDetection={true}
      />
    </div>
  );
}
