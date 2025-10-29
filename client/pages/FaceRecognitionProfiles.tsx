import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, User, Users, Trash2, Edit3, Camera, Upload, Eye, EyeOff, RefreshCw, BarChart3, Activity, Zap, Bell, Target, Brain, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { WebcamModal } from '@/components/WebcamModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { mockDataService } from '@/services/mockDataService';
import { useProfileRealTime, useEmotionRealTime } from '@/hooks/useRealTimeData';

const COLORS = ['#1db954', '#1ed760', '#1aa34a', '#168f3a', '#137a32', '#0f6b2a', '#0d5c24'];

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
  const [refreshKey, setRefreshKey] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [liveEmotionDetection, setLiveEmotionDetection] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Real-time data hooks
  const { isConnected: profileConnected, eventCount: profileEventCount } = useProfileRealTime(isLiveMode);
  const { isConnected: emotionConnected, eventCount: emotionEventCount, lastEvent } = useEmotionRealTime(liveEmotionDetection);
  
  // State for profiles - now using actual state with localStorage persistence
  const [profiles, setProfiles] = useState<FaceProfile[]>(() => {
    // Load profiles from localStorage on component mount
    const savedProfiles = localStorage.getItem('vibetune-face-profiles');
    if (savedProfiles) {
      const parsed = JSON.parse(savedProfiles);
      // Convert date strings back to Date objects
      return parsed.map((profile: any) => ({
        ...profile,
        createdAt: new Date(profile.createdAt),
        lastSeen: profile.lastSeen ? new Date(profile.lastSeen) : undefined
      }));
    }
    return [];
  });
  const emotionAnalytics: Array<{ emotion: string; count: number; percentage: number }> = [];
  const emotionTrend: Array<{ date: string; emotion: string; count: number }> = [];

  // Save profiles to localStorage whenever profiles change
  useEffect(() => {
    localStorage.setItem('vibetune-face-profiles', JSON.stringify(profiles));
  }, [profiles]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setRefreshKey(prev => prev + 1);
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Live emotion detection simulation
  useEffect(() => {
    if (liveEmotionDetection) {
      const interval = setInterval(() => {
        // Simulate new emotion detection
        queryClient.invalidateQueries({ queryKey: ['emotion-analytics'] });
        queryClient.invalidateQueries({ queryKey: ['emotion-trend'] });
      }, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [liveEmotionDetection, queryClient]);
  
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    queryClient.invalidateQueries({ queryKey: ['face-profiles'] });
    queryClient.invalidateQueries({ queryKey: ['emotion-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['emotion-trend'] });
  }, [queryClient]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  const toggleLiveMode = useCallback(() => {
    setIsLiveMode(prev => !prev);
    if (!isLiveMode) {
      setAutoRefresh(true);
      setLiveEmotionDetection(true);
    }
  }, [isLiveMode]);

  const toggleLiveEmotionDetection = useCallback(() => {
    setLiveEmotionDetection(prev => !prev);
  }, []);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<FaceProfile | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Actually save the profile
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (capturedPhotos.length >= 5) return; // Max 5 photos
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = e.target?.result as string;
          setCapturedPhotos(prev => [...prev, imageData]);
        };
        reader.readAsDataURL(file);
      });
    }
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
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-vibetune-green text-vibetune-green hover:bg-vibetune-green hover:text-black"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
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
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsWebcamOpen(true)}
                      className="flex-1 border-vibetune-gray text-white hover:bg-vibetune-gray/40"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 border-vibetune-gray text-white hover:bg-vibetune-gray/40"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {capturedPhotos.length === 0 ? (
                    <div className="w-full h-32 border-2 border-dashed border-vibetune-gray rounded-lg flex flex-col items-center justify-center">
                      <Camera className="w-8 h-8 text-vibetune-text-muted mb-2" />
                      <p className="text-vibetune-text-muted text-sm">No photos added yet</p>
                      <p className="text-vibetune-text-muted text-xs">Take photos or upload from gallery</p>
                    </div>
                  ) : (
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

      {/* Empty State */}
      {profiles.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-vibetune-gray rounded-full flex items-center justify-center">
            <Users className="w-12 h-12 text-vibetune-text-muted" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Face Profiles Yet</h2>
          <p className="text-vibetune-text-muted mb-6">
            Create your first face recognition profile to get started
          </p>
          <Button className="bg-vibetune-green hover:bg-vibetune-green-dark text-black">
            <Plus className="w-4 h-4 mr-2" />
            Create First Profile
          </Button>
        </div>
      ) : (
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
      )}

      {/* Analytics Section */}
      <div className="mt-8">
        <Tabs defaultValue="emotions" className="space-y-6">
          <TabsList className="bg-vibetune-gray">
            <TabsTrigger value="emotions">Emotion Analytics</TabsTrigger>
            <TabsTrigger value="trends">Emotion Trends</TabsTrigger>
            <TabsTrigger value="profiles">Profile Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="emotions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-vibetune-gray border-gray-700">
                <CardHeader>
                <CardTitle className="text-white">Emotion Distribution</CardTitle>
                <CardDescription>Overall emotion detection statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={emotionAnalytics}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ emotion, percentage }) => `${emotion}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {emotionAnalytics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-vibetune-gray border-gray-700">
                <CardHeader>
                <CardTitle className="text-white">Emotion Breakdown</CardTitle>
                <CardDescription>Detailed emotion statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {emotionAnalytics.map((emotion, index) => (
                      <div key={emotion.emotion} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-white capitalize">{emotion.emotion}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-vibetune-green font-medium">{emotion.count}</span>
                          <span className="text-vibetune-text-muted">({emotion.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-vibetune-gray border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Emotion Trends Over Time</CardTitle>
                <CardDescription>Daily emotion detection patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={emotionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a1a', 
                        border: '1px solid #333',
                        color: '#fff'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#1db954" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profiles" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-vibetune-gray border-gray-700">
                <CardHeader>
                <CardTitle className="text-white">Total Profiles</CardTitle>
                <CardDescription>Face recognition profiles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-vibetune-green">{profiles.length}</div>
                  <p className="text-sm text-vibetune-text-muted mt-2">
                    {profiles.filter(p => p.isActive).length} active
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-vibetune-gray border-gray-700">
                <CardHeader>
                <CardTitle className="text-white">Total Photos</CardTitle>
                <CardDescription>Captured profile photos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-vibetune-green">
                    {profiles.reduce((sum, p) => sum + p.photos.length, 0)}
                  </div>
                  <p className="text-sm text-vibetune-text-muted mt-2">
                    Average: {(profiles.reduce((sum, p) => sum + p.photos.length, 0) / profiles.length).toFixed(1)} per profile
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-vibetune-gray border-gray-700">
                <CardHeader>
                <CardTitle className="text-white">Recognition Rate</CardTitle>
                <CardDescription>Successful face recognition</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-vibetune-green">94.2%</div>
                  <Progress value={94.2} className="mt-2" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
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
