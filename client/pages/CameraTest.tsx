import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, AlertCircle, CheckCircle } from 'lucide-react';

export default function CameraTest() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
    console.log(message);
  };

  const testCameraAccess = async () => {
    addLog('Starting camera test...');
    setIsLoading(true);
    setError(null);

    try {
      addLog('Checking browser support...');
      
      if (!navigator.mediaDevices) {
        throw new Error('navigator.mediaDevices not available');
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      addLog('Browser support: OK');
      addLog('Requesting camera permission...');

      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      addLog(`Camera stream obtained: ${mediaStream.getTracks().length} tracks`);

      mediaStream.getTracks().forEach(track => {
        addLog(`Track: ${track.kind} - ${track.label} - ${track.readyState}`);
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        addLog('Video element source set');
        
        videoRef.current.onloadedmetadata = () => {
          addLog('Video metadata loaded');
          
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                addLog('Video playing successfully!');
              })
              .catch((playError) => {
                addLog(`Video play failed: ${playError.message}`);
              });
          }
        };
      }

      setIsLoading(false);
      addLog('Camera test completed successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error: ${errorMessage}`);
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    addLog('Stopping camera...');
    
    if (stream) {
      stream.getTracks().forEach(track => {
        addLog(`Stopping track: ${track.kind}`);
        track.stop();
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    addLog('Camera stopped');
    setError(null);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Camera Test</h1>
        <p className="text-vibetune-text-muted mb-6">
          Simple camera access test to diagnose issues
        </p>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-vibetune-gray/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              {navigator.mediaDevices?.getUserMedia ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <div>
                <p className="text-white font-medium">Browser Support</p>
                <p className="text-sm text-vibetune-text-muted">
                  {navigator.mediaDevices?.getUserMedia ? 'Supported' : 'Not Supported'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-vibetune-gray/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              {stream ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="text-white font-medium">Camera Stream</p>
                <p className="text-sm text-vibetune-text-muted">
                  {stream ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-vibetune-gray/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              {window.location.protocol === 'https:' || window.location.hostname === 'localhost' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              )}
              <div>
                <p className="text-white font-medium">Security</p>
                <p className="text-sm text-vibetune-text-muted">
                  {window.location.protocol} - {window.location.hostname}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-red-200 font-medium">Camera Error</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Display */}
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
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
                    <p className="text-vibetune-text-muted text-sm">Click "Test Camera" to start</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex space-x-3">
              <Button
                onClick={stream ? stopCamera : testCameraAccess}
                disabled={isLoading}
                className={stream ? 
                  "bg-red-500 hover:bg-red-600 text-white" : 
                  "bg-vibetune-green hover:bg-vibetune-green-dark text-black"
                }
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Testing...' : stream ? 'Stop Camera' : 'Test Camera'}
              </Button>
              
              <Button
                onClick={clearLogs}
                variant="outline"
                className="border-vibetune-gray text-white hover:bg-vibetune-gray/40"
              >
                Clear Logs
              </Button>
            </div>
          </div>

          {/* Logs */}
          <div className="space-y-4">
            <h3 className="text-white font-medium">Test Logs</h3>
            <div className="bg-black/40 rounded-lg p-4 h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-vibetune-text-muted text-sm">No logs yet. Click "Test Camera" to start.</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className="text-xs font-mono"
                      style={{
                        color: log.includes('Error:') ? '#ef4444' :
                               log.includes('successfully') ? '#10b981' :
                               log.includes('OK') ? '#10b981' :
                               '#9ca3af'
                      }}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Browser Info */}
            <div className="bg-vibetune-gray/20 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Browser Info</h4>
              <div className="text-xs text-vibetune-text-muted space-y-1">
                <div>User Agent: {navigator.userAgent.slice(0, 80)}...</div>
                <div>Platform: {navigator.platform}</div>
                <div>Online: {navigator.onLine ? 'Yes' : 'No'}</div>
                <div>Permissions API: {navigator.permissions ? 'Available' : 'Not Available'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
