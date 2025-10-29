// Mock data service for dynamic analytics, social, and face profile features
export interface MockListeningStats {
  track_name: string;
  artist_name: string;
  album_name: string;
  play_count: number;
  total_duration: number;
  avg_listen_duration: number;
}

export interface MockLibraryStats {
  totalTracks: number;
  totalPlaylists: number;
  totalAlbums: number;
  offlineTracks: number;
  lastSyncAt?: Date;
}

export interface MockSocialStats {
  followers: number;
  following: number;
  totalLikes: number;
  totalShares: number;
}

export interface MockOfflineStats {
  totalSizeGB: number;
  trackCount: number;
  usagePercentage: number;
}

export interface MockActivityItem {
  id: string;
  user_id: string;
  activity_type: 'play' | 'like' | 'share' | 'playlist_create' | 'follow';
  display_name: string;
  image_url?: string;
  created_at: string;
  activity_data: {
    trackId?: string;
    trackName?: string;
    artistName?: string;
    albumName?: string;
    playlistId?: string;
    playlistName?: string;
    shareMessage?: string;
  };
}

export interface MockUserProfile {
  id: string;
  display_name: string;
  image_url?: string;
  followers?: number;
  following?: number;
  isFollowing?: boolean;
}

export interface MockFaceProfile {
  id: string;
  name: string;
  email?: string;
  photos: string[];
  createdAt: Date;
  lastSeen?: Date;
  isActive: boolean;
  emotionHistory: Array<{
    emotion: string;
    timestamp: Date;
    confidence: number;
  }>;
}

class MockDataService {
  private generateRandomId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getRandomTrack(): string {
    const tracks = [
      'Blinding Lights', 'Watermelon Sugar', 'Levitating', 'Good 4 U', 'Stay',
      'Industry Baby', 'Heat Waves', 'Bad Habits', 'Peaches', 'Montero',
      'Kiss Me More', 'Positions', 'Dynamite', 'Savage', 'WAP',
      'Cardigan', 'Willow', 'Anti-Hero', 'Lavender Haze', 'Midnight Rain'
    ];
    return tracks[Math.floor(Math.random() * tracks.length)];
  }

  private getRandomArtist(): string {
    const artists = [
      'The Weeknd', 'Harry Styles', 'Dua Lipa', 'Olivia Rodrigo', 'The Kid LAROI',
      'Lil Nas X', 'Glass Animals', 'Ed Sheeran', 'Justin Bieber', 'Lil Nas X',
      'Doja Cat', 'Ariana Grande', 'BTS', 'Megan Thee Stallion', 'Cardi B',
      'Taylor Swift', 'Billie Eilish', 'Adele', 'Drake', 'Post Malone'
    ];
    return artists[Math.floor(Math.random() * artists.length)];
  }

  private getRandomAlbum(): string {
    const albums = [
      'After Hours', 'Fine Line', 'Future Nostalgia', 'SOUR', 'F*CK LOVE 3',
      'MONTERO', 'Planet Her', 'Positions', 'BE', 'Good News',
      'folklore', 'evermore', 'Midnights', '30', 'Certified Lover Boy',
      'Hollywood\'s Bleeding', 'Donda', 'Justice', 'Happier Than Ever', '30'
    ];
    return albums[Math.floor(Math.random() * albums.length)];
  }

