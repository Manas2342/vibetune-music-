import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Heart, Share2, Music, Users, UserPlus, UserMinus, PlayCircle, Search, RefreshCw, Radio } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useSocialRealTime } from "@/hooks/useRealTimeData";

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: "play" | "like" | "share" | "playlist_create" | "follow";
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
    followedUserId?: string;
  };
}

interface UserProfile {
  id: string;
  display_name: string;
  image_url?: string;
  followed_at?: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem("spotifySessionToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init?.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export default function Social() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState<"all" | "play" | "like" | "share" | "playlist_create" | "follow">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const queryClient = useQueryClient();
  const hasSession = !!localStorage.getItem("spotifySessionToken");

  const { isConnected, eventCount } = useSocialRealTime(isLiveMode && hasSession);

  const activityQuery = useQuery<{ activities: ActivityItem[] }>({
    queryKey: ["social-activity-feed"],
    queryFn: () => apiFetch("/api/social/activity"),
    enabled: hasSession,
    staleTime: 20000,
  });

  const followingQuery = useQuery<{ following: UserProfile[] }>({
    queryKey: ["social-following"],
    queryFn: () => apiFetch("/api/social/following"),
    enabled: hasSession,
    staleTime: 30000,
  });

  const followersQuery = useQuery<{ followers: UserProfile[] }>({
    queryKey: ["social-followers"],
    queryFn: () => apiFetch("/api/social/followers"),
    enabled: hasSession,
    staleTime: 30000,
  });

  useEffect(() => {
    if (!autoRefresh || !hasSession) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["social-activity-feed"] });
      queryClient.invalidateQueries({ queryKey: ["social-following"] });
      queryClient.invalidateQueries({ queryKey: ["social-followers"] });
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, hasSession, queryClient]);

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["social-activity-feed"] });
    queryClient.invalidateQueries({ queryKey: ["social-following"] });
    queryClient.invalidateQueries({ queryKey: ["social-followers"] });
  };

  const followMutation = useMutation({
    mutationFn: (userId: string) => apiFetch(`/api/social/follow/${userId}`, { method: "POST" }),
    onSuccess: () => {
      toast({ title: "Success", description: "User followed successfully" });
      refreshAll();
    },
    onError: () => {
      toast({ title: "Failed", description: "Could not follow user", variant: "destructive" });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (userId: string) => apiFetch(`/api/social/follow/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Success", description: "User unfollowed successfully" });
      refreshAll();
    },
    onError: () => {
      toast({ title: "Failed", description: "Could not unfollow user", variant: "destructive" });
    },
  });

  const likeMutation = useMutation({
    mutationFn: (trackData: any) => apiFetch("/api/social/like", {
      method: "POST",
      body: JSON.stringify({ trackData }),
    }),
    onSuccess: () => {
      toast({ title: "Success", description: "Track liked!" });
      queryClient.invalidateQueries({ queryKey: ["social-activity-feed"] });
    },
    onError: () => {
      toast({ title: "Failed", description: "Could not like track", variant: "destructive" });
    },
  });

  const shareMutation = useMutation({
    mutationFn: ({ trackData, message }: { trackData: any; message: string }) =>
      apiFetch("/api/social/share", {
        method: "POST",
        body: JSON.stringify({ trackData, message }),
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Track shared!" });
      queryClient.invalidateQueries({ queryKey: ["social-activity-feed"] });
    },
    onError: () => {
      toast({ title: "Failed", description: "Could not share track", variant: "destructive" });
    },
  });

  const filteredActivities = useMemo(() => {
    const activities = activityQuery.data?.activities || [];
    const byFilter = activityFilter === "all"
      ? activities
      : activities.filter((a) => a.activity_type === activityFilter);
    const sorted = [...byFilter].sort((a, b) => {
      const t1 = new Date(a.created_at).getTime();
      const t2 = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? t2 - t1 : t1 - t2;
    });
    return sorted;
  }, [activityQuery.data?.activities, activityFilter, sortOrder]);

  const filteredFollowing = useMemo(() => {
    const list = followingQuery.data?.following || [];
    return list.filter((u) => u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [followingQuery.data?.following, searchQuery]);

  const followingIdSet = useMemo(() => {
    return new Set((followingQuery.data?.following || []).map((u) => u.id));
  }, [followingQuery.data?.following]);

  const suggestedUsers = useMemo(() => {
    const followers = followersQuery.data?.followers || [];
    return followers.filter((u) => !followingIdSet.has(u.id));
  }, [followersQuery.data?.followers, followingIdSet]);

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return "Unknown";
    const now = Date.now();
    const date = new Date(dateString).getTime();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getActivityIcon = (type: ActivityItem["activity_type"]) => {
    switch (type) {
      case "play":
        return <PlayCircle className="h-4 w-4 text-vibetune-green" />;
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "share":
        return <Share2 className="h-4 w-4 text-blue-500" />;
      case "playlist_create":
        return <Music className="h-4 w-4 text-purple-500" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-orange-500" />;
      default:
        return <Music className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    const d = activity.activity_data || {};
    switch (activity.activity_type) {
      case "play":
        return `played "${d.trackName || "Unknown track"}" by ${d.artistName || "Unknown artist"}`;
      case "like":
        return `liked "${d.trackName || "Unknown track"}" by ${d.artistName || "Unknown artist"}`;
      case "share":
        return `shared "${d.trackName || "Unknown track"}" by ${d.artistName || "Unknown artist"}`;
      case "playlist_create":
        return `created playlist "${d.playlistName || "Untitled"}"`;
      case "follow":
        return "followed a new user";
      default:
        return "had some activity";
    }
  };

  if (!hasSession) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-vibetune-gray border-gray-700">
          <CardContent className="py-10 text-center">
            <Users className="h-12 w-12 text-vibetune-text-muted mx-auto mb-4" />
            <h2 className="text-xl text-white font-semibold mb-2">Connect Spotify to use Social</h2>
            <p className="text-vibetune-text-muted">Social feed and follows need an active Spotify session.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Social</h1>
          <p className="text-vibetune-text-muted mt-2">Real activity feed powered by your app data</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAll}
          className="border-vibetune-green text-vibetune-green hover:bg-vibetune-green hover:text-black"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-700 bg-vibetune-gray p-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="social-live-mode" className="text-sm text-white">Live mode</Label>
          <Switch
            id="social-live-mode"
            checked={isLiveMode}
            onCheckedChange={setIsLiveMode}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="social-auto-refresh" className="text-sm text-white">Auto refresh</Label>
          <Switch
            id="social-auto-refresh"
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
          />
        </div>
        <div className="text-xs text-vibetune-text-muted flex items-center gap-2">
          <Radio className={`h-3.5 w-3.5 ${isConnected ? "text-vibetune-green" : "text-gray-500"}`} />
          {isConnected ? "Connected" : "Disconnected"} • Events: {eventCount}
        </div>
      </div>

      <Tabs defaultValue="feed" className="space-y-6">
        <TabsList className="bg-vibetune-gray">
          <TabsTrigger value="feed">Activity Feed</TabsTrigger>
          <TabsTrigger value="following">Following ({followingQuery.data?.following?.length || 0})</TabsTrigger>
          <TabsTrigger value="followers">Followers ({followersQuery.data?.followers?.length || 0})</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          <Card className="bg-vibetune-gray border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Music className="h-5 w-5" />
                Activity Feed
              </CardTitle>
              <CardDescription>Recent actions from you and users you follow</CardDescription>
              <div className="flex flex-wrap gap-2 pt-2">
                {(["all", "play", "like", "share", "playlist_create", "follow"] as const).map((filter) => (
                  <Button
                    key={filter}
                    size="sm"
                    variant={activityFilter === filter ? "default" : "outline"}
                    className={activityFilter === filter ? "bg-vibetune-green text-black hover:bg-vibetune-green-dark" : ""}
                    onClick={() => setActivityFilter(filter)}
                  >
                    {filter}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))}
                >
                  {sortOrder === "newest" ? "Newest" : "Oldest"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {activityQuery.isLoading ? (
                  <div className="text-vibetune-text-muted">Loading activity...</div>
                ) : activityQuery.isError ? (
                  <div className="text-red-400">Failed to load activity feed.</div>
                ) : filteredActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <Music className="h-12 w-12 text-vibetune-text-muted mx-auto mb-4" />
                    <p className="text-vibetune-text-muted">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-colors">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={activity.image_url} />
                          <AvatarFallback>{activity.display_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-white">{activity.display_name}</span>
                            {getActivityIcon(activity.activity_type)}
                            <span className="text-xs text-vibetune-text-muted">{formatTimeAgo(activity.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-300">{getActivityText(activity)}</p>
                          {activity.activity_data.shareMessage && (
                            <p className="text-xs text-vibetune-text-muted mt-1 italic">
                              "{activity.activity_data.shareMessage}"
                            </p>
                          )}
                          <div className="mt-2">
                            {followingIdSet.has(activity.user_id) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 border-gray-600 text-white hover:bg-gray-700"
                                onClick={() => unfollowMutation.mutate(activity.user_id)}
                                disabled={unfollowMutation.isPending}
                              >
                                <UserMinus className="h-3 w-3 mr-1" />
                                Unfollow
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 border-vibetune-green text-vibetune-green hover:bg-vibetune-green hover:text-black"
                                onClick={() => followMutation.mutate(activity.user_id)}
                                disabled={followMutation.isPending}
                              >
                                <UserPlus className="h-3 w-3 mr-1" />
                                Follow
                              </Button>
                            )}
                          </div>
                          {(activity.activity_type === "play" || activity.activity_type === "like" || activity.activity_type === "share") && activity.activity_data.trackName && (
                            <div className="flex items-center space-x-2 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() =>
                                  likeMutation.mutate({
                                    id: activity.activity_data.trackId,
                                    name: activity.activity_data.trackName,
                                    artists: [{ name: activity.activity_data.artistName }],
                                    album: { name: activity.activity_data.albumName },
                                  })
                                }
                              >
                                <Heart className="h-3 w-3 mr-1" />
                                Like
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() =>
                                  shareMutation.mutate({
                                    trackData: {
                                      id: activity.activity_data.trackId,
                                      name: activity.activity_data.trackName,
                                      artists: [{ name: activity.activity_data.artistName }],
                                      album: { name: activity.activity_data.albumName },
                                    },
                                    message: "Check out this track!",
                                  })
                                }
                              >
                                <Share2 className="h-3 w-3 mr-1" />
                                Share
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          <Card className="bg-vibetune-gray border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Following</CardTitle>
              <CardDescription>Users you follow in VibeTune</CardDescription>
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
              {followingQuery.isLoading ? (
                <div className="text-vibetune-text-muted">Loading following...</div>
              ) : followingQuery.isError ? (
                <div className="text-red-400">Failed to load following list.</div>
              ) : filteredFollowing.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-vibetune-text-muted mx-auto mb-4" />
                  <p className="text-vibetune-text-muted">{searchQuery ? "No users found" : "Not following anyone yet"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFollowing.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={user.image_url} />
                          <AvatarFallback>{user.display_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{user.display_name}</p>
                          <p className="text-xs text-vibetune-text-muted">Following since {formatTimeAgo(user.followed_at)}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unfollowMutation.mutate(user.id)}
                        className="border-gray-600 text-white hover:bg-gray-700"
                        disabled={unfollowMutation.isPending}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Unfollow
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followers" className="space-y-4">
          <Card className="bg-vibetune-gray border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Followers</CardTitle>
              <CardDescription>Users following you</CardDescription>
            </CardHeader>
            <CardContent>
              {followersQuery.isLoading ? (
                <div className="text-vibetune-text-muted">Loading followers...</div>
              ) : followersQuery.isError ? (
                <div className="text-red-400">Failed to load followers list.</div>
              ) : !followersQuery.data?.followers?.length ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-vibetune-text-muted mx-auto mb-4" />
                  <p className="text-vibetune-text-muted">No followers yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {followersQuery.data.followers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={user.image_url} />
                          <AvatarFallback>{user.display_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{user.display_name}</p>
                          <p className="text-xs text-vibetune-text-muted">Followed you {formatTimeAgo(user.followed_at)}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => followMutation.mutate(user.id)}
                        className="border-vibetune-green text-vibetune-green hover:bg-vibetune-green hover:text-black"
                        disabled={followMutation.isPending}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Follow Back
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discover" className="space-y-4">
          <Card className="bg-vibetune-gray border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Discover New Users</CardTitle>
              <CardDescription>Suggested users from people already connected to your graph</CardDescription>
            </CardHeader>
            <CardContent>
              {suggestedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-vibetune-text-muted mx-auto mb-4" />
                  <p className="text-vibetune-text-muted">No suggestions yet. As your network grows, suggestions appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={user.image_url} />
                          <AvatarFallback>{user.display_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{user.display_name}</p>
                          <p className="text-xs text-vibetune-text-muted">Suggested follower</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => followMutation.mutate(user.id)}
                        className="border-vibetune-green text-vibetune-green hover:bg-vibetune-green hover:text-black"
                        disabled={followMutation.isPending}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
