import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import spotifyService from '../services/spotifyService';
import { useAuth } from '../contexts/AuthContext';

const SpotifyCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Spotify authorization failed: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        setStatus('loading');

        // Handle the callback and get the auth response
        const authResponse = await spotifyService.handleCallback(code, state || undefined);

        // Store tokens for Web Playback SDK
        if ((authResponse as any).accessToken) {
          localStorage.setItem('spotify_access_token', (authResponse as any).accessToken);
        }
        if ((authResponse as any).refreshToken) {
          localStorage.setItem('spotify_refresh_token', (authResponse as any).refreshToken);
        }

        // Update auth context
        setUser(authResponse.user);

        setStatus('success');

        // If this is in a popup, send message to parent and close
        if (window.opener) {
          window.opener.postMessage({
            type: 'SPOTIFY_AUTH_SUCCESS',
            user: authResponse.user
          }, window.location.origin);
          window.close();
        } else {
        // If not in popup, redirect to the stored return URL or home
        const returnUrl = localStorage.getItem('vibetune_return_url') || '/';
        localStorage.removeItem('vibetune_return_url');
        setTimeout(() => {
          navigate(returnUrl, { replace: true });
        }, 1500);
        }

      } catch (error) {
        console.error('Spotify callback error:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        setStatus('error');

        // If this is in a popup, send error message to parent
        if (window.opener) {
          window.opener.postMessage({
            type: 'SPOTIFY_AUTH_ERROR',
            error: error instanceof Error ? error.message : 'Authentication failed'
          }, window.location.origin);
          setTimeout(() => window.close(), 2000);
        } else {
          // If not in popup, redirect to the stored return URL or home after error
          const returnUrl = localStorage.getItem('vibetune_return_url') || '/';
          localStorage.removeItem('vibetune_return_url');
          setTimeout(() => {
            navigate(returnUrl, { replace: true });
          }, 3000);
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUser]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-vibetune-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-vibetune-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">Connecting to Spotify</h2>
          <p className="text-vibetune-light">Please wait while we complete your authentication...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-vibetune-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-vibetune-green rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Successfully Connected!</h2>
          <p className="text-vibetune-light">Redirecting you to VibeTime...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-vibetune-dark flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Authentication Failed</h2>
          <p className="text-vibetune-light mb-4">{error}</p>
          <p className="text-sm text-vibetune-light">Redirecting you back to login...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default SpotifyCallback;
