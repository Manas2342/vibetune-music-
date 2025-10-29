import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  displayName: string;
  email?: string;
  country?: string;
  followers: number;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  product?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithSpotify: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for authentication from URL params (after Spotify connection)
    const checkAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionToken = urlParams.get('sessionToken');
        const userParam = urlParams.get('user');
        
        if (sessionToken && userParam) {
          // Store session token
          localStorage.setItem('vibetune_session', sessionToken);
          const userData = JSON.parse(decodeURIComponent(userParam));
          setUser(userData);
          localStorage.setItem('vibetune_user', JSON.stringify(userData));
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          // Check for existing session
          const existingUser = localStorage.getItem('vibetune_user');
          const existingSession = localStorage.getItem('vibetune_session');
          if (existingUser && existingSession) {
            setUser(JSON.parse(existingUser));
          } else {
            // Spotify auth flow: use spotifySessionToken to fetch user
            const spotifySession = localStorage.getItem('spotifySessionToken');
            if (spotifySession) {
              try {
                const res = await fetch('/api/auth/user', {
                  headers: { Authorization: `Bearer ${spotifySession}` }
                });
                if (res.ok) {
                  const data = await res.json();
                  if (data?.user) {
                    setUser({
                      id: data.user.id,
                      displayName: data.user.display_name,
                      email: data.user.email,
                      country: data.user.country,
                      followers: data.user.followers?.total ?? 0,
                      images: data.user.images ?? [],
                      product: data.user.product,
                    });
                    localStorage.setItem('vibetune_user', JSON.stringify({
                      id: data.user.id,
                      displayName: data.user.display_name,
                      email: data.user.email,
                      country: data.user.country,
                      followers: data.user.followers?.total ?? 0,
                      images: data.user.images ?? [],
                      product: data.user.product,
                    }));
                    // Also mirror into vibetune_session for consistency
                    localStorage.setItem('vibetune_session', spotifySession);
                  }
                }
              } catch {}
            }
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Clear invalid session
        localStorage.removeItem('vibetune_user');
        localStorage.removeItem('vibetune_session');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const loginWithSpotify = async (): Promise<void> => {
    try {
      // Connect to Spotify API
      const response = await fetch('/api/auth/spotify/url');
      const { authUrl } = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to connect with Spotify:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // For now, redirect to Spotify login instead
    await loginWithSpotify();
    return true;
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    // For now, redirect to Spotify login instead
    await loginWithSpotify();
    return true;
  };

  const logout = async () => {
    try {
      // Clear all local storage
      localStorage.removeItem('vibetune_user');
      localStorage.removeItem('vibetune_session');
      localStorage.removeItem('spotifySessionToken');
      localStorage.removeItem('spotify_access_token');
      localStorage.removeItem('spotify_refresh_token');
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('vibetune_user', JSON.stringify(updatedUser));
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithSpotify,
    signup,
    logout,
    updateProfile,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
