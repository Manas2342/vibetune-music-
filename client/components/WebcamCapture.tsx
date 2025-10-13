import { useState, useEffect } from 'react';
import { Camera, X, RotateCcw, Download, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebcam } from '@/hooks/useWebcam';
import { cn } from '@/lib/utils';

interface WebcamCaptureProps {
  onCapture?: (imageData: string) => void;
  onClose?: () => void;
  className?: string;
  showControls?: boolean;
  autoStart?: boolean;
}

export function WebcamCapture({ 
  onCapture, 
  onClose, 
  className,
  showControls = true,
  autoStart = false
}: WebcamCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const {
    isActive,
    isLoading,
    error,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    capturePhoto,
    toggleCamera
  } = useWebcam();

  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  const handleCapture = () => {
    const imageData = capturePhoto();
    if (imageData) {
      setCapturedImage(imageData);
      onCapture?.(imageData);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleDownload = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.download = `vibetune-photo-${Date.now()}.jpg`;
      link.href = capturedImage;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const startRecording = async () => {
    if (!isActive) return;
    
    setIsRecording(true);
    // In a real app, you'd implement video recording here
    // For now, we'll just simulate recording for 3 seconds
    setTimeout(() => {
      setIsRecording(false);
    }, 3000);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  return (
    <div className={cn("relative bg-vibetune-darker rounded-lg overflow-hidden", className)}>
      {/* Header */}
      {showControls && (
        <div className="flex items-center justify-between p-4 bg-vibetune-gray/20 border-b border-vibetune-gray/20">
          <h3 className="text-white font-semibold">Camera</h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-vibetune-text-muted hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Video/Image Display */}
      <div className="relative aspect-video bg-black">
        {capturedImage ? (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-500 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">REC</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-vibetune-darker/80">
            <div className="text-center">
              <Camera className="w-12 h-12 text-vibetune-text-muted mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Camera Error</p>
              <p className="text-vibetune-text-muted text-sm mb-4">{error}</p>
              <Button onClick={startCamera} className="bg-vibetune-green hover:bg-vibetune-green-dark text-black">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-vibetune-darker/80">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-vibetune-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white">Starting camera...</p>
            </div>
          </div>
        )}

        {/* No Camera State */}
        {!isActive && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-vibetune-darker">
            <div className="text-center">
              <Camera className="w-12 h-12 text-vibetune-text-muted mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Camera Off</p>
              <p className="text-vibetune-text-muted text-sm mb-4">
                Click start to begin using your camera
              </p>
              <Button onClick={startCamera} className="bg-vibetune-green hover:bg-vibetune-green-dark text-black">
                Start Camera
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="p-4 bg-vibetune-gray/20">
          {capturedImage ? (
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                onClick={handleRetake}
                className="border-vibetune-gray text-white hover:bg-vibetune-gray/40"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button
                onClick={handleDownload}
                className="bg-vibetune-green hover:bg-vibetune-green-dark text-black"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                onClick={toggleCamera}
                className="border-vibetune-gray text-white hover:bg-vibetune-gray/40"
                disabled={isLoading}
              >
                <Camera className="w-4 h-4 mr-2" />
                {isActive ? 'Stop' : 'Start'} Camera
              </Button>
              
              {isActive && (
                <>
                  <Button
                    onClick={handleCapture}
                    className="bg-vibetune-green hover:bg-vibetune-green-dark text-black"
                    disabled={isLoading}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Capture Photo
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      "border-vibetune-gray hover:bg-vibetune-gray/40",
                      isRecording ? "text-red-400 border-red-400" : "text-white"
                    )}
                    disabled={isLoading}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Record Video
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
