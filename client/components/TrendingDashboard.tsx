import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Music, Users, Clock, Star, Play, Heart, Share2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useMusicPlayer } from '@/contexts/EnhancedMusicPlayerContext';

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
  list_rank: number;
}

interface TrendingArtistRow {
  name: string;
  id: string;
  popularity: number;
  trend: number;
  tracksOnTrendingList: number;
  imageUrl?: string;
}

interface TrendingData {
  tracks: TrendingTrack[];
  genres: Array<{ name: string; count: number; trend: number }>;
  artists: TrendingArtistRow[];
  playlistName: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

const TrendingDashboard: React.FC = () => {
  const { playTrack } = useMusicPlayer();
  const [trendingData, setTrendingData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;

    const fetchTrendingData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/spotify/trending/india');
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            typeof data?.error === 'string' ? data.error : 'Could not load trending songs for India'
          );
        }

        if (cancelled) return;

        const tracks: TrendingTrack[] = (data.tracks ?? []).map((t: any, index: number) => ({
          id: t.id,
          name: t.name,
          artists: (t.artists ?? []).map((a: { id: string; name: string }) => ({
            id: a.id,
            name: a.name,
          })),
          album: {
            name: t.album?.name ?? '',
            images: t.album?.images ?? [],
          },
          popularity: t.popularity ?? 0,
          preview_url: t.preview_url ?? undefined,
          external_urls: t.external_urls ?? { spotify: '' },
          duration_ms: t.duration_ms ?? 0,
          explicit: !!t.explicit,
          list_rank: index + 1,
          trend_score: Math.max(0, 100 - index * 2),
          play_count: Math.round((t.popularity ?? 0) * 12000),
          like_count: Math.round((t.popularity ?? 0) * 800),
        }));

        const artists: TrendingArtistRow[] = (data.artists ?? []).map((a: any) => ({
          name: a.name,
          id: a.id,
          popularity: a.popularity ?? 0,
          trend: a.trend ?? 0,
          tracksOnTrendingList: a.tracksOnTrendingList ?? a.chartAppearances ?? 0,
          imageUrl: a.imageUrl,
        }));

        const genres: Array<{ name: string; count: number; trend: number }> = data.genres ?? [];

