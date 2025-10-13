import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithSpotify } = useAuth();

  const handleSpotifyLogin = async () => {
    try {
      setError('');
      setIsLoading(true);
      
      // Get the authorization URL from the backend
      const response = await fetch('/api/auth/spotify/url');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get authorization URL');
      }
      
      // Open Spotify OAuth in a popup window
      const popup = window.open(
        data.authUrl,
        'spotify-login',
        'width=500,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
      );
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }
      
      // Listen for the popup to close or send a message
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsLoading(false);
          // Check if authentication was successful by trying to get user info
          checkAuthStatus();
        }
      }, 1000);
      
      // Listen for messages from the popup (callback page)
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'SPOTIFY_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageListener);
          // Handle successful authentication
          window.location.href = '/';
        } else if (event.data.type === 'SPOTIFY_AUTH_ERROR') {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageListener);
          setError(event.data.error || 'Authentication failed');
          setIsLoading(false);
        }
      };
      
      window.addEventListener('message', messageListener);
      
    } catch (error) {
      console.error('Spotify login failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect with Spotify. Please try again.');
      setIsLoading(false);
    }
  };
  
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      if (response.ok) {
        // User is authenticated, redirect to main app
        window.location.href = '/';
      }
    } catch (error) {
      // User is not authenticated, stay on login page
      console.log('User not authenticated');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-vibetune-dark via-vibetune-darker to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-vibetune-green rounded-full flex items-center justify-center">
              <Music className="w-7 h-7 text-black" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-vibetune-text-muted mt-2">Sign in to your VibeTune account</p>
        </div>

        {/* Spotify Login */}
        <div className="bg-vibetune-gray/20 backdrop-blur-sm rounded-2xl p-8 border border-vibetune-gray/20">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Connect with Spotify</h2>
              <p className="text-vibetune-text-muted text-sm">
                Access your music library, playlists, and discover new tracks
              </p>
            </div>

            <Button
              onClick={handleSpotifyLogin}
              className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold py-4 rounded-full transition-all duration-200 flex items-center justify-center space-x-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting to Spotify...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <span>Continue with Spotify</span>
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-vibetune-gray/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-vibetune-gray/20 text-vibetune-text-muted">Why Spotify?</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center space-x-3 text-vibetune-text-muted">
                <div className="w-2 h-2 bg-vibetune-green rounded-full"></div>
                <span>Access to millions of songs and podcasts</span>
              </div>
              <div className="flex items-center space-x-3 text-vibetune-text-muted">
                <div className="w-2 h-2 bg-vibetune-green rounded-full"></div>
                <span>Sync your existing playlists and liked songs</span>
              </div>
              <div className="flex items-center space-x-3 text-vibetune-text-muted">
                <div className="w-2 h-2 bg-vibetune-green rounded-full"></div>
                <span>Personalized music recommendations</span>
              </div>
              <div className="flex items-center space-x-3 text-vibetune-text-muted">
                <div className="w-2 h-2 bg-vibetune-green rounded-full"></div>
                <span>Control playback across all your devices</span>
              </div>
            </div>

            <div className="text-center text-xs text-vibetune-text-muted">
              <p>
                By continuing, you agree to Spotify's{' '}
                <a href="https://www.spotify.com/legal/end-user-agreement/" target="_blank" rel="noopener noreferrer" className="text-vibetune-green hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="https://www.spotify.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-vibetune-green hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
