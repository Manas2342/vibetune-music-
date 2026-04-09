import { useEffect, useMemo, useState } from "react";
import { Download, Music, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMusicPlayer } from "@/contexts/EnhancedMusicPlayerContext";
import { useToast } from "@/hooks/use-toast";

type OfflineTrackApiItem = {
  id: string;
  spotifyId?: string;
  name?: string;
  artist?: string;
  downloadPath?: string;
  fileSize?: number;
  syncedAt?: string;
  trackData?: {
    id?: string;
    title?: string;
    name?: string;
    artist?: string;
    artists?: { name: string }[];
    albumArt?: string;
    image?: string;
    duration?: number;
    duration_ms?: number;
  };
};

export default function Downloaded() {
  const navigate = useNavigate();
  const { playTrack } = useMusicPlayer();
  const { toast } = useToast();
  const [tracks, setTracks] = useState<OfflineTrackApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = () => {
    const sessionToken = localStorage.getItem("spotifySessionToken");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken || ""}`,
    };
  };

  const loadOfflineTracks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/offline/tracks", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setTracks(data?.offlineTracks || []);
    } catch (error) {
      console.error("Failed to load offline tracks:", error);
      setTracks([]);
      toast({
        title: "Failed to load downloads",
        description: "Please reconnect Spotify session and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOfflineTracks();
  }, []);

  const totalSizeLabel = useMemo(() => {
    const bytes = tracks.reduce((sum, t) => sum + (t.fileSize || 0), 0);
    if (!bytes) return "0 MB";
    const mb = bytes / 1024 / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  }, [tracks]);

  const playOfflineTrack = async (track: OfflineTrackApiItem) => {
    const trackId = track.spotifyId || track.trackData?.id || track.id;
    if (!trackId) return;

    const title = track.trackData?.title || track.trackData?.name || track.name || "Unknown track";
    const artist =
      track.trackData?.artist ||
      (track.trackData?.artists || []).map((a) => a.name).join(", ") ||
      track.artist ||
      "Unknown artist";
    const albumArt = track.trackData?.albumArt || track.trackData?.image || "/placeholder.svg";
    const duration = track.trackData?.duration_ms || track.trackData?.duration || 0;

    await playTrack({
      id: trackId,
      title,
      artist,
      albumArt,
      duration,
      url: `/api/offline/serve/${trackId}`,
      spotifyId: trackId,
      isSpotifyTrack: false,
      quality: "high",
    });
  };

  const removeOfflineTrack = async (track: OfflineTrackApiItem) => {
    const trackId = track.spotifyId || track.trackData?.id || track.id;
    if (!trackId) return;

    try {
      const response = await fetch(`/api/offline/${trackId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setTracks((prev) => prev.filter((t) => (t.spotifyId || t.trackData?.id || t.id) !== trackId));
      toast({
        title: "Removed download",
        description: "Track removed from offline storage.",
      });
    } catch (error) {
      console.error("Failed to remove offline track:", error);
      toast({
        title: "Failed to remove",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Downloaded</h1>
        <p className="text-vibetune-text-muted mt-2">
          {tracks.length} track{tracks.length !== 1 ? "s" : ""} • {totalSizeLabel}
        </p>
      </div>

      {isLoading ? (
        <div className="text-vibetune-text-muted">Loading downloads...</div>
      ) : tracks.length === 0 ? (
        <div className="rounded-lg border border-vibetune-gray bg-vibetune-gray/20 p-6">
          <Download className="w-10 h-10 text-vibetune-text-muted mb-3" />
          <h2 className="text-white text-xl font-semibold mb-2">No downloaded tracks yet</h2>
          <p className="text-vibetune-text-muted mb-4">
            Download songs from search or playlists to listen offline here.
          </p>
          <Button
            className="bg-vibetune-green hover:bg-vibetune-green-dark text-black"
            onClick={() => navigate("/search")}
          >
            Browse Music
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track, index) => {
            const trackId = track.spotifyId || track.trackData?.id || track.id;
            const title = track.trackData?.title || track.trackData?.name || track.name || "Unknown track";
            const artist =
              track.trackData?.artist ||
              (track.trackData?.artists || []).map((a) => a.name).join(", ") ||
              track.artist ||
              "Unknown artist";
            const albumArt = track.trackData?.albumArt || track.trackData?.image || "/placeholder.svg";

            return (
              <div
                key={trackId || index}
                className="group flex items-center gap-3 rounded-lg bg-vibetune-gray/25 hover:bg-vibetune-gray/45 p-3 transition-colors"
              >
                <div className="w-7 text-sm text-vibetune-text-muted">{index + 1}</div>
                <img src={albumArt} alt={title} className="w-12 h-12 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium truncate">{title}</p>
                  <p className="text-xs text-vibetune-text-muted truncate">{artist}</p>
                </div>
                <Button
                  size="sm"
                  className="bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full w-9 h-9 p-0"
                  onClick={() => playOfflineTrack(track)}
                >
                  <Play className="w-4 h-4 ml-0.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-vibetune-text-muted hover:text-red-400 w-9 h-9 p-0"
                  onClick={() => removeOfflineTrack(track)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && tracks.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-vibetune-text-muted">
          <Music className="w-3 h-3" />
          Offline tracks are streamed from your local offline storage.
        </div>
      )}
    </div>
  );
}
