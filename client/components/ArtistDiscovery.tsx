import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Users,
  Music,
  Play,
  Heart,
  Share2,
  ExternalLink,
  TrendingUp,
  Star,
  Headphones,
} from 'lucide-react';
import { useMusicPlayer } from '@/contexts/EnhancedMusicPlayerContext';
import { cn } from '@/lib/utils';

interface Artist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers?: { total: number };
  images: Array<{ url: string; height: number; width: number }>;
  external_urls: { spotify: string };
}

interface Track {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
  popularity: number;
  preview_url?: string;
  external_urls?: { spotify: string };
}

interface RelatedArtist extends Artist {
  connection_strength: number;
  shared_genres: string[];
}

const MARKET = 'IN';

function searchArtistsUrl(query: string, limit = 24) {
  const params = new URLSearchParams({
    q: query,
    type: 'artist',
    limit: String(limit),
    market: MARKET,
  });
  return `/api/spotify/search?${params.toString()}`;
}

const ArtistDiscovery: React.FC = () => {
  const { playTrack } = useMusicPlayer();
  const [searchQuery, setSearchQuery] = useState('');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [relatedArtists, setRelatedArtists] = useState<RelatedArtist[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'discover' | 'related' | 'tracks'>('discover');

  const parseArtistSearch = async (res: Response) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof data?.error === 'string' ? data.error : 'Search failed');
    }
    return (data.artists?.items ?? []) as Artist[];
  };

  const loadInitialArtists = useCallback(async () => {
    setInitialLoading(true);
    setError(null);
    const queries = ['genre:pop', 'genre:hip hop', 'a'];
    for (const q of queries) {
      try {
        const res = await fetch(searchArtistsUrl(q, 24));
        const items = await parseArtistSearch(res);
        if (items.length > 0) {
          setArtists(items);
          setInitialLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Initial artist load attempt failed:', q, e);
      }
    }
    setArtists([]);
    setError('Could not load suggested artists. Check Spotify API credentials and try searching above.');
    setInitialLoading(false);
  }, []);

  useEffect(() => {
    loadInitialArtists();
  }, [loadInitialArtists]);

  const searchArtists = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(searchArtistsUrl(searchQuery.trim(), 24));
      const items = await parseArtistSearch(res);
      setArtists(items);
      if (items.length === 0) {
        setError('No artists found. Try a different name.');
      }
    } catch (e) {
      console.error('Error searching artists:', e);
      setError(e instanceof Error ? e.message : 'Search failed');
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtistDetails = useCallback(async (artist: Artist) => {
    setDetailLoading(true);
    setError(null);
    setRelatedArtists([]);
    setTopTracks([]);

    let base: Artist = artist;

    try {
      const fullRes = await fetch(`/api/spotify/artist/${artist.id}`);
      if (fullRes.ok) {
        const full = await fullRes.json();
        base = { ...artist, ...full };
        setSelectedArtist(base);
      } else {
        setSelectedArtist(artist);
      }
    } catch (e) {
      console.warn('Artist profile fetch:', e);
      setSelectedArtist(artist);
    }

    try {
      const relatedRes = await fetch(`/api/spotify/artist/${artist.id}/related-artists`);
      if (relatedRes.ok) {
        const relatedData = await relatedRes.json();
        const rawRelated: Artist[] = relatedData.artists ?? [];
        const processedRelated: RelatedArtist[] = rawRelated.map((related) => ({
          ...related,
          genres: related.genres ?? [],
          followers: related.followers ?? { total: 0 },
          images: related.images ?? [],
          external_urls: related.external_urls ?? { spotify: '' },
          connection_strength: Math.min(
            100,
            (base.genres ?? []).filter((g) => (related.genres ?? []).includes(g)).length * 20 +
              (related.popularity ?? 0) * 0.3
          ),
          shared_genres: (base.genres ?? []).filter((genre) => (related.genres ?? []).includes(genre)),
        }));
        setRelatedArtists(processedRelated);
      } else {
        setRelatedArtists([]);
        const err = await relatedRes.json().catch(() => ({}));
        setError((prev) => prev || (typeof err?.error === 'string' ? err.error : 'Related artists could not be loaded.'));
      }
    } catch (e) {
      console.error('Related artists:', e);
      setRelatedArtists([]);
      setError((prev) => prev || 'Related artists could not be loaded.');
    }

    try {
      const tracksRes = await fetch(`/api/spotify/artist/${artist.id}/top-tracks?market=${MARKET}`);
      if (tracksRes.ok) {
        const tracksData = await tracksRes.json();
        setTopTracks(tracksData.tracks ?? []);
      } else {
        setTopTracks([]);
        const err = await tracksRes.json().catch(() => ({}));
        setError((prev) => prev || (typeof err?.error === 'string' ? err.error : 'Top tracks could not be loaded.'));
      }
    } catch (e) {
      console.error('Top tracks:', e);
      setTopTracks([]);
      setError((prev) => prev || 'Top tracks could not be loaded.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const selectArtist = (artist: Artist) => {
    setSelectedArtist(artist);
    void fetchArtistDetails(artist);
  };

  const goToTab = (tab: 'discover' | 'related' | 'tracks') => {
    setActiveTab(tab);
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const playArtistTrack = async (track: Track) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Artist Discovery
          </h1>
          <p className="text-muted-foreground">Explore artists and discover new music connections</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Artists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search for artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchArtists()}
            />
            <Button onClick={searchArtists} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedArtist && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={selectedArtist.images?.[0]?.url} alt={selectedArtist.name} />
                <AvatarFallback className="text-2xl">{selectedArtist.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-3xl font-bold">{selectedArtist.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {selectedArtist.popularity ?? 0}% Popular
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {formatFollowers(selectedArtist.followers?.total ?? 0)} followers
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(selectedArtist.genres ?? []).slice(0, 5).map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" asChild>
                    <a href={selectedArtist.external_urls?.spotify || '#'} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in Spotify
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" type="button">
                    <Heart className="h-4 w-4 mr-2" />
                    Follow
                  </Button>
                  <Button size="sm" variant="outline" type="button">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div
        className="flex flex-wrap gap-2 p-1 rounded-lg bg-black/30 border border-white/10"
        role="tablist"
        aria-label="Artist discovery sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'discover'}
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'discover'
              ? 'bg-emerald-500 text-black shadow'
              : 'text-zinc-300 hover:bg-white/10 hover:text-white'
          )}
          onClick={() => goToTab('discover')}
        >
          Discover Artists
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'related'}
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'related'
              ? 'bg-emerald-500 text-black shadow'
              : 'text-zinc-300 hover:bg-white/10 hover:text-white'
          )}
          onClick={() => goToTab('related')}
        >
          Related Artists
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'tracks'}
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'tracks'
              ? 'bg-emerald-500 text-black shadow'
              : 'text-zinc-300 hover:bg-white/10 hover:text-white'
          )}
          onClick={() => goToTab('tracks')}
        >
          Top Tracks
        </button>
      </div>

      {activeTab === 'discover' && (
        <div>
          {(initialLoading || loading) && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Headphones className="h-8 w-8 animate-pulse mr-2" />
              Loading artists…
            </div>
          )}
          {!initialLoading && !loading && artists.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No artists yet. Use search or refresh the page.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artists.map((artist) => (
              <Card
                key={artist.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                onClick={() => selectArtist(artist)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={artist.images?.[0]?.url} alt={artist.name} />
                      <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{artist.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatFollowers(artist.followers?.total ?? 0)} followers
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">{artist.popularity ?? 0}% popular</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(artist.genres ?? []).slice(0, 3).map((genre) => (
                      <Badge key={genre} variant="outline" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'related' && (
        <div className="space-y-4 min-h-[200px]" role="tabpanel">
          {!selectedArtist ? (
            <div className="rounded-lg border border-dashed border-white/20 p-8 text-center text-zinc-400">
              <p className="font-medium text-white mb-1">No artist selected</p>
              <p className="text-sm mb-4">Open <strong>Discover Artists</strong> and click an artist card first. Related artists load automatically.</p>
              <Button type="button" variant="secondary" onClick={() => goToTab('discover')}>
                Go to Discover
              </Button>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-white">Artists similar to {selectedArtist.name}</h3>
              {detailLoading && (
                <p className="text-zinc-400 text-sm">Loading related artists…</p>
              )}
              {!detailLoading && relatedArtists.length === 0 && (
                <p className="text-zinc-400">No related artists returned for this artist.</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedArtists.map((artist) => (
              <Card
                key={artist.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                onClick={() => selectArtist(artist)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={artist.images?.[0]?.url} alt={artist.name} />
                      <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{artist.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatFollowers(artist.followers?.total ?? 0)} followers
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {artist.connection_strength.toFixed(0)}% match
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {artist.popularity ?? 0}% popular
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {artist.shared_genres.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">Shared genres:</p>
                      <div className="flex flex-wrap gap-1">
                        {artist.shared_genres.slice(0, 3).map((genre) => (
                          <Badge key={genre} variant="outline" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'tracks' && (
        <div className="space-y-4 min-h-[200px]" role="tabpanel">
          {!selectedArtist ? (
            <div className="rounded-lg border border-dashed border-white/20 p-8 text-center text-zinc-400">
              <p className="font-medium text-white mb-1">No artist selected</p>
              <p className="text-sm mb-4">Open <strong>Discover Artists</strong> and click an artist card first. Top tracks load automatically.</p>
              <Button type="button" variant="secondary" onClick={() => goToTab('discover')}>
                Go to Discover
              </Button>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-white">Top tracks — {selectedArtist.name}</h3>
              {detailLoading && (
                <p className="text-zinc-400 text-sm">Loading top tracks…</p>
              )}
              {!detailLoading && topTracks.length === 0 && (
                <p className="text-zinc-400">No top tracks returned for this artist.</p>
              )}
              <div className="space-y-2">
                {topTracks.map((track, index) => (
              <Card key={track.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-muted-foreground w-8">{index + 1}</div>
                    <div className="w-12 h-12 rounded overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {track.album?.images?.[0]?.url ? (
                        <img src={track.album.images[0].url} alt="" className="w-12 h-12 object-cover" />
                      ) : (
                        <Music className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{track.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{track.album?.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {track.popularity ?? 0}% popular
                      </Badge>
                      <span className="text-sm text-muted-foreground">{formatDuration(track.duration_ms)}</span>
                      <Button size="sm" variant="ghost" type="button" onClick={() => playArtistTrack(track)}>
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" type="button" aria-label="Like">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ArtistDiscovery;
