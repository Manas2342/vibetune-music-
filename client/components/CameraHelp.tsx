import { Camera, AlertCircle, CheckCircle, Lightbulb, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CameraHelpProps {
  isOpen: boolean;
  onClose: () => void;
  error?: string | null;
}

export function CameraHelp({ isOpen, onClose, error }: CameraHelpProps) {
  if (!isOpen) return null;

  const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'Chrome';
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari';
    if (userAgent.includes('edge')) return 'Edge';
    return 'your browser';
  };

  const isHTTPS = window.location.protocol === 'https:';
  const isLocalhost = window.location.hostname === 'localhost';

  const troubleshootingSteps = [
    {
      title: "Check camera permissions",
      description: `In ${detectBrowser()}, look for a camera icon in the address bar and make sure it's allowed.`,
      icon: Shield,
      status: 'action'
    },
    {
      title: "Ensure camera is not in use",
      description: "Close other applications that might be using your camera (Zoom, Teams, Skype, etc.)",
      icon: Camera,
      status: 'action'
    },
    {
      title: "Try refreshing the page",
      description: "Sometimes a simple page refresh can resolve camera access issues.",
      icon: AlertCircle,
      status: 'action'
    },
    {
      title: "Check browser settings",
      description: "Make sure camera access is enabled in your browser's privacy settings.",
      icon: Settings,
      status: 'action'
    }
  ];

  if (!isHTTPS && !isLocalhost) {
    troubleshootingSteps.unshift({
      title: "HTTPS Required",
      description: "Camera access requires a secure connection. Try accessing via HTTPS or localhost.",
      icon: Shield,
      status: 'error'
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-vibetune-darker rounded-lg border border-vibetune-gray max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-vibetune-gray/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Camera className="w-6 h-6 text-vibetune-green" />
              <h2 className="text-xl font-semibold text-white">Camera Troubleshooting</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-vibetune-text-muted hover:text-white">
              ×
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Check */}
          <div className="bg-vibetune-gray/20 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-vibetune-green" />
              Quick Status Check
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-vibetune-text-muted">Browser Support:</span>
                <span className={cn(
                  "font-medium",
                  navigator.mediaDevices?.getUserMedia ? "text-green-400" : "text-red-400"
                )}>
                  {navigator.mediaDevices?.getUserMedia ? "✓ Supported" : "✗ Not Supported"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-vibetune-text-muted">Secure Context:</span>
                <span className={cn(
                  "font-medium",
                  (isHTTPS || isLocalhost) ? "text-green-400" : "text-red-400"
                )}>
                  {(isHTTPS || isLocalhost) ? "✓ Secure" : "✗ Insecure"}
                </span>
              </div>
            </div>
          </div>

          {/* Troubleshooting Steps */}
          <div>
            <h3 className="text-white font-medium mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-vibetune-green" />
              Troubleshooting Steps
            </h3>
            <div className="space-y-3">
              {troubleshootingSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-vibetune-gray/10 rounded-lg">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    step.status === 'error' ? "bg-red-500/20" : "bg-vibetune-green/20"
                  )}>
                    <step.icon className={cn(
                      "w-4 h-4",
                      step.status === 'error' ? "text-red-400" : "text-vibetune-green"
                    )} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{step.title}</h4>
                    <p className="text-vibetune-text-muted text-sm mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Browser Specific Instructions */}
          <div className="bg-vibetune-gray/20 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">Browser-Specific Instructions</h3>
            <div className="text-sm text-vibetune-text-muted space-y-2">
              <p><strong>Chrome:</strong> Click the camera icon in the address bar → Allow</p>
              <p><strong>Firefox:</strong> Click the shield icon → Permissions → Allow Camera</p>
              <p><strong>Safari:</strong> Safari → Preferences → Websites → Camera → Allow</p>
              <p><strong>Edge:</strong> Click the camera icon in the address bar → Allow</p>
            </div>
          </div>

          {/* Additional Tips */}
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">💡 Tips for Best Experience</h3>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Make sure you have good lighting for face detection</li>
              <li>• Position yourself centered in the camera view</li>
              <li>• Keep your face clearly visible and unobstructed</li>
              <li>• For emotion detection, try different facial expressions</li>
              <li>• Use a modern browser for best compatibility</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-vibetune-gray/20">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-vibetune-gray text-white hover:bg-vibetune-gray/40"
            >
              Refresh Page
            </Button>
            <Button
              onClick={onClose}
              className="bg-vibetune-green hover:bg-vibetune-green-dark text-black"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
