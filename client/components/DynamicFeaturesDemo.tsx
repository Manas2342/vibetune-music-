import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Zap, 
  Brain, 
  BarChart3, 
  Users, 
  Camera,
  PlayCircle,
  Heart,
  Share2,
  TrendingUp,
  Target,
  CheckCircle
} from 'lucide-react';
import { useRealTimeData } from '@/hooks/useRealTimeData';

export function DynamicFeaturesDemo() {
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoStats, setDemoStats] = useState({
    analyticsUpdates: 0,
    socialActivities: 0,
    emotionDetections: 0,
    profileUpdates: 0,
  });

  const { isConnected, lastEvent, eventCount, status } = useRealTimeData({
    enabled: isDemoActive,
    onEvent: (event) => {
      setDemoStats(prev => ({
        ...prev,
        [event.type === 'analytics_update' ? 'analyticsUpdates' : 
         event.type === 'social_activity' ? 'socialActivities' :
         event.type === 'emotion_detected' ? 'emotionDetections' :
         'profileUpdates']: prev[event.type === 'analytics_update' ? 'analyticsUpdates' : 
         event.type === 'social_activity' ? 'socialActivities' :
         event.type === 'emotion_detected' ? 'emotionDetections' :
         'profileUpdates'] + 1
      }));
    }
  });

  const startDemo = () => {
    setIsDemoActive(true);
    setDemoStats({
      analyticsUpdates: 0,
      socialActivities: 0,
      emotionDetections: 0,
      profileUpdates: 0,
    });
  };

  const stopDemo = () => {
    setIsDemoActive(false);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'analytics_update': return <BarChart3 className="h-4 w-4" />;
      case 'social_activity': return <Users className="h-4 w-4" />;
      case 'emotion_detected': return <Brain className="h-4 w-4" />;
      case 'profile_updated': return <Camera className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'analytics_update': return 'text-green-500';
      case 'social_activity': return 'text-blue-500';
      case 'emotion_detected': return 'text-purple-500';
      case 'profile_updated': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-vibetune-gray border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="h-5 w-5 mr-2 text-vibetune-green" />
            Dynamic Features Demo
          </CardTitle>
          <CardDescription>
            Experience real-time updates across Analytics, Social, and Face Profile features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Button
              onClick={isDemoActive ? stopDemo : startDemo}
              className={isDemoActive 
                ? "bg-red-600 hover:bg-red-700 text-white" 
                : "bg-vibetune-green hover:bg-vibetune-green-dark text-black"
              }
            >
              {isDemoActive ? 'Stop Demo' : 'Start Demo'}
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-sm text-vibetune-text-muted">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Real-time Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-vibetune-dark/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-white">Analytics</span>
              </div>
              <div className="text-2xl font-bold text-green-500">{demoStats.analyticsUpdates}</div>
              <div className="text-xs text-vibetune-text-muted">Updates</div>
            </div>

            <div className="bg-vibetune-dark/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-white">Social</span>
              </div>
              <div className="text-2xl font-bold text-blue-500">{demoStats.socialActivities}</div>
              <div className="text-xs text-vibetune-text-muted">Activities</div>
            </div>

            <div className="bg-vibetune-dark/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-white">Emotions</span>
              </div>
              <div className="text-2xl font-bold text-purple-500">{demoStats.emotionDetections}</div>
              <div className="text-xs text-vibetune-text-muted">Detections</div>
            </div>

            <div className="bg-vibetune-dark/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Camera className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-white">Profiles</span>
              </div>
              <div className="text-2xl font-bold text-orange-500">{demoStats.profileUpdates}</div>
              <div className="text-xs text-vibetune-text-muted">Updates</div>
            </div>
          </div>

          {/* Live Event Feed */}
          {isDemoActive && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Activity className="h-5 w-5 mr-2 text-vibetune-green" />
                Live Event Feed
              </h3>
              
              <div className="bg-vibetune-dark/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {lastEvent && (
                    <div className="flex items-center space-x-3 p-2 rounded bg-vibetune-gray/50">
                      <div className={getEventColor(lastEvent.type)}>
                        {getEventIcon(lastEvent.type)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white capitalize">
                          {lastEvent.type.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-vibetune-text-muted">
                          {lastEvent.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Event #{eventCount}
                      </Badge>
                    </div>
                  )}
                  
                  {eventCount === 0 && (
                    <div className="text-center py-8 text-vibetune-text-muted">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Waiting for real-time events...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Feature Status */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Feature Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-vibetune-dark/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-white">Analytics Dashboard</span>
                </div>
                <div className="text-xs text-vibetune-text-muted">
                  Real-time charts, auto-refresh, live mode
                </div>
              </div>

              <div className="bg-vibetune-dark/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-white">Social Feed</span>
                </div>
                <div className="text-xs text-vibetune-text-muted">
                  Live notifications, activity filtering, dynamic updates
                </div>
              </div>

              <div className="bg-vibetune-dark/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-white">Face Profiles</span>
                </div>
                <div className="text-xs text-vibetune-text-muted">
                  Live emotion detection, profile analytics, real-time stats
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

