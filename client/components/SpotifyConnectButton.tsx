import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { LogIn, LogOut, Music, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';

interface SpotifyUser {
  id: string;
  display_name: string;
  images?: Array<{ url: string }>;
}

export const SpotifyConnectButton: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check for existing Spotify auth on component mount
  useEffect(() => {
    const checkSpotifyAuth = async () => {
      const sessionToken = localStorage.getItem('spotifySessionToken');
      const accessToken = localStorage.getItem('spotify_access_token');
      
      console.log('🔍 Checking Spotify auth:', { 
        sessionToken: !!sessionToken, 
        accessToken: !!accessToken 
      });

      if (sessionToken || accessToken) {
        try {
          const token = accessToken || sessionToken;
          const userResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('✅ Spotify user data:', userData);
            setSpotifyUser(userData);
          } else {
            console.log('❌ Invalid Spotify token, clearing...');
            localStorage.removeItem('spotifySessionToken');
            localStorage.removeItem('spotify_access_token');
            setSpotifyUser(null);
          }
        } catch (error) {
          console.error('❌ Error checking Spotify auth:', error);
          localStorage.removeItem('spotifySessionToken');
          localStorage.removeItem('spotify_access_token');
          setSpotifyUser(null);
        }
      }
    };

    checkSpotifyAuth();

    // Listen for storage changes (e.g., from another tab)
    const handleStorageChange = () => {
      checkSpotifyAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleConnect = async () => {
    console.log('🎵 Spotify connect button clicked!');
    setIsConnecting(true);
    
    try {
      console.log('🎵 Fetching Spotify auth URL...');
      // Get Spotify authorization URL
      const response = await fetch('/api/auth/spotify/url');
      const data = await response.json();
      
      console.log('🎵 Auth URL received:', data.authUrl);
      
      if (data.authUrl) {
        // Use direct redirect instead of popup for better reliability
        console.log('🎵 Redirecting to Spotify auth...');
        
        // Store the current URL to return to after auth
        localStorage.setItem('vibetune_return_url', window.location.href);
        
        // Redirect directly to Spotify auth
        window.location.href = data.authUrl;

        // With direct redirect, we'll handle success/failure in the callback page
        console.log('🎵 Redirecting to Spotify authentication...');
      } else {
        console.error('🎵 No auth URL received from server');
        setIsConnecting(false);
        toast({
          title: "❌ Server Error",
          description: "Failed to get Spotify authorization URL from server.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('🎵 Error connecting to Spotify:', error);
      setIsConnecting(false);
      toast({
        title: "❌ Connection Error",
        description: "Failed to initiate Spotify connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      // Disconnect Web Playback SDK
      if (window.Spotify) {
        const player = new window.Spotify.Player({
          name: 'VibeTune Player',
          getOAuthToken: () => localStorage.getItem('spotify_access_token') || '',
        });
        player.disconnect();
      }
      
      // Clear tokens
      localStorage.removeItem('spotifySessionToken');
      localStorage.removeItem('spotify_access_token');
      setSpotifyUser(null);
      
      toast({
        title: '👋 Disconnected from Spotify',
        description: 'You have been disconnected from Spotify.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error disconnecting from Spotify:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect from Spotify.',
        variant: 'destructive',
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
      >
        <Music className="w-4 h-4" />
        {isConnecting ? 'Connecting...' : 'Connect Spotify'}
      </Button>
    );
  }

  if (spotifyUser) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {spotifyUser.images?.[0] ? (
            <img
              src={spotifyUser.images[0].url}
              alt={spotifyUser.display_name}
              className="w-8 h-8 rounded-full border-2 border-green-500"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">
              {spotifyUser.display_name}
            </span>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Spotify Connected
            </span>
          </div>
        </div>
        <Button
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          className="text-white border-white hover:bg-white hover:text-black"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
    >
      <Music className="w-4 h-4" />
      {isConnecting ? 'Connecting...' : 'Connect Spotify'}
    </Button>
  );
};