import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Bell, User, Camera, LogOut, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { WebcamModal } from "./WebcamModal";
import { SpotifyConnectButton } from "./SpotifyConnectButton";

export function TopBar() {
  const { user, logout, loginWithSpotify } = useAuth();
  const navigate = useNavigate();
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleSpotifyConnect = async () => {
    try {
      setIsConnecting(true);
      const res = await fetch('/api/auth/spotify/url');
      const data = await res.json();
      if (!res.ok || !data.authUrl) throw new Error('Failed to get authorization URL');

      const authWindow = window.open(
        data.authUrl,
        'spotify-auth',
        `width=600,height=700,left=${(screen.width - 600) / 2},top=${(screen.height - 700) / 2}`
      );

      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS') {
          setIsConnecting(false);
          window.removeEventListener('message', messageListener);
          setTimeout(() => window.location.reload(), 300);
        }
        if (event.data?.type === 'SPOTIFY_AUTH_ERROR') {
          setIsConnecting(false);
          window.removeEventListener('message', messageListener);
        }
      };
      window.addEventListener('message', messageListener);

      const interval = setInterval(() => {
        try {
          if (authWindow?.closed) {
            clearInterval(interval);
            window.removeEventListener('message', messageListener);
            setIsConnecting(false);
          }
        } catch {}
      }, 800);
    } catch (e) {
      console.error('Spotify connect failed:', e);
      setIsConnecting(false);
    }
  };

  const handleWebcamCapture = (imageData: string) => {
    // Handle captured image (e.g., update profile picture)
    console.log('Captured image:', imageData);
    // You could update the user's profile picture here
  };

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 bg-vibetune-dark border-b border-vibetune-gray">
        {/* Navigation Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 bg-vibetune-darker hover:bg-vibetune-gray text-vibetune-text-muted hover:text-white"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 bg-vibetune-darker hover:bg-vibetune-gray text-vibetune-text-muted hover:text-white"
            onClick={() => window.history.forward()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Webcam Button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-vibetune-text-muted hover:text-white"
                onClick={() => setIsWebcamOpen(true)}
              >
                <Camera className="w-5 h-5" />
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="text-vibetune-text-muted hover:text-white"
              >
                <Bell className="w-5 h-5" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 bg-vibetune-green hover:bg-vibetune-green-dark text-black rounded-full"
                  >
                    {user.images && user.images.length > 0 ? (
                      <img
                        src={user.images[0].url}
                        alt={user.displayName}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-vibetune-gray border-vibetune-light-gray">
                  <div className="px-3 py-2 border-b border-vibetune-light-gray">
                    <p className="text-sm font-medium text-white">{user.displayName}</p>
                    <p className="text-xs text-vibetune-text-muted">{user.email || 'Spotify User'}</p>
                  </div>

                  <DropdownMenuItem asChild className="text-white hover:bg-vibetune-light-gray">
                    <Link to="/profile" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="text-white hover:bg-vibetune-light-gray"
                    onClick={() => setIsWebcamOpen(true)}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="text-white hover:bg-vibetune-light-gray">
                    <Link to="/settings" className="flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-vibetune-light-gray" />

                  <DropdownMenuItem
                    className="text-red-400 hover:bg-vibetune-light-gray"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            /* Spotify connect button for non-authenticated users */
            <SpotifyConnectButton size="sm" />
          )}
        </div>
      </div>

      {/* Webcam Modal */}
      <WebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={handleWebcamCapture}
        title="Take a Photo"
      />
    </>
  );
}
