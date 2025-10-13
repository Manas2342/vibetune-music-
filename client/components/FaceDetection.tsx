import { useEffect, useRef } from 'react';

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

interface FaceDetectionOverlayProps {
  faces: FaceDetection[];
  recognizedPerson: string | null;
  videoWidth: number;
  videoHeight: number;
  containerWidth: number;
  containerHeight: number;
  isDetecting: boolean;
}

export function FaceDetectionOverlay({
  faces,
  recognizedPerson,
  videoWidth,
  videoHeight,
  containerWidth,
  containerHeight,
  isDetecting
}: FaceDetectionOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Calculate scale factors to map video coordinates to container coordinates
  const scaleX = containerWidth / (videoWidth || 1);
  const scaleY = containerHeight / (videoHeight || 1);

  useEffect(() => {
    if (!isDetecting) return;

    const overlay = overlayRef.current;
    if (!overlay) return;

    // Clear previous overlays
    overlay.innerHTML = '';

    // Draw face detection boxes
    faces.forEach((face, index) => {
      // Create face bounding box
      const faceBox = document.createElement('div');
      faceBox.className = 'absolute border-2 border-vibetune-green rounded-lg';
      faceBox.style.left = `${face.x * scaleX}px`;
      faceBox.style.top = `${face.y * scaleY}px`;
      faceBox.style.width = `${face.width * scaleX}px`;
      faceBox.style.height = `${face.height * scaleY}px`;
      faceBox.style.boxShadow = '0 0 10px rgba(29, 185, 84, 0.5)';
      
      // Add confidence label
      const confidenceLabel = document.createElement('div');
      confidenceLabel.className = 'absolute -top-6 left-0 bg-vibetune-green text-black text-xs px-2 py-1 rounded font-medium';
      confidenceLabel.textContent = `${Math.round(face.confidence * 100)}%`;
      faceBox.appendChild(confidenceLabel);

      // Add face landmarks if available
      if (face.landmarks) {
        const landmarks = face.landmarks;
        
        // Left eye
        const leftEye = document.createElement('div');
        leftEye.className = 'absolute w-2 h-2 bg-blue-400 rounded-full';
        leftEye.style.left = `${(landmarks.leftEye.x - face.x) * scaleX - 4}px`;
        leftEye.style.top = `${(landmarks.leftEye.y - face.y) * scaleY - 4}px`;
        faceBox.appendChild(leftEye);

        // Right eye
        const rightEye = document.createElement('div');
        rightEye.className = 'absolute w-2 h-2 bg-blue-400 rounded-full';
        rightEye.style.left = `${(landmarks.rightEye.x - face.x) * scaleX - 4}px`;
        rightEye.style.top = `${(landmarks.rightEye.y - face.y) * scaleY - 4}px`;
        faceBox.appendChild(rightEye);

        // Nose
        const nose = document.createElement('div');
        nose.className = 'absolute w-2 h-2 bg-yellow-400 rounded-full';
        nose.style.left = `${(landmarks.nose.x - face.x) * scaleX - 4}px`;
        nose.style.top = `${(landmarks.nose.y - face.y) * scaleY - 4}px`;
        faceBox.appendChild(nose);

        // Mouth
        const mouth = document.createElement('div');
        mouth.className = 'absolute w-2 h-2 bg-red-400 rounded-full';
        mouth.style.left = `${(landmarks.mouth.x - face.x) * scaleX - 4}px`;
        mouth.style.top = `${(landmarks.mouth.y - face.y) * scaleY - 4}px`;
        faceBox.appendChild(mouth);
      }

      overlay.appendChild(faceBox);
    });

    // Add recognition label if person is recognized
    if (recognizedPerson && faces.length > 0) {
      const recognitionLabel = document.createElement('div');
      recognitionLabel.className = 'absolute top-4 left-4 bg-vibetune-green text-black px-4 py-2 rounded-lg font-semibold text-sm shadow-lg';
      recognitionLabel.innerHTML = `
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
          <span>Recognized: ${recognizedPerson}</span>
        </div>
      `;
      overlay.appendChild(recognitionLabel);
    }

  }, [faces, recognizedPerson, scaleX, scaleY, isDetecting]);

  if (!isDetecting) return null;

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: containerWidth, height: containerHeight }}
    />
  );
}

interface FaceStatsProps {
  faces: FaceDetection[];
  recognizedPerson: string | null;
  isDetecting: boolean;
}

export function FaceStats({ faces, recognizedPerson, isDetecting }: FaceStatsProps) {
  if (!isDetecting) return null;

  return (
    <div className="absolute bottom-4 right-4 bg-black/70 text-white p-3 rounded-lg text-sm space-y-1 z-20">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isDetecting ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
        <span className="font-medium">Face Detection {isDetecting ? 'Active' : 'Inactive'}</span>
      </div>
      
      <div>Faces Detected: <span className="font-medium text-vibetune-green">{faces.length}</span></div>
      
      {faces.length > 0 && (
        <div>
          Average Confidence: <span className="font-medium text-vibetune-green">
            {Math.round(faces.reduce((sum, face) => sum + face.confidence, 0) / faces.length * 100)}%
          </span>
        </div>
      )}
      
      {recognizedPerson && (
        <div className="border-t border-gray-600 pt-2 mt-2">
          <div className="text-vibetune-green font-medium">✓ {recognizedPerson}</div>
        </div>
      )}
    </div>
  );
}

interface LiveFaceIndicatorProps {
  isDetecting: boolean;
  facesCount: number;
}

export function LiveFaceIndicator({ isDetecting, facesCount }: LiveFaceIndicatorProps) {
  if (!isDetecting) return null;

  return (
    <div className="absolute top-4 right-4 z-20">
      <div className="flex items-center space-x-2 bg-black/70 text-white px-3 py-2 rounded-lg">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium">LIVE</span>
        </div>
        <div className="h-4 w-px bg-gray-400" />
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-vibetune-green" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <span className="text-xs">{facesCount}</span>
        </div>
      </div>
    </div>
  );
}
