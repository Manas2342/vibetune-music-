import { useState } from 'react';
import { Camera, Edit3, Save, X, Mail, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { WebcamModal } from '@/components/WebcamModal';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    bio: 'Music lover and playlist curator',
    location: 'New York, NY',
  });
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;
    
    const updates: any = {
      displayName: editData.name,
      email: editData.email,
    };
    
    if (tempAvatar) {
      updates.avatar = tempAvatar;
    }
    
    const success = await updateProfile(updates);
    if (success) {
      setIsEditing(false);
      setTempAvatar(null);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: user?.displayName || '',
      email: user?.email || '',
      bio: 'Music lover and playlist curator',
      location: 'New York, NY',
    });
    setTempAvatar(null);
    setIsEditing(false);
  };

  const handleWebcamCapture = (imageData: string) => {
    setTempAvatar(imageData);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-vibetune-text-muted mb-4">Please log in to view your profile</p>
          <Button className="bg-vibetune-green hover:bg-vibetune-green-dark text-black">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  const displayAvatar = tempAvatar || (user.images && user.images[0] ? user.images[0].url : null);

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-vibetune-green/20 to-blue-500/20 rounded-lg p-8 mb-8">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-vibetune-gray border-4 border-white/20">
                {displayAvatar ? (
                  <img 
                    src={displayAvatar} 
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-vibetune-green flex items-center justify-center">
                    <span className="text-2xl font-bold text-black">
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Camera Button */}
              <Button
                size="sm"
                className="absolute bottom-0 right-0 w-10 h-10 p-0 bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full border-2 border-vibetune-dark"
                onClick={() => setIsWebcamOpen(true)}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Name</Label>
                    <Input
                      id="name"
                      value={editData.name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      className="bg-vibetune-darker border-vibetune-gray text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                      className="bg-vibetune-darker border-vibetune-gray text-white"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSave}
                      className="bg-vibetune-green hover:bg-vibetune-green-dark text-black"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="border-vibetune-gray text-white hover:bg-vibetune-gray/40"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-white">{user.displayName}</h1>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-vibetune-text-muted hover:text-white"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 text-vibetune-text-muted">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{editData.location}</span>
                    </div>
                  </div>
                  <p className="text-white mt-4">{editData.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Music Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-vibetune-gray/20 rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-vibetune-green">487</h3>
            <p className="text-vibetune-text-muted">Liked Songs</p>
          </div>
          <div className="bg-vibetune-gray/20 rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-vibetune-green">23</h3>
            <p className="text-vibetune-text-muted">Playlists Created</p>
          </div>
          <div className="bg-vibetune-gray/20 rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-vibetune-green">156</h3>
            <p className="text-vibetune-text-muted">Artists Followed</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
          
          <div className="space-y-3">
            {[
              { action: "Liked", item: "Blinding Lights", artist: "The Weeknd", time: "2 hours ago" },
              { action: "Added to playlist", item: "Levitating", artist: "Dua Lipa", time: "5 hours ago" },
              { action: "Followed", item: "Olivia Rodrigo", artist: "Artist", time: "1 day ago" },
              { action: "Created playlist", item: "Summer Vibes 2024", artist: "Playlist", time: "2 days ago" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-vibetune-gray/20 rounded-lg">
                <div className="w-12 h-12 bg-vibetune-green/20 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 bg-vibetune-green/40 rounded"></div>
                </div>
                <div className="flex-1">
                  <p className="text-white">
                    <span className="text-vibetune-text-muted">{activity.action}</span> {activity.item}
                  </p>
                  <p className="text-sm text-vibetune-text-muted">
                    {activity.artist} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Webcam Modal */}
      <WebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={handleWebcamCapture}
        title="Update Profile Picture"
      />
    </>
  );
}
