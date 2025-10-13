import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Camera, X, RotateCcw, Download, Play, Square, Eye, EyeOff, Users, Scan, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebcamWithFaceDetection } from '@/hooks/useWebcamWithFaceDetection';
import { FaceDetectionOverlay, FaceStats, LiveFaceIndicator } from './FaceDetection';
import { CameraHelp } from './CameraHelp';
import { DetectedEmotion } from '@/services/emotionDetection';
import { cn } from '@/lib/utils';

interface WebcamCaptureWithFaceDetectionProps {
  onCapture?: (imageData: string) => void;
  onClose?: () => void;
  onStatusUpdate?: (status: { isActive: boolean; isDetecting: boolean; emotionData: DetectedEmotion | null }) => void;
  className?: string;
  showControls?: boolean;
  autoStart?: boolean;
  enableFaceDetection?: boolean;
}

export const WebcamCaptureWithFaceDetection = forwardRef<any, WebcamCaptureWithFaceDetectionProps>(({ 
  onCapture, 
  onClose, 
  onStatusUpdate,
  className,
  showControls = true,
  autoStart = false,
  enableFaceDetection = true
}, ref) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showFaceOverlay, setShowFaceOverlay] = useState(enableFaceDetection);
  const [showHelp, setShowHelp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  const {
    isActive,
    isLoading,
    error,
    videoRef,
    canvasRef,
    detectionCanvasRef,
    isDetecting,
    faces,
    recognizedPerson,
    emotionData,
    startCamera,
    stopCamera,
    capturePhoto,
    toggleCamera,
    startFaceDetection,
    stopFaceDetection
  } = useWebcamWithFaceDetection();
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    startCamera,
    stopCamera,
    toggleCamera,
    startFaceDetection,
    stopFaceDetection,
    capturePhoto,
    isActive,
    isDetecting,
    emotionData
  }));

  // Update container dimensions for overlay positioning
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  // Auto-start face detection when camera starts and overlay is enabled
  useEffect(() => {
    if (isActive && enableFaceDetection && showFaceOverlay && !isDetecting) {
      startFaceDetection();
    } else if (!showFaceOverlay && isDetecting) {
      stopFaceDetection();
    }
  }, [isActive, enableFaceDetection, showFaceOverlay, isDetecting, startFaceDetection, stopFaceDetection]);
  
  // Notify parent component of status updates
  useEffect(() => {
    if (onStatusUpdate) {
      onStatusUpdate({
        isActive,
        isDetecting,
        emotionData
      });
    }
  }, [isActive, isDetecting, emotionData, onStatusUpdate]);

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

  const toggleFaceDetection = () => {
    if (isDetecting) {
      stopFaceDetection();
    } else {
      startFaceDetection();
    }
  };

  const getVideoElement = () => videoRef.current;
  const videoDimensions = getVideoElement() ? {
    width: getVideoElement()!.videoWidth,
    height: getVideoElement()!.videoHeight
  } : { width: 0, height: 0 };

  return (
    <div className={cn("relative bg-vibetune-darker rounded-lg overflow-hidden", className)}>
      {/* Header */}
      {showControls && (
        <div className="flex items-center justify-between p-4 bg-vibetune-gray/20 border-b border-vibetune-gray/20">
          <h3 className="text-white font-semibold flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Smart Camera
            {enableFaceDetection && (
              <span className="ml-2 text-xs bg-vibetune-green text-black px-2 py-1 rounded-full">
                AI Powered
              </span>
            )}
          </h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-vibetune-text-muted hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Video/Image Display */}
      <div 
        ref={containerRef}
        className="relative aspect-video bg-black"
      >
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
              style={{
                backgroundColor: '#000',
                width: '100%',
                height: '100%'
              }}
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            <canvas
              ref={detectionCanvasRef}
              className="hidden"
            />

            {/* Face Detection Overlay */}
            {enableFaceDetection && showFaceOverlay && (
              <FaceDetectionOverlay
                faces={faces}
                recognizedPerson={recognizedPerson}
                videoWidth={videoDimensions.width}
                videoHeight={videoDimensions.height}
                containerWidth={containerDimensions.width}
                containerHeight={containerDimensions.height}
                isDetecting={isDetecting}
              />
            )}

            {/* Live Indicator */}
            {enableFaceDetection && (
              <LiveFaceIndicator
                isDetecting={isDetecting}
                facesCount={faces.length}
              />
            )}

            {/* Face Stats */}
            {enableFaceDetection && (
              <FaceStats
                faces={faces}
                recognizedPerson={recognizedPerson}
                isDetecting={isDetecting}
              />
            )}
          </>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-500 px-3 py-1 rounded-full z-30">
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
              <div className="flex space-x-3 justify-center">
                <Button onClick={startCamera} className="bg-vibetune-green hover:bg-vibetune-green-dark text-black">
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowHelp(true)}
                  className="border-vibetune-gray text-white hover:bg-vibetune-gray/40"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Get Help
                </Button>
              </div>
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
                Click start to begin using your smart camera
              </p>
              <div className="flex space-x-3 justify-center">
                <Button onClick={startCamera} className="bg-vibetune-green hover:bg-vibetune-green-dark text-black">
                  Start Camera
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowHelp(true)}
                  className="border-vibetune-gray text-white hover:bg-vibetune-gray/40"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help
                </Button>
              </div>
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
            <div className="space-y-3">
              {/* Primary Controls */}
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

              {/* Face Detection Controls */}
              {enableFaceDetection && isActive && (
                <div className="flex items-center justify-center space-x-3 pt-2 border-t border-vibetune-gray/20">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFaceDetection}
                    className={cn(
                      "border-vibetune-gray hover:bg-vibetune-gray/40",
                      isDetecting ? "text-vibetune-green border-vibetune-green" : "text-white"
                    )}
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    {isDetecting ? 'Stop' : 'Start'} Face Detection
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFaceOverlay(!showFaceOverlay)}
                    className="border-vibetune-gray text-white hover:bg-vibetune-gray/40"
                  >
                    {showFaceOverlay ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showFaceOverlay ? 'Hide' : 'Show'} Overlay
                  </Button>

                  <div className="flex items-center space-x-2 text-sm text-vibetune-text-muted">
                    <Users className="w-4 h-4" />
                    <span>{faces.length} face{faces.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Camera Help Modal */}
      <CameraHelp 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
        error={error} 
      />
    </div>
  );
});

WebcamCaptureWithFaceDetection.displayName = 'WebcamCaptureWithFaceDetection';
