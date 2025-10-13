import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Track } from './MusicPlayerContext';

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
}

interface LibraryContextType {
  likedSongs: Track[];
  playlists: Playlist[];
  isLiked: (trackId: string) => boolean;
  toggleLike: (track: Track) => void;
  addToLiked: (track: Track) => void;
  removeFromLiked: (trackId: string) => void;
  createPlaylist: (name: string, description?: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  updatePlaylist: (playlistId: string, updates: Partial<Playlist>) => void;
  addToPlaylist: (playlistId: string, track: Track) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  getPlaylist: (playlistId: string) => Playlist | undefined;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};

interface LibraryProviderProps {
  children: ReactNode;
}

export const LibraryProvider: React.FC<LibraryProviderProps> = ({ children }) => {
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedLikedSongs = localStorage.getItem('vibetune_liked_songs');
      if (savedLikedSongs) {
        setLikedSongs(JSON.parse(savedLikedSongs));
      }

      const savedPlaylists = localStorage.getItem('vibetune_playlists');
      if (savedPlaylists) {
        const parsedPlaylists = JSON.parse(savedPlaylists).map((playlist: any) => ({
          ...playlist,
          createdAt: new Date(playlist.createdAt),
          updatedAt: new Date(playlist.updatedAt),
        }));
        setPlaylists(parsedPlaylists);
      } else {
        // Create default playlists
        const defaultPlaylists: Playlist[] = [
          {
            id: 'my-playlist-1',
            name: 'My Playlist #1',
            description: 'A collection of my favorite tracks',
            tracks: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'chill-vibes',
            name: 'Chill Vibes',
            description: 'Perfect for relaxing',
            tracks: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'workout-mix',
            name: 'Workout Mix',
            description: 'High energy tracks for exercise',
            tracks: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'study-focus',
            name: 'Study Focus',
            description: 'Concentration music',
            tracks: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        setPlaylists(defaultPlaylists);
      }
    } catch (error) {
      console.error('Error loading library data:', error);
    }
  }, []);

  // Save liked songs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('vibetune_liked_songs', JSON.stringify(likedSongs));
    } catch (error) {
      console.error('Error saving liked songs:', error);
    }
  }, [likedSongs]);

  // Save playlists to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('vibetune_playlists', JSON.stringify(playlists));
    } catch (error) {
      console.error('Error saving playlists:', error);
    }
  }, [playlists]);

  const isLiked = (trackId: string): boolean => {
    return likedSongs.some(track => track.id === trackId);
  };

  const addToLiked = (track: Track) => {
    setLikedSongs(prev => {
      if (!prev.some(t => t.id === track.id)) {
        return [...prev, track];
      }
      return prev;
    });
  };

  const removeFromLiked = (trackId: string) => {
    setLikedSongs(prev => prev.filter(track => track.id !== trackId));
  };

  const toggleLike = (track: Track) => {
    if (isLiked(track.id)) {
      removeFromLiked(track.id);
    } else {
      addToLiked(track);
    }
  };

  const createPlaylist = (name: string, description?: string): Playlist => {
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: description || '',
      tracks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist;
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId));
  };

  const updatePlaylist = (playlistId: string, updates: Partial<Playlist>) => {
    setPlaylists(prev =>
      prev.map(playlist =>
        playlist.id === playlistId
          ? { ...playlist, ...updates, updatedAt: new Date() }
          : playlist
      )
    );
  };

  const addToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists(prev =>
      prev.map(playlist => {
        if (playlist.id === playlistId) {
          // Check if track already exists in playlist
          if (!playlist.tracks.some(t => t.id === track.id)) {
            return {
              ...playlist,
              tracks: [...playlist.tracks, track],
              updatedAt: new Date(),
            };
          }
        }
        return playlist;
      })
    );
  };

  const removeFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev =>
      prev.map(playlist => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            tracks: playlist.tracks.filter(track => track.id !== trackId),
            updatedAt: new Date(),
          };
        }
        return playlist;
      })
    );
  };

  const getPlaylist = (playlistId: string): Playlist | undefined => {
    return playlists.find(playlist => playlist.id === playlistId);
  };

  const contextValue: LibraryContextType = {
    likedSongs,
    playlists,
    isLiked,
    toggleLike,
    addToLiked,
    removeFromLiked,
    createPlaylist,
    deletePlaylist,
    updatePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    getPlaylist,
  };

  return (
    <LibraryContext.Provider value={contextValue}>
      {children}
    </LibraryContext.Provider>
  );
};
