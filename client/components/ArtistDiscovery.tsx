import React, { useState, useEffect } from 'react';
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
  Globe,
  Calendar,
  Headphones
} from 'lucide-react';

interface Artist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: { total: number };
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
}

interface RelatedArtist extends Artist {
  connection_strength: number;
  shared_genres: string[];
}

const ArtistDiscovery: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [relatedArtists, setRelatedArtists] = useState<RelatedArtist[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'related' | 'tracks'>('discover');

  const searchArtists = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}&type=artist&limit=20`);
      const data = await response.json();
      setArtists(data.artists?.items || []);
    } catch (error) {
      console.error('Error searching artists:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectArtist = async (artist: Artist) => {
    setSelectedArtist(artist);
    setActiveTab('related');
    
    try {
      // Fetch related artists
      const relatedResponse = await fetch(`/api/spotify/artist/${artist.id}/related-artists`);
      const relatedData = await relatedResponse.json();
      
      const processedRelated = (relatedData.artists || []).map((related: Artist) => ({
        ...related,
        connection_strength: Math.random() * 100, // Mock connection strength
        shared_genres: artist.genres.filter(genre => related.genres.includes(genre))
      }));
      
      setRelatedArtists(processedRelated);
      
      // Fetch top tracks
      const tracksResponse = await fetch(`/api/spotify/artist/${artist.id}/top-tracks?market=US`);
      const tracksData = await tracksResponse.json();
      setTopTracks(tracksData.tracks || []);
    } catch (error) {
      console.error('Error fetching artist details:', error);
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Artist Discovery
          </h1>
          <p className="text-muted-foreground">Explore artists and discover new music connections</p>
        </div>
      </div>

      {/* Search */}
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
              onKeyPress={(e) => e.key === 'Enter' && searchArtists()}
            />
            <Button onClick={searchArtists} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Artist Info */}
      {selectedArtist && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={selectedArtist.images[0]?.url} alt={selectedArtist.name} />
                <AvatarFallback className="text-2xl">
                  {selectedArtist.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-3xl font-bold">{selectedArtist.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {selectedArtist.popularity}% Popular
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {formatFollowers(selectedArtist.followers.total)} followers
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedArtist.genres.slice(0, 5).map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Spotify
                  </Button>
                  <Button size="sm" variant="outline">
                    <Heart className="h-4 w-4 mr-2" />
                    Follow
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'discover' ? 'default' : 'outline'}
          onClick={() => setActiveTab('discover')}
        >
          Discover Artists
        </Button>
        <Button
          variant={activeTab === 'related' ? 'default' : 'outline'}
          onClick={() => setActiveTab('related')}
          disabled={!selectedArtist}
        >
          Related Artists
        </Button>
        <Button
          variant={activeTab === 'tracks' ? 'default' : 'outline'}
          onClick={() => setActiveTab('tracks')}
          disabled={!selectedArtist}
        >
          Top Tracks
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'discover' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {artists.map((artist) => (
            <Card 
              key={artist.id} 
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
              onClick={() => selectArtist(artist)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={artist.images[0]?.url} alt={artist.name} />
                    <AvatarFallback>
                      {artist.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{artist.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatFollowers(artist.followers.total)} followers
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-muted-foreground">
                        {artist.popularity}% popular
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {artist.genres.slice(0, 3).map((genre) => (
                    <Badge key={genre} variant="outline" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'related' && selectedArtist && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Artists Similar to {selectedArtist.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedArtists.map((artist) => (
              <Card 
                key={artist.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                onClick={() => selectArtist(artist)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={artist.images[0]?.url} alt={artist.name} />
                      <AvatarFallback>
                        {artist.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{artist.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatFollowers(artist.followers.total)} followers
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {artist.connection_strength.toFixed(0)}% match
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {artist.popularity}% popular
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
        </div>
      )}

      {activeTab === 'tracks' && selectedArtist && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Top Tracks by {selectedArtist.name}</h3>
          <div className="space-y-2">
            {topTracks.map((track, index) => (
              <Card key={track.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-muted-foreground w-8">
                      {index + 1}
                    </div>
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
                        {track.album?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {track.popularity}% popular
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(track.duration_ms)}
                      </span>
                      <Button size="sm" variant="ghost">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistDiscovery;

