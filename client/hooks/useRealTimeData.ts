import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realTimeDataService, RealTimeEvent } from '@/services/realTimeDataService';

export interface UseRealTimeDataOptions {
  enabled?: boolean;
  eventTypes?: string[];
  onEvent?: (event: RealTimeEvent) => void;
}

export function useRealTimeData(options: UseRealTimeDataOptions = {}) {
  const { enabled = true, eventTypes = [], onEvent } = options;
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealTimeEvent | null>(null);
  const eventCountRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    // Start the real-time service
    realTimeDataService.start();
    setIsConnected(true);

    // Subscribe to all event types or specific ones
    const eventTypesToSubscribe = eventTypes.length > 0 ? eventTypes : [
      'analytics_update',
      'social_activity',
      'emotion_detected',
      'profile_updated'
    ];

    const unsubscribers = eventTypesToSubscribe.map(eventType => 
      realTimeDataService.subscribe(eventType, (event) => {
        setLastEvent(event);
        eventCountRef.current += 1;

        // Call custom event handler if provided
        if (onEvent) {
          onEvent(event);
        }

        // Auto-invalidate relevant queries based on event type
        switch (event.type) {
          case 'analytics_update':
            queryClient.invalidateQueries({ queryKey: ['listening-stats'] });
            queryClient.invalidateQueries({ queryKey: ['library-stats'] });
            queryClient.invalidateQueries({ queryKey: ['social-stats'] });
            break;
          case 'social_activity':
            queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
            queryClient.invalidateQueries({ queryKey: ['following'] });
            queryClient.invalidateQueries({ queryKey: ['followers'] });
            break;
          case 'emotion_detected':
            queryClient.invalidateQueries({ queryKey: ['emotion-analytics'] });
            queryClient.invalidateQueries({ queryKey: ['emotion-trend'] });
            break;
          case 'profile_updated':
            queryClient.invalidateQueries({ queryKey: ['face-profiles'] });
            queryClient.invalidateQueries({ queryKey: ['emotion-analytics'] });
            queryClient.invalidateQueries({ queryKey: ['emotion-trend'] });
            break;
        }
      })
    );

    return () => {
      // Cleanup
      unsubscribers.forEach(unsubscribe => unsubscribe());
      setIsConnected(false);
    };
  }, [enabled, eventTypes, onEvent, queryClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      realTimeDataService.stop();
    };
  }, []);

  return {
    isConnected,
    lastEvent,
    eventCount: eventCountRef.current,
    status: realTimeDataService.getStatus(),
  };
}

// Hook for specific event types
export function useAnalyticsRealTime(enabled = true) {
  return useRealTimeData({
    enabled,
    eventTypes: ['analytics_update'],
  });
}

export function useSocialRealTime(enabled = true) {
  return useRealTimeData({
    enabled,
    eventTypes: ['social_activity'],
  });
}

export function useEmotionRealTime(enabled = true) {
  return useRealTimeData({
    enabled,
    eventTypes: ['emotion_detected'],
  });
}

export function useProfileRealTime(enabled = true) {
  return useRealTimeData({
    enabled,
    eventTypes: ['profile_updated'],
  });
}

