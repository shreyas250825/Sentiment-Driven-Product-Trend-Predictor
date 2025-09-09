import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Mail, Lock, Sparkles, Shield, Check, X, User, Zap } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validations, setValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const { signUpWithEmail, googleSignIn, currentUser } = useAuth();

  useEffect(() => {
    const checkValidations = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };
    
    setValidations(checkValidations);
    
    const strength = Object.values(checkValidations).filter(Boolean).length;
    setPasswordStrength(strength);
  }, [password]);

  useEffect(() => {
    // Simple navigation when user is authenticated
    if (currentUser && !hasNavigated) {
      setIsNavigating(true);
      setTimeout(() => {
        setHasNavigated(true);
        navigate('/dashboard', { replace: true });
      }, 2000); // Further increased delay to prevent flickering
    }
  }, [currentUser, navigate, hasNavigated]);

  const validateEmail = (email) => {
    const re = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    if (passwordStrength < 5) {
      setError('Password must meet all requirements.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      await signUpWithEmail(email, password);
      // Navigation will be handled by the useEffect above
    } catch (error) {
      setError(error.message || 'Signup failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError('');
    try {
      await googleSignIn();
      // Navigation will be handled by the useEffect above
    } catch (error) {
      setError('Google sign-up failed. Please try again.');
      setIsLoading(false);
    }
  };

  const getStrengthColor = (strength) => {
    if (strength < 2) return 'from-red-500 to-red-600';
    if (strength < 4) return 'from-yellow-500 to-orange-500';
    return 'from-emerald-500 to-green-600';
  };

  const getStrengthText = (strength) => {
    if (strength < 2) return 'Weak';
    if (strength < 4) return 'Good';
    return 'Strong';
  };

  const features = [
    { icon: BarChart3, text: 'Advanced AI Analytics' },
    { icon: Shield, text: 'Enterprise Security' },
    { icon: Zap, text: 'Real-time Insights' }
  ];

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

      <div className="relative w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Features */}
          <div className="hidden lg:block space-y-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Join the Future of
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent block">
                  Business Intelligence
                </span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                Transform your decision-making with AI-powered trend analysis and predictive insights.
              </p>
            </div>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                  <div className="p-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg font-medium text-white">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-sm text-gray-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-sm text-gray-400">Support</div>
              </div>
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <div className="w-full max-w-md mx-auto lg:max-w-none">
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-600/5 rounded-3xl"></div>
              
              {/* Header */}
              <div className="relative text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                <p className="text-gray-300">Start your journey with TrendSight</p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-red-300">Registration Error</h3>
                      <p className="text-sm text-red-400 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
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
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                      placeholder="Create a strong password"
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
                  
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Password Strength</span>
                        <span className={`font-medium bg-gradient-to-r ${getStrengthColor(passwordStrength)} bg-clip-text text-transparent`}>
                          {getStrengthText(passwordStrength)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${getStrengthColor(passwordStrength)} transition-all duration-300`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        ></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(validations).map(([key, isValid]) => (
                          <div key={key} className="flex items-center space-x-2">
                            {isValid ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <X className="h-3 w-3 text-gray-500" />
                            )}
                            <span className={isValid ? 'text-emerald-400' : 'text-gray-500'}>
                              {key === 'length' && '8+ characters'}
                              {key === 'uppercase' && 'Uppercase'}
                              {key === 'lowercase' && 'Lowercase'}
                              {key === 'number' && 'Number'}
                              {key === 'special' && 'Special char'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium text-gray-200 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-600/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                  
                  {/* Password Match Indicator */}
                  {confirmPassword && (
                    <div className="flex items-center space-x-2 text-sm">
                      {password === confirmPassword ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-red-400" />
                          <span className="text-red-400">Passwords don't match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Terms & Privacy */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    className="w-4 h-4 mt-1 rounded bg-white/5 border border-white/10 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed">
                    I agree to the{' '}
                    <button className="text-cyan-400 hover:text-cyan-300 underline">Terms of Service</button>
                    {' '}and{' '}
                    <button className="text-cyan-400 hover:text-cyan-300 underline">Privacy Policy</button>
                  </label>
                </div>

                {/* Sign Up Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || passwordStrength < 5 || password !== confirmPassword}
                  className="group relative w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-semibold text-white shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Create Account
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
                    <span className="px-4 bg-slate-900/50 text-gray-400">Or sign up with</span>
                  </div>
                </div>
              </div>

              {/* Google Sign Up */}
              <button
                onClick={handleGoogleSignUp}
                disabled={isLoading}
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

              {/* Login Link */}
              <div className="text-center mt-8 z-50 relative">
                <p className="text-gray-400">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-200"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>

            {/* Security Badge */}
            <div className="text-center mt-6">
              <div className="inline-flex items-center px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
                <Shield className="h-4 w-4 text-emerald-400 mr-2" />
                <span className="text-sm text-gray-300">Protected by enterprise-grade security</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;