  private getRandomUserName(): string {
    const names = [
      'MusicLover23', 'BeatMaster', 'SoundWave', 'MelodyMaker', 'RhythmRider',
      'AudioAce', 'TuneTracker', 'VibeVault', 'SoundSage', 'MusicMaven',
      'BeatBuilder', 'TuneTitan', 'SoundSeeker', 'MelodyMage', 'RhythmRanger'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  // Analytics Mock Data
  generateListeningStats(timeframe: 'week' | 'month' | 'year'): MockListeningStats[] {
    const stats: MockListeningStats[] = [];
    const trackCount = timeframe === 'week' ? 20 : timeframe === 'month' ? 50 : 100;
    
    for (let i = 0; i < trackCount; i++) {
      const playCount = Math.floor(Math.random() * 50) + 1;
      const totalDuration = playCount * (Math.random() * 180000 + 120000); // 2-5 minutes per play
      
      stats.push({
        track_name: this.getRandomTrack(),
        artist_name: this.getRandomArtist(),
        album_name: this.getRandomAlbum(),
        play_count: playCount,
        total_duration: totalDuration,
        avg_listen_duration: totalDuration / playCount
      });
    }
    
    return stats.sort((a, b) => b.play_count - a.play_count);
  }

  generateLibraryStats(): MockLibraryStats {
    return {
      totalTracks: Math.floor(Math.random() * 2000) + 500,
      totalPlaylists: Math.floor(Math.random() * 50) + 10,
      totalAlbums: Math.floor(Math.random() * 200) + 50,
      offlineTracks: Math.floor(Math.random() * 100) + 20,
      lastSyncAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    };
  }

  generateSocialStats(): MockSocialStats {
    return {
      followers: Math.floor(Math.random() * 500) + 50,
      following: Math.floor(Math.random() * 200) + 30,
      totalLikes: Math.floor(Math.random() * 1000) + 100,
      totalShares: Math.floor(Math.random() * 200) + 20
    };
  }

  generateOfflineStats(): MockOfflineStats {
    const totalSizeGB = Math.random() * 5 + 1; // 1-6 GB
    const trackCount = Math.floor(Math.random() * 100) + 20;
    const usagePercentage = Math.min(100, (totalSizeGB / 10) * 100); // Assuming 10GB limit
    
    return {
      totalSizeGB,
      trackCount,
      usagePercentage
    };
  }

  generateListeningTrend(): Array<{ date: string; minutes: number }> {
    const trend = [];
    const days = 7;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trend.push({
        date: date.toISOString().split('T')[0],
        minutes: Math.floor(Math.random() * 200) + 50
      });
    }
    
    return trend;
  }

  // Social Mock Data
  generateActivityFeed(limit: number = 50): MockActivityItem[] {
    const activities: MockActivityItem[] = [];
    const activityTypes: Array<'play' | 'like' | 'share' | 'playlist_create' | 'follow'> = 
      ['play', 'like', 'share', 'playlist_create', 'follow'];
    
    for (let i = 0; i < limit; i++) {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const userName = this.getRandomUserName();
      const trackName = this.getRandomTrack();
      const artistName = this.getRandomArtist();
      const albumName = this.getRandomAlbum();
      
      activities.push({
        id: this.generateRandomId(),
        user_id: this.generateRandomId(),
        activity_type: activityType,
        display_name: userName,
        image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1db954&color=fff`,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        activity_data: {
          trackId: this.generateRandomId(),
          trackName,
          artistName,
          albumName,
          playlistId: activityType === 'playlist_create' ? this.generateRandomId() : undefined,
          playlistName: activityType === 'playlist_create' ? `My ${trackName} Playlist` : undefined,
          shareMessage: activityType === 'share' ? `Check out this amazing track! 🎵` : undefined
        }
      });
    }
    
    return activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  generateFollowing(): MockUserProfile[] {
    const following: MockUserProfile[] = [];
    const count = Math.floor(Math.random() * 20) + 5;
    
    for (let i = 0; i < count; i++) {
      const userName = this.getRandomUserName();
      following.push({
        id: this.generateRandomId(),
        display_name: userName,
        image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1db954&color=fff`,
        followers: Math.floor(Math.random() * 1000) + 10,
        following: Math.floor(Math.random() * 200) + 5,
        isFollowing: true
      });
    }
    
    return following;
  }

  generateFollowers(): MockUserProfile[] {
    const followers: MockUserProfile[] = [];
    const count = Math.floor(Math.random() * 30) + 10;
    
    for (let i = 0; i < count; i++) {
      const userName = this.getRandomUserName();
      followers.push({
        id: this.generateRandomId(),
        display_name: userName,
        image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1db954&color=fff`,
        followers: Math.floor(Math.random() * 1000) + 10,
        following: Math.floor(Math.random() * 200) + 5,
        isFollowing: Math.random() > 0.5
      });
    }
    
    return followers;
  }

  // Face Profile Mock Data
  generateFaceProfiles(): MockFaceProfile[] {
    const profiles: MockFaceProfile[] = [];
    const names = ['User Profile 1', 'User Profile 2', 'User Profile 3', 'User Profile 4', 'User Profile 5'];
    const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
    
    names.forEach((name, index) => {
      const emotionHistory = [];
      for (let i = 0; i < Math.floor(Math.random() * 20) + 5; i++) {
        emotionHistory.push({
          emotion: emotions[Math.floor(Math.random() * emotions.length)],
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          confidence: Math.random() * 0.4 + 0.6 // 0.6-1.0
        });
      }
      
      profiles.push({
        id: this.generateRandomId(),
        name,
        email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
        photos: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => 
          `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1db954&color=fff&size=200`
        ),
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        lastSeen: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
        isActive: Math.random() > 0.2,
        emotionHistory: emotionHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      });
    });
    
    return profiles;
  }

  generateEmotionAnalytics(): Array<{ emotion: string; count: number; percentage: number }> {
    const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
    const total = Math.floor(Math.random() * 1000) + 500;
    
    return emotions.map(emotion => {
      const count = Math.floor(Math.random() * (total / emotions.length)) + 10;
      return {
        emotion,
        count,
        percentage: (count / total) * 100
      };
    }).sort((a, b) => b.count - a.count);
  }

  generateEmotionTrend(): Array<{ date: string; emotion: string; count: number }> {
    const trend = [];
    const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
    const days = 7;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      emotions.forEach(emotion => {
        trend.push({
          date: date.toISOString().split('T')[0],
          emotion,
          count: Math.floor(Math.random() * 20) + 1
        });
      });
    }
    
    return trend;
  }
}

export const mockDataService = new MockDataService();
