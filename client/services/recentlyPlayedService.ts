import { Track } from '../contexts/EnhancedMusicPlayerContext';

export interface RecentlyPlayedItem {
  id: string;
  title: string;
  artist: string;
  image: string;
  playedAt: Date;
  duration?: number;
  spotifyId?: string;
}

class RecentlyPlayedService {
  private readonly STORAGE_KEY = 'vibetune_recently_played';
  private readonly MAX_ITEMS = 50; // Keep last 50 played tracks

  /**
   * Add a track to recently played
   */
  addTrack(track: Track): void {
    try {
      const recentlyPlayed = this.getRecentlyPlayed();
      
      // Remove if already exists (to update position)
      const filtered = recentlyPlayed.filter(item => item.id !== track.id);
      
      // Add new item at the beginning
      const newItem: RecentlyPlayedItem = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        image: track.albumArt || '/placeholder.svg',
        playedAt: new Date(),
        duration: track.duration,
        spotifyId: track.spotifyId
      };
      
      const updated = [newItem, ...filtered].slice(0, this.MAX_ITEMS);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      console.log('🎵 Added to recently played:', track.title);
    } catch (error) {
      console.error('Error saving to recently played:', error);
    }
  }

  /**
   * Get recently played tracks
   */
  getRecentlyPlayed(limit: number = 20): RecentlyPlayedItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const items: RecentlyPlayedItem[] = JSON.parse(stored);
      
      // Convert playedAt back to Date objects
      const parsedItems = items.map(item => ({
        ...item,
        playedAt: new Date(item.playedAt)
      }));
      
      return parsedItems.slice(0, limit);
    } catch (error) {
      console.error('Error loading recently played:', error);
      return [];
    }
  }

  /**
   * Remove a specific track from recently played
   */
  removeTrack(trackId: string): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;
      
      const items: RecentlyPlayedItem[] = JSON.parse(stored);
      const filteredItems = items.filter(item => item.id !== trackId);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredItems));
      console.log(`🎵 Removed track ${trackId} from recently played`);
    } catch (error) {
      console.error('Error removing track from recently played:', error);
    }
  }

  /**
   * Clear all recently played tracks
   */
  clearRecentlyPlayed(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🎵 Cleared recently played tracks');
    } catch (error) {
      console.error('Error clearing recently played:', error);
    }
  }

  /**
   * Get recently played count
   */
  getCount(): number {
    return this.getRecentlyPlayed().length;
  }

  /**
   * Check if a track was played recently
   */
  wasPlayedRecently(trackId: string, withinMinutes: number = 60): boolean {
    const recentlyPlayed = this.getRecentlyPlayed();
    const track = recentlyPlayed.find(item => item.id === trackId);
    
    if (!track) return false;
    
    const timeDiff = Date.now() - track.playedAt.getTime();
    return timeDiff < (withinMinutes * 60 * 1000);
  }
}

// Export singleton instance
export const recentlyPlayedService = new RecentlyPlayedService();
export default recentlyPlayedService;
