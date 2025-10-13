import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  Clock, 
  Music, 
  TrendingUp, 
  Calendar,
  Headphones,
  Heart,
  Download,
  Users,
  Share2,
  PlayCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

interface ListeningStats {
  track_name: string;
  artist_name: string;
  album_name: string;
  play_count: number;
  total_duration: number;
  avg_listen_duration: number;
}

interface LibraryStats {
  totalTracks: number;
  totalPlaylists: number;
  totalAlbums: number;
  offlineTracks: number;
  lastSyncAt?: Date;
}

interface AnalyticsData {
  listeningStats: ListeningStats[];
  libraryStats: LibraryStats;
  socialStats: {
    followers: number;
    following: number;
    totalLikes: number;
    totalShares: number;
  };
  offlineStats: {
    totalSizeGB: number;
    trackCount: number;
    usagePercentage: number;
  };
}

const COLORS = ['#1db954', '#1ed760', '#1aa34a', '#168f3a', '#137a32'];

export default function Analytics() {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  
  const { data: listeningStats, isLoading: statsLoading } = useQuery({
    queryKey: ['listening-stats', timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/listening?timeframe=${timeframe}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch listening stats');
      return response.json();
    }
  });

  const { data: libraryStats } = useQuery({
    queryKey: ['library-stats'],
    queryFn: async () => {
      const response = await fetch('/api/library/stats', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch library stats');
      return response.json();
    }
  });

  const { data: offlineStats } = useQuery({
    queryKey: ['offline-stats'],
    queryFn: async () => {
      const response = await fetch('/api/offline/stats', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch offline stats');
      return response.json();
    }
  });

  const { data: socialStats } = useQuery({
    queryKey: ['social-stats'],
    queryFn: async () => {
      const [followersRes, followingRes] = await Promise.all([
        fetch('/api/social/followers', { credentials: 'include' }),
        fetch('/api/social/following', { credentials: 'include' })
      ]);
      
      const followers = await followersRes.json();
      const following = await followingRes.json();
      
      return {
        followers: followers.followers?.length || 0,
        following: following.following?.length || 0,
        totalLikes: 0, // Would need to implement likes tracking
        totalShares: 0, // Would need to implement shares tracking
      };
    }
  });

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getTopTracks = () => {
    if (!listeningStats?.stats) return [];
    return listeningStats.stats.slice(0, 10);
  };

  const getTopArtists = () => {
    if (!listeningStats?.stats) return [];
    const artistMap = new Map();
    
    listeningStats.stats.forEach((track: ListeningStats) => {
      const artist = track.artist_name;
      if (artistMap.has(artist)) {
        artistMap.set(artist, {
          ...artistMap.get(artist),
          play_count: artistMap.get(artist).play_count + track.play_count,
          total_duration: artistMap.get(artist).total_duration + track.total_duration
        });
      } else {
        artistMap.set(artist, {
          name: artist,
          play_count: track.play_count,
          total_duration: track.total_duration
        });
      }
    });
    
    return Array.from(artistMap.values())
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, 10);
  };

  const getListeningTrend = () => {
    // Mock data - in real implementation, this would come from the backend
    return [
      { date: '2024-01-01', minutes: 120 },
      { date: '2024-01-02', minutes: 95 },
      { date: '2024-01-03', minutes: 180 },
      { date: '2024-01-04', minutes: 150 },
      { date: '2024-01-05', minutes: 200 },
      { date: '2024-01-06', minutes: 175 },
      { date: '2024-01-07', minutes: 220 }
    ];
  };

  const getTotalListeningTime = () => {
    if (!listeningStats?.stats) return 0;
    return listeningStats.stats.reduce((total: number, track: ListeningStats) => 
      total + track.total_duration, 0
    );
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibetune-green"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-vibetune-text-muted mt-2">
            Insights into your music listening habits
          </p>
        </div>
        <Select value={timeframe} onValueChange={(value: 'week' | 'month' | 'year') => setTimeframe(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-vibetune-gray border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Listening Time</CardTitle>
            <Clock className="h-4 w-4 text-vibetune-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatDuration(getTotalListeningTime())}
            </div>
            <p className="text-xs text-vibetune-text-muted">
              {timeframe === 'week' ? '+12%' : timeframe === 'month' ? '+23%' : '+15%'} from last {timeframe}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-vibetune-gray border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Tracks Played</CardTitle>
            <Music className="h-4 w-4 text-vibetune-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {listeningStats?.stats ? listeningStats.stats.reduce((total: number, track: ListeningStats) => total + track.play_count, 0) : 0}
            </div>
            <p className="text-xs text-vibetune-text-muted">
              Unique tracks: {listeningStats?.stats?.length || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-vibetune-gray border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Library Size</CardTitle>
            <Download className="h-4 w-4 text-vibetune-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {libraryStats?.stats?.totalTracks || 0}
            </div>
            <p className="text-xs text-vibetune-text-muted">
              {libraryStats?.stats?.offlineTracks || 0} offline
            </p>
          </CardContent>
        </Card>

        <Card className="bg-vibetune-gray border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Social</CardTitle>
            <Users className="h-4 w-4 text-vibetune-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {(socialStats?.followers || 0) + (socialStats?.following || 0)}
            </div>
            <p className="text-xs text-vibetune-text-muted">
              {socialStats?.followers || 0} followers, {socialStats?.following || 0} following
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-vibetune-gray">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tracks">Top Tracks</TabsTrigger>
          <TabsTrigger value="artists">Top Artists</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Listening Trend Chart */}
            <Card className="bg-vibetune-gray border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Listening Trend</CardTitle>
                <CardDescription>Daily listening time over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getListeningTrend()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a1a', 
                        border: '1px solid #333',
                        color: '#fff'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="minutes" 
                      stroke="#1db954" 
                      fill="#1db954" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Genres */}
            <Card className="bg-vibetune-gray border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Storage Usage</CardTitle>
                <CardDescription>Offline music storage breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-vibetune-text-muted">Used Storage</span>
                    <span className="text-sm font-medium text-white">
                      {offlineStats?.stats?.totalSizeGB.toFixed(2) || 0} GB
                    </span>
                  </div>
                  <Progress 
                    value={offlineStats?.stats?.usagePercentage || 0} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs text-vibetune-text-muted">
                    <span>{offlineStats?.stats?.trackCount || 0} tracks</span>
                    <span>{offlineStats?.stats?.usagePercentage?.toFixed(1) || 0}% of limit</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tracks" className="space-y-6">
          <Card className="bg-vibetune-gray border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Your Top Tracks</CardTitle>
              <CardDescription>Most played tracks in the selected timeframe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getTopTracks().map((track, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800 transition-colors">
                    <div className="flex-shrink-0 w-8 text-center">
                      <span className="text-lg font-bold text-vibetune-green">#{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {track.track_name}
                      </p>
                      <p className="text-xs text-vibetune-text-muted truncate">
                        {track.artist_name} • {track.album_name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-vibetune-text-muted">
                      <div className="flex items-center">
                        <PlayCircle className="h-3 w-3 mr-1" />
                        {track.play_count}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(track.total_duration)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="artists" className="space-y-6">
          <Card className="bg-vibetune-gray border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Your Top Artists</CardTitle>
              <CardDescription>Most listened to artists in the selected timeframe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getTopArtists().map((artist, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800 transition-colors">
                    <div className="flex-shrink-0 w-8 text-center">
                      <span className="text-lg font-bold text-vibetune-green">#{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {artist.name}
                      </p>
                      <p className="text-xs text-vibetune-text-muted">
                        {artist.play_count} plays • {formatDuration(artist.total_duration)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-vibetune-gray border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Library Overview</CardTitle>
                <CardDescription>Your music library statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-vibetune-text-muted">Total Tracks</span>
                    <Badge variant="secondary">{libraryStats?.stats?.totalTracks || 0}</Badge>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-vibetune-text-muted">Playlists</span>
                    <Badge variant="secondary">{libraryStats?.stats?.totalPlaylists || 0}</Badge>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-vibetune-text-muted">Albums</span>
                    <Badge variant="secondary">{libraryStats?.stats?.totalAlbums || 0}</Badge>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-vibetune-text-muted">Offline Tracks</span>
                    <Badge variant="outline" className="text-vibetune-green border-vibetune-green">
                      {libraryStats?.stats?.offlineTracks || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-vibetune-gray border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Last Sync</CardTitle>
                <CardDescription>Library synchronization status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <Calendar className="h-12 w-12 text-vibetune-green mx-auto mb-4" />
                  <p className="text-sm text-white">
                    {libraryStats?.stats?.lastSyncAt 
                      ? new Date(libraryStats.stats.lastSyncAt).toLocaleString()
                      : 'Never synchronized'
                    }
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4 border-vibetune-green text-vibetune-green hover:bg-vibetune-green hover:text-black"
                  >
                    Sync Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}