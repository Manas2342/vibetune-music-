import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Play, Square } from 'lucide-react';

export function DebugCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    console.log('Debug: Starting camera');
    setIsLoading(true);
    setError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      };

      console.log('Debug: Requesting camera access with constraints:', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Debug: Camera stream obtained:', mediaStream);

      setStream(mediaStream);

      if (videoRef) {
        console.log('Debug: Setting video source');
        videoRef.srcObject = mediaStream;
        videoRef.onloadedmetadata = () => {
          console.log('Debug: Video metadata loaded');
          videoRef.play()
            .then(() => {
              console.log('Debug: Video playing');
            })
            .catch((playError) => {
              console.error('Debug: Video play failed:', playError);
              setError(`Video play failed: ${playError.message}`);
            });
        };
      }

      setIsLoading(false);

    } catch (err) {
      console.error('Debug: Camera error:', err);
      setError(err instanceof Error ? err.message : 'Camera access failed');
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    console.log('Debug: Stopping camera');
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('Debug: Stopping track:', track.kind, track.label);
        track.stop();
      });
      setStream(null);
    }
    if (videoRef) {
      videoRef.srcObject = null;
    }
    setError(null);
  };

  return (
    <div className="bg-vibetune-gray/20 rounded-lg p-6 max-w-2xl mx-auto">
      <h3 className="text-white font-semibold mb-4 flex items-center">
        <Camera className="w-5 h-5 mr-2 text-vibetune-green" />
        Debug Camera Test
      </h3>

      {/* Status */}
      <div className="mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-vibetune-text-muted">Browser Support:</span>
          <span className={navigator.mediaDevices?.getUserMedia ? "text-green-400" : "text-red-400"}>
            {navigator.mediaDevices?.getUserMedia ? "✓ Supported" : "✗ Not Supported"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-vibetune-text-muted">Stream Active:</span>
          <span className={stream ? "text-green-400" : "text-gray-400"}>
            {stream ? "✓ Active" : "✗ Inactive"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-vibetune-text-muted">Protocol:</span>
          <span className={window.location.protocol === 'https:' || window.location.hostname === 'localhost' ? "text-green-400" : "text-yellow-400"}>
            {window.location.protocol}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Video Element */}
      <div className="relative aspect-video bg-black rounded-lg mb-4 overflow-hidden">
        <video
          ref={setVideoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
          style={{ backgroundColor: '#000' }}
        />
        {!stream && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-12 h-12 text-vibetune-text-muted mx-auto mb-4" />
              <p className="text-white">No camera feed</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex space-x-3 justify-center">
        <Button
          onClick={stream ? stopCamera : startCamera}
          disabled={isLoading}
          className={stream ? "bg-red-500 hover:bg-red-600 text-white" : "bg-vibetune-green hover:bg-vibetune-green-dark text-black"}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          ) : stream ? (
            <Square className="w-4 h-4 mr-2" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          {isLoading ? 'Starting...' : stream ? 'Stop Camera' : 'Start Camera'}
        </Button>
      </div>

      {/* Debug Info */}
      <div className="mt-4 text-xs text-vibetune-text-muted">
        <details>
          <summary className="cursor-pointer">Debug Information</summary>
          <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-x-auto">
            {JSON.stringify({
              userAgent: navigator.userAgent,
              mediaDevices: !!navigator.mediaDevices,
              getUserMedia: !!navigator.mediaDevices?.getUserMedia,
              protocol: window.location.protocol,
              hostname: window.location.hostname,
              streamTracks: stream?.getTracks().map(track => ({
                kind: track.kind,
                label: track.label,
                enabled: track.enabled,
                readyState: track.readyState
              })) || []
            }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
