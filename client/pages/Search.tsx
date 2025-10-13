import { useState, useEffect, useCallback } from "react";
import { Search as SearchIcon, TrendingUp, Play, Clock, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useMusicPlayer } from "@/contexts/EnhancedMusicPlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLibrary } from "@/contexts/LibraryContext";
import { useSearchParams } from "react-router-dom";
import spotifyService from "../services/spotifyService";
// Simple debounce implementation
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  const debouncedFunction = (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
  debouncedFunction.cancel = () => clearTimeout(timeoutId);
  return debouncedFunction;
};

interface Track {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  duration_ms: number;
  preview_url?: string;
  external_urls: {
    spotify: string;
  };
}

interface SearchResults {
  tracks?: {
    items: Track[];
    total: number;
  };
}

const browseCategories = [
  { name: "Pop", color: "bg-pink-500", query: "pop music" },
  { name: "Hip-Hop", color: "bg-purple-600", query: "hip hop music" },
  { name: "Rock", color: "bg-red-500", query: "rock music" },
  { name: "Jazz", color: "bg-blue-600", query: "jazz music" },
  { name: "Electronic", color: "bg-green-500", query: "electronic music" },
  { name: "Country", color: "bg-yellow-600", query: "country music" },
  { name: "R&B", color: "bg-indigo-600", query: "rnb music" },
  { name: "Classical", color: "bg-gray-600", query: "classical music" },
  { name: "Reggae", color: "bg-orange-500", query: "reggae music" },
  { name: "Folk", color: "bg-teal-600", query: "folk music" }
];

const trendingSearches = [
  "Bad Bunny",
  "Taylor Swift",
  "Drake",
  "Olivia Rodrigo",
  "Billie Eilish",
  "The Weeknd"
];

