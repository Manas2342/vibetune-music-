import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Heart, 
  Share2, 
  Music, 
  Users, 
  UserPlus, 
  UserMinus, 
  Clock,
  PlayCircle,
  MessageSquare,
  TrendingUp,
  Search
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: 'play' | 'like' | 'share' | 'playlist_create' | 'follow';
  display_name: string;
  image_url?: string;
  created_at: string;
  activity_data: {
    trackId?: string;
    trackName?: string;
    artistName?: string;
    albumName?: string;
    playlistId?: string;
    playlistName?: string;
    shareMessage?: string;
  };
}

interface UserProfile {
  id: string;
  display_name: string;
  image_url?: string;
  followers?: number;
  following?: number;
  isFollowing?: boolean;
}

export default function Social() {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch activity feed
  const { data: activityFeed, isLoading: feedLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const response = await fetch('/api/social/activity?limit=50', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch activity feed');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch following list
  const { data: following } = useQuery({
    queryKey: ['user-following'],
    queryFn: async () => {
      const response = await fetch('/api/social/following', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch following list');
      return response.json();
    }
  });

  // Fetch followers list
  const { data: followers } = useQuery({
    queryKey: ['user-followers'],
    queryFn: async () => {
      const response = await fetch('/api/social/followers', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch followers list');
      return response.json();
    }
  });

  // Follow user mutation
  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/social/follow/${userId}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to follow user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-following'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      toast({
        title: "Success",
        description: "User followed successfully"
      });
    }
  });

  // Unfollow user mutation
  const unfollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/social/follow/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to unfollow user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-following'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      toast({
        title: "Success",
        description: "User unfollowed successfully"
      });
    }
  });

  // Like track mutation
  const likeMutation = useMutation({
    mutationFn: async (trackData: any) => {
      const response = await fetch('/api/social/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ trackData })
      });
      if (!response.ok) throw new Error('Failed to like track');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      toast({
        title: "Success",
        description: "Track liked!"
      });
    }
  });

  // Share track mutation
  const shareMutation = useMutation({
    mutationFn: async ({ trackData, message }: { trackData: any; message: string }) => {
      const response = await fetch('/api/social/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ trackData, message })
      });
      if (!response.ok) throw new Error('Failed to share track');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      toast({
        title: "Success",
        description: "Track shared!"
      });
    }
  });

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'play': return <PlayCircle className="h-4 w-4 text-vibetune-green" />;
      case 'like': return <Heart className="h-4 w-4 text-red-500" />;
      case 'share': return <Share2 className="h-4 w-4 text-blue-500" />;
      case 'playlist_create': return <Music className="h-4 w-4 text-purple-500" />;
      case 'follow': return <UserPlus className="h-4 w-4 text-orange-500" />;
      default: return <Music className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    const { activity_type, activity_data } = activity;
    
    switch (activity_type) {
      case 'play':
        return `played "${activity_data.trackName}" by ${activity_data.artistName}`;
      case 'like':
        return `liked "${activity_data.trackName}" by ${activity_data.artistName}`;
      case 'share':
        return `shared "${activity_data.trackName}" by ${activity_data.artistName}`;
      case 'playlist_create':
        return `created playlist "${activity_data.playlistName}"`;
      case 'follow':
        return 'followed a new user';
      default:
        return 'had some activity';
    }
  };

  const handleFollowToggle = (userId: string, isCurrentlyFollowing: boolean) => {
    if (isCurrentlyFollowing) {
      unfollowMutation.mutate(userId);
    } else {
      followMutation.mutate(userId);
    }
  };

  const filteredFollowing = following?.following?.filter((user: UserProfile) =>
    user.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (feedLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibetune-green"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Social</h1>
          <p className="text-vibetune-text-muted mt-2">
            Connect with other music lovers and discover new tracks
          </p>
        </div>
      </div>

      <Tabs defaultValue="feed" className="space-y-6">
        <TabsList className="bg-vibetune-gray">
          <TabsTrigger value="feed">Activity Feed</TabsTrigger>
          <TabsTrigger value="following">Following ({following?.following?.length || 0})</TabsTrigger>
          <TabsTrigger value="followers">Followers ({followers?.followers?.length || 0})</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          <Card className="bg-vibetune-gray border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Activity Feed
              </CardTitle>
              <CardDescription>See what your friends are listening to</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {activityFeed?.activities?.map((activity: ActivityItem) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={activity.image_url} />
                        <AvatarFallback>
                          {activity.display_name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-white">{activity.display_name}</span>
                          {getActivityIcon(activity.activity_type)}
                          <span className="text-xs text-vibetune-text-muted">
                            {formatTimeAgo(activity.created_at)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-300">
                          {getActivityText(activity)}
                        </p>
                        
                        {activity.activity_data.shareMessage && (
                          <p className="text-xs text-vibetune-text-muted mt-1 italic">
                            "{activity.activity_data.shareMessage}"
                          </p>
                        )}
                        
                        {(activity.activity_type === 'play' || activity.activity_type === 'like' || activity.activity_type === 'share') && activity.activity_data.trackName && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => likeMutation.mutate({
                                id: activity.activity_data.trackId,
                                name: activity.activity_data.trackName,
                                artists: [{ name: activity.activity_data.artistName }],
                                album: { name: activity.activity_data.albumName }
                              })}
                            >
                              <Heart className="h-3 w-3 mr-1" />
                              Like
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => shareMutation.mutate({
                                trackData: {
                                  id: activity.activity_data.trackId,
                                  name: activity.activity_data.trackName,
                                  artists: [{ name: activity.activity_data.artistName }],
                                  album: { name: activity.activity_data.albumName }
                                },
                                message: `Check out this track!`
                              })}
                            >
                              <Share2 className="h-3 w-3 mr-1" />
                              Share
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(!activityFeed?.activities || activityFeed.activities.length === 0) && (
                    <div className="text-center py-8">
                      <Music className="h-12 w-12 text-vibetune-text-muted mx-auto mb-4" />
                      <p className="text-vibetune-text-muted">No recent activity</p>
                      <p className="text-sm text-vibetune-text-muted mt-1">
                        Follow some users to see their activity here
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          <Card className="bg-vibetune-gray border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Following</CardTitle>
              <CardDescription>People you follow</CardDescription>
              <div className="flex items-center space-x-2 mt-4">
                <Search className="h-4 w-4 text-vibetune-text-muted" />
                <Input
                  placeholder="Search following..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-vibetune-dark border-gray-600"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredFollowing.map((user: UserProfile) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={user.image_url} />
                        <AvatarFallback>
                          {user.display_name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{user.display_name}</p>
                        <p className="text-xs text-vibetune-text-muted">
                          {user.followers || 0} followers
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFollowToggle(user.id, true)}
                      disabled={unfollowMutation.isPending}
                      className="border-gray-600 text-white hover:bg-gray-700"
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Unfollow
                    </Button>
                  </div>
                ))}
                
                {filteredFollowing.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-vibetune-text-muted mx-auto mb-4" />
                    <p className="text-vibetune-text-muted">
                      {searchQuery ? 'No users found' : 'Not following anyone yet'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followers" className="space-y-4">
          <Card className="bg-vibetune-gray border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Followers</CardTitle>
              <CardDescription>People who follow you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {followers?.followers?.map((user: UserProfile) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={user.image_url} />
                        <AvatarFallback>
                          {user.display_name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{user.display_name}</p>
                        <p className="text-xs text-vibetune-text-muted">
                          Followed you {formatTimeAgo((user as any).followed_at || new Date().toISOString())}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFollowToggle(user.id, false)}
                      disabled={followMutation.isPending}
                      className="border-vibetune-green text-vibetune-green hover:bg-vibetune-green hover:text-black"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Follow Back
                    </Button>
                  </div>
                ))}
                
                {(!followers?.followers || followers.followers.length === 0) && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-vibetune-text-muted mx-auto mb-4" />
                    <p className="text-vibetune-text-muted">No followers yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discover" className="space-y-4">
          <Card className="bg-vibetune-gray border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Discover New Users</CardTitle>
              <CardDescription>Find new people to follow based on similar music taste</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-vibetune-text-muted mx-auto mb-4" />
                <p className="text-vibetune-text-muted">User discovery coming soon!</p>
                <p className="text-sm text-vibetune-text-muted mt-1">
                  We're working on recommendations based on your listening habits
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}