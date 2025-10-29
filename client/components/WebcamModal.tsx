import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WebcamCaptureWithFaceDetection } from './WebcamCaptureWithFaceDetection';
import { Camera, Upload, X } from 'lucide-react';

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
  title = "Add Profile Photo",
  enableFaceDetection = true
}: WebcamModalProps) {
  const [activeTab, setActiveTab] = useState("camera");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (imageData: string) => {
    onCapture?.(imageData);
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setSelectedImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSelectedImage = () => {
    if (selectedImage) {
      onCapture?.(selectedImage);
      onClose();
    }
  };

  const handleRemoveSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setActiveTab("camera");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-vibetune-gray/20">
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Camera
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Gallery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="p-0">
            <WebcamCaptureWithFaceDetection
              onCapture={handleCapture}
              onClose={handleClose}
              autoStart={true}
              enableFaceDetection={enableFaceDetection}
              className="border-0"
            />
          </TabsContent>

          <TabsContent value="gallery" className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Upload from Gallery</h3>
                <p className="text-vibetune-text-muted text-sm">
                  Choose a photo from your device to create a face profile
                </p>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="gallery-upload"
                />
                
                <label
                  htmlFor="gallery-upload"
                  className="w-full max-w-md h-48 border-2 border-dashed border-vibetune-gray rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-vibetune-green transition-colors"
                >
                  {selectedImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={selectedImage}
                        alt="Selected"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveSelectedImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-vibetune-text-muted mb-4" />
                      <p className="text-vibetune-text-muted mb-2">Click to select an image</p>
                      <p className="text-xs text-vibetune-text-muted">
                        JPG, PNG, or WebP up to 10MB
                      </p>
                    </div>
                  )}
                </label>

                {selectedImage && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUseSelectedImage}
                      className="bg-vibetune-green hover:bg-vibetune-green-dark text-black"
                    >
                      Use This Photo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRemoveSelectedImage}
                      className="border-vibetune-gray text-white hover:bg-vibetune-gray/20"
                    >
                      Choose Different
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
