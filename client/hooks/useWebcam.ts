import { useState, useRef, useCallback } from 'react';

interface WebcamState {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  stream: MediaStream | null;
}

export function useWebcam() {
  const [state, setState] = useState<WebcamState>({
    isActive: false,
    isLoading: false,
    error: null,
    stream: null,
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Check for camera support
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported in this browser.');
      }
      
      // Try multiple constraint options for better compatibility
      const constraintOptions = [
        {
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'user'
          },
          audio: false
        },
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        },
        {
          video: { facingMode: 'user' },
          audio: false
        },
        {
          video: true,
          audio: false
        }
      ];
      
      let stream: MediaStream | null = null;
      let lastError: Error | null = null;
      
      for (const constraints of constraintOptions) {
        try {
          console.log('Trying camera constraints:', constraints);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('Camera stream obtained successfully');
          break;
        } catch (error) {
          console.log('Constraint failed:', error);
          lastError = error as Error;
        }
      }
      
      if (!stream) {
        throw lastError || new Error('Failed to access camera with any settings');
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setState({
        isActive: true,
        isLoading: false,
        error: null,
        stream,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access camera';
      setState({
        isActive: false,
        isLoading: false,
        error: errorMessage,
        stream: null,
      });
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setState({
      isActive: false,
      isLoading: false,
      error: null,
      stream: null,
    });
  }, [state.stream]);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current || !state.isActive) {
      return null;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }, [state.isActive]);

  const toggleCamera = useCallback(() => {
    if (state.isActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [state.isActive, startCamera, stopCamera]);

  return {
    ...state,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    toggleCamera,
    capturePhoto,
  };
}
