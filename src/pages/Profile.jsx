import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Settings, Trophy, TrendingUp, BarChart3, Target, Crown, Zap, Edit3, Camera, Save, X, AlertCircle, RefreshCw } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../services/api';

// Icon mapping for achievements
const iconMap = {
  TrendingUp,
  Trophy,
  BarChart3,
  Target,
  Crown
};

const Profile = () => {
  const { currentUser } = useAuth();

  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    analyses: 0,
    products: 0,
    reports: 0,
    accuracy: 0
  });

  const [user, setUser] = useState({
    email: '',
    name: '',
    joinDate: '',
    plan: '',
    status: '',
    notifications: {
      email: true,
      push: false,
      weeklyReports: true,
      marketing: false
    }
  });

  const [achievements, setAchievements] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [usage, setUsage] = useState({ api_calls: 0, storage_used: 0 });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user data from API on component mount or when currentUser changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        const response = await getUserProfile();
        if (response.success && response.data) {
          const profile = response.data;
          setUser({
            email: currentUser.email || profile.user.email,
            name: currentUser.displayName || profile.user.name,
            joinDate: profile.user.join_date,
            plan: profile.user.plan,
            status: profile.user.status,
            notifications: {
              email: true,
              push: false,
              weeklyReports: true,
              marketing: false
            }
          });
          setStats(profile.stats);
          setAchievements(profile.achievements);
          setRecentActivity(profile.recent_activity);
          setUsage(profile.usage);
          setIsVisible(true);
          setLoading(false);
        } else {
          throw new Error('Failed to load profile data');
        }
      } catch (error) {
        setError(error.message || 'Failed to load profile');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationToggle = (type) => {
    setUser(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  const handleSaveProfile = () => {
    localStorage.setItem('profileUser', JSON.stringify(user));
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    const savedUser = JSON.parse(localStorage.getItem('profileUser'));
    if (savedUser) {
      setUser(savedUser);
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <RefreshCw className="animate-spin mr-2" />
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-500">
        <AlertCircle className="mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className={`relative max-w-7xl mx-auto py-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        
        {/* Header Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
            
            {/* Avatar Section */}
            <div className="relative group">
              <div className="w-32 h-32 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                {user.name ? user.name.charAt(0).toUpperCase() : <User size={64} className="text-white" />}
              </div>
              <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera size={16} className="text-white" />
              </button>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </div>
            
            {/* User Info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-4">
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={user.name}
                    onChange={handleInputChange}
                    className="text-3xl font-bold bg-transparent border-b border-white/50 text-white mr-3 px-2 py-1 focus:outline-none focus:border-cyan-400"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-white mr-3">
                    {user.name || (user.email ? user.email.split('@')[0] : '')}
                  </h1>
                )}
                <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full text-white text-sm font-medium shadow-lg">
                  {user.plan}
                </span>
              </div>
              
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={user.email}
                  onChange={handleInputChange}
                  className="text-gray-300 text-lg mb-4 bg-transparent border-b border-white/50 w-full px-2 py-1 focus:outline-none focus:border-cyan-400"
                />
              ) : (
                <p className="text-gray-300 text-lg mb-4">{user.email}</p>
              )}
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-gray-300">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-cyan-400" />
                  <span>Member since {user.joinDate}</span>
                </div>
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-yellow-400" />
                  <span className="px-2 py-1 bg-emerald-500/20 rounded-full text-emerald-400 font-medium">
                    {user.status}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Edit/Save Button */}
            {isEditing ? (
              <div className="flex space-x-3">
                <button 
                  onClick={handleSaveProfile}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-white hover:shadow-lg transition-all duration-200 flex items-center"
                >
                  <Save size={16} className="mr-2" />
                  Save
                </button>
                <button 
                  onClick={handleCancelEdit}
                  className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-200 flex items-center"
                >
                  <X size={16} className="mr-2" />
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-200 flex items-center"
              >
                <Edit3 size={16} className="mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.products}</span>
            </div>
            <h3 className="text-gray-300 text-sm font-medium">Products Tracked</h3>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.reports}</span>
            </div>
            <h3 className="text-gray-300 text-sm font-medium">Reports Generated</h3>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl">
                <Target className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.accuracy}%</span>
            </div>
            <h3 className="text-gray-300 text-sm font-medium">Average Confidence</h3>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.analyses}</span>
            </div>
            <h3 className="text-gray-300 text-sm font-medium">Analyses Performed</h3>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-2 mb-8">
          <div className="flex space-x-2 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'achievements', label: 'Achievements', icon: Trophy },
              { id: 'activity', label: 'Recent Activity', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Account Overview</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-cyan-400 mr-3" />
                        <span className="text-gray-300">Email Address</span>
                      </div>
                      <span className="text-white font-medium">{user.email}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-cyan-400 mr-3" />
                        <span className="text-gray-300">Member Since</span>
                      </div>
                      <span className="text-white font-medium">{user.joinDate}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                      <div className="flex items-center">
                        <Crown className="h-5 w-5 text-amber-400 mr-3" />
                        <span className="text-gray-300">Plan</span>
                      </div>
                      <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full text-white text-sm font-medium">
                        {user.plan}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Usage This Month</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-300">API Calls</span>
                          <span className="text-white">{usage.api_calls || 0} / 1000</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2 rounded-full" style={{width: `${Math.min((usage.api_calls || 0) / 10, 100)}%`}}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-300">Storage Used</span>
                          <span className="text-white">{usage.storage_used || 0} GB / 10 GB</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full" style={{width: `${Math.min((usage.storage_used || 0) * 10, 100)}%`}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Achievements</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {achievements.map((achievement, index) => {
                  const IconComponent = iconMap[achievement.icon] || Trophy;
                  return (
                    <div
                      key={index}
                      className={`p-6 rounded-2xl border transition-all duration-300 ${
                        achievement.earned
                          ? `bg-gradient-to-br ${achievement.color} border-white/30 shadow-xl`
                          : 'bg-white/5 border-white/10 opacity-50'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-xl ${achievement.earned ? 'bg-white/20' : 'bg-white/10'}`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {achievement.title}
                          </h3>
                          <p className={`text-sm ${achievement.earned ? 'text-white/90' : 'text-gray-400'}`}>
                            {achievement.description}
                          </p>
                          {achievement.earned && (
                            <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-medium text-white">
                              Earned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Activity Tab */}
          {activeTab === 'activity' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">{activity.action}</p>
                      <p className="text-gray-400 text-sm">{activity.time}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium">
                        {activity.accuracy}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
              <div className="space-y-6">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Email notifications', type: 'email', enabled: user.notifications.email },
                      { label: 'Push notifications', type: 'push', enabled: user.notifications.push },
                      { label: 'Weekly reports', type: 'weeklyReports', enabled: user.notifications.weeklyReports },
                      { label: 'Marketing updates', type: 'marketing', enabled: user.notifications.marketing }
                    ].map((setting, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-300">{setting.label}</span>
                        <button
                          onClick={() => handleNotificationToggle(setting.type)}
                          className={`w-12 h-6 rounded-full transition-all duration-200 ${
                            setting.enabled ? 'bg-cyan-500' : 'bg-gray-600'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                              setting.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          ></div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button 
                    onClick={() => {
                      const savedUser = JSON.parse(localStorage.getItem('profileUser'));
                      if (savedUser) {
                        setUser(savedUser);
                      }
                    }}
                    className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      localStorage.setItem('profileUser', JSON.stringify(user));
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-semibold text-white shadow-lg hover:shadow-cyan-500/25 transition-all duration-200"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upgrade Section */}
        <div className="mt-8 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 backdrop-blur-xl rounded-3xl border border-white/20 p-8 text-center">
          <Crown className="h-16 w-16 text-amber-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Unlock Premium Features</h3>
          <p className="text-gray-300 mb-6">Get unlimited analyses, priority support, and advanced insights</p>
          <button className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-semibold text-white shadow-lg hover:shadow-amber-500/25 transform hover:scale-105 transition-all duration-200">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;