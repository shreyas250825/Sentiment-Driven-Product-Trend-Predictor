import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Mail, Lock, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithEmail, googleSignIn, loading, error, currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Simple navigation when user is authenticated
    if (currentUser && !hasNavigated) {
      setIsNavigating(true);
      setTimeout(() => {
        setHasNavigated(true);
        navigate('/dashboard', { replace: true });
      }, 3000); // Significantly increased delay to prevent flickering
    }
  }, [currentUser, navigate, hasNavigated]);

  const handleSubmit = async () => {
    if (!email || !password) {
      return;
    }

    setLocalLoading(true);
    try {
      await signInWithEmail(email, password);
      // Navigation will be handled by the useEffect above
    } catch (err) {
      setLocalLoading(false);
      // Error is handled by useAuth hook
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalLoading(true);
    try {
      await googleSignIn();
      // Navigation will be handled by the useEffect above
    } catch (err) {
      setLocalLoading(false);
      // Error is handled by useAuth hook
    }
  };

  const handleSignUpRedirect = () => {
    navigate('/signup');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Don't render anything if we're navigating or user is authenticated
  if (isNavigating || currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-white/60">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 right-40 w-60 h-60 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Main Login Card */}
        <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
          {/* Header */}
          <div className="relative text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-300">Sign in to your TrendSight account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-300">Authentication Error</h3>
                  <p className="text-sm text-red-400 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-200 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-600/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-200 flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 pr-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-600/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded bg-white/5 border border-white/10 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                />
                <span className="ml-2 text-gray-300">Remember me</span>
              </label>
              <button
                type="button"
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={localLoading || loading}
              className="group relative w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-semibold text-white shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:transform-none"
            >
              <span className="relative z-10 flex items-center justify-center">
            {(localLoading || loading) ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Signing In...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 mr-2" />
                Sign In
              </>
            )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          </div>

          {/* Divider */}
          <div className="my-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-900/50 text-gray-400">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={localLoading || loading}
            className="w-full py-3 px-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl font-medium text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-50 flex items-center justify-center group"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="group-hover:text-cyan-300 transition-colors duration-200">Continue with Google</span>
          </button>

          {/* Sign Up Link */}
          <div className="relative text-center mt-8">
            <p className="text-gray-400 mb-3">
              Don't have an account?
            </p>
            <button
              type="button"
              onClick={handleSignUpRedirect}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-400/30 text-cyan-400 rounded-xl hover:from-cyan-500/30 hover:to-purple-600/30 hover:border-cyan-400/50 hover:text-cyan-300 transition-all duration-300 font-medium cursor-pointer z-10 pointer-events-auto"
            >
              Create one now
            </button>
          </div>

          {/* Demo Info */}
          {!error && (
            <div className="mt-6 p-4 bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-xl">
              <div className="text-center">
                <p className="text-sm text-blue-300 font-medium mb-2">Demo Access Available</p>
                <p className="text-xs text-blue-400">Use your Google account or create a new account to get started</p>
              </div>
            </div>
          )}
        </div>

        {/* Security Badge */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
            <Shield className="h-4 w-4 text-emerald-400 mr-2" />
            <span className="text-sm text-gray-300">Secured by 256-bit SSL encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;