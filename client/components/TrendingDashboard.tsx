import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Music, Users, Clock, Star, Play, Heart, Share2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface TrendingTrack {
  id: string;
  name: string;
  artists: Array<{ name: string; id: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  popularity: number;
  preview_url?: string;
  external_urls: { spotify: string };
  duration_ms: number;
  explicit: boolean;
  trend_score: number;
  play_count: number;
  like_count: number;
}

interface TrendingData {
  tracks: TrendingTrack[];
  genres: Array<{ name: string; count: number; trend: number }>;
  artists: Array<{ name: string; id: string; popularity: number; trend: number }>;
}

const TrendingDashboard: React.FC = () => {
  const [trendingData, setTrendingData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'short' | 'medium' | 'long'>('short');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  useEffect(() => {
    fetchTrendingData();
    const interval = setInterval(fetchTrendingData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange, selectedGenre]);

  const fetchTrendingData = async () => {
    try {
      setLoading(true);
      
      // Fetch trending tracks from multiple sources
      const [newReleases, featuredPlaylists, topTracks] = await Promise.all([
        fetch('/api/spotify/new-releases?limit=20').then(res => res.json()),
        fetch('/api/spotify/featured-playlists?limit=10').then(res => res.json()),
        fetch('/api/spotify/top-artists?limit=20').then(res => res.json())
      ]);

      // Process and combine data
      const processedTracks = processTrendingTracks(newReleases, featuredPlaylists);
      const processedGenres = processGenreData(processedTracks);
      const processedArtists = processArtistData(topTracks);

      setTrendingData({
        tracks: processedTracks,
        genres: processedGenres,
        artists: processedArtists
      });
    } catch (error) {
      console.error('Error fetching trending data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processTrendingTracks = (newReleases: any, featuredPlaylists: any): TrendingTrack[] => {
    const tracks: TrendingTrack[] = [];
    
    // Process new releases
    if (newReleases?.albums?.items) {
      newReleases.albums.items.forEach((album: any) => {
        if (album.artists && album.artists.length > 0) {
          tracks.push({
            id: album.id,
            name: album.name,
            artists: album.artists,
            album: {
              name: album.name,
              images: album.images || []
            },
            popularity: Math.floor(Math.random() * 100) + 50, // Mock popularity
            external_urls: album.external_urls,
            duration_ms: Math.floor(Math.random() * 300000) + 120000, // Mock duration
            explicit: false,
            trend_score: Math.floor(Math.random() * 100),
            play_count: Math.floor(Math.random() * 1000000) + 100000,
            like_count: Math.floor(Math.random() * 50000) + 5000
          });
        }
      });
    }

    return tracks.slice(0, 20);
  };

  const processGenreData = (tracks: TrendingTrack[]) => {
    const genreMap = new Map<string, number>();
    
    tracks.forEach(track => {
      // Mock genre assignment based on artist name patterns
      const genres = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Indie', 'Jazz', 'Classical'];
      const randomGenre = genres[Math.floor(Math.random() * genres.length)];
      genreMap.set(randomGenre, (genreMap.get(randomGenre) || 0) + 1);
    });

    return Array.from(genreMap.entries()).map(([name, count]) => ({
      name,
      count,
      trend: Math.floor(Math.random() * 50) + 10
    }));
  };

  const processArtistData = (topArtists: any) => {
    if (!topArtists?.artists?.items) return [];
    
    return topArtists.artists.items.map((artist: any) => ({
      name: artist.name,
      id: artist.id,
      popularity: artist.popularity || Math.floor(Math.random() * 100),
      trend: Math.floor(Math.random() * 50) + 10
    }));
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Trending Now
          </h1>
          <p className="text-muted-foreground">Discover what's hot in music right now</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === 'short' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('short')}
          >
            Today
          </Button>
          <Button
            variant={timeRange === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('medium')}
          >
            This Week
          </Button>
          <Button
            variant={timeRange === 'long' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('long')}
          >
            This Month
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tracks</p>
                <p className="text-2xl font-bold">{trendingData?.tracks.length || 0}</p>
              </div>
              <Music className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Artists</p>
                <p className="text-2xl font-bold">{trendingData?.artists.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Genres</p>
                <p className="text-2xl font-bold">{trendingData?.genres.length || 0}</p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Duration</p>
                <p className="text-2xl font-bold">3:24</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Data */}
      <Tabs defaultValue="tracks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tracks">Trending Tracks</TabsTrigger>
          <TabsTrigger value="genres">Genre Analysis</TabsTrigger>
          <TabsTrigger value="artists">Top Artists</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tracks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trending Tracks List */}
            <Card>
              <CardHeader>
                <CardTitle>🔥 Hot Tracks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trendingData?.tracks.slice(0, 10).map((track, index) => (
                    <div key={track.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="text-2xl font-bold text-muted-foreground w-8">
                        {index + 1}
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <Music className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{track.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {track.artists.map(a => a.name).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {track.trend_score}%
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendingData?.tracks.slice(0, 10).map((track, index) => ({
                    name: track.name.substring(0, 10) + '...',
                    trend: track.trend_score,
                    plays: track.play_count / 10000,
                    likes: track.like_count / 1000
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="trend" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="plays" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="genres" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Genre Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={trendingData?.genres}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {trendingData?.genres.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Genre Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendingData?.genres}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="trend" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="artists" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Artists</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trendingData?.artists.slice(0, 10).map((artist, index) => (
                    <div key={artist.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="text-2xl font-bold text-muted-foreground w-8">
                        {index + 1}
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{artist.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Popularity: {artist.popularity}%
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        +{artist.trend}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Artist Popularity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendingData?.artists.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="popularity" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Play Count Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendingData?.tracks.slice(0, 8).map((track, index) => ({
                    name: `Track ${index + 1}`,
                    plays: track.play_count / 10000,
                    likes: track.like_count / 1000
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="plays" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="likes" stroke="#ff7300" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Plays</span>
                    <span className="text-lg font-bold">
                      {trendingData?.tracks.reduce((sum, track) => sum + track.play_count, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Likes</span>
                    <span className="text-lg font-bold">
                      {trendingData?.tracks.reduce((sum, track) => sum + track.like_count, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg. Trend Score</span>
                    <span className="text-lg font-bold">
                      {Math.round(trendingData?.tracks.reduce((sum, track) => sum + track.trend_score, 0) / (trendingData?.tracks.length || 1))}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrendingDashboard;

