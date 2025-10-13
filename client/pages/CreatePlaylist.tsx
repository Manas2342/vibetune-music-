import { useState, useEffect } from 'react';
import { Play, Heart, MoreHorizontal, Clock, Plus, Search, X, Music, Edit3, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLibrary } from '@/contexts/LibraryContext';
import { useMusicPlayer } from '@/contexts/EnhancedMusicPlayerContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import spotifyService from '@/services/spotifyService';

interface Track {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string; images?: Array<{ url: string }> };
  duration_ms: number;
  preview_url?: string;
  external_urls?: { spotify?: string };
}

export default function CreatePlaylist() {
  const { createPlaylist, addToPlaylist, removeFromPlaylist, playlists, deletePlaylist } = useLibrary();
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // View state
  const [view, setView] = useState<'create' | 'list'>('list');
  
  // Playlist creation state
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);
  
  // Song search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  
  // Current playlist tracks
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  // Create a new playlist
  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      toast({
        title: "❌ Playlist Name Required",
        description: "Please enter a name for your playlist.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const newPlaylist = createPlaylist(playlistName.trim(), playlistDescription.trim());
      setCurrentPlaylistId(newPlaylist.id);
      
      // Reset form
      setPlaylistName('');
      setPlaylistDescription('');
      
      // Switch to list view to show created playlists
      setView('list');
      
      toast({
        title: "🎵 Playlist Created!",
        description: `"${newPlaylist.name}" has been created successfully.`,
      });
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: "❌ Error",
        description: "Failed to create playlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Search for songs
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await spotifyService.search(query.trim());
      setSearchResults(results.tracks?.items || []);
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add song to playlist
  const handleAddToPlaylist = async (track: Track) => {
    if (!currentPlaylistId) {
      toast({
        title: "❌ No Playlist Selected",
        description: "Please create a playlist first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const musicTrack = {
        id: track.id,
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        albumArt: track.album.images?.[0]?.url || '',
        duration: track.duration_ms,
        url: track.preview_url || track.external_urls?.spotify || '',
        spotifyId: track.id,
        previewUrl: track.preview_url,
        isSpotifyTrack: true,
        quality: 'high' as const,
        dateAdded: new Date().toISOString()
      };

      addToPlaylist(currentPlaylistId, musicTrack);
      
      // Update local state
      setPlaylistTracks(prev => [...prev, musicTrack]);
      
      toast({
        title: "🎵 Song Added!",
        description: `"${track.name}" has been added to your playlist.`,
      });
      
      setShowSearchDialog(false);
      setSearchQuery('');
      setSearchResults([]);
      
      // Clear current playlist selection to refresh the list view
      setCurrentPlaylistId(null);
    } catch (error) {
      console.error('Error adding song:', error);
      toast({
        title: "❌ Error",
        description: "Failed to add song. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Remove song from playlist
  const handleRemoveFromPlaylist = (trackId: string) => {
    if (!currentPlaylistId) return;
    
    removeFromPlaylist(currentPlaylistId, trackId);
    setPlaylistTracks(prev => prev.filter(track => track.id !== trackId));
    toast({
      title: "🗑️ Song Removed",
      description: "Song has been removed from the playlist.",
    });
  };

  // Play track
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

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle playlist deletion
  const handleDeletePlaylist = (playlistId: string, playlistName: string) => {
    deletePlaylist(playlistId);
    toast({
      title: "🗑️ Playlist Deleted",
      description: `"${playlistName}" has been deleted.`,
    });
  };

  // Handle editing playlist
  const handleEditPlaylist = (playlistId: string) => {
    setCurrentPlaylistId(playlistId);
    setView('create');
    // Load playlist data for editing
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
      setPlaylistName(playlist.name);
      setPlaylistDescription(playlist.description || '');
      setPlaylistTracks(playlist.tracks || []);
    }
  };

  // Handle viewing playlist
  const handleViewPlaylist = (playlistId: string) => {
    navigate(`/playlist/${playlistId}`);
  };

  // Handle adding songs to a specific playlist
  const handleAddSongsToPlaylist = (playlistId: string, playlistName: string) => {
    setCurrentPlaylistId(playlistId);
    setShowSearchDialog(true);
    toast({
      title: "🎵 Adding to Playlist",
      description: `Adding songs to "${playlistName}"`,
    });
  };

  // Get playlist cover image (use first track's album art or default)
  const getPlaylistCoverImage = (playlist: any) => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      return playlist.tracks[0].albumArt || '/placeholder.svg';
    }
    return null;
  };

  // Main render function
  if (view === 'create') {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {currentPlaylistId ? 'Edit Playlist' : 'Create New Playlist'}
              </h1>
              <p className="text-vibetune-text-muted">
                {currentPlaylistId ? 'Modify your playlist details and songs' : 'Create your perfect music collection'}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => setView('list')}
              className="text-vibetune-text-muted hover:text-white"
            >
              ← Back to Playlists
            </Button>
          </div>
          
          {/* Creation Form */}
          <div className="bg-vibetune-gray/20 rounded-2xl p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Playlist Name *
                  </label>
                  <Input
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    placeholder="Enter playlist name..."
                    className="bg-vibetune-dark border-vibetune-gray text-white placeholder:text-vibetune-text-muted h-12 text-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Description
                  </label>
                  <Textarea
                    value={playlistDescription}
                    onChange={(e) => setPlaylistDescription(e.target.value)}
                    placeholder="Add a description (optional)..."
                    rows={4}
                    className="bg-vibetune-dark border-vibetune-gray text-white placeholder:text-vibetune-text-muted"
                  />
                </div>
                
                <Button
                  onClick={handleCreatePlaylist}
                  disabled={isCreating || !playlistName.trim()}
                  className="bg-vibetune-green hover:bg-vibetune-green-dark text-black h-12 px-8 text-lg font-semibold"
                >
                  {isCreating ? 'Creating...' : (currentPlaylistId ? 'Update Playlist' : 'Create Playlist')}
                </Button>
              </div>
              
              {/* Visual Preview */}
              <div className="flex items-center justify-center">
                <div className="w-64 h-64 bg-gradient-to-br from-vibetune-green/20 to-purple-600/20 rounded-2xl flex items-center justify-center border border-vibetune-gray/30">
                  <div className="text-center">
                    <Music className="w-16 h-16 text-vibetune-green mx-auto mb-4" />
                    <div className="text-white font-semibold text-lg mb-2">
                      {playlistName || 'Your Playlist'}
                    </div>
                    <div className="text-vibetune-text-muted text-sm">
                      {playlistDescription || 'No description yet'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show playlist list view
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Playlists</h1>
            <p className="text-vibetune-text-muted">
              Manage and organize your music collections
            </p>
          </div>
          <Button
            onClick={() => {
              setView('create');
              setPlaylistName('');
              setPlaylistDescription('');
              setCurrentPlaylistId(null);
            }}
            className="bg-vibetune-green hover:bg-vibetune-green-dark text-black h-12 px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Playlist
          </Button>
        </div>

        {/* Playlists Grid */}
        {playlists.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-32 h-32 bg-vibetune-gray/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Music className="w-16 h-16 text-vibetune-text-muted" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">No Playlists Yet</h2>
              <p className="text-vibetune-text-muted mb-6 max-w-md">
                Create your first playlist to start organizing your favorite music and discover new songs.
              </p>
              <Button
                onClick={() => setView('create')}
                className="bg-vibetune-green hover:bg-vibetune-green-dark text-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Playlist
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="group bg-vibetune-gray/20 rounded-xl p-6 hover:bg-vibetune-gray/30 transition-all duration-200 hover:scale-105"
              >
                {/* Playlist Cover */}
                <div className="relative mb-4">
                  <div className="w-full aspect-square bg-gradient-to-br from-vibetune-green/20 to-purple-600/20 rounded-lg flex items-center justify-center border border-vibetune-gray/30 overflow-hidden">
                    {getPlaylistCoverImage(playlist) ? (
                      <img 
                        src={getPlaylistCoverImage(playlist)} 
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="w-12 h-12 text-vibetune-green" />
                    )}
                  </div>
                  
                  {/* Action Buttons Overlay */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                    <Button
                      size="sm"
                      className="w-10 h-10 bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full shadow-lg"
                      onClick={() => handleAddSongsToPlaylist(playlist.id, playlist.name)}
                      title="Add Songs"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    {playlist.tracks.length > 0 && (
                      <Button
                        size="sm"
                        className="w-10 h-10 bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full shadow-lg"
                        onClick={() => handlePlay(playlist.tracks[0])}
                        title="Play"
                      >
                        <Play className="w-4 h-4 ml-0.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Playlist Info */}
                <div className="mb-4">
                  <h3 className="text-white font-semibold text-lg mb-1 truncate">
                    {playlist.name}
                  </h3>
                  <p className="text-vibetune-text-muted text-sm mb-2 line-clamp-2">
                    {playlist.description || 'No description'}
                  </p>
                  <p className="text-vibetune-text-muted text-xs">
                    {playlist.tracks.length} songs • Created {new Date(playlist.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddSongsToPlaylist(playlist.id, playlist.name)}
                    className="flex-1 text-vibetune-green hover:text-white hover:bg-vibetune-green/20"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewPlaylist(playlist.id)}
                    className="flex-1 text-vibetune-text-muted hover:text-white hover:bg-vibetune-gray/40"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditPlaylist(playlist.id)}
                    className="flex-1 text-vibetune-text-muted hover:text-white hover:bg-vibetune-gray/40"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePlaylist(playlist.id, playlist.name)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Songs Dialog */}
        <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
          <DialogContent className="max-w-2xl bg-vibetune-dark border-vibetune-gray text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                Add Songs to "{playlists.find(p => p.id === currentPlaylistId)?.name || 'Playlist'}"
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vibetune-text-muted w-4 h-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  placeholder="Search for songs..."
                  className="pl-10 bg-vibetune-gray border-vibetune-gray text-white placeholder:text-vibetune-text-muted"
                />
              </div>
              
              {isSearching && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-vibetune-green border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center space-x-3 p-3 hover:bg-vibetune-gray/40 rounded-md cursor-pointer transition-colors"
                      onClick={() => handleAddToPlaylist(track)}
                    >
                      <img
                        src={track.album.images?.[0]?.url || '/placeholder.svg'}
                        alt={track.album.name}
                        className="w-12 h-12 rounded-md object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{track.name}</div>
                        <div className="text-vibetune-text-muted text-sm truncate">
                          {track.artists.map(artist => artist.name).join(', ')}
                        </div>
                      </div>
                      <div className="text-vibetune-text-muted text-sm">
                        {formatDuration(track.duration_ms)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 text-vibetune-green hover:text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {searchQuery && !isSearching && searchResults.length === 0 && (
                <div className="text-center py-8 text-vibetune-text-muted">
                  No songs found for "{searchQuery}"
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
