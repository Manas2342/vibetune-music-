import fs from 'fs';
import path from 'path';
import NodeCache from 'node-cache';
import spotifyService from './spotifyService';
import playlistService from './playlistService';

export interface RecommendationRequest {
  seedTracks?: string[];
  seedArtists?: string[];
  seedGenres?: string[];
  targetFeatures?: {
    acousticness?: number;
    danceability?: number;
    energy?: number;
    instrumentalness?: number;
    liveness?: number;
    speechiness?: number;
    valence?: number;
    tempo?: number;
  };
  limit?: number;
  market?: string;
}

export interface RecommendationTrack {
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
  popularity: number;
  audioFeatures?: {
    acousticness: number;
    danceability: number;
    energy: number;
    instrumentalness: number;
    liveness: number;
    speechiness: number;
    valence: number;
    tempo: number;
  };
  reasoning?: string;
}

export interface UserListeningProfile {
  userId: string;
  favoriteGenres: { [genre: string]: number };
  favoriteArtists: { [artistId: string]: number };
  audioFeaturePreferences: {
    acousticness: number;
    danceability: number;
    energy: number;
    instrumentalness: number;
    liveness: number;
    speechiness: number;
    valence: number;
    tempo: number;
  };
  playHistory: {
    trackId: string;
    playCount: number;
    lastPlayed: Date;
    skipRate: number;
  }[];
  timeOfDayPreferences: {
    [hour: string]: {
      energy: number;
      valence: number;
      tempo: number;
    };
  };
  updatedAt: Date;
}

export interface RecommendationContext {
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  mood?: 'happy' | 'sad' | 'energetic' | 'calm' | 'focused' | 'party';
  activity?: 'workout' | 'study' | 'work' | 'relax' | 'sleep' | 'commute';
  weather?: 'sunny' | 'rainy' | 'cloudy' | 'cold' | 'hot';
  previousTracks?: string[];
}

class RecommendationService {
  private cache: NodeCache;
  private profilesPath = path.join(process.cwd(), 'storage', 'user-profiles');
  private genreSeeds = [
    'pop', 'rock', 'hip-hop', 'jazz', 'classical', 'electronic', 'country',
    'r-n-b', 'indie', 'alternative', 'metal', 'punk', 'folk', 'blues',
    'reggae', 'latin', 'world', 'ambient', 'house', 'techno', 'dubstep',
    'trap', 'lo-fi', 'chill', 'acoustic'
  ];

