import { useState, useRef, useCallback, useEffect } from 'react';
import { emotionDetectionService, DetectedEmotion, FaceWithEmotion } from '@/services/emotionDetection';

interface FaceDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  landmarks?: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    nose: { x: number; y: number };
    mouth: { x: number; y: number };
  };
}

interface WebcamFaceState {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  stream: MediaStream | null;
  isDetecting: boolean;
  faces: FaceDetection[];
  recognizedPerson: string | null;
  emotionData: DetectedEmotion | null;
  facesWithEmotions: FaceWithEmotion[];
}

export function useWebcamWithFaceDetection() {
  const [state, setState] = useState<WebcamFaceState>({
    isActive: false,
    isLoading: false,
    error: null,
    stream: null,
    isDetecting: false,
    faces: [],
    recognizedPerson: null,
    emotionData: null,
    facesWithEmotions: [],
  });
  
  // Add debouncing for emotion detection
  const lastEmotionRef = useRef<string | null>(null);
  const lastEmotionTimeRef = useRef<number>(0);
  const emotionDebounceDelay = 3000; // 3 seconds delay between emotion changes
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const faceDetectorRef = useRef<any>(null);
  const emotionDetectionInterval = useRef<NodeJS.Timeout>();

  // Initialize face detection
  const initializeFaceDetection = useCallback(async () => {
    try {
      // Check if browser supports face detection
      if ('FaceDetector' in window) {
        faceDetectorRef.current = new (window as any).FaceDetector({
          maxDetectedFaces: 5,
          fastMode: false
        });
      } else {
        // Fallback to manual face detection using canvas analysis
        console.log('Using fallback face detection');
      }
      
      // Initialize emotion detection service
      await emotionDetectionService.initialize();
    } catch (error) {
      console.error('Face detection initialization failed:', error);
    }
  }, []);

  // Detect faces in video frame
  const detectFaces = useCallback(async () => {
    if (!videoRef.current || !detectionCanvasRef.current || !state.isActive) {
      return;
    }

    const video = videoRef.current;
    const canvas = detectionCanvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      let detectedFaces: FaceDetection[] = [];

      if (faceDetectorRef.current) {
        // Use browser's FaceDetector API
        const faces = await faceDetectorRef.current.detect(canvas);
        detectedFaces = faces.map((face: any) => ({
          x: face.boundingBox.x,
          y: face.boundingBox.y,
          width: face.boundingBox.width,
          height: face.boundingBox.height,
          confidence: 0.8, // Browser API doesn't provide confidence
          landmarks: face.landmarks ? {
            leftEye: face.landmarks.find((l: any) => l.type === 'eye')?.locations[0] || { x: 0, y: 0 },
            rightEye: face.landmarks.find((l: any) => l.type === 'eye')?.locations[1] || { x: 0, y: 0 },
            nose: face.landmarks.find((l: any) => l.type === 'nose')?.locations[0] || { x: 0, y: 0 },
            mouth: face.landmarks.find((l: any) => l.type === 'mouth')?.locations[0] || { x: 0, y: 0 },
          } : undefined
        }));
      } else {
        // Fallback: Simple face detection using skin color detection
        detectedFaces = await detectFacesFallback(context, canvas.width, canvas.height);
      }

      // Simulate face recognition (in real app, you'd use a face recognition service)
      const recognizedPerson = detectedFaces.length > 0 ? await recognizeFace(canvas) : null;

      setState(prev => ({
        ...prev,
        faces: detectedFaces,
        recognizedPerson,
      }));

    } catch (error) {
      console.error('Face detection error:', error);
    }

    // Continue detection loop
    if (state.isDetecting) {
      animationFrameRef.current = requestAnimationFrame(detectFaces);
    }
  }, [state.isActive, state.isDetecting]);
  
  // Detect emotions in video frame - don't depend on state to avoid stale closures
  const detectEmotions = useCallback(async () => {
    // Use current refs instead of state dependencies to avoid stale closures
    const videoElement = videoRef.current;
    
    console.log('🎭 detectEmotions called');
    
    if (!videoElement) {
      console.log('❌ No video element available');
      return;
    }
    
    // Check if video has proper dimensions
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      console.log('❌ Video not ready - dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
      return;
    }
    
    try {
      console.log('✅ Starting emotion analysis on video element');
      
      // Check if we should use forced emotion for testing
      const urlParams = new URLSearchParams(window.location.search);
      const forceEmotion = urlParams.get('forceEmotion');
      
      let facesWithEmotions;
      if (forceEmotion) {
        console.log(`🎭 Using forced emotion: ${forceEmotion}`);
        facesWithEmotions = emotionDetectionService.forceEmotion(forceEmotion);
      } else {
        // Use emotion detection service to analyze video frame
        facesWithEmotions = await emotionDetectionService.detectEmotions(videoElement);
      }
      
      console.log(`Found ${facesWithEmotions.length} faces with emotions`);
      
      // Get the dominant emotion if there are any faces
      const emotionData = facesWithEmotions.length > 0 ? facesWithEmotions[0].emotion : null;
      
      if (emotionData) {
        const currentTime = Date.now();
        const currentEmotion = emotionData.emotion;
        
        // Check if we should update the emotion (debouncing)
        const shouldUpdate = 
          lastEmotionRef.current === null || // First detection
          lastEmotionRef.current !== currentEmotion || // Different emotion
          (currentTime - lastEmotionTimeRef.current) > emotionDebounceDelay; // Enough time passed
        
        if (shouldUpdate) {
          console.log('✅ Updating state with emotion:', emotionData.emotion, 'confidence:', emotionData.confidence);
          lastEmotionRef.current = currentEmotion;
          lastEmotionTimeRef.current = currentTime;
          
          setState(prev => ({
            ...prev,
            emotionData,
            facesWithEmotions,
          }));
        } else {
          console.log('⏳ Emotion change debounced, keeping current emotion:', lastEmotionRef.current);
        }
      } else {
        console.log('ℹ️ No faces detected for emotion analysis');
      }
    } catch (error) {
      console.error('❌ Emotion detection error:', error);
    }
  }, []); // Remove state dependencies to avoid stale closures

  // Fallback face detection using color analysis
  const detectFacesFallback = async (context: CanvasRenderingContext2D, width: number, height: number): Promise<FaceDetection[]> => {
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Simple skin color detection
    const skinPixels: { x: number; y: number }[] = [];
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Simple skin color detection (R > G > B and within certain ranges)
      if (r > 95 && g > 40 && b > 20 && 
          Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
          Math.abs(r - g) > 15 && r > g && r > b) {
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        skinPixels.push({ x, y });
      }
    }

    // Group skin pixels into potential face regions
    if (skinPixels.length > 1000) { // Minimum threshold for a face
      // Simple clustering - in real implementation you'd use more sophisticated algorithms
      const centerX = skinPixels.reduce((sum, p) => sum + p.x, 0) / skinPixels.length;
      const centerY = skinPixels.reduce((sum, p) => sum + p.y, 0) / skinPixels.length;
      
      return [{
        x: Math.max(0, centerX - 50),
        y: Math.max(0, centerY - 50),
        width: 100,
        height: 100,
        confidence: 0.6
      }];
    }

    return [];
  };

  // Simulate face recognition
  const recognizeFace = async (canvas: HTMLCanvasElement): Promise<string | null> => {
    // In a real app, you'd send the image to a face recognition service
    // For demo purposes, we'll simulate recognition based on time
    const hour = new Date().getHours();
    const recognizedNames = ['John Doe', 'Jane Smith', 'Alex Johnson', 'Unknown Person'];
    
    // Simulate random recognition with some consistency
    const index = hour % recognizedNames.length;
    return Math.random() > 0.3 ? recognizedNames[index] : null;
  };

  const startCamera = useCallback(async () => {
    console.log('Starting camera...');
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices) {
        throw new Error('MediaDevices not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser. Please use a modern browser with camera support.');
      }
      
      // Check for HTTPS (required for camera access in most browsers)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        console.warn('Camera access requires HTTPS in production. Consider using localhost for development.');
      }
      
      // Multiple constraint fallbacks for better compatibility
      const constraintOptions = [
        {
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'user',
            frameRate: { ideal: 30, max: 60 }
          },
          audio: false
        },
        {
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            facingMode: 'user'
          },
          audio: false
        },
        {
          video: {
            facingMode: 'user'
          },
          audio: false
        },
        {
          video: true,
          audio: false
        }
      ];
      
      let stream: MediaStream | null = null;
      let lastError: Error | null = null;
      
      // Try constraints in order of preference
      for (const constraints of constraintOptions) {
        try {
          console.log('Trying constraints:', constraints);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('Camera stream obtained with constraints:', constraints);
          break;
        } catch (error) {
          console.log('Constraints failed:', constraints, error);
          lastError = error as Error;
        }
      }
      
      if (!stream) {
        throw lastError || new Error('Failed to access camera with any constraints');
      }
      
      console.log('Camera stream obtained:', stream);
      
      if (videoRef.current) {
        // Stop any existing stream first
        if (videoRef.current.srcObject) {
          const existingStream = videoRef.current.srcObject as MediaStream;
          existingStream.getTracks().forEach(track => track.stop());
        }
        
        // Set up the video element
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                console.log('Video playing successfully');
                setState(prev => ({
                  ...prev,
                  isActive: true,
                  isLoading: false,
                  error: null,
                  stream,
                }));
                
                // Initialize face detection after video is playing
                initializeFaceDetection().then(() => {
                  console.log('Face detection initialized, starting detection automatically in 1 second');
                  // Auto-start face detection after 1 second delay to ensure video is fully ready
                  setTimeout(() => {
                    console.log('Auto-starting face detection');
                    // Start face detection inline to avoid circular dependency
                    setState(prev => ({ ...prev, isDetecting: true }));
                    detectFaces();
                    
                    // Start emotion detection at regular intervals
                    if (emotionDetectionInterval.current) {
                      clearInterval(emotionDetectionInterval.current);
                    }
                    
                    emotionDetectionInterval.current = setInterval(() => {
                      console.log('⏰ Emotion detection interval triggered');
                      detectEmotions();
                    }, 2000);
                  }, 1000);
                });
              })
              .catch((playError) => {
                console.error('Video play failed:', playError);
                setState(prev => ({
                  ...prev,
                  isActive: true, // Still set to active as stream is working
                  isLoading: false,
                  error: null,
                  stream,
                }));
              });
          }
        };
        
        videoRef.current.onerror = (error) => {
          console.error('Video error:', error);
          setState(prev => ({
            ...prev,
            isActive: false,
            isLoading: false,
            error: 'Video loading failed',
            stream: null,
          }));
        };
      }
      
    } catch (error) {
      console.error('Camera access error:', error);
      let errorMessage = 'Failed to access camera';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more specific error messages
        if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = 'Camera access denied. Please allow camera access and try again.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage = 'Camera is already in use by another application.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Camera constraints cannot be satisfied. Try using a different camera.';
        }
      }
      
      setState(prev => ({
        ...prev,
        isActive: false,
        isLoading: false,
        error: errorMessage,
        stream: null,
      }));
    }
  }, [initializeFaceDetection]);

  const stopCamera = useCallback(() => {
    setState(prevState => {
      // Stop existing stream tracks
      if (prevState.stream) {
        prevState.stream.getTracks().forEach(track => track.stop());
      }
      
      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Clear emotion detection interval
      if (emotionDetectionInterval.current) {
        clearInterval(emotionDetectionInterval.current);
        emotionDetectionInterval.current = undefined;
      }
      
      return {
        isActive: false,
        isLoading: false,
        error: null,
        stream: null,
        isDetecting: false,
        faces: [],
        recognizedPerson: null,
        emotionData: null,
        facesWithEmotions: [],
      };
    });
  }, []);

  const startFaceDetection = useCallback(() => {
    console.log('🚀 Starting face detection...');
    setState(prev => ({ ...prev, isDetecting: true }));
    
    // Start face detection loop
    detectFaces();
    
    // Start emotion detection at regular intervals
    if (emotionDetectionInterval.current) {
      console.log('Clearing existing emotion detection interval');
      clearInterval(emotionDetectionInterval.current);
    }
    
    console.log('Setting up emotion detection interval (every 2 seconds)');
    // Detect emotions every 2 seconds (less CPU intensive than every frame)
    emotionDetectionInterval.current = setInterval(() => {
      console.log('⏰ Emotion detection interval triggered');
      detectEmotions();
    }, 2000);
  }, [detectFaces, detectEmotions]);

  const stopFaceDetection = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isDetecting: false, 
      faces: [], 
      recognizedPerson: null,
      emotionData: null,
      facesWithEmotions: []
    }));
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (emotionDetectionInterval.current) {
      clearInterval(emotionDetectionInterval.current);
      emotionDetectionInterval.current = undefined;
    }
  }, []);

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
    setState(prevState => {
      if (prevState.isActive) {
        // Stop camera
        if (prevState.stream) {
          prevState.stream.getTracks().forEach(track => track.stop());
        }
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        if (emotionDetectionInterval.current) {
          clearInterval(emotionDetectionInterval.current);
          emotionDetectionInterval.current = undefined;
        }
        
        return {
          isActive: false,
          isLoading: false,
          error: null,
          stream: null,
          isDetecting: false,
          faces: [],
          recognizedPerson: null,
          emotionData: null,
          facesWithEmotions: [],
        };
      } else {
        // Start camera - trigger async function
        startCamera();
        return prevState;
      }
    });
  }, [startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (emotionDetectionInterval.current) {
        clearInterval(emotionDetectionInterval.current);
      }
    };
  }, []);

  return {
    ...state,
    videoRef,
    canvasRef,
    detectionCanvasRef,
    startCamera,
    stopCamera,
    toggleCamera,
    capturePhoto,
    startFaceDetection,
    stopFaceDetection,
    detectEmotions,
  };
}
