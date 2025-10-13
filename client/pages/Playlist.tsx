import { useParams } from "react-router-dom";
import { Play, Heart, MoreHorizontal, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import spotifyService from "@/services/spotifyService";
import { useMusicPlayer } from "@/contexts/EnhancedMusicPlayerContext";

export default function Playlist() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState<any | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const { playTrack } = useMusicPlayer();

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const pl = await spotifyService.getPlaylist(id);
        setPlaylist(pl);
        const items = await spotifyService.getPlaylistTracksAll(id);
        setTracks(items);
      } catch (e) {
        // ignore
      }
    };
    load();
  }, [id]);

  return (
    <div>
      {/* Playlist Header */}
      <div className="bg-gradient-to-b from-vibetune-green/20 to-vibetune-dark p-6 pb-8">
        <div className="flex items-end space-x-6">
          <div className="w-56 h-56 bg-vibetune-gray rounded-lg shadow-2xl overflow-hidden">
            {playlist?.images?.[0]?.url ? (
              <img src={playlist.images[0].url} alt={playlist?.name} className="w-full h-full object-cover" />
            ) : (
              <img src="/placeholder.svg" alt={playlist?.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white mb-2">PLAYLIST</p>
            <h1 className="text-5xl font-bold text-white mb-4">{playlist?.name || 'Playlist'}</h1>
            <p className="text-vibetune-text-muted mb-2">
              {playlist?.owner?.display_name} • {playlist?.tracks?.total || 0} songs
            </p>
          </div>
        </div>
      </div>

      {/* Playlist Controls */}
      <div className="px-6 py-4 bg-vibetune-dark">
        <div className="flex items-center space-x-6">
          <Button className="w-14 h-14 bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full">
            <Play className="w-6 h-6 ml-0.5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-vibetune-text-muted hover:text-white">
            <Heart className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="sm" className="text-vibetune-text-muted hover:text-white">
            <MoreHorizontal className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Track List */}
      <div className="px-6">
        {/* Header */}
        <div className="grid grid-cols-[16px_6fr_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 py-2 text-sm text-vibetune-text-muted border-b border-vibetune-gray/20 mb-4">
          <div>#</div>
          <div>TITLE</div>
          <div>ALBUM</div>
          <div>DATE ADDED</div>
          <div className="flex justify-end">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Tracks */}
        <div className="space-y-1">
          {tracks.map((item, index) => {
            const track = item.track;
            if (!track) return null;
            const durationMin = Math.floor((track.duration_ms || 0) / 60000);
            const durationSec = Math.floor(((track.duration_ms || 0) % 60000) / 1000).toString().padStart(2, '0');
            return (
            <div
              key={track.id || index}
              className="grid grid-cols-[16px_6fr_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 py-2 text-sm hover:bg-vibetune-gray/20 rounded-md group cursor-pointer"
              onClick={async () => {
                await playTrack({
                  id: track.id,
                  title: track.name,
                  artist: (track.artists || []).map((a: any) => a.name).join(', '),
                  albumArt: track.album?.images?.[0]?.url || '',
                  duration: track.duration_ms,
                  url: track.preview_url || track.external_urls?.spotify || '',
                  spotifyId: track.id,
                  previewUrl: track.preview_url,
                  isSpotifyTrack: true,
                  quality: 'high'
                });
              }}
            >
              <div className="flex items-center text-vibetune-text-muted">
                <span className="group-hover:hidden">{index + 1}</span>
                <Play className="w-4 h-4 hidden group-hover:block" />
              </div>
              
              <div className="flex items-center space-x-3 min-w-0">
                <img src={track.album?.images?.[0]?.url || '/placeholder.svg'} alt={track.name} className="w-10 h-10 rounded" />
                <div className="min-w-0">
                  <div className="text-white font-medium truncate">{track.name}</div>
                  <div className="text-vibetune-text-muted truncate">{(track.artists || []).map((a: any) => a.name).join(', ')}</div>
                </div>
              </div>
              
              <div className="flex items-center text-vibetune-text-muted truncate">
                {track.album?.name}
              </div>
              
              <div className="flex items-center text-vibetune-text-muted">
                {/* date added not available via minimal fetch here */}
              </div>
              
              <div className="flex items-center justify-end space-x-2">
                <span className="text-vibetune-text-muted">{durationMin}:{durationSec}</span>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 w-8 h-8 p-0">
                  <MoreHorizontal className="w-4 h-4 text-vibetune-text-muted" />
                </Button>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
