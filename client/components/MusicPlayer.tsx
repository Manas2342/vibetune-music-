import { useEffect, useMemo, useState } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Volume2,
  Heart,
  Maximize2,
  Minimize2,
  ScrollText,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useMusicPlayer } from "@/contexts/EnhancedMusicPlayerContext";
import { useLibrary } from "@/contexts/LibraryContext";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Format duration helper
const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    currentTime,
    duration,
    isSpotifyConnected,
    togglePlayPause,
    setVolume,
    seekTo,
    skipToNext,
    skipToPrevious,
    isShuffled,
    repeatMode,
    toggleShuffle,
    setRepeatMode
  } = useMusicPlayer();
  
  const { isLiked, toggleLike } = useLibrary();
  const { user } = useAuth();
  const repeatLabel = useMemo(() => repeatMode, [repeatMode]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mobileFullScreenTab, setMobileFullScreenTab] = useState<"player" | "lyrics">("player");
  const [lyrics, setLyrics] = useState<string>("");
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const handleProgressChange = (value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    seekTo(newTime);
  };

  useEffect(() => {
    const fetchLyrics = async () => {
      if (!currentTrack?.title || !currentTrack?.artist) {
        setLyrics("");
        setLyricsError(null);
        return;
      }

      setLyricsLoading(true);
      setLyricsError(null);
      setLyrics("");

      try {
        const artist = encodeURIComponent(currentTrack.artist.split(",")[0].trim());
        const title = encodeURIComponent(currentTrack.title.trim());
        const response = await fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`);
        if (!response.ok) {
          throw new Error(`Lyrics not found (HTTP ${response.status})`);
        }
        const data = await response.json();
        if (data?.lyrics && typeof data.lyrics === "string") {
          setLyrics(data.lyrics);
        } else {
          setLyricsError("Lyrics not available for this song.");
        }
      } catch (error) {
        setLyricsError("Lyrics are not available right now.");
      } finally {
        setLyricsLoading(false);
      }
    };

    if (isExpanded) {
      setMobileFullScreenTab("player");
      fetchLyrics();
    }
  }, [currentTrack?.title, currentTrack?.artist, isExpanded]);

  // Don't render if no track is playing
  if (!currentTrack) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-vibetune-darker border-t border-vibetune-gray px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Currently Playing */}
        <div
          className="flex items-center space-x-3 w-1/3 cursor-pointer"
          onClick={() => setIsExpanded(true)}
          title="Open now playing"
        >
          <div className="w-14 h-14 bg-vibetune-gray rounded-md overflow-hidden">
            <img 
              src={currentTrack.albumArt || "/placeholder.svg"} 
              alt={`${currentTrack.title} - ${currentTrack.artist}`} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white truncate">
              {currentTrack.title}
            </div>
            <div className="text-xs text-vibetune-text-muted truncate">
              {currentTrack.artist}
            </div>
            {isSpotifyConnected && (
              <div className="text-[10px] text-vibetune-green mt-0.5">
                {user?.product === "premium" ? "Premium • Web Playback Active" : "Spotify Connected"}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`w-8 h-8 p-0 ${isLiked(currentTrack.id) ? 'text-vibetune-green' : 'text-vibetune-text-muted hover:text-white'}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(currentTrack);
            }}
          >
            <Heart className={`w-4 h-4 ${isLiked(currentTrack.id) ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center space-y-2 w-1/3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className={`w-8 h-8 p-0 ${isShuffled ? 'text-vibetune-green' : 'text-vibetune-text-muted hover:text-white'}`}
              onClick={toggleShuffle}
            >
              <Shuffle className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-8 h-8 p-0 text-white hover:text-vibetune-green"
              onClick={skipToPrevious}
            >
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button
              className="w-8 h-8 p-0 bg-white hover:bg-gray-200 text-black rounded-full"
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-8 h-8 p-0 text-white hover:text-vibetune-green"
              onClick={skipToNext}
            >
              <SkipForward className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`w-8 h-8 p-0 ${repeatLabel !== 'none' ? 'text-vibetune-green' : 'text-vibetune-text-muted hover:text-white'}`}
              onClick={() => {
                const next = repeatLabel === 'none' ? 'playlist' : repeatLabel === 'playlist' ? 'track' : 'none';
                setRepeatMode(next);
              }}
            >
              <Repeat className="w-4 h-4" />
              {repeatLabel === 'track' && <span className="absolute top-0 right-0 w-1 h-1 bg-vibetune-green rounded-full"></span>}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 w-full max-w-md">
            <span className="text-xs text-vibetune-text-muted w-10 text-right">
              {formatDuration(currentTime)}
            </span>
            <Slider
              value={[progress]}
              onValueChange={handleProgressChange}
              max={100}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-vibetune-text-muted w-10">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        {/* Volume and Additional Controls */}
        <div className="flex items-center justify-end space-x-3 w-1/3">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-vibetune-text-muted hover:text-white"
            onClick={() => setIsExpanded(true)}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-vibetune-text-muted" />
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-24"
            />
          </div>
        </div>
      </div>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="w-screen h-screen max-w-none rounded-none border-0 bg-vibetune-dark p-0">
          <DialogTitle className="sr-only">Now Playing</DialogTitle>
          <div className="h-full px-6 py-8">
            <div className="w-full h-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className={`${mobileFullScreenTab === "player" ? "block" : "hidden"} lg:block`}>
                <div className="flex items-center justify-end mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
                    <Minimize2 className="w-5 h-5" />
                  </Button>
                </div>

                <div className="w-full aspect-square max-h-[52vh] bg-vibetune-gray rounded-xl overflow-hidden shadow-2xl mx-auto">
                  <img
                    src={currentTrack.albumArt || "/placeholder.svg"}
                    alt={`${currentTrack.title} - ${currentTrack.artist}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="mt-6 text-center">
                  <h2 className="text-2xl font-bold text-white">{currentTrack.title}</h2>
                  <p className="text-vibetune-text-muted mt-1">{currentTrack.artist}</p>
                </div>

                <div className="mt-6 flex items-center space-x-3">
                  <span className="text-xs text-vibetune-text-muted w-10 text-right">{formatDuration(currentTime)}</span>
                  <Slider
                    value={[progress]}
                    onValueChange={handleProgressChange}
                    max={100}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-xs text-vibetune-text-muted w-10">{formatDuration(duration)}</span>
                </div>

                <div className="mt-6 flex items-center justify-center space-x-6">
                  <Button variant="ghost" size="sm" onClick={skipToPrevious}>
                    <SkipBack className="w-6 h-6" />
                  </Button>
                  <Button
                    className="w-14 h-14 p-0 bg-white hover:bg-gray-200 text-black rounded-full"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={skipToNext}>
                    <SkipForward className="w-6 h-6" />
                  </Button>
                </div>
                <p className="mt-4 text-center text-xs text-vibetune-text-muted">
                  Some Spotify songs may have limited preview length depending on region/account.
                </p>
              </div>

              <div className="lg:hidden flex items-center justify-center gap-2 mb-2">
                <Button
                  size="sm"
                  variant={mobileFullScreenTab === "player" ? "default" : "outline"}
                  className={mobileFullScreenTab === "player" ? "bg-vibetune-green text-black hover:bg-vibetune-green-dark" : ""}
                  onClick={() => setMobileFullScreenTab("player")}
                >
                  Player
                </Button>
                <Button
                  size="sm"
                  variant={mobileFullScreenTab === "lyrics" ? "default" : "outline"}
                  className={mobileFullScreenTab === "lyrics" ? "bg-vibetune-green text-black hover:bg-vibetune-green-dark" : ""}
                  onClick={() => setMobileFullScreenTab("lyrics")}
                >
                  Lyrics
                </Button>
              </div>

              <div className={`h-full min-h-[40vh] lg:min-h-[70vh] bg-vibetune-gray/25 rounded-xl border border-vibetune-gray/40 p-4 flex flex-col ${mobileFullScreenTab === "lyrics" ? "block" : "hidden"} lg:flex`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold flex items-center">
                    <ScrollText className="w-4 h-4 mr-2" />
                    Lyrics
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                  {lyricsLoading ? (
                    <div className="h-full flex items-center justify-center text-vibetune-text-muted">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading lyrics...
                    </div>
                  ) : lyricsError ? (
                    <div className="h-full flex items-center justify-center text-center text-vibetune-text-muted">
                      {lyricsError}
                    </div>
                  ) : lyrics ? (
                    <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-white/90 font-sans">
                      {lyrics}
                    </pre>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center text-vibetune-text-muted">
                      Lyrics not available for this track.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