        setTrendingData({
          tracks,
          artists,
          genres,
          playlistName: data.playlistName ?? 'Trending in India',
        });
      } catch (e) {
        if (!cancelled) {
          console.error('Error fetching India trending:', e);
          setError(e instanceof Error ? e.message : 'Failed to load');
          setTrendingData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTrendingData();
    const interval = setInterval(fetchTrendingData, 300000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const filteredGenres = useMemo(() => {
    if (!trendingData?.genres) return [];
    if (selectedGenre === 'all') return trendingData.genres;
    return trendingData.genres.filter((g) => g.name === selectedGenre);
  }, [trendingData?.genres, selectedGenre]);

  const avgDurationLabel = useMemo(() => {
    const tracks = trendingData?.tracks ?? [];
    if (!tracks.length) return '—';
    const ms = tracks.reduce((s, t) => s + (t.duration_ms || 0), 0) / tracks.length;
    const m = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }, [trendingData?.tracks]);

  const handlePlayTrack = async (track: TrendingTrack) => {
    try {
      await playTrack({
        id: track.id,
        title: track.name,
        artist: track.artists.map((a) => a.name).join(', '),
        albumArt: track.album?.images?.[0]?.url || '',
        duration: track.duration_ms,
        url: track.preview_url || track.external_urls?.spotify || '',
        spotifyId: track.id,
        previewUrl: track.preview_url,
        isSpotifyTrack: true,
        quality: 'high',
      });
    } catch (err) {
      console.error('Play failed:', err);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading && !trendingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !trendingData) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive font-medium">{error}</p>
        <p className="text-sm text-muted-foreground mt-2">
          The server needs valid Spotify API credentials (SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET). You can still use
          the app logged in with Spotify—try refreshing. Check your network if the error continues.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Trending in India
          </h1>
          <p className="text-muted-foreground">
            Trending songs and artists in India (Spotify market IN). Source: {trendingData?.playlistName ?? 'editorial playlists'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Genre filter</span>
          <select
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            <option value="all">All genres</option>
            {(trendingData?.genres ?? []).map((g) => (
              <option key={g.name} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trending songs</p>
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
                <p className="text-sm font-medium text-muted-foreground">Trending artists</p>
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
                <p className="text-sm font-medium text-muted-foreground">Genres (from artists)</p>
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
                <p className="text-sm font-medium text-muted-foreground">Avg. track length</p>
                <p className="text-2xl font-bold">{avgDurationLabel}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tracks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tracks">Trending tracks</TabsTrigger>
          <TabsTrigger value="genres">Genres</TabsTrigger>
          <TabsTrigger value="artists">Trending artists</TabsTrigger>
          <TabsTrigger value="analytics">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="tracks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hot trending tracks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trendingData?.tracks.slice(0, 10).map((track, index) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="text-2xl font-bold text-muted-foreground w-8">{index + 1}</div>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shrink-0">
                        {track.album?.images?.[0]?.url ? (
                          <img
                            src={track.album.images[0].url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Music className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{track.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {track.artists.map((a) => a.name).join(', ')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDuration(track.duration_ms)} · Popularity {track.popularity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          #{track.list_rank}
                        </Badge>
                        <Button size="sm" variant="ghost" type="button" onClick={() => handlePlayTrack(track)}>
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" type="button" aria-label="Like">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" type="button" aria-label="Share">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rank vs popularity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={trendingData?.tracks.slice(0, 10).map((track) => ({
                      name: track.name.length > 12 ? `${track.name.slice(0, 12)}…` : track.name,
                      rankScore: track.trend_score,
                      popularity: track.popularity,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="rankScore" stroke="#8884d8" strokeWidth={2} name="Trend score" />
                    <Line type="monotone" dataKey="popularity" stroke="#82ca9d" strokeWidth={2} name="Spotify popularity" />
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
                <CardTitle>Genre mix (from trending artists)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={filteredGenres.length ? filteredGenres : trendingData?.genres}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(filteredGenres.length ? filteredGenres : trendingData?.genres ?? []).map((_, index) => (
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
                <CardTitle>Genre weight</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredGenres.length ? filteredGenres : trendingData?.genres}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
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
                <CardTitle>Trending artists</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trendingData?.artists.slice(0, 10).map((artist, index) => (
                    <div
                      key={artist.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="text-2xl font-bold text-muted-foreground w-8">{index + 1}</div>
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shrink-0">
                        {artist.imageUrl ? (
                          <img src={artist.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{artist.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {artist.tracksOnTrendingList} songs on this list · Spotify popularity {artist.popularity}
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
                <CardTitle>Artist popularity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendingData?.artists.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 9 }} />
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
                <CardTitle>Popularity distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={trendingData?.tracks.slice(0, 8).map((track, index) => ({
                      name: `Rank ${index + 1}`,
                      popularity: track.popularity,
                      trend: track.trend_score,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="popularity" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="trend" stroke="#ff7300" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement (derived from Spotify popularity)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total popularity index</span>
                    <span className="text-lg font-bold">
                      {trendingData?.tracks.reduce((sum, track) => sum + track.popularity, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg. popularity</span>
                    <span className="text-lg font-bold">
                      {trendingData?.tracks.length
                        ? Math.round(
                            trendingData.tracks.reduce((s, t) => s + t.popularity, 0) / trendingData.tracks.length
                          )
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg. trend score</span>
                    <span className="text-lg font-bold">
                      {Math.round(
                        (trendingData?.tracks.reduce((sum, track) => sum + track.trend_score, 0) || 0) /
                          (trendingData?.tracks.length || 1)
                      )}
                      %
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
