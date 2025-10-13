import { Grid3X3, List, Plus, Search, Play, Heart, MoreHorizontal, Clock, Eye, Edit3, Trash2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import spotifyService from "@/services/spotifyService";
import { useMusicPlayer } from "@/contexts/EnhancedMusicPlayerContext";
import { useLibrary } from "@/contexts/LibraryContext";
import { useToast } from "@/hooks/use-toast";

type Tab = 'All' | 'Playlists' | 'Artists' | 'Albums' | 'Podcasts';

type ViewMode = 'grid' | 'list';

export default function Library() {
  const [tab, setTab] = useState<Tab>('All');
  const [query, setQuery] = useState('');
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [savedTracks, setSavedTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [artistTopTracks, setArtistTopTracks] = useState<any[]>([]);
  const [artistAlbums, setArtistAlbums] = useState<any[]>([]);
  const [loadingArtist, setLoadingArtist] = useState(false);
  const [allArtists, setAllArtists] = useState<any[]>([]);
  const [loadingAllArtists, setLoadingAllArtists] = useState(false);
  const [artistSearchQuery, setArtistSearchQuery] = useState('');
  const [showArtistSearch, setShowArtistSearch] = useState(false);
  
  const navigate = useNavigate();
  const { playTrack } = useMusicPlayer();
  const { toggleLike, isLiked } = useLibrary();
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const pls = await spotifyService.getUserPlaylists(50, 0);
        setPlaylists(pls.items || []);
      } catch (error) {
        console.error('Error loading playlists:', error);
      }
      try {
        const al = await spotifyService.getSavedAlbums(50, 0);
        setAlbums((al.items || []).map((x: any) => x.album));
      } catch (error) {
        console.error('Error loading albums:', error);
      }
      try {
        const fa = await spotifyService.getFollowedArtists(50);
        setArtists(fa.artists?.items || []);
      } catch (error) {
        console.error('Error loading artists:', error);
      }
      try {
        const st = await spotifyService.getSavedTracks(50, 0);
        setSavedTracks((st.items || []).map((x: any) => x.track));
      } catch (error) {
        console.error('Error loading saved tracks:', error);
      }
      
      // Load popular artists for discovery
      try {
        await loadPopularArtists();
      } catch (error) {
        console.error('Error loading popular artists:', error);
      }
      
      setLoading(false);
    };
    load();
  }, []);

  const filteredPlaylists = useMemo(() => playlists.filter((p) => p.name?.toLowerCase().includes(query.toLowerCase())), [playlists, query]);
  const filteredAlbums = useMemo(() => albums.filter((a) => a.name?.toLowerCase().includes(query.toLowerCase())), [albums, query]);
  const filteredArtists = useMemo(() => artists.filter((a) => a.name?.toLowerCase().includes(query.toLowerCase())), [artists, query]);
  const filteredAllArtists = useMemo(() => allArtists.filter((a) => a.name?.toLowerCase().includes(artistSearchQuery.toLowerCase())), [allArtists, artistSearchQuery]);
  const filteredSavedTracks = useMemo(() => savedTracks.filter((t) => t.name?.toLowerCase().includes(query.toLowerCase())), [savedTracks, query]);

  // Helper functions
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlay = async (track: any) => {
    try {
      await playTrack(track);
      toast({
        title: "🎵 Playing",
        description: `Now playing "${track.name}"`,
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

  const handleLike = async (track: any) => {
    try {
      await toggleLike(track);
      toast({
        title: isLiked(track.id) ? "💔 Removed from Liked" : "❤️ Added to Liked",
        description: `"${track.name}" ${isLiked(track.id) ? 'removed from' : 'added to'} your liked songs`,
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "❌ Error",
        description: "Failed to update liked status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreatePlaylist = () => {
    navigate('/create-playlist');
  };

  const handleViewPlaylist = (playlistId: string) => {
    navigate(`/playlist/${playlistId}`);
  };

  const handleViewArtist = (artistId: string) => {
    navigate(`/artist/${artistId}`);
  };

  const handleViewAlbum = (albumId: string) => {
    navigate(`/album/${albumId}`);
  };

  const handleArtistClick = async (artist: any) => {
    setSelectedArtist(artist);
    setLoadingArtist(true);
    
    try {
      // Load artist's top tracks
      const topTracks = await spotifyService.getArtistTopTracks(artist.id);
      setArtistTopTracks(topTracks.tracks || []);
      
      // Load artist's albums
      const albums = await spotifyService.getArtistAlbums(artist.id);
      setArtistAlbums(albums.items || []);
    } catch (error) {
      console.error('Error loading artist details:', error);
      toast({
        title: "❌ Error",
        description: "Failed to load artist details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingArtist(false);
    }
  };

  const handleBackToArtists = () => {
    setSelectedArtist(null);
    setArtistTopTracks([]);
    setArtistAlbums([]);
  };

  const handleSearchArtists = async (query: string) => {
    if (!query.trim()) {
      setAllArtists([]);
      return;
    }

    setLoadingAllArtists(true);
    try {
      const searchResults = await spotifyService.search(query, 'artist', 50);
      setAllArtists(searchResults.artists?.items || []);
    } catch (error) {
      console.error('Error searching artists:', error);
      toast({
        title: "❌ Error",
        description: "Failed to search artists. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAllArtists(false);
    }
  };

  const loadPopularArtists = async () => {
    setLoadingAllArtists(true);
    try {
      // Search for popular artists by genre
      const genres = ['pop', 'rock', 'hip hop', 'electronic', 'classical', 'jazz', 'country', 'r&b'];
      const randomGenre = genres[Math.floor(Math.random() * genres.length)];
      const searchResults = await spotifyService.search(randomGenre, 'artist', 30);
      setAllArtists(searchResults.artists?.items || []);
    } catch (error) {
      console.error('Error loading popular artists:', error);
      toast({
        title: "❌ Error",
        description: "Failed to load artists. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAllArtists(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Your Library</h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`${showSearch ? 'text-white bg-vibetune-gray' : 'text-vibetune-text-muted hover:text-white'}`}
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`${viewMode === 'grid' ? 'text-white bg-vibetune-gray' : 'text-vibetune-text-muted hover:text-white'}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`${viewMode === 'list' ? 'text-white bg-vibetune-gray' : 'text-vibetune-text-muted hover:text-white'}`}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-2 mb-6">
        <Button 
          className="bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full"
          onClick={handleCreatePlaylist}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create playlist
        </Button>
        <Button 
          variant="outline" 
          className="border-vibetune-gray text-white hover:bg-vibetune-gray"
          onClick={() => {
            toast({
              title: "📥 Import",
              description: "Import functionality coming soon!",
            });
          }}
        >
          Import
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-4 mb-6">
        {["All", "Playlists", "Artists", "Albums", "Podcasts"].map((filter) => (
          <Button
            key={filter}
            variant="ghost"
            size="sm"
            onClick={() => setTab(filter as Tab)}
            className={`rounded-full ${filter === tab ? "bg-white text-black" : "bg-vibetune-gray text-white hover:bg-vibetune-light-gray"}`}
          >
            {filter}
          </Button>
        ))}
      </div>

      {/* Search Input */}
      {showSearch && (
        <div className="mb-6">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vibetune-text-muted w-4 h-4" />
            <Input
              placeholder={`Search in ${tab}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-vibetune-gray text-white placeholder:text-vibetune-text-muted border-0 h-10"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-vibetune-green border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Podcast Section */}
        {tab === 'Podcasts' && (
          <section>
            <h2 className="text-white font-semibold mb-4">Podcasts & Shows</h2>
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-vibetune-text-muted mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">No Podcasts Yet</h3>
              <p className="text-vibetune-text-muted mb-4">
                Podcasts are not available in your region yet. Check back later!
              </p>
              <p className="text-vibetune-text-muted text-sm">
                In the meantime, enjoy your music library below.
              </p>
            </div>
          </section>
        )}

        {/* Saved Tracks Section */}
        {(tab === 'All' || tab === 'Podcasts') && filteredSavedTracks.length > 0 && (
          <section>
            <h2 className="text-white font-semibold mb-4">
              {tab === 'Podcasts' ? 'Your Music Collection' : 'Liked Songs'}
            </h2>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {filteredSavedTracks.slice(0, 10).map((track) => (
                  <div key={track.id} className="group cursor-pointer">
                    <div className="relative mb-2">
                      {track.album?.images?.[0]?.url ? (
                        <img src={track.album.images[0].url} alt={track.name} className="w-full aspect-square object-cover rounded-md" />
                      ) : (
                        <div className="w-full aspect-square bg-vibetune-gray rounded-md flex items-center justify-center">
                          <Music className="w-8 h-8 text-vibetune-text-muted" />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          className="w-8 h-8 bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full shadow-lg"
                          onClick={() => handlePlay(track)}
                        >
                          <Play className="w-4 h-4 ml-0.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-white font-medium truncate">{track.name}</div>
                    <div className="text-vibetune-text-muted text-sm truncate">
                      {track.artists?.map((a: any) => a.name).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSavedTracks.slice(0, 20).map((track) => (
                  <div key={track.id} className="flex items-center space-x-3 p-3 hover:bg-vibetune-gray/20 rounded-md group">
                    <img
                      src={track.album?.images?.[0]?.url || '/placeholder.svg'}
                      alt={track.name}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{track.name}</div>
                      <div className="text-vibetune-text-muted text-sm truncate">
                        {track.artists?.map((a: any) => a.name).join(', ')}
                      </div>
                    </div>
                    <div className="text-vibetune-text-muted text-sm">
                      {formatDuration(track.duration_ms)}
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePlay(track)}
                        className="w-8 h-8 p-0 text-vibetune-green hover:text-white"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(track)}
                        className="w-8 h-8 p-0 text-red-400 hover:text-red-300"
                      >
                        <Heart className={`w-4 h-4 ${isLiked(track.id) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {(tab === 'All' || tab === 'Playlists') && (
          <section>
            <h2 className="text-white font-semibold mb-4">Playlists</h2>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {filteredPlaylists.map((pl) => (
                  <div key={pl.id} className="group cursor-pointer" onClick={() => handleViewPlaylist(pl.id)}>
                    <div className="relative mb-2">
                      {pl.images?.[0]?.url ? (
                        <img src={pl.images[0].url} alt={pl.name} className="w-full aspect-square object-cover rounded-md" />
                      ) : (
                        <div className="w-full aspect-square bg-vibetune-gray rounded-md flex items-center justify-center">
                          <Music className="w-8 h-8 text-vibetune-text-muted" />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          className="w-8 h-8 bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full shadow-lg"
                        >
                          <Play className="w-4 h-4 ml-0.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-white font-medium truncate">{pl.name}</div>
                    <div className="text-vibetune-text-muted text-sm truncate">{pl.tracks?.total || 0} songs</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPlaylists.map((pl) => (
                  <div key={pl.id} className="flex items-center space-x-3 p-3 hover:bg-vibetune-gray/20 rounded-md group cursor-pointer" onClick={() => handleViewPlaylist(pl.id)}>
                    <img
                      src={pl.images?.[0]?.url || '/placeholder.svg'}
                      alt={pl.name}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{pl.name}</div>
                      <div className="text-vibetune-text-muted text-sm truncate">
                        {pl.tracks?.total || 0} songs • {pl.owner?.display_name || 'You'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 text-vibetune-green hover:text-white"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 text-vibetune-text-muted hover:text-white"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {(tab === 'All' || tab === 'Artists') && (
          <section>
            {!selectedArtist ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold">Artists</h2>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`${showArtistSearch ? 'text-white bg-vibetune-gray' : 'text-vibetune-text-muted hover:text-white'}`}
                      onClick={() => setShowArtistSearch(!showArtistSearch)}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-vibetune-gray text-white hover:bg-vibetune-gray"
                      onClick={loadPopularArtists}
                    >
                      Discover Artists
                    </Button>
                  </div>
                </div>

                {/* Artist Search */}
                {showArtistSearch && (
                  <div className="mb-6">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vibetune-text-muted w-4 h-4" />
                      <Input
                        placeholder="Search for artists..."
                        value={artistSearchQuery}
                        onChange={(e) => {
                          setArtistSearchQuery(e.target.value);
                          handleSearchArtists(e.target.value);
                        }}
                        className="pl-10 bg-vibetune-gray text-white placeholder:text-vibetune-text-muted border-0 h-10"
                      />
                    </div>
                  </div>
                )}

                {/* Followed Artists */}
                {filteredArtists.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white text-lg font-medium mb-3">Your Followed Artists</h3>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {filteredArtists.map((ar) => (
                          <div key={ar.id} className="group cursor-pointer text-center" onClick={() => handleArtistClick(ar)}>
                            <div className="mb-2 relative">
                              {ar.images?.[0]?.url ? (
                                <img src={ar.images[0].url} alt={ar.name} className="w-full aspect-square object-cover rounded-full" />
                              ) : (
                                <div className="w-full aspect-square bg-vibetune-gray rounded-full flex items-center justify-center">
                                  <Music className="w-8 h-8 text-vibetune-text-muted" />
                                </div>
                              )}
                              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  className="w-8 h-8 bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full shadow-lg"
                                >
                                  <Play className="w-4 h-4 ml-0.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-white font-medium truncate">{ar.name}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredArtists.map((ar) => (
                          <div key={ar.id} className="flex items-center space-x-3 p-3 hover:bg-vibetune-gray/20 rounded-md group cursor-pointer" onClick={() => handleArtistClick(ar)}>
                            <img
                              src={ar.images?.[0]?.url || '/placeholder.svg'}
                              alt={ar.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium truncate">{ar.name}</div>
                              <div className="text-vibetune-text-muted text-sm truncate">
                                {ar.followers?.total?.toLocaleString() || 0} followers
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 p-0 text-vibetune-green hover:text-white"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 p-0 text-vibetune-text-muted hover:text-white"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* All Artists */}
                {loadingAllArtists ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-vibetune-green border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredAllArtists.length > 0 ? (
                  <div>
                    <h3 className="text-white text-lg font-medium mb-3">
                      {artistSearchQuery ? `Search Results for "${artistSearchQuery}"` : 'Discover Artists'}
                    </h3>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {filteredAllArtists.map((ar) => (
                          <div key={ar.id} className="group cursor-pointer text-center" onClick={() => handleArtistClick(ar)}>
                            <div className="mb-2 relative">
                              {ar.images?.[0]?.url ? (
                                <img src={ar.images[0].url} alt={ar.name} className="w-full aspect-square object-cover rounded-full" />
                              ) : (
                                <div className="w-full aspect-square bg-vibetune-gray rounded-full flex items-center justify-center">
                                  <Music className="w-8 h-8 text-vibetune-text-muted" />
                                </div>
                              )}
                              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  className="w-8 h-8 bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full shadow-lg"
                                >
                                  <Play className="w-4 h-4 ml-0.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-white font-medium truncate">{ar.name}</div>
                            <div className="text-vibetune-text-muted text-xs truncate">
                              {ar.followers?.total?.toLocaleString() || 0} followers
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredAllArtists.map((ar) => (
                          <div key={ar.id} className="flex items-center space-x-3 p-3 hover:bg-vibetune-gray/20 rounded-md group cursor-pointer" onClick={() => handleArtistClick(ar)}>
                            <img
                              src={ar.images?.[0]?.url || '/placeholder.svg'}
                              alt={ar.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium truncate">{ar.name}</div>
                              <div className="text-vibetune-text-muted text-sm truncate">
                                {ar.followers?.total?.toLocaleString() || 0} followers • {ar.genres?.slice(0, 2).join(', ') || 'Artist'}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 p-0 text-vibetune-green hover:text-white"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 p-0 text-vibetune-text-muted hover:text-white"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : artistSearchQuery ? (
                  <div className="text-center py-8">
                    <Music className="w-16 h-16 text-vibetune-text-muted mx-auto mb-4" />
                    <h3 className="text-white text-lg font-semibold mb-2">No Artists Found</h3>
                    <p className="text-vibetune-text-muted mb-4">
                      No artists found for "{artistSearchQuery}"
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-white text-lg font-medium mb-3">Popular Artists</h3>
                    {loadingAllArtists ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-vibetune-green border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : allArtists.length > 0 ? (
                      <>
                        {viewMode === 'grid' ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {allArtists.slice(0, 12).map((ar) => (
                              <div key={ar.id} className="group cursor-pointer text-center" onClick={() => handleArtistClick(ar)}>
                                <div className="mb-2 relative">
                                  {ar.images?.[0]?.url ? (
                                    <img src={ar.images[0].url} alt={ar.name} className="w-full aspect-square object-cover rounded-full" />
                                  ) : (
                                    <div className="w-full aspect-square bg-vibetune-gray rounded-full flex items-center justify-center">
                                      <Music className="w-8 h-8 text-vibetune-text-muted" />
                                    </div>
                                  )}
                                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="sm"
                                      className="w-8 h-8 bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full shadow-lg"
                                    >
                                      <Play className="w-4 h-4 ml-0.5" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-white font-medium truncate">{ar.name}</div>
                                <div className="text-vibetune-text-muted text-xs truncate">
                                  {ar.followers?.total?.toLocaleString() || 0} followers
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {allArtists.slice(0, 12).map((ar) => (
                              <div key={ar.id} className="flex items-center space-x-3 p-3 hover:bg-vibetune-gray/20 rounded-md group cursor-pointer" onClick={() => handleArtistClick(ar)}>
                                <img
                                  src={ar.images?.[0]?.url || '/placeholder.svg'}
                                  alt={ar.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-white font-medium truncate">{ar.name}</div>
                                  <div className="text-vibetune-text-muted text-sm truncate">
                                    {ar.followers?.total?.toLocaleString() || 0} followers • {ar.genres?.slice(0, 2).join(', ') || 'Artist'}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0 text-vibetune-green hover:text-white"
                                  >
                                    <Play className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0 text-vibetune-text-muted hover:text-white"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-6 text-center">
                          <Button 
                            className="bg-vibetune-green hover:bg-vibetune-green-dark text-black"
                            onClick={loadPopularArtists}
                          >
                            <Search className="w-4 h-4 mr-2" />
                            Discover More Artists
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Music className="w-16 h-16 text-vibetune-text-muted mx-auto mb-4" />
                        <h3 className="text-white text-lg font-semibold mb-2">Discover New Artists</h3>
                        <p className="text-vibetune-text-muted mb-4">
                          Search for artists or click "Discover Artists" to find new music
                        </p>
                        <Button 
                          className="bg-vibetune-green hover:bg-vibetune-green-dark text-black"
                          onClick={loadPopularArtists}
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Discover Artists
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Artist Header */}
                <div className="flex items-center space-x-4 mb-6">
                  <Button
                    variant="ghost"
                    onClick={handleBackToArtists}
                    className="text-vibetune-text-muted hover:text-white"
                  >
                    ← Back to Artists
                  </Button>
                </div>
                
                <div className="flex items-center space-x-6 mb-8">
                  <img
                    src={selectedArtist.images?.[0]?.url || '/placeholder.svg'}
                    alt={selectedArtist.name}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{selectedArtist.name}</h1>
                    <p className="text-vibetune-text-muted text-lg">
                      {selectedArtist.followers?.total?.toLocaleString() || 0} followers
                    </p>
                    <p className="text-vibetune-text-muted">
                      {selectedArtist.genres?.join(', ') || 'Artist'}
                    </p>
                  </div>
                </div>

                {loadingArtist ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-vibetune-green border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Top Tracks */}
                    {artistTopTracks.length > 0 && (
                      <div>
                        <h2 className="text-white text-xl font-semibold mb-4">Popular Songs</h2>
                        <div className="space-y-2">
                          {artistTopTracks.slice(0, 10).map((track, index) => (
                            <div key={track.id} className="flex items-center space-x-3 p-3 hover:bg-vibetune-gray/20 rounded-md group">
                              <div className="text-vibetune-text-muted text-sm w-6">{index + 1}</div>
                              <img
                                src={track.album?.images?.[0]?.url || '/placeholder.svg'}
                                alt={track.name}
                                className="w-12 h-12 rounded-md object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-medium truncate">{track.name}</div>
                                <div className="text-vibetune-text-muted text-sm truncate">
                                  {track.artists?.map((a: any) => a.name).join(', ')}
                                </div>
                              </div>
                              <div className="text-vibetune-text-muted text-sm">
                                {formatDuration(track.duration_ms)}
                              </div>
                              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePlay(track)}
                                  className="w-8 h-8 p-0 text-vibetune-green hover:text-white"
                                >
                                  <Play className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleLike(track)}
                                  className="w-8 h-8 p-0 text-red-400 hover:text-red-300"
                                >
                                  <Heart className={`w-4 h-4 ${isLiked(track.id) ? 'fill-current' : ''}`} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Albums */}
                    {artistAlbums.length > 0 && (
                      <div>
                        <h2 className="text-white text-xl font-semibold mb-4">Albums</h2>
                        {viewMode === 'grid' ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {artistAlbums.slice(0, 10).map((album) => (
                              <div key={album.id} className="group cursor-pointer" onClick={() => handleViewAlbum(album.id)}>
                                <div className="relative mb-2">
                                  <img
                                    src={album.images?.[0]?.url || '/placeholder.svg'}
                                    alt={album.name}
                                    className="w-full aspect-square object-cover rounded-md"
                                  />
                                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="sm"
                                      className="w-8 h-8 bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full shadow-lg"
                                    >
                                      <Play className="w-4 h-4 ml-0.5" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-white font-medium truncate">{album.name}</div>
                                <div className="text-vibetune-text-muted text-sm truncate">
                                  {album.release_date?.split('-')[0] || ''}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {artistAlbums.slice(0, 10).map((album) => (
                              <div key={album.id} className="flex items-center space-x-3 p-3 hover:bg-vibetune-gray/20 rounded-md group cursor-pointer" onClick={() => handleViewAlbum(album.id)}>
                                <img
                                  src={album.images?.[0]?.url || '/placeholder.svg'}
                                  alt={album.name}
                                  className="w-12 h-12 rounded-md object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-white font-medium truncate">{album.name}</div>
                                  <div className="text-vibetune-text-muted text-sm truncate">
                                    {album.album_type} • {album.release_date?.split('-')[0] || ''}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0 text-vibetune-green hover:text-white"
                                  >
                                    <Play className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {(tab === 'All' || tab === 'Albums') && (
          <section>
            <h2 className="text-white font-semibold mb-4">Albums</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {filteredAlbums.map((al) => (
                <div key={al.id} className="group cursor-pointer">
                  <div className="relative mb-2">
                    {al.images?.[0]?.url ? (
                      <img src={al.images[0].url} alt={al.name} className="w-full aspect-square object-cover rounded-md" />
                    ) : (
                      <div className="w-full aspect-square bg-vibetune-gray rounded-md" />
                    )}
                  </div>
                  <div className="text-white font-medium truncate">{al.name}</div>
                  <div className="text-vibetune-text-muted text-sm truncate">{(al.artists || []).map((a: any) => a.name).join(', ')}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && filteredPlaylists.length === 0 && filteredAlbums.length === 0 && filteredArtists.length === 0 && filteredSavedTracks.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-vibetune-text-muted mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">Your Library is Empty</h3>
            <p className="text-vibetune-text-muted mb-4">
              {query ? `No results found for "${query}"` : "Start by creating a playlist or saving some music"}
            </p>
            {!query && (
              <Button 
                className="bg-vibetune-green hover:bg-vibetune-green-dark text-black"
                onClick={handleCreatePlaylist}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Playlist
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
