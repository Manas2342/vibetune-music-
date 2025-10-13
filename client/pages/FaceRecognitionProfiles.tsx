import { useState } from 'react';
import { Plus, User, Trash2, Edit3, Camera, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { WebcamModal } from '@/components/WebcamModal';

interface FaceProfile {
  id: string;
  name: string;
  email?: string;
  photos: string[];
  createdAt: Date;
  lastSeen?: Date;
  isActive: boolean;
}

export default function FaceRecognitionProfiles() {
  const [profiles, setProfiles] = useState<FaceProfile[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      photos: ['/placeholder.svg', '/placeholder.svg'],
      createdAt: new Date('2024-01-15'),
      lastSeen: new Date(),
      isActive: true
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      photos: ['/placeholder.svg'],
      createdAt: new Date('2024-01-10'),
      lastSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      id: '3',
      name: 'Alex Johnson',
      photos: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
      createdAt: new Date('2024-01-05'),
      isActive: false
    }
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<FaceProfile | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);

  const handleCreateProfile = () => {
    if (!newProfileName.trim() || capturedPhotos.length === 0) return;

    const newProfile: FaceProfile = {
      id: Date.now().toString(),
      name: newProfileName.trim(),
      email: newProfileEmail.trim() || undefined,
      photos: capturedPhotos,
      createdAt: new Date(),
      isActive: true
    };

    setProfiles(prev => [newProfile, ...prev]);
    setNewProfileName('');
    setNewProfileEmail('');
    setCapturedPhotos([]);
    setIsCreateModalOpen(false);
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  const toggleProfileStatus = (id: string) => {
    setProfiles(prev => prev.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const handleWebcamCapture = (imageData: string) => {
    setCapturedPhotos(prev => [...prev, imageData]);
  };

  const removeCapturedPhoto = (index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Face Recognition Profiles</h1>
          <p className="text-vibetune-text-muted">
            Manage face recognition profiles for personalized experiences
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-vibetune-green hover:bg-vibetune-green-dark text-black">
              <Plus className="w-4 h-4 mr-2" />
              Add Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-vibetune-darker border-vibetune-gray">
            <DialogHeader>
              <DialogTitle className="text-white">Create Face Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Name</Label>
                <Input
                  id="name"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Enter name"
                  className="bg-vibetune-gray border-vibetune-light-gray text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-white">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={newProfileEmail}
                  onChange={(e) => setNewProfileEmail(e.target.value)}
                  placeholder="Enter email"
                  className="bg-vibetune-gray border-vibetune-light-gray text-white"
                />
              </div>

              <div>
                <Label className="text-white">Photos ({capturedPhotos.length}/5)</Label>
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsWebcamOpen(true)}
                    className="w-full border-vibetune-gray text-white hover:bg-vibetune-gray/40"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                  
                  {capturedPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {capturedPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={photo} 
                            alt={`Capture ${index + 1}`}
                            className="w-full aspect-square object-cover rounded border border-vibetune-gray"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeCapturedPhoto(index)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleCreateProfile}
                  disabled={!newProfileName.trim() || capturedPhotos.length === 0}
                  className="flex-1 bg-vibetune-green hover:bg-vibetune-green-dark text-black"
                >
                  Create Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border-vibetune-gray text-white hover:bg-vibetune-gray/40"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-vibetune-gray/20 rounded-lg p-4">
          <h3 className="text-2xl font-bold text-vibetune-green">{profiles.length}</h3>
          <p className="text-vibetune-text-muted text-sm">Total Profiles</p>
        </div>
        <div className="bg-vibetune-gray/20 rounded-lg p-4">
          <h3 className="text-2xl font-bold text-vibetune-green">{profiles.filter(p => p.isActive).length}</h3>
          <p className="text-vibetune-text-muted text-sm">Active Profiles</p>
        </div>
        <div className="bg-vibetune-gray/20 rounded-lg p-4">
          <h3 className="text-2xl font-bold text-vibetune-green">{profiles.filter(p => p.lastSeen).length}</h3>
          <p className="text-vibetune-text-muted text-sm">Recently Seen</p>
        </div>
        <div className="bg-vibetune-gray/20 rounded-lg p-4">
          <h3 className="text-2xl font-bold text-vibetune-green">{profiles.reduce((sum, p) => sum + p.photos.length, 0)}</h3>
          <p className="text-vibetune-text-muted text-sm">Total Photos</p>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <div key={profile.id} className="bg-vibetune-gray/20 rounded-lg p-6">
            {/* Profile Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-vibetune-green rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{profile.name}</h3>
                  {profile.email && (
                    <p className="text-sm text-vibetune-text-muted">{profile.email}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleProfileStatus(profile.id)}
                  className={`w-8 h-8 p-0 ${profile.isActive ? 'text-vibetune-green' : 'text-vibetune-text-muted'}`}
                >
                  {profile.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-8 h-8 p-0 text-vibetune-text-muted hover:text-white"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteProfile(profile.id)}
                  className="w-8 h-8 p-0 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Photos */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-vibetune-text-muted">Photos</span>
                <span className="text-sm text-vibetune-green">{profile.photos.length}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {profile.photos.slice(0, 3).map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`${profile.name} photo ${index + 1}`}
                    className="w-full aspect-square object-cover rounded border border-vibetune-gray"
                  />
                ))}
                {profile.photos.length > 3 && (
                  <div className="w-full aspect-square bg-vibetune-gray rounded border border-vibetune-gray flex items-center justify-center">
                    <span className="text-xs text-vibetune-text-muted">+{profile.photos.length - 3}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-vibetune-text-muted">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  profile.isActive 
                    ? 'bg-vibetune-green/20 text-vibetune-green' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {profile.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-vibetune-text-muted">Created</span>
                <span className="text-white">{profile.createdAt.toLocaleDateString()}</span>
              </div>
              {profile.lastSeen && (
                <div className="flex items-center justify-between">
                  <span className="text-vibetune-text-muted">Last Seen</span>
                  <span className="text-white">{profile.lastSeen.toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Webcam Modal */}
      <WebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={handleWebcamCapture}
        title="Capture Profile Photo"
        enableFaceDetection={true}
      />
    </div>
  );
}
