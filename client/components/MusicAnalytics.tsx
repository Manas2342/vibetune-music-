import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Music, 
  Clock, 
  Heart, 
  Play, 
  Download,
  Calendar,
  Headphones,
  Zap,
  Target,
  Activity,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';

interface Track {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
  popularity: number;
  played_at?: string;
}

interface Artist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: { total: number };
  images: Array<{ url: string }>;
}

interface AnalyticsData {
  topTracks: Track[];
  topArtists: Artist[];
  recentlyPlayed: Track[];
  listeningTime: number;
  totalTracks: number;
  favoriteGenres: Array<{ genre: string; count: number }>;
  listeningPatterns: Array<{ hour: number; plays: number }>;
  audioFeatures: {
    danceability: number;
    energy: number;
    valence: number;
    acousticness: number;
    instrumentalness: number;
    liveness: number;
    speechiness: number;
  };
}

const MusicAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'short' | 'medium' | 'long'>('medium');
  const [activeChart, setActiveChart] = useState<'overview' | 'genres' | 'patterns' | 'features'>('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch top tracks
      const topTracksResponse = await fetch(`/api/spotify/top/tracks?time_range=${timeRange}_term&limit=20`);
      const topTracksData = await topTracksResponse.json();
      
      // Fetch top artists
      const topArtistsResponse = await fetch(`/api/spotify/top/artists?time_range=${timeRange}_term&limit=20`);
      const topArtistsData = await topArtistsResponse.json();
      
      // Fetch recently played
      const recentResponse = await fetch('/api/spotify/recently-played?limit=50');
      const recentData = await recentResponse.json();
      
      // Process the data
      const processedData: AnalyticsData = {
        topTracks: topTracksData.items || [],
        topArtists: topArtistsData.items || [],
        recentlyPlayed: recentData.items?.map((item: any) => item.track) || [],
        listeningTime: calculateListeningTime(topTracksData.items || []),
        totalTracks: topTracksData.items?.length || 0,
        favoriteGenres: processGenres(topArtistsData.items || []),
        listeningPatterns: processListeningPatterns(recentData.items || []),
        audioFeatures: {
          danceability: 0.7,
          energy: 0.8,
          valence: 0.6,
          acousticness: 0.3,
          instrumentalness: 0.1,
          liveness: 0.2,
          speechiness: 0.1
        }
      };
      
      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateListeningTime = (tracks: Track[]) => {
    return tracks.reduce((total, track) => total + track.duration_ms, 0);
  };

  const processGenres = (artists: Artist[]) => {
    const genreCount: { [key: string]: number } = {};
    artists.forEach(artist => {
      artist.genres.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });
    
    return Object.entries(genreCount)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  const processListeningPatterns = (recentItems: any[]) => {
    const hourCount: { [key: number]: number } = {};
    recentItems.forEach(item => {
      const hour = new Date(item.played_at).getHours();
      hourCount[hour] = (hourCount[hour] || 0) + 1;
    });
    
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      plays: hourCount[i] || 0
    }));
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (hour: number) => {
    return `${hour}:00`;
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#87d068', '#ffc0cb'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Music Analytics
          </h1>
          <p className="text-muted-foreground">Insights into your music listening habits</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === 'short' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('short')}
          >
            Last 4 weeks
          </Button>
          <Button
            variant={timeRange === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('medium')}
          >
            Last 6 months
          </Button>
          <Button
            variant={timeRange === 'long' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('long')}
          >
            All time
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Listening Time</p>
                <p className="text-2xl font-bold">{formatDuration(analyticsData.listeningTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Music className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tracks Played</p>
                <p className="text-2xl font-bold">{analyticsData.totalTracks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Artists</p>
                <p className="text-2xl font-bold">{analyticsData.topArtists.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Popularity</p>
                <p className="text-2xl font-bold">
                  {Math.round(analyticsData.topTracks.reduce((sum, track) => sum + track.popularity, 0) / analyticsData.topTracks.length) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Navigation */}
      <div className="flex gap-2">
        <Button
          variant={activeChart === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveChart('overview')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeChart === 'genres' ? 'default' : 'outline'}
          onClick={() => setActiveChart('genres')}
        >
          <PieChartIcon className="h-4 w-4 mr-2" />
          Genres
        </Button>
        <Button
          variant={activeChart === 'patterns' ? 'default' : 'outline'}
          onClick={() => setActiveChart('patterns')}
        >
          <Activity className="h-4 w-4 mr-2" />
          Patterns
        </Button>
        <Button
          variant={activeChart === 'features' ? 'default' : 'outline'}
          onClick={() => setActiveChart('features')}
        >
          <Target className="h-4 w-4 mr-2" />
          Audio Features
        </Button>
      </div>

      {/* Charts */}
      {activeChart === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Tracks</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.topTracks.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="popularity" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Artists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.topArtists.slice(0, 5).map((artist, index) => (
                  <div key={artist.id} className="flex items-center gap-3">
                    <div className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={artist.images[0]?.url} alt={artist.name} />
                      <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{artist.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFollowers(artist.followers.total)} followers
                      </p>
                    </div>
                    <Badge variant="secondary">{artist.popularity}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeChart === 'genres' && (
        <Card>
          <CardHeader>
            <CardTitle>Favorite Genres</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={analyticsData.favoriteGenres}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ genre, percent }) => `${genre} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.favoriteGenres.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {activeChart === 'patterns' && (
        <Card>
          <CardHeader>
            <CardTitle>Listening Patterns by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.listeningPatterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={formatTime}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(hour) => `${hour}:00`}
                  formatter={(value) => [`${value} plays`, 'Plays']}
                />
                <Area 
                  type="monotone" 
                  dataKey="plays" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {activeChart === 'features' && (
        <Card>
          <CardHeader>
            <CardTitle>Audio Features Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(analyticsData.audioFeatures).map(([feature, value]) => (
                <div key={feature} className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-2">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - value)}`}
                        className="text-primary"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{Math.round(value * 100)}%</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium capitalize">{feature}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.recentlyPlayed.slice(0, 10).map((track) => (
              <div key={track.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-12 h-12 rounded overflow-hidden bg-muted flex items-center justify-center">
                  {track.album?.images?.[0]?.url ? (
                    <img 
                      src={track.album.images[0].url} 
                      alt={track.name} 
                      className="w-12 h-12 object-cover" 
                    />
                  ) : (
                    <Music className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{track.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {track.artists.map(a => a.name).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {track.popularity}%
                  </Badge>
                  <Button size="sm" variant="ghost">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const formatFollowers = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

export default MusicAnalytics;
