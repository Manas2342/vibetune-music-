import { useState, useRef } from 'react';
import { Camera, Video, Image, Download, Share2, Music, Brain, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WebcamCaptureWithFaceDetection } from '@/components/WebcamCaptureWithFaceDetection';
import { EmotionSongRecommendations, EmotionDisplay, EmotionBars } from '@/components/EmotionSongRecommendations';
import { DebugCamera } from '@/components/DebugCamera';
import { DetectedEmotion } from '@/services/emotionDetection';

export default function WebcamDemo() {
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [mode, setMode] = useState<'camera' | 'gallery' | 'music'>('camera');
  const [emotionData, setEmotionData] = useState<DetectedEmotion | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const webcamRef = useRef<any>(null);

  const handleCapture = (imageData: string) => {
    setCapturedImages(prev => [imageData, ...prev]);
    setMode('gallery');
  };
  
  // Handle webcam status updates
  const handleWebcamStatusUpdate = (status: { isActive: boolean; isDetecting: boolean; emotionData: DetectedEmotion | null }) => {
    setIsActive(status.isActive);
    setIsDetecting(status.isDetecting);
    setEmotionData(status.emotionData);
  };

  const downloadImage = (imageData: string, index: number) => {
    const link = document.createElement('a');
    link.download = `vibetune-photo-${index + 1}.jpg`;
    link.href = imageData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">AI-Powered Webcam Studio</h1>
        <p className="text-vibetune-text-muted">
          Capture photos, detect emotions, and discover music that matches your mood
        </p>
        {/* Current Status Display */}
        <div className="mt-4 flex items-center space-x-4">
          {isActive && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm">Camera Active</span>
            </div>
          )}
          
          {isDetecting && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-blue-400 text-sm">Detecting Emotions</span>
            </div>
          )}
          
          {isActive && isDetecting && emotionData && (
            <EmotionDisplay emotion={emotionData} />
          )}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center space-x-2 mb-6">
        <Button
          variant={mode === 'camera' ? 'default' : 'outline'}
          onClick={() => setMode('camera')}
          className={mode === 'camera' ? 'bg-vibetune-green text-black' : 'border-vibetune-gray text-white hover:bg-vibetune-gray/40'}
        >
          <Camera className="w-4 h-4 mr-2" />
          Camera
        </Button>
        <Button
          variant={mode === 'music' ? 'default' : 'outline'}
          onClick={() => setMode('music')}
          className={mode === 'music' ? 'bg-vibetune-green text-black' : 'border-vibetune-gray text-white hover:bg-vibetune-gray/40'}
        >
          <Music className="w-4 h-4 mr-2" />
          Music Recommendations
        </Button>
        <Button
          variant={mode === 'gallery' ? 'default' : 'outline'}
          onClick={() => setMode('gallery')}
          className={mode === 'gallery' ? 'bg-vibetune-green text-black' : 'border-vibetune-gray text-white hover:bg-vibetune-gray/40'}
        >
          <Image className="w-4 h-4 mr-2" />
          Gallery ({capturedImages.length})
        </Button>
      </div>
      
      {/* Debug Section - temporarily added for testing */}
      <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <h3 className="text-yellow-400 font-medium mb-2">🚧 Debug Mode (for camera testing)</h3>
        <p className="text-vibetune-text-muted text-sm mb-4">This debug component tests basic camera functionality. Use this if the main camera isn't working.</p>
        <DebugCamera />
      </div>

      {mode === 'camera' ? (
        /* Camera Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Camera View */}
          <div className="lg:col-span-2">
            <WebcamCaptureWithFaceDetection
              ref={webcamRef}
              onCapture={handleCapture}
              onStatusUpdate={handleWebcamStatusUpdate}
              className="w-full"
              enableFaceDetection={true}
            />
          </div>

          {/* Camera Features */}
          <div className="space-y-6">
            <div className="bg-vibetune-gray/20 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <Video className="w-5 h-5 mr-2 text-vibetune-green" />
                Features
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-vibetune-green rounded-full" />
                  <span className="text-vibetune-text-muted">Real-time face detection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-vibetune-green rounded-full" />
                  <span className="text-vibetune-text-muted">Emotion recognition & analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-vibetune-green rounded-full" />
                  <span className="text-vibetune-text-muted">Music recommendations by mood</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-vibetune-green rounded-full" />
                  <span className="text-vibetune-text-muted">YouTube API integration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-vibetune-green rounded-full" />
                  <span className="text-vibetune-text-muted">High quality photo capture</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-vibetune-green rounded-full" />
                  <span className="text-vibetune-text-muted">AI-powered overlays</span>
                </div>
              </div>
            </div>

            <div className="bg-vibetune-gray/20 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-4">AI Tips</h3>
              <div className="space-y-2 text-sm text-vibetune-text-muted">
                <p>• Face directly towards the camera for best detection</p>
                <p>• Ensure good lighting for accurate recognition</p>
                <p>• Try different facial expressions for emotion detection</p>
                <p>• Check the Music tab for song recommendations</p>
                <p>• Emotions are detected every 1.5 seconds</p>
              </div>
            </div>

            {/* Emotion Analysis */}
            {isActive && isDetecting && emotionData && (
              <EmotionBars emotion={emotionData} />
            )}

            {/* Recent Captures Preview */}
            {capturedImages.length > 0 && (
              <div className="bg-vibetune-gray/20 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4">Recent Captures</h3>
                <div className="grid grid-cols-3 gap-2">
                  {capturedImages.slice(0, 6).map((image, index) => (
                    <div key={index} className="aspect-square bg-vibetune-gray rounded overflow-hidden">
                      <img src={image} alt={`Capture ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                {capturedImages.length > 6 && (
                  <p className="text-xs text-vibetune-text-muted mt-2">
                    +{capturedImages.length - 6} more photos
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : mode === 'music' ? (
        /* Music Recommendations Mode */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Song Recommendations */}
          <div className="lg:col-span-1">
            <EmotionSongRecommendations 
              emotion={emotionData} 
              className="h-full" 
            />
          </div>
          
          {/* Camera Preview for Emotion Detection */}
          <div className="lg:col-span-1">
            <div className="bg-vibetune-gray/20 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-vibetune-green" />
                Emotion Detection
              </h3>
              <div className="aspect-video bg-black rounded-lg mb-4 overflow-hidden">
                <WebcamCaptureWithFaceDetection
                  showControls={false}
                  enableFaceDetection={true}
                  autoStart={true}
                  onStatusUpdate={handleWebcamStatusUpdate}
                  className="h-full"
                />
              </div>
              
              {/* Emotion Status */}
              <div className="space-y-3">
                {!isActive && (
                  <div className="text-center py-4">
                    <Camera className="w-8 h-8 text-vibetune-text-muted mx-auto mb-2" />
                    <p className="text-vibetune-text-muted text-sm">
                      Start the camera to begin emotion detection
                    </p>
                  </div>
                )}
                
                {isActive && !isDetecting && (
                  <div className="text-center py-4">
                    <Brain className="w-8 h-8 text-vibetune-text-muted mx-auto mb-2" />
                    <p className="text-vibetune-text-muted text-sm">
                      Enable face detection to analyze emotions
                    </p>
                  </div>
                )}
                
                {isActive && isDetecting && !emotionData && (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-vibetune-green border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-vibetune-text-muted text-sm">
                      Analyzing your facial expressions...
                    </p>
                  </div>
                )}
                
                {emotionData && (
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-4xl mb-2">
                        {emotionData.emotion === 'happy' && '😊'}
                        {emotionData.emotion === 'sad' && '😢'}
                        {emotionData.emotion === 'angry' && '😠'}
                        {emotionData.emotion === 'surprised' && '😲'}
                        {emotionData.emotion === 'fearful' && '😨'}
                        {emotionData.emotion === 'disgusted' && '🤢'}
                        {emotionData.emotion === 'neutral' && '😐'}
                      </div>
                      <p className="text-white font-medium capitalize mb-1">
                        {emotionData.emotion}
                      </p>
                      <p className="text-vibetune-text-muted text-sm">
                        {Math.round(emotionData.confidence * 100)}% confidence
                      </p>
                    </div>
                    
                    <div className="bg-vibetune-gray/20 rounded-lg p-3">
                      <p className="text-vibetune-text-muted text-xs text-center mb-2">
                        Based on your {emotionData.emotion} emotion, we've found songs that match your mood!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Gallery Mode */
        <div>
          {capturedImages.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-16 h-16 text-vibetune-text-muted mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No photos yet</h3>
              <p className="text-vibetune-text-muted mb-4">
                Switch to camera mode to take your first photo
              </p>
              <Button
                onClick={() => setMode('camera')}
                className="bg-vibetune-green hover:bg-vibetune-green-dark text-black"
              >
                <Camera className="w-4 h-4 mr-2" />
                Open Camera
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {capturedImages.map((image, index) => (
                <div key={index} className="group relative bg-vibetune-gray rounded-lg overflow-hidden">
                  <div className="aspect-square">
                    <img 
                      src={image} 
                      alt={`Capture ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-black/50 text-white hover:bg-black/70"
                      onClick={() => downloadImage(image, index)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-black/50 text-white hover:bg-black/70"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Photo number */}
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
