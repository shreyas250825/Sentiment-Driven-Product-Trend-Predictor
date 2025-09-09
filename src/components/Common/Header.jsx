import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, TrendingUp, ArrowLeftRight, User, Clock, Menu, X, Zap, Shield, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiInstance from '../../services/apiInstance';

const Header = () => {
  const { currentUser, logout, getElapsedTime } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [notifications, setNotifications] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPath, setCurrentPath] = useState(location.pathname);

  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location]);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await apiInstance.get('/health');
        if (response.status === 200 && response.data.status) {
          setBackendStatus(response.data.status);
        } else {
          setBackendStatus('unhealthy');
        }
      } catch (error) {
        setBackendStatus('offline');
      }
    };

    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 60000); // check every 60 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch notifications count from backend
    const fetchNotifications = async () => {
      try {
        const response = await apiInstance.get('/notifications');
        if (response.status === 200 && response.data.count !== undefined) {
          setNotifications(response.data.count);
        } else {
          setNotifications(0);
        }
      } catch (error) {
        setNotifications(0);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatTime = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const isActive = (path) => currentPath === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: TrendingUp },
    { path: '/analysis', label: 'Analysis', icon: BarChart3 },
    { path: '/compare', label: 'Compare', icon: ArrowLeftRight }
  ];

  const handleNavigation = (path) => {
    console.log('handleNavigation called with path:', path);
    setCurrentPath(path);
    setIsMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    console.log('handleLogout called');
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-emerald-400';
      case 'offline': return 'text-red-400';
      case 'unhealthy': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <Zap className="h-3 w-3" />;
      case 'offline': return <X className="h-3 w-3" />;
      case 'unhealthy': return <Shield className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3 animate-spin" />;
    }
  };

  return (
    <header className={`sticky top-0 relative z-50 bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all duration-300 ${isVisible ? '' : 'transform -translate-y-full'}`}>
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 animate-pulse pointer-events-none"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          
          {/* Logo */}
          <div className="flex items-center cursor-pointer group" onClick={() => handleNavigation('/')}>
            <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              <div className="relative bg-gradient-to-r from-cyan-500 to-purple-600 p-2 rounded-xl">
                <BarChart3 size={28} className="text-white" />
              </div>
            </div>
            <div className="ml-3">
              <span className="text-2xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                TrendSight
              </span>
              <div className="text-xs text-cyan-400 font-medium">AI Powered</div>
            </div>
          </div>

          {/* Desktop Navigation */}
          {currentUser && (
            <nav className="hidden lg:flex items-center space-x-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`group relative flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-white shadow-lg border border-cyan-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <item.icon size={16} className={`mr-2 ${isActive(item.path) ? 'text-cyan-400' : ''}`} />
                  {item.label}
                  {isActive(item.path) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-600/10 rounded-xl pointer-events-none"></div>
                  )}
                </button>
              ))}
            </nav>
          )}

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                {/* Session Timer */}
                {getElapsedTime() > 0 && (
                  <div className="hidden sm:flex items-center px-3 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                    <Clock size={16} className="mr-2 text-cyan-400" />
                    <span className="text-sm text-gray-300 font-medium">{formatTime(getElapsedTime())}</span>
                  </div>
                )}

                {/* Notifications */}
                <button className="relative p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/20 transition-all duration-200">
                  <Bell size={18} className="text-gray-300" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                      {notifications}
                    </span>
                  )}
                </button>

                {/* Profile Button */}
                <button
                  onClick={() => handleNavigation('/profile')}
                  className={`group flex items-center space-x-3 px-4 py-2 rounded-xl border transition-all duration-200 ${
                    isActive('/profile')
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border-cyan-500/30 text-white'
                      : 'bg-white/10 backdrop-blur-sm border-white/10 text-gray-300 hover:text-white hover:bg-white/20'
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {currentUser.email.split('@')[0]}
                  </span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 text-sm font-medium"
                >
                  Logout
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="lg:hidden p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/20 transition-all duration-200"
                >
                  {isMenuOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleNavigation('/login')}
                  className="px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-semibold text-white hover:bg-white/20 transition-all duration-200"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigation('/signup')}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-semibold text-white shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-200"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Backend Status Indicator */}
        <div className="flex items-center justify-center pb-3">
          <div className={`flex items-center space-x-2 px-3 py-1 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 text-xs ${getStatusColor(backendStatus)}`}>
            {getStatusIcon(backendStatus)}
            <span className="font-medium">
              Backend: {backendStatus.charAt(0).toUpperCase() + backendStatus.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && currentUser && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-white border border-cyan-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <item.icon size={20} className={`mr-3 ${isActive(item.path) ? 'text-cyan-400' : ''}`} />
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile Session Timer */}
              {getElapsedTime() > 0 && (
                <div className="flex items-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                  <Clock size={20} className="mr-3 text-cyan-400" />
                  <span className="text-gray-300">Session: {formatTime(getElapsedTime())}</span>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;