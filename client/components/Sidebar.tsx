import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Search,
  Library,
  Plus,
  Heart,
  Download,
  Music,
  Camera,
  Users,
  BarChart3,
  TrendingUp,
  Share2,
  Zap,
  LogOut,
  UserSearch
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLibrary } from "@/contexts/LibraryContext";
import { useState, useEffect } from "react";

const sidebarItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "Search", href: "/search" },
  { icon: Library, label: "Your Library", href: "/library" },
];

const playlistItems = [
  { icon: Plus, label: "Create Playlist", href: "/create-playlist" },
  { icon: Heart, label: "Liked Songs", href: "/liked" },
  { icon: Download, label: "Downloaded", href: "/downloaded" },
];

const featuresItems = [
  { icon: TrendingUp, label: "Trending", href: "/trending" },
  { icon: UserSearch, label: "Artist Discovery", href: "/artists" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Share2, label: "Social", href: "/social" },
  { icon: Camera, label: "Webcam Studio", href: "/webcam" },
  { icon: Users, label: "Face Profiles", href: "/face-profiles" },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { playlists } = useLibrary();
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);

  const handleLogout = () => {
    logout();
  };

  // Fetch user's Spotify playlists
  useEffect(() => {
    const fetchUserPlaylists = async () => {
      if (user?.spotifyAccessToken) {
        try {
          const response = await fetch('/api/spotify/me/playlists?limit=10');
          if (response.ok) {
            const data = await response.json();
            setUserPlaylists(data.items || []);
          }
        } catch (error) {
          console.error('Error fetching user playlists:', error);
        }
      }
    };

    fetchUserPlaylists();
  }, [user?.spotifyAccessToken]);

  return (
    <div className="w-64 bg-vibetune-darker h-full flex flex-col">
      {/* VibeTune Logo */}
      <div className="p-6">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-vibetune-green rounded-full flex items-center justify-center">
            <Music className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-bold text-white">VibeTune</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="px-3 space-y-1">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-vibetune-gray text-white"
                  : "text-vibetune-text-muted hover:text-white hover:bg-vibetune-gray"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Playlist Section */}
      <div className="mt-8 px-3">
        <div className="space-y-1">
          {playlistItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-vibetune-gray text-white"
                    : "text-vibetune-text-muted hover:text-white hover:bg-vibetune-gray"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="mt-6 border-t border-vibetune-gray pt-4">
          <div className="px-3 py-2 text-xs font-semibold text-vibetune-text-muted uppercase tracking-wider">
            Features
          </div>
          <div className="space-y-1">
            {featuresItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-vibetune-gray text-white"
                      : "text-vibetune-text-muted hover:text-white hover:bg-vibetune-gray"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Playlists */}
        <div className="mt-6 border-t border-vibetune-gray pt-4">
          <div className="space-y-2">
            <div className="px-3 py-2 text-xs font-semibold text-vibetune-text-muted uppercase tracking-wider">
              Your Playlists
            </div>
            {/* Local playlists from LibraryContext */}
            {playlists.slice(0, 3).map((playlist) => (
              <Link
                key={playlist.id}
                to={`/playlist/${playlist.id}`}
                className="block px-3 py-2 text-sm text-vibetune-text-muted hover:text-white transition-colors truncate"
                title={playlist.name}
              >
                {playlist.name}
              </Link>
            ))}
            {/* Spotify playlists */}
            {userPlaylists.slice(0, 3).map((playlist) => (
              <Link
                key={playlist.id}
                to={`/playlist/${playlist.id}`}
                className="block px-3 py-2 text-sm text-vibetune-text-muted hover:text-white transition-colors truncate"
                title={playlist.name}
              >
                {playlist.name}
              </Link>
            ))}
            {playlists.length === 0 && userPlaylists.length === 0 && (
              <div className="px-3 py-2 text-sm text-vibetune-text-muted">
                No playlists yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-auto p-3 border-t border-vibetune-gray">
        {user && (
          <div className="mb-4">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>Log out</span>
            </button>
          </div>
        )}
        
        <div className="flex items-center space-x-2 text-xs text-vibetune-text-muted">
          <span>Privacy</span>
          <span>•</span>
          <span>Terms</span>
          <span>•</span>
          <span>About</span>
        </div>
      </div>
    </div>
  );
}