  constructor() {
    this.cache = new NodeCache({ stdTTL: 1800 }); // 30 minutes cache
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.profilesPath)) {
      fs.mkdirSync(this.profilesPath, { recursive: true });
    }
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(
    userId: string,
    context: RecommendationContext = {},
    limit: number = 20,
    accessToken?: string
  ): Promise<RecommendationTrack[]> {
    try {
      // Get user's listening profile
      const userProfile = await this.getUserProfile(userId);
      
      // Generate recommendations based on profile and context
      let recommendations: RecommendationTrack[] = [];

      if (accessToken) {
        // Use Spotify recommendations with user data
        recommendations = await this.getSpotifyRecommendations(userProfile, context, limit, accessToken);
      } else {
        // Use fallback recommendation logic
        recommendations = await this.getFallbackRecommendations(userProfile, context, limit);
      }

      // Add reasoning for recommendations
      recommendations = recommendations.map(track => ({
        ...track,
        reasoning: this.generateReasoning(track, userProfile, context)
      }));

      console.log(`🎵 Generated ${recommendations.length} recommendations for user ${userId}`);
      return recommendations;
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  /**
   * Get recommendations based on seed data
   */
  async getRecommendationsBySeed(
    request: RecommendationRequest,
    accessToken?: string
  ): Promise<RecommendationTrack[]> {
    if (!accessToken) {
      return this.getFallbackRecommendationsBySeed(request);
    }

    try {
      const params = new URLSearchParams({
        limit: (request.limit || 20).toString(),
        market: request.market || 'US'
      });

      // Add seed parameters
      if (request.seedTracks?.length) {
        params.append('seed_tracks', request.seedTracks.slice(0, 5).join(','));
      }
      if (request.seedArtists?.length) {
        params.append('seed_artists', request.seedArtists.slice(0, 5).join(','));
      }
      if (request.seedGenres?.length) {
        params.append('seed_genres', request.seedGenres.slice(0, 5).join(','));
      }

      // Add target features
      if (request.targetFeatures) {
        Object.entries(request.targetFeatures).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(`target_${key}`, value.toString());
          }
        });
      }

      const response = await fetch(`https://api.spotify.com/v1/recommendations?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.tracks || [];
    } catch (error) {
      console.error('Error getting Spotify recommendations:', error);
      return this.getFallbackRecommendationsBySeed(request);
    }
  }

  /**
   * Get mood-based recommendations
   */
  async getMoodRecommendations(
    mood: string,
    limit: number = 20,
    accessToken?: string
  ): Promise<RecommendationTrack[]> {
    const moodFeatures = this.getMoodFeatures(mood);
    
    return this.getRecommendationsBySeed({
      seedGenres: moodFeatures.genres,
      targetFeatures: moodFeatures.features,
      limit
    }, accessToken);
  }

  /**
   * Get activity-based recommendations
   */
  async getActivityRecommendations(
    activity: string,
    limit: number = 20,
    accessToken?: string
  ): Promise<RecommendationTrack[]> {
    const activityFeatures = this.getActivityFeatures(activity);
    
    return this.getRecommendationsBySeed({
      seedGenres: activityFeatures.genres,
      targetFeatures: activityFeatures.features,
      limit
    }, accessToken);
  }

  /**
   * Get similar tracks
   */
  async getSimilarTracks(
    trackId: string,
    limit: number = 20,
    accessToken?: string
  ): Promise<RecommendationTrack[]> {
    return this.getRecommendationsBySeed({
      seedTracks: [trackId],
      limit
    }, accessToken);
  }

  /**
   * Get artist radio (similar artists and tracks)
   */
  async getArtistRadio(
    artistId: string,
    limit: number = 20,
    accessToken?: string
  ): Promise<RecommendationTrack[]> {
    return this.getRecommendationsBySeed({
      seedArtists: [artistId],
      limit
    }, accessToken);
  }

  /**
   * Update user listening profile
   */
  async updateUserProfile(userId: string, trackData: {
    trackId: string;
    artistIds: string[];
    genres: string[];
    audioFeatures?: any;
    wasSkipped: boolean;
    playDuration: number;
    totalDuration: number;
  }): Promise<void> {
    let profile = await this.getUserProfile(userId);
    const currentHour = new Date().getHours().toString();

    // Update play history
    const existingTrack = profile.playHistory.find(t => t.trackId === trackData.trackId);
    if (existingTrack) {
      existingTrack.playCount++;
      existingTrack.lastPlayed = new Date();
      if (trackData.wasSkipped) {
        existingTrack.skipRate = (existingTrack.skipRate * (existingTrack.playCount - 1) + 1) / existingTrack.playCount;
      }
    } else {
      profile.playHistory.push({
        trackId: trackData.trackId,
        playCount: 1,
        lastPlayed: new Date(),
        skipRate: trackData.wasSkipped ? 1 : 0
      });
    }

    // Update genre preferences
    trackData.genres.forEach(genre => {
      profile.favoriteGenres[genre] = (profile.favoriteGenres[genre] || 0) + 1;
    });

    // Update artist preferences
    trackData.artistIds.forEach(artistId => {
      profile.favoriteArtists[artistId] = (profile.favoriteArtists[artistId] || 0) + 1;
    });

    // Update audio features preferences
    if (trackData.audioFeatures && !trackData.wasSkipped) {
      const weight = trackData.playDuration / trackData.totalDuration;
      Object.keys(profile.audioFeaturePreferences).forEach(feature => {
        if (trackData.audioFeatures[feature] !== undefined) {
          const currentValue = profile.audioFeaturePreferences[feature];
          const newValue = trackData.audioFeatures[feature];
          profile.audioFeaturePreferences[feature] = currentValue * 0.95 + newValue * 0.05 * weight;
        }
      });
    }

    // Update time-of-day preferences
    if (trackData.audioFeatures && !trackData.wasSkipped) {
      if (!profile.timeOfDayPreferences[currentHour]) {
        profile.timeOfDayPreferences[currentHour] = {
          energy: 0.5,
          valence: 0.5,
          tempo: 120
        };
      }
      
      const hourPrefs = profile.timeOfDayPreferences[currentHour];
      hourPrefs.energy = hourPrefs.energy * 0.9 + trackData.audioFeatures.energy * 0.1;
      hourPrefs.valence = hourPrefs.valence * 0.9 + trackData.audioFeatures.valence * 0.1;
      hourPrefs.tempo = hourPrefs.tempo * 0.9 + trackData.audioFeatures.tempo * 0.1;
    }

    profile.updatedAt = new Date();
    await this.saveUserProfile(profile);
  }

  /**
   * Get user's listening profile
   */
  async getUserProfile(userId: string): Promise<UserListeningProfile> {
    const cacheKey = `profile_${userId}`;
    const cached = this.cache.get<UserListeningProfile>(cacheKey);
    if (cached) {
      return cached;
    }

    const profilePath = path.join(this.profilesPath, `${userId}.json`);
    
    let profile: UserListeningProfile;
    if (fs.existsSync(profilePath)) {
      try {
        const profileData = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
        profile = {
          ...profileData,
          updatedAt: new Date(profileData.updatedAt),
          playHistory: profileData.playHistory.map((item: any) => ({
            ...item,
            lastPlayed: new Date(item.lastPlayed)
          }))
        };
      } catch (error) {
        console.error('Error loading user profile:', error);
        profile = this.createDefaultProfile(userId);
      }
    } else {
      profile = this.createDefaultProfile(userId);
    }

    this.cache.set(cacheKey, profile);
    return profile;
  }

  /**
   * Get trending recommendations
   */
  async getTrendingRecommendations(
    limit: number = 20,
    timeframe: 'short' | 'medium' | 'long' = 'medium',
    accessToken?: string
  ): Promise<RecommendationTrack[]> {
    // This would typically use trending data from various sources
    // For now, we'll use popular genres and high energy tracks
    return this.getRecommendationsBySeed({
      seedGenres: ['pop', 'hip-hop', 'electronic'],
      targetFeatures: {
        energy: 0.7,
        danceability: 0.6,
        valence: 0.6
      },
      limit
    }, accessToken);
  }

  // Private helper methods

  private async getSpotifyRecommendations(
    userProfile: UserListeningProfile,
    context: RecommendationContext,
    limit: number,
    accessToken: string
  ): Promise<RecommendationTrack[]> {
    const seeds = this.generateSeeds(userProfile, context);
    
    return this.getRecommendationsBySeed({
      seedTracks: seeds.tracks,
      seedArtists: seeds.artists,
      seedGenres: seeds.genres,
      targetFeatures: seeds.features,
      limit
    }, accessToken);
  }

  private async getFallbackRecommendations(
    userProfile: UserListeningProfile,
    context: RecommendationContext,
    limit: number
  ): Promise<RecommendationTrack[]> {
    // Return recommendations based on user's favorite genres
    const topGenres = Object.entries(userProfile.favoriteGenres)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    return this.getFallbackRecommendationsBySeed({
      seedGenres: topGenres.length > 0 ? topGenres : ['pop', 'rock'],
      targetFeatures: userProfile.audioFeaturePreferences,
      limit
    });
  }

  private async getFallbackRecommendationsBySeed(request: RecommendationRequest): Promise<RecommendationTrack[]> {
    // This would return cached or pre-defined recommendations
    // For now, return empty array as fallback
    console.log('Using fallback recommendations');
    return [];
  }

  private generateSeeds(userProfile: UserListeningProfile, context: RecommendationContext) {
    // Get top artists
    const topArtists = Object.entries(userProfile.favoriteArtists)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([artistId]) => artistId);

    // Get top genres
    const topGenres = Object.entries(userProfile.favoriteGenres)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    // Get recent tracks
    const recentTracks = userProfile.playHistory
      .filter(track => track.skipRate < 0.5) // Filter out frequently skipped tracks
      .sort((a, b) => b.lastPlayed.getTime() - a.lastPlayed.getTime())
      .slice(0, 2)
      .map(track => track.trackId);

    // Adjust features based on context
    let features = { ...userProfile.audioFeaturePreferences };
    if (context.mood) {
      const moodFeatures = this.getMoodFeatures(context.mood).features;
      features = { ...features, ...moodFeatures };
    }
    if (context.activity) {
      const activityFeatures = this.getActivityFeatures(context.activity).features;
      features = { ...features, ...activityFeatures };
    }
    if (context.timeOfDay) {
      const hour = this.getTimeOfDayHour(context.timeOfDay);
      const timePrefs = userProfile.timeOfDayPreferences[hour];
      if (timePrefs) {
        features.energy = features.energy * 0.7 + timePrefs.energy * 0.3;
        features.valence = features.valence * 0.7 + timePrefs.valence * 0.3;
        features.tempo = features.tempo * 0.7 + timePrefs.tempo * 0.3;
      }
    }

    return {
      tracks: recentTracks,
      artists: topArtists,
      genres: topGenres.length > 0 ? topGenres : ['pop'],
      features
    };
  }

  private getMoodFeatures(mood: string) {
    const moodMap: { [key: string]: { genres: string[], features: any } } = {
      happy: {
        genres: ['pop', 'indie', 'funk'],
        features: { valence: 0.8, energy: 0.7, danceability: 0.6 }
      },
      sad: {
        genres: ['blues', 'indie', 'alternative'],
        features: { valence: 0.2, energy: 0.3, acousticness: 0.6 }
      },
      energetic: {
        genres: ['electronic', 'hip-hop', 'rock'],
        features: { energy: 0.9, danceability: 0.8, tempo: 140 }
      },
      calm: {
        genres: ['ambient', 'classical', 'chill'],
        features: { energy: 0.2, valence: 0.5, acousticness: 0.8 }
      },
      focused: {
        genres: ['ambient', 'classical', 'lo-fi'],
        features: { energy: 0.4, instrumentalness: 0.8, speechiness: 0.1 }
      },
      party: {
        genres: ['pop', 'hip-hop', 'electronic'],
        features: { energy: 0.9, danceability: 0.9, valence: 0.8 }
      }
    };

    return moodMap[mood] || moodMap.happy;
  }

  private getActivityFeatures(activity: string) {
    const activityMap: { [key: string]: { genres: string[], features: any } } = {
      workout: {
        genres: ['electronic', 'hip-hop', 'rock'],
        features: { energy: 0.9, tempo: 140, danceability: 0.8 }
      },
      study: {
        genres: ['ambient', 'classical', 'lo-fi'],
        features: { energy: 0.3, instrumentalness: 0.9, speechiness: 0.1 }
      },
      work: {
        genres: ['ambient', 'electronic', 'instrumental'],
        features: { energy: 0.5, instrumentalness: 0.7, speechiness: 0.1 }
      },
      relax: {
        genres: ['ambient', 'chill', 'acoustic'],
        features: { energy: 0.2, valence: 0.6, acousticness: 0.7 }
      },
      sleep: {
        genres: ['ambient', 'classical'],
        features: { energy: 0.1, tempo: 60, acousticness: 0.9 }
      },
      commute: {
        genres: ['pop', 'indie', 'alternative'],
        features: { energy: 0.6, valence: 0.6, danceability: 0.5 }
      }
    };

    return activityMap[activity] || activityMap.relax;
  }

  private getTimeOfDayHour(timeOfDay: string): string {
    const timeMap: { [key: string]: string } = {
      morning: '8',
      afternoon: '14',
      evening: '18',
      night: '22'
    };
    
    return timeMap[timeOfDay] || '12';
  }

  private generateReasoning(track: RecommendationTrack, userProfile: UserListeningProfile, context: RecommendationContext): string {
    const reasons: string[] = [];

    // Check if artist is in favorites
    const artistIds = track.artists.map(a => a.id);
    const favoriteArtist = artistIds.find(id => userProfile.favoriteArtists[id]);
    if (favoriteArtist) {
      reasons.push(`You've enjoyed music by ${track.artists.find(a => a.id === favoriteArtist)?.name}`);
    }

    // Check context
    if (context.mood) {
      reasons.push(`Perfect for your ${context.mood} mood`);
    }
    if (context.activity) {
      reasons.push(`Great for ${context.activity}`);
    }
    if (context.timeOfDay) {
      reasons.push(`Matches your ${context.timeOfDay} listening preferences`);
    }

    // Audio features
    if (track.audioFeatures) {
      if (track.audioFeatures.energy > 0.7) {
        reasons.push('High energy track');
      }
      if (track.audioFeatures.danceability > 0.7) {
        reasons.push('Very danceable');
      }
    }

    if (track.popularity > 70) {
      reasons.push('Popular right now');
    }

    return reasons.join(' • ') || 'Based on your listening history';
  }

  private createDefaultProfile(userId: string): UserListeningProfile {
    return {
      userId,
      favoriteGenres: {},
      favoriteArtists: {},
      audioFeaturePreferences: {
        acousticness: 0.5,
        danceability: 0.5,
        energy: 0.5,
        instrumentalness: 0.5,
        liveness: 0.5,
        speechiness: 0.5,
        valence: 0.5,
        tempo: 120
      },
      playHistory: [],
      timeOfDayPreferences: {},
      updatedAt: new Date()
    };
  }

  private async saveUserProfile(profile: UserListeningProfile): Promise<void> {
    const profilePath = path.join(this.profilesPath, `${profile.userId}.json`);
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
    this.cache.set(`profile_${profile.userId}`, profile);
  }
}

export default new RecommendationService();