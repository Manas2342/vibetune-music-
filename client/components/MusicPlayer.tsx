import { useMemo } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Volume2,
  Heart,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useMusicPlayer } from "@/contexts/EnhancedMusicPlayerContext";
import { useLibrary } from "@/contexts/LibraryContext";

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
  const repeatLabel = useMemo(() => repeatMode, [repeatMode]);

  // Don't render if no track is playing
  if (!currentTrack) {
    return null;
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const handleProgressChange = (value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    seekTo(newTime);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-vibetune-darker border-t border-vibetune-gray px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Currently Playing */}
        <div className="flex items-center space-x-3 w-1/3">
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
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`w-8 h-8 p-0 ${isLiked(currentTrack.id) ? 'text-vibetune-green' : 'text-vibetune-text-muted hover:text-white'}`}
            onClick={() => toggleLike(currentTrack)}
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
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-vibetune-text-muted hover:text-white">
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
    </div>
  );
}