// Search function
const searchMusic = async (query: string): Promise<SearchResults> => {
  if (!query.trim()) return { tracks: { items: [], total: 0 } };
  
  const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}&type=track&limit=20`);
  if (!response.ok) {
    throw new Error('Failed to search');
  }
  return response.json();
};

// Format duration helper
const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Helper functions for different search types
const getRecentlyPlayed = async () => {
  try {
    const response = await fetch('/api/spotify/me/player/recently-played');
    const data = await response.json();
    return { tracks: { items: data.items || [] } };
  } catch (error) {
    console.error('Error fetching recently played:', error);
    return { tracks: { items: [] } };
  }
};

const getFeaturedPlaylists = async () => {
  try {
    const response = await fetch('/api/spotify/featured-playlists');
    const data = await response.json();
    return { playlists: { items: data.playlists?.items || [] } };
  } catch (error) {
    console.error('Error fetching featured playlists:', error);
    return { playlists: { items: [] } };
  }
};

const getNewReleases = async () => {
  try {
    const response = await fetch('/api/spotify/new-releases');
    const data = await response.json();
    return { albums: { items: data.albums?.items || [] } };
  } catch (error) {
    console.error('Error fetching new releases:', error);
    return { albums: { items: [] } };
  }
};

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [searchParams] = useSearchParams();
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer?.() || {};
  const { user } = useAuth();
  const { isLiked, toggleLike } = useLibrary();
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  
  // Get the type parameter from URL
  const searchType = searchParams.get('type') || 'general';

  // Debounce search input
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setDebouncedQuery(query);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  // Search query based on type
  const { data: searchResults, isLoading, error } = useQuery<any>({
    queryKey: ['search', debouncedQuery, searchType],
    queryFn: () => {
      if (searchType === 'recently-played') {
        return getRecentlyPlayed();
      } else if (searchType === 'featured-playlists') {
        return getFeaturedPlaylists();
      } else if (searchType === 'new-releases') {
        return getNewReleases();
      } else {
        return searchMusic(debouncedQuery);
      }
    },
    enabled: debouncedQuery.length > 0 || searchType !== 'general',
    staleTime: 30000,
  });

  // Load Spotify saved state for result tracks when authenticated
  useEffect(() => {
    const fetchSaved = async () => {
      try {
        if (!user || !(searchResults as SearchResults)?.tracks?.items?.length) {
          setSavedMap({});
          return;
        }
        const ids = (searchResults as SearchResults)?.tracks?.items?.map(t => t.id) || [];
        const saved = await spotifyService.checkSavedTracks(ids);
        const map: Record<string, boolean> = {};
        ids.forEach((id, idx) => { map[id] = !!saved[idx]; });
        setSavedMap(map);
      } catch (e) {
        // ignore
      }
    };
    fetchSaved();
  }, [user, (searchResults as SearchResults)?.tracks?.items?.length]);

  const handlePlay = async (track: Track) => {
    if (playTrack) {
      try {
        await playTrack({
          id: track.id,
          title: track.name,
          artist: track.artists[0]?.name || 'Unknown Artist',
          albumArt: track.album.images[0]?.url || '',
          duration: track.duration_ms,
          url: track.preview_url || track.external_urls.spotify,
          spotifyId: track.id,
          previewUrl: track.preview_url,
          isSpotifyTrack: true,
          quality: 'high'
        });
        setSelectedTrack(track);
      } catch (error) {
        console.error('Error playing track:', error);
        // Maybe show a toast notification
      }
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleTrendingClick = (search: string) => {
    setSearchQuery(search);
    setDebouncedQuery(search);
  };

  const handleCategoryClick = (category: { name: string; query: string }) => {
    setSearchQuery(category.query);
    setDebouncedQuery(category.query);
  };

  const handleLike = async (track: Track) => {
    if (user) {
      try {
        const currentlySaved = !!savedMap[track.id];
        if (currentlySaved) {
          await spotifyService.removeSavedTracks([track.id]);
        } else {
          await spotifyService.saveTracks([track.id]);
        }
        setSavedMap(prev => ({ ...prev, [track.id]: !currentlySaved }));
      } catch (e) {
        // fallback to local like if API fails
        const musicTrack = {
          id: track.id,
          title: track.name,
          artist: track.artists[0]?.name || 'Unknown Artist',
          albumArt: track.album.images[0]?.url || '',
          duration: track.duration_ms,
          url: track.preview_url || track.external_urls.spotify,
        };
        toggleLike(musicTrack);
      }
    } else {
      const musicTrack = {
        id: track.id,
        title: track.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        albumArt: track.album.images[0]?.url || '',
        duration: track.duration_ms,
        url: track.preview_url || track.external_urls.spotify,
      };
      toggleLike(musicTrack);
    }
  };

  return (
    <div className="p-6">
      {/* Search Input - only show for general search */}
      {searchType === 'general' && (
        <div className="mb-8">
          <div className="relative max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vibetune-text-muted w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="What do you want to listen to?"
              className="pl-10 bg-white text-black placeholder:text-gray-600 border-0 rounded-full h-12"
            />
          </div>
        </div>
      )}

      {/* Search Results */}
      {(debouncedQuery || searchType !== 'general') && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            {isLoading ? 'Loading...' : 
             searchType === 'recently-played' ? 'Recently Played' :
             searchType === 'featured-playlists' ? 'Made for You' :
             searchType === 'new-releases' ? 'Popular Albums' :
             `Search results for "${debouncedQuery}"`}
          </h2>
          
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-vibetune-green border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          {error && (
            <div className="text-red-400 text-center py-4">
              Failed to search. Please try again.
            </div>
          )}
          
          {(searchResults as SearchResults)?.tracks?.items && (searchResults as SearchResults).tracks.items.length > 0 && (
            <div className="space-y-2">
              {(searchResults as SearchResults).tracks.items.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center space-x-4 p-3 hover:bg-vibetune-gray/40 rounded-md cursor-pointer transition-colors group"
                  onClick={() => handlePlay(track)}
                >
                  <div className="relative">
                    <img
                      src={track.album.images[0]?.url || '/placeholder.svg'}
                      alt={track.album.name}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{track.name}</div>
                    <div className="text-vibetune-text-muted text-sm truncate">
                      {track.artists.map(artist => artist.name).join(', ')}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-vibetune-text-muted">
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
                    <span className="text-sm">{formatDuration(track.duration_ms)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {(searchResults as SearchResults)?.tracks?.items && (searchResults as SearchResults).tracks.items.length === 0 && !isLoading && (
            <div className="text-vibetune-text-muted text-center py-8">
              No results found for "{debouncedQuery}"
            </div>
          )}

          {/* Featured Playlists */}
          {(searchResults as any)?.playlists?.items && (searchResults as any).playlists.items.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {(searchResults as any).playlists.items.map((playlist: any) => (
                <div key={playlist.id} className="group cursor-pointer">
                  <div className="relative mb-3">
                    {playlist.images?.[0]?.url ? (
                      <img src={playlist.images[0].url} alt={playlist.name} className="w-full aspect-square object-cover rounded-md" />
                    ) : (
                      <div className="w-full aspect-square rounded-md bg-gradient-to-br from-violet-600 to-fuchsia-600 p-4 flex items-end">
                        <div className="w-full h-16 bg-black/20 rounded"></div>
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full w-12 h-12 p-0 shadow-lg"
                    >
                      <Play className="w-5 h-5 ml-0.5" />
                    </Button>
                  </div>
                  <h3 className="font-semibold text-white truncate">{playlist.name}</h3>
                  <p className="text-sm text-vibetune-text-muted truncate">{playlist.description || 'Featured'}</p>
                </div>
              ))}
            </div>
          )}

          {/* New Releases */}
          {(searchResults as any)?.albums?.items && (searchResults as any).albums.items.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {(searchResults as any).albums.items.map((album: any) => (
                <div key={album.id} className="group cursor-pointer">
                  <div className="relative mb-3">
                    {album.images?.[0]?.url ? (
                      <img src={album.images[0].url} alt={album.name} className="w-full aspect-square object-cover rounded-md" />
                    ) : (
                      <img src="/placeholder.svg" alt={album.name} className="w-full aspect-square object-cover rounded-md" />
                    )}
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full w-12 h-12 p-0 shadow-lg"
                    >
                      <Play className="w-5 h-5 ml-0.5" />
                    </Button>
                  </div>
                  <h3 className="font-semibold text-white truncate">{album.name}</h3>
                  <p className="text-sm text-vibetune-text-muted truncate">
                    {album.artists.map((artist: any) => artist.name).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Trending Searches */}
      {!debouncedQuery && searchType === 'general' && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Trending searches</h2>
          <div className="space-y-2">
            {trendingSearches.map((search, index) => (
              <div 
                key={index} 
                className="flex items-center space-x-3 p-3 hover:bg-vibetune-gray/40 rounded-md cursor-pointer transition-colors"
                onClick={() => handleTrendingClick(search)}
              >
                <TrendingUp className="w-5 h-5 text-vibetune-green" />
                <span className="text-white">{search}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Browse All */}
      {!debouncedQuery && searchType === 'general' && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Browse all</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {browseCategories.map((category, index) => (
              <div
                key={index}
                className={`${category.color} rounded-lg p-4 h-32 relative overflow-hidden cursor-pointer hover:scale-105 transition-transform`}
                onClick={() => handleCategoryClick(category)}
              >
                <h3 className="text-white font-bold text-lg">{category.name}</h3>
                <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-black/20 rounded-lg transform rotate-12"></div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
