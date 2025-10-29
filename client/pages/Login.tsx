import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Loader2, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const { loginWithSpotify } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Simulate API call for email/password login
      // In a real app, this would call your authentication API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, accept any email/password
      if (formData.email && formData.password) {
        toast({
          title: "🎵 Welcome to VibeTune!",
          description: "You've successfully logged in.",
        });
        navigate('/');
      } else {
        throw new Error('Please fill in all fields');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Simulate API call for signup
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "🎉 Account Created!",
        description: "Welcome to VibeTune! You can now start exploring music.",
      });
      navigate('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        window.location.href = '/';
      }
    } catch (error) {
      console.log('User not authenticated');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-vibetune-dark via-vibetune-darker to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-vibetune-green to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
              <Music className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">VibeTune</h1>
          <p className="text-vibetune-text-muted">Your AI-powered music discovery platform</p>
        </div>

        {/* Main Login Card */}
        <Card className="bg-vibetune-gray/20 backdrop-blur-sm border-vibetune-gray/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
            <CardDescription className="text-vibetune-text-muted">
              Choose your preferred way to sign in
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-vibetune-gray/30 mb-6">
                <TabsTrigger value="login" className="text-white data-[state=active]:bg-vibetune-green data-[state=active]:text-black">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-white data-[state=active]:bg-vibetune-green data-[state=active]:text-black">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vibetune-text-muted w-4 h-4" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10 bg-vibetune-gray/50 border-vibetune-gray text-white placeholder:text-vibetune-text-muted focus:border-vibetune-green"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vibetune-text-muted w-4 h-4" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10 pr-10 bg-vibetune-gray/50 border-vibetune-gray text-white placeholder:text-vibetune-text-muted focus:border-vibetune-green"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-vibetune-text-muted" />
                        ) : (
                          <Eye className="h-4 w-4 text-vibetune-text-muted" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        id="remember"
                        type="checkbox"
                        className="w-4 h-4 text-vibetune-green bg-vibetune-gray border-vibetune-gray rounded focus:ring-vibetune-green focus:ring-2"
                      />
                      <Label htmlFor="remember" className="text-sm text-vibetune-text-muted">
                        Remember me
                      </Label>
                    </div>
                    <Link to="/forgot-password" className="text-sm text-vibetune-green hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-vibetune-green hover:bg-vibetune-green-dark text-black font-semibold py-3 rounded-lg transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-white">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vibetune-text-muted w-4 h-4" />
                      <Input
                        id="signup-name"
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10 bg-vibetune-gray/50 border-vibetune-gray text-white placeholder:text-vibetune-text-muted focus:border-vibetune-green"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vibetune-text-muted w-4 h-4" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10 bg-vibetune-gray/50 border-vibetune-gray text-white placeholder:text-vibetune-text-muted focus:border-vibetune-green"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vibetune-text-muted w-4 h-4" />
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10 pr-10 bg-vibetune-gray/50 border-vibetune-gray text-white placeholder:text-vibetune-text-muted focus:border-vibetune-green"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-vibetune-text-muted" />
                        ) : (
                          <Eye className="h-4 w-4 text-vibetune-text-muted" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-white">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vibetune-text-muted w-4 h-4" />
                      <Input
                        id="confirm-password"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-10 bg-vibetune-gray/50 border-vibetune-gray text-white placeholder:text-vibetune-text-muted focus:border-vibetune-green"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="terms"
                      type="checkbox"
                      className="w-4 h-4 text-vibetune-green bg-vibetune-gray border-vibetune-gray rounded focus:ring-vibetune-green focus:ring-2"
                      required
                    />
                    <Label htmlFor="terms" className="text-sm text-vibetune-text-muted">
                      I agree to the{' '}
                      <Link to="/terms" className="text-vibetune-green hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-vibetune-green hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-vibetune-green hover:bg-vibetune-green-dark text-black font-semibold py-3 rounded-lg transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-vibetune-gray/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-vibetune-gray/20 text-vibetune-text-muted">Or continue with</span>
              </div>
            </div>

            {/* Spotify Login */}
            <Button
              onClick={handleSpotifyLogin}
              className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <span>Continue with Spotify</span>
                </>
              )}
            </Button>

            {/* Features */}
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center space-x-3 text-vibetune-text-muted">
                <div className="w-2 h-2 bg-vibetune-green rounded-full"></div>
                <span>Access to millions of songs and podcasts</span>
              </div>
              <div className="flex items-center space-x-3 text-vibetune-text-muted">
                <div className="w-2 h-2 bg-vibetune-green rounded-full"></div>
                <span>AI-powered music recommendations</span>
              </div>
              <div className="flex items-center space-x-3 text-vibetune-text-muted">
                <div className="w-2 h-2 bg-vibetune-green rounded-full"></div>
                <span>Create and share playlists</span>
              </div>
              <div className="flex items-center space-x-3 text-vibetune-text-muted">
                <div className="w-2 h-2 bg-vibetune-green rounded-full"></div>
                <span>Face recognition for mood-based music</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-vibetune-text-muted">
          <p>
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-vibetune-green hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-vibetune-green hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
