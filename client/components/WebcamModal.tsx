import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WebcamCaptureWithFaceDetection } from './WebcamCaptureWithFaceDetection';

interface WebcamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture?: (imageData: string) => void;
  title?: string;
  enableFaceDetection?: boolean;
}

export function WebcamModal({
  isOpen,
  onClose,
  onCapture,
  title = "Take a Photo",
  enableFaceDetection = true
}: WebcamModalProps) {
  const handleCapture = (imageData: string) => {
    onCapture?.(imageData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-vibetune-darker border-vibetune-gray">
        <DialogHeader className="border-b border-vibetune-gray/20 pb-4">
          <DialogTitle className="text-white flex items-center">
            {title}
            {enableFaceDetection && (
              <span className="ml-2 text-xs bg-vibetune-green text-black px-2 py-1 rounded-full">
                AI Enhanced
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="p-0">
          <WebcamCaptureWithFaceDetection
            onCapture={handleCapture}
            onClose={onClose}
            autoStart={true}
            enableFaceDetection={enableFaceDetection}
            className="border-0"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
