import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Minus, BarChart3, MessageSquare, AlertCircle,
  ArrowUp, ArrowDown, Calendar, Users, PieChart, RefreshCw, Trash2,
  Brain, Target, Zap, Clock, Award, Activity, Globe, Filter,
  ChevronRight, Star, Sparkles, Eye, BookOpen, Download,
  ArrowUpRight, ArrowDownRight, Plus
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,Pie,
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell
} from 'recharts';
import useApi from '../hooks/useApi';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const EnhancedDashboard = () => {
  const { getAnalysisHistory, deleteAnalysis, data: historyData, loading, error } = useApi();
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setRefreshing(true);
      await getAnalysisHistory();
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Process API data when it arrives
  useEffect(() => {
    if (historyData && historyData.success && historyData.data) {
      const analyses = historyData.data;
      setRecentAnalyses(analyses);
      
      // Calculate dashboard metrics from real data
      const totalAnalyses = analyses.length;
      const positiveTrends = analyses.filter(a => a.trend_prediction?.predicted_trend === 'surge').length;
      const avgConfidence = totalAnalyses > 0 ? 
        analyses.reduce((sum, a) => sum + (a.trend_prediction?.confidence || 0), 0) / totalAnalyses : 0;
      const totalDataPoints = analyses.reduce((sum, a) => sum + (a.sentiment?.sample_size || 0), 0);
      
      // Calculate growth rate based on timestamps (simple calculation)
      const now = new Date();
      const recentAnalyses = analyses.filter(a => {
        const analysisDate = new Date(a.timestamp);
        const daysDiff = (now - analysisDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      }).length;
      
      const olderAnalyses = analyses.filter(a => {
        const analysisDate = new Date(a.timestamp);
        const daysDiff = (now - analysisDate) / (1000 * 60 * 60 * 24);
        return daysDiff > 7 && daysDiff <= 14;
      }).length;
      
      const growthRate = olderAnalyses > 0 ? 
        ((recentAnalyses - olderAnalyses) / olderAnalyses * 100) : 
        (recentAnalyses > 0 ? 100 : 0);

      setDashboardMetrics({
        totalAnalyses,
        positiveTrends,
        avgConfidence: Math.round(avgConfidence * 100),
        totalDataPoints,
        growthRate: Math.round(growthRate),
        successRate: Math.round(avgConfidence * 100) // Use confidence as success rate approximation
      });

      // Generate trending products from real data
      const trending = analyses
        .map(analysis => ({
          product: analysis.product,
          score: Math.round(((analysis.sentiment?.confidence_score || 0) + (analysis.trend_prediction?.confidence || 0)) * 50),
          trend: analysis.trend_prediction?.predicted_trend === 'surge' ? 'up' : 
                 analysis.trend_prediction?.predicted_trend === 'drop' ? 'down' : 'stable',
          change: Math.round((analysis.trend_prediction?.confidence || 0) * 30 - 15), // Convert to percentage change
          timestamp: analysis.timestamp
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      setTrendingProducts(trending);
    }
  }, [historyData]);

  useEffect(() => {
    if (error) {
      console.error('API Error:', error);
    }
  }, [error]);

  // Handle smooth navigation from signup
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleRefresh = async () => {
    await loadHistory();
  };

  const getTrendIcon = (trend, size = 20) => {
    const iconProps = { size, className: `${getTrendColor(trend)} transition-all duration-200` };
    switch(trend) {
      case 'surge':
        return <ArrowUpRight {...iconProps} className="text-green-500" />;
      case 'drop':
        return <ArrowDownRight {...iconProps} className="text-red-500" />;
      default:
        return <Minus {...iconProps} className="text-yellow-500" />;
    }
  };

  const getTrendColor = (trend) => {
    switch(trend) {
      case 'surge': return 'text-green-600 bg-green-100';
      case 'drop': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleProductClick = (productName) => {
    navigate('/compare', { state: { preSelectedProduct: productName } });
  };

  // Generate chart data from real analyses
  const chartData = useMemo(() => {
    if (!recentAnalyses.length) return [];
    
    // Group analyses by day
    const dayGroups = {};
    const now = new Date();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
      dayGroups[dayKey] = { 
        day: dayKey, 
        analyses: 0, 
        sentiment: 0, 
        accuracy: 0,
        count: 0 
      };
    }
    
    // Fill with actual data
    recentAnalyses.forEach(analysis => {
      const analysisDate = new Date(analysis.timestamp);
      const daysDiff = Math.floor((now - analysisDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 7) {
        const dayKey = analysisDate.toLocaleDateString('en-US', { weekday: 'short' });
        if (dayGroups[dayKey]) {
          dayGroups[dayKey].analyses++;
          dayGroups[dayKey].sentiment += (analysis.sentiment?.confidence_score || 0) * 100;
          dayGroups[dayKey].accuracy += (analysis.trend_prediction?.confidence || 0) * 100;
          dayGroups[dayKey].count++;
        }
      }
    });
    
    // Calculate averages
    return Object.values(dayGroups).map(day => ({
      ...day,
      sentiment: day.count > 0 ? day.sentiment / day.count : 0,
      accuracy: day.count > 0 ? day.accuracy / day.count : 0
    }));
  }, [recentAnalyses]);

  if (loading && !recentAnalyses.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl mr-3">
                <Brain className="h-6 w-6 text-white" />
              </div>
              AI Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Real-time insights and trend predictions powered by machine learning</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-xl hover:border-gray-400 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Performance Metrics */}
        {dashboardMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Analyses</h3>
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <BarChart3 size={20} className="text-indigo-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {dashboardMetrics.totalAnalyses}
              </div>
              <div className="flex items-center text-sm">
                {dashboardMetrics.growthRate >= 0 ? (
                  <ArrowUp size={14} className="text-green-500 mr-1" />
                ) : (
                  <ArrowDown size={14} className="text-red-500 mr-1" />
                )}
                <span className={`font-medium ${dashboardMetrics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {dashboardMetrics.growthRate >= 0 ? '+' : ''}{dashboardMetrics.growthRate}%
                </span>
                <span className="text-gray-500 ml-1">vs last period</span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Positive Trends</h3>
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp size={20} className="text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {dashboardMetrics.positiveTrends}
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600">
                  {dashboardMetrics.totalAnalyses > 0 ? 
                    Math.round((dashboardMetrics.positiveTrends / dashboardMetrics.totalAnalyses) * 100) : 0}% of analyses
                </span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Avg Confidence</h3>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target size={20} className="text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {dashboardMetrics.avgConfidence}%
              </div>
              <div className="flex items-center text-sm">
                <Award size={14} className="text-blue-500 mr-1" />
                <span className="text-blue-600 font-medium">{dashboardMetrics.successRate}%</span>
                <span className="text-gray-500 ml-1">accuracy rate</span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Data Points</h3>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Globe size={20} className="text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {dashboardMetrics.totalDataPoints.toLocaleString()}
              </div>
              <div className="flex items-center text-sm">
                <Activity size={14} className="text-purple-500 mr-1" />
                <span className="text-gray-600">analyzed this period</span>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Performance Trends */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Analysis Performance</h3>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="analyses"
                  stroke="#6366F1"
                  fill="url(#colorGradient)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sentiment Distribution */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sentiment Overview</h3>
              <MessageSquare className="h-5 w-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={[
                    { 
                      name: 'Positive', 
                      value: recentAnalyses.filter(a => a.sentiment?.overall_sentiment === 'positive').length || 1, 
                      color: '#10B981' 
                    },
                    { 
                      name: 'Neutral', 
                      value: recentAnalyses.filter(a => a.sentiment?.overall_sentiment === 'neutral').length || 1, 
                      color: '#F59E0B' 
                    },
                    { 
                      name: 'Negative', 
                      value: recentAnalyses.filter(a => a.sentiment?.overall_sentiment === 'negative').length || 1, 
                      color: '#EF4444' 
                    }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: 'Positive', value: recentAnalyses.filter(a => a.sentiment?.overall_sentiment === 'positive').length, color: '#10B981' },
                    { name: 'Neutral', value: recentAnalyses.filter(a => a.sentiment?.overall_sentiment === 'neutral').length, color: '#F59E0B' },
                    { name: 'Negative', value: recentAnalyses.filter(a => a.sentiment?.overall_sentiment === 'negative').length, color: '#EF4444' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trending Products & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Trending Products */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Sparkles className="h-5 w-5 text-indigo-600 mr-2" />
                Trending Products
              </h3>
              <Link 
                to="/analysis"
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Analyze New →
              </Link>
            </div>
            
            {trendingProducts.length > 0 ? (
              <div className="space-y-3">
                {trendingProducts.map((product, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                    onClick={() => handleProductClick(product.product)}
                  >
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg mr-3">
                        <span className="text-white font-bold text-sm">{idx + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.product}</p>
                        <p className="text-sm text-gray-500">Score: {product.score}/100</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <span className={`text-sm font-medium mr-2 ${
                        product.trend === 'up' ? 'text-green-600' : 
                        product.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {product.change > 0 ? '+' : ''}{product.change}%
                      </span>
                      {product.trend === 'up' && <ArrowUp size={16} className="text-green-500" />}
                      {product.trend === 'down' && <ArrowDown size={16} className="text-red-500" />}
                      {product.trend === 'stable' && <Minus size={16} className="text-gray-500" />}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Sparkles size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No trending products yet</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Zap className="h-5 w-5 text-indigo-600 mr-2" />
              Quick Actions
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/analysis"
                className="group p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center mb-2">
                  <Brain size={20} className="mr-2" />
                  <span className="font-semibold">New Analysis</span>
                </div>
                <p className="text-xs opacity-90">Start AI prediction</p>
              </Link>

              <Link
                to="/compare"
                className="group p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center mb-2">
                  <Users size={20} className="mr-2" />
                  <span className="font-semibold">Compare</span>
                </div>
                <p className="text-xs opacity-90">Side-by-side analysis</p>
              </Link>

              <button
                onClick={() => window.print()}
                className="group p-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl text-white hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center mb-2">
                  <Download size={20} className="mr-2" />
                  <span className="font-semibold">Export</span>
                </div>
                <p className="text-xs opacity-90">Download reports</p>
              </button>

              <Link
                to="/analysis"
                className="group p-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl text-white hover:from-orange-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center mb-2">
                  <BookOpen size={20} className="mr-2" />
                  <span className="font-semibold">Insights</span>
                </div>
                <p className="text-xs opacity-90">View detailed analysis</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Analyses Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="h-5 w-5 text-indigo-600 mr-2" />
                  Recent Analyses
                </h2>
                <p className="text-sm text-gray-600 mt-1">Latest AI-powered product predictions</p>
              </div>
              <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                <span className="text-sm text-gray-500">{recentAnalyses.length} total analyses</span>
                <Link
                  to="/analyses"
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                >
                  View all <ChevronRight size={14} className="ml-1" />
                </Link>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center">
                <AlertCircle size={20} className="text-red-400 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {recentAnalyses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses yet</h3>
              <p className="text-gray-500 mb-6">Start by analyzing your first product to see insights here</p>
              <Link
                to="/analysis"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                <Plus size={18} className="mr-2" />
                Analyze Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Analysis Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Sentiment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Trend Prediction
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Opportunity Score
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Data Sources
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-gray-100">
                  {recentAnalyses.slice(0, 5).map((analysis) => {
                    const opportunityScore = Math.round(((analysis.sentiment?.confidence_score || 0) + (analysis.trend_prediction?.confidence || 0)) * 50);
                    
                    return (
                      <tr 
                        key={analysis.id} 
                        className="hover:bg-white/80 transition-all duration-200 cursor-pointer group"
                        onClick={() => handleProductClick(analysis.product)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                              <span className="text-white font-bold text-sm">
                                {analysis.product.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {analysis.product}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(analysis.sentiment?.sample_size || 0).toLocaleString()} data points
                              </p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock size={14} className="mr-1" />
                            {formatDate(analysis.timestamp)}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              analysis.sentiment?.overall_sentiment === 'positive' 
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : analysis.sentiment?.overall_sentiment === 'negative'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }`}>
                              {analysis.sentiment?.overall_sentiment || 'unknown'}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              {Math.round((analysis.sentiment?.confidence_score || 0) * 100)}%
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getTrendIcon(analysis.trend_prediction?.predicted_trend, 18)}
                            <div className="ml-2">
                              <p className="text-sm font-semibold text-gray-900 capitalize">
                                {analysis.trend_prediction?.predicted_trend || 'unknown'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {Math.round((analysis.trend_prediction?.confidence || 0) * 100)}% confidence
                              </p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3 w-16">
                              <div 
                                className={`h-2 rounded-full ${
                                  opportunityScore >= 80 ? 'bg-green-500' :
                                  opportunityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${opportunityScore}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {opportunityScore}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {(analysis.sources_used || []).slice(0, 3).map(source => (
                              <span 
                                key={source} 
                                className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium"
                              >
                                {source}
                              </span>
                            ))}
                            {(analysis.sources_used || []).length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                                +{analysis.sources_used.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/compare', { state: { preSelectedProduct: analysis.product } });
                              }}
                              className="p-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                              title="Compare product"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete analysis for ${analysis.product}?`)) {
                                  try {
                                    await deleteAnalysis(analysis.id);
                                    setRecentAnalyses(prev => prev.filter(a => a.id !== analysis.id));
                                  } catch (error) {
                                    alert('Failed to delete analysis: ' + error.message);
                                  }
                                }
                              }}
                              className="p-1 text-red-600 hover:text-red-800 transition-colors"
                              title="Delete analysis"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;