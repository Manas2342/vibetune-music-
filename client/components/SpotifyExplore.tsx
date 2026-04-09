import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Music2, Disc3, Loader2, ChevronRight, LayoutGrid } from 'lucide-react';
import spotifyService from '@/services/spotifyService';
import { useMusicPlayer } from '@/contexts/EnhancedMusicPlayerContext';
import { cn } from '@/lib/utils';

type PlaylistItem = {
  id: string;
  name: string;
  description?: string;
  images: { url: string }[];
  owner?: { display_name?: string };
};

type AlbumItem = {
  id: string;
  name: string;
  artists: { name: string }[];
  images: { url: string }[];
  external_urls?: { spotify: string };
};

type CategoryItem = {
  id: string;
  name: string;
  icons: { url: string }[];
};

const COUNTRY = 'IN';

function dedupePlaylists(items: PlaylistItem[]): PlaylistItem[] {
  const seen = new Set<string>();
  return items.filter((p) => {
    if (!p?.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

/** Spotify browse often returns 0 playlists for some categories with client credentials; search fills the gap. */
async function searchPlaylistsQueries(queries: string[], perQuery = 10): Promise<PlaylistItem[]> {
  const results = await Promise.all(
    queries.map((q) =>
      spotifyService
        .search(q, 'playlist', perQuery, 0, COUNTRY)
        .catch(() => ({ playlists: { items: [] as PlaylistItem[] } }))
    )
  );
  const out: PlaylistItem[] = [];
  for (const sp of results) {
    out.push(...((sp as { playlists?: { items?: PlaylistItem[] } }).playlists?.items ?? []));
  }
  return dedupePlaylists(out);
}

function isNewReleasesCategory(c: CategoryItem): boolean {
  return /new\s*release|releases/i.test(c.name);
}

function isMadeForYouCategory(c: CategoryItem): boolean {
  return /made\s*for\s*you|^for\s*you$/i.test(c.name) || /made-for-you/i.test(c.id);
}

function categorySearchQueries(c: CategoryItem): string[] {
  const name = c.name.toLowerCase();
  const id = c.id.toLowerCase();

  if (isMadeForYouCategory(c)) {
    return [
      'Bollywood Hits',
      'Hindi Hits',
      'Indian Pop',
      'Desi Hits',
      'Punjabi Hits',
      'Tamil Hits',
      'Romantic Hindi',
    ];
  }

  const regional: [RegExp, string[]][] = [
    [/hindi|हिंदी/i, ['Hindi songs', 'Bollywood', 'Hindi hits']],
    [/punjabi/i, ['Punjabi hits', 'Punjabi songs']],
    [/tamil/i, ['Tamil hits', 'Tamil songs']],
    [/telugu/i, ['Telugu hits', 'Telugu songs']],
    [/malayalam/i, ['Malayalam hits']],
    [/bhojpuri|haryanvi/i, [c.name]],
    [/ghazal/i, ['Ghazals Hindi', 'Ghazal']],
    [/indie/i, ['Indie India', 'Indie Hindi']],
    [/devotional/i, ['Devotional Hindi', 'Bhajan']],
    [/party|mood|decades|pop|love|trending|discover|charts/i, [`${c.name} playlist`, `${c.name} India`]],
  ];

  for (const [re, queries] of regional) {
    if (re.test(name) || re.test(id)) {
      return queries;
    }
  }

  return [`${c.name} music`, `${c.name} India`, `${c.name} playlist`];
}

export const SpotifyExplore: React.FC = () => {
  const { playTrack } = useMusicPlayer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featured, setFeatured] = useState<PlaylistItem[]>([]);
  const [releases, setReleases] = useState<AlbumItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryItem | null>(null);
  const [catPlaylists, setCatPlaylists] = useState<PlaylistItem[]>([]);
  const [catAlbums, setCatAlbums] = useState<AlbumItem[]>([]);
  const [catLoading, setCatLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fp, nr, cat] = await Promise.all([
        spotifyService.getFeaturedPlaylists(20, 0, COUNTRY),
        spotifyService.getNewReleases(24, 0, COUNTRY),
        spotifyService.getCategories(40, 0, COUNTRY),
      ]);
      let feat = fp?.playlists?.items ?? [];
      let rel = nr?.albums?.items ?? [];

      if (feat.length === 0) {
        feat = await searchPlaylistsQueries(['Top Hits', 'Popular India', 'Viral'], 6);
      }
      if (rel.length === 0) {
        try {
          const sp = await spotifyService.search('year:2024', 'album', 15, 0, COUNTRY);
          rel = (sp as { albums?: { items?: AlbumItem[] } })?.albums?.items ?? [];
        } catch {
          // ignore
        }
      }

      setFeatured(feat);
      setReleases(rel);
      setCategories(cat?.categories?.items ?? []);
    } catch (e) {
      console.error(e);
      setError('Could not load Spotify content. Check your connection and API credentials.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectCategory = async (c: CategoryItem) => {
    setActiveCategory(c);
    setCatLoading(true);
    setCatPlaylists([]);
    setCatAlbums([]);

    try {
      let playlists: PlaylistItem[] = [];
      let albums: AlbumItem[] = [];

      try {
        const data = await spotifyService.getCategoryPlaylists(c.id, 24, 0, COUNTRY);
        playlists = data?.playlists?.items ?? [];
      } catch {
        playlists = [];
      }

      if (isNewReleasesCategory(c)) {
        const nr = await spotifyService.getNewReleases(30, 0, COUNTRY);
        albums = nr?.albums?.items ?? [];
        if (albums.length === 0 && releases.length > 0) {
          albums = releases;
        }
      }

      if (playlists.length === 0 || isMadeForYouCategory(c)) {
        const queries = categorySearchQueries(c);
        const searched = await searchPlaylistsQueries(queries, 8);
        playlists = dedupePlaylists([...playlists, ...searched]);
      } else if (playlists.length < 6) {
        const extra = await searchPlaylistsQueries(categorySearchQueries(c).slice(0, 3), 6);
        playlists = dedupePlaylists([...playlists, ...extra]);
      }

      if (!isNewReleasesCategory(c) && playlists.length === 0) {
        const fallback = await searchPlaylistsQueries([`${c.name}`, `${c.name} songs India`], 12);
        playlists = fallback;
      }

      setCatPlaylists(playlists.slice(0, 36));
      setCatAlbums(albums);
    } catch (e) {
      console.error(e);
      setCatPlaylists([]);
      setCatAlbums([]);
    } finally {
      setCatLoading(false);
    }
  };

  const playAlbumFirstTrack = async (album: AlbumItem) => {
    try {
      const tracks = await spotifyService.getAlbumTracks(album.id, 5, 0);
      const first = tracks?.items?.[0];
      if (!first?.id) return;
      const t = first as {
        id: string;
        name: string;
        artists: { name: string }[];
        duration_ms: number;
        preview_url?: string;
        external_urls?: { spotify: string };
      };
      await playTrack({
        id: t.id,
        title: t.name,
        artist: (t.artists ?? []).map((a) => a.name).join(', '),
        albumArt: album.images?.[0]?.url || '',
        duration: t.duration_ms,
        url: t.preview_url || t.external_urls?.spotify || '',
        spotifyId: t.id,
        previewUrl: t.preview_url,
        isSpotifyTrack: true,
        quality: 'high',
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-zinc-400">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        <p className="text-sm">Loading Spotify picks…</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12 px-4 md:px-8 max-w-[1600px] mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-violet-950/60 px-6 py-10 md:px-10 md:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
        <div className="relative">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium uppercase tracking-widest mb-2">
            <Sparkles className="h-4 w-4" />
            Spotify
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">Discover</h1>
          <p className="text-zinc-400 max-w-xl text-base md:text-lg">
            Playlists and albums for India ({COUNTRY}). Categories use search when Spotify browse returns empty (e.g. Made For You).
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100 text-sm">{error}</div>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Music2 className="h-5 w-5 text-emerald-500" />
            Featured playlists
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20">
          {featured.length === 0 && (
            <p className="text-zinc-500 text-sm">No playlists available right now.</p>
          )}
          {featured.map((pl) => (
            <Link
              key={pl.id}
              to={`/playlist/${pl.id}`}
              className="group flex-shrink-0 w-[180px] md:w-[200px] rounded-xl overflow-hidden bg-zinc-900/80 border border-white/5 hover:border-emerald-500/40 transition-all hover:shadow-lg hover:shadow-emerald-900/20"
            >
              <div className="aspect-square relative bg-zinc-800">
                <img
                  src={pl.images?.[0]?.url || '/placeholder.svg'}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <p className="font-medium text-white text-sm line-clamp-2 leading-snug">{pl.name}</p>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{pl.owner?.display_name || 'Spotify'}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Disc3 className="h-5 w-5 text-violet-400" />
            New releases
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {releases.length === 0 && (
            <p className="text-zinc-500 text-sm">No new releases loaded.</p>
          )}
          {releases.map((al) => (
            <button
              key={al.id}
              type="button"
              onClick={() => playAlbumFirstTrack(al)}
              className="group flex-shrink-0 w-[160px] md:w-[180px] text-left rounded-xl overflow-hidden bg-zinc-900/80 border border-white/5 hover:border-violet-500/40 transition-all"
            >
              <div className="aspect-square relative bg-zinc-800">
                <img
                  src={al.images?.[0]?.url || '/placeholder.svg'}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <p className="font-medium text-white text-sm line-clamp-2">{al.name}</p>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{al.artists?.map((a) => a.name).join(', ')}</p>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Play <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-amber-400" />
            Browse categories
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectCategory(c)}
              className={cn(
                'rounded-xl p-4 text-left border transition-all flex flex-col gap-2 min-h-[100px]',
                activeCategory?.id === c.id
                  ? 'bg-emerald-950/60 border-emerald-500/50 ring-1 ring-emerald-500/30'
                  : 'bg-zinc-900/50 border-white/5 hover:border-white/15'
              )}
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                {c.icons?.[0]?.url ? (
                  <img src={c.icons[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Music2 className="h-6 w-6" />
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-white line-clamp-2">{c.name}</span>
            </button>
          ))}
        </div>

        {activeCategory && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-6 space-y-8">
            <h3 className="text-lg font-semibold text-white">{activeCategory.name}</h3>

            {catLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              </div>
            ) : (
              <>
                {catAlbums.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wide">New albums & singles</h4>
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {catAlbums.map((al) => (
                        <button
                          key={al.id}
                          type="button"
                          onClick={() => playAlbumFirstTrack(al)}
                          className="flex-shrink-0 w-[140px] text-left rounded-lg overflow-hidden bg-zinc-900 border border-white/5 hover:border-violet-500/30"
                        >
                          <div className="aspect-square bg-zinc-800">
                            <img src={al.images?.[0]?.url || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
                          </div>
                          <p className="p-2 text-xs font-medium text-white line-clamp-2">{al.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wide">
                    {isMadeForYouCategory(activeCategory) ? 'Hindi & Indian picks (search)' : 'Playlists'}
                  </h4>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {catPlaylists.length === 0 && catAlbums.length === 0 ? (
                      <p className="text-zinc-500 text-sm">Nothing loaded for this category — try another.</p>
                    ) : catPlaylists.length === 0 ? (
                      <p className="text-zinc-500 text-sm">No playlists found; see albums above.</p>
                    ) : (
                      catPlaylists.map((pl) => (
                        <Link
                          key={pl.id}
                          to={`/playlist/${pl.id}`}
                          className="flex-shrink-0 w-[150px] rounded-lg overflow-hidden bg-zinc-900 border border-white/5 hover:border-emerald-500/30 transition-colors"
                        >
                          <div className="aspect-square bg-zinc-800">
                            <img src={pl.images?.[0]?.url || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
                          </div>
                          <p className="p-2 text-xs font-medium text-white line-clamp-2">{pl.name}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default SpotifyExplore;
