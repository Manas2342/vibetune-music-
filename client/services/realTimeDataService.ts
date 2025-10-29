// Real-time data service for dynamic features
import { mockDataService } from './mockDataService';

export interface RealTimeEvent {
  id: string;
  type: 'analytics_update' | 'social_activity' | 'emotion_detected' | 'profile_updated';
  timestamp: Date;
  data: any;
}

class RealTimeDataService {
  private listeners: Map<string, Set<(event: RealTimeEvent) => void>> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  // Start real-time data simulation
  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Analytics updates every 30 seconds
    this.intervals.set('analytics', setInterval(() => {
      this.emit('analytics_update', {
        id: `analytics_${Date.now()}`,
        type: 'analytics_update',
        timestamp: new Date(),
        data: {
          listeningStats: mockDataService.generateListeningStats('month'),
          libraryStats: mockDataService.generateLibraryStats(),
          socialStats: mockDataService.generateSocialStats(),
        }
      });
    }, 30000));

    // Social activity updates every 15 seconds
    this.intervals.set('social', setInterval(() => {
      this.emit('social_activity', {
        id: `social_${Date.now()}`,
        type: 'social_activity',
        timestamp: new Date(),
        data: {
          activities: mockDataService.generateActivityFeed(5), // New activities
          following: mockDataService.generateFollowing(),
          followers: mockDataService.generateFollowers(),
        }
      });
    }, 15000));

    // Emotion detection updates every 10 seconds
    this.intervals.set('emotion', setInterval(() => {
      this.emit('emotion_detected', {
        id: `emotion_${Date.now()}`,
        type: 'emotion_detected',
        timestamp: new Date(),
        data: {
          emotion: this.getRandomEmotion(),
          confidence: Math.random() * 0.4 + 0.6,
          profileId: this.getRandomProfileId(),
        }
      });
    }, 10000));

    // Profile updates every 20 seconds
    this.intervals.set('profiles', setInterval(() => {
      this.emit('profile_updated', {
        id: `profile_${Date.now()}`,
        type: 'profile_updated',
        timestamp: new Date(),
        data: {
          profiles: mockDataService.generateFaceProfiles(),
          emotionAnalytics: mockDataService.generateEmotionAnalytics(),
          emotionTrend: mockDataService.generateEmotionTrend(),
        }
      });
    }, 20000));
  }

  // Stop real-time data simulation
  stop() {
    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }

  // Subscribe to real-time events
  subscribe(eventType: string, callback: (event: RealTimeEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  // Emit events to subscribers
  private emit(eventType: string, event: RealTimeEvent) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in real-time event callback:', error);
        }
      });
    }
  }

  // Get random emotion for simulation
  private getRandomEmotion(): string {
    const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
    return emotions[Math.floor(Math.random() * emotions.length)];
  }

  // Get random profile ID for simulation
  private getRandomProfileId(): string {
    return `profile_${Math.floor(Math.random() * 5) + 1}`;
  }

  // Get current system status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeListeners: Array.from(this.listeners.keys()),
      intervalCount: this.intervals.size,
    };
  }

  // Simulate a specific event
  simulateEvent(eventType: string, data: any) {
    this.emit(eventType, {
      id: `simulated_${Date.now()}`,
      type: eventType as any,
      timestamp: new Date(),
      data,
    });
  }
}

export const realTimeDataService = new RealTimeDataService();

