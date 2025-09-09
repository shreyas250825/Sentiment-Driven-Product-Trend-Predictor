import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  ScatterChart,
  Scatter,
  PieChart,
  Pie
} from 'recharts';
import { 
  ArrowLeftRight, Download, RefreshCw, AlertCircle, TrendingUp, X, Plus,
  Brain, Target, Sparkles, Eye, MessageSquare, BarChart3, Activity,
  ArrowUpRight, ArrowDownRight, Minus, Globe, Zap, Info, Award,
  CheckCircle, XCircle, Clock, Users, Filter, Search, ChevronDown,
  ChevronUp, Target as TargetIcon, TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon, BarChart2, LineChart as LineChartIcon
} from 'lucide-react';
import useApi from '../hooks/useApi';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const EnhancedProductComparison = () => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [comparisonInsights, setComparisonInsights] = useState(null);
  const [viewMode, setViewMode] = useState('metrics'); // 'metrics', 'trends', 'details'
  const [expandedSections, setExpandedSections] = useState({
    insights: true,
    metrics: true,
    trends: true,
    details: false
  });
  
  const { getAnalysisHistory, compareProducts, data, loading: apiLoading } = useApi();
  const location = useLocation();
  const navigate = useNavigate();

  // Check for preselected products from Dashboard
  useEffect(() => {
    if (location.state?.preSelectedProduct) {
      setSelectedProducts([location.state.preSelectedProduct]);
      // Clear the state to avoid re-adding on re-render
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Fetch available products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setRefreshing(true);
      await getAnalysisHistory();
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setRefreshing(false);
    }
  };

  // Extract products from API response
  const availableProducts = data?.success && data.data ? 
    data.data.map(analysis => ({ 
      name: analysis.product, 
      id: analysis.id,
      sentiment: analysis.sentiment?.overall_sentiment,
      confidence: analysis.sentiment?.confidence_score,
      trend: analysis.trend_prediction?.predicted_trend,
      timestamp: analysis.timestamp
    })) : [];

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchComparisonData = async () => {
    if (selectedProducts.length === 0) {
      setComparisonData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const selectedNames = selectedProducts.join(',');
      await compareProducts(selectedNames);
    } catch (err) {
      console.error('Error fetching comparison data:', err);
      
      let errorMessage = 'Failed to load comparison data. Please try again.';
      
      if (err.response) {
        const status = err.response.status;
        if (status === 404) {
          errorMessage = 'No analysis data found for the selected products. Please run analyses first.';
        } else if (status === 403) {
          errorMessage = 'Access denied. Please check your permissions and try again.';
        } else if (status === 500) {
          errorMessage = 'Server error occurred. Please try again in a few moments.';
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      setComparisonData([]);
    } finally {
      setLoading(false);
    }
  };

  // Update comparisonData when API returns data
  useEffect(() => {
    if (data && data.success && Array.isArray(data.data)) {
      const metrics = [
        'sentiment_score',
        'trend_confidence', 
        'sample_size',
        'opportunity_score',
        'model_accuracy'
      ];
      
      const formattedData = metrics.map(metric => {
        const obj = {
          name: metric.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          key: metric
        };
        
        data.data.forEach(product => {
          let value = 0;
          switch(metric) {
            case 'sentiment_score':
              value = (product.sentiment?.confidence_score || 0) * 100;
              break;
            case 'trend_confidence':
              value = (product.trend_prediction?.confidence || 0) * 100;
              break;
            case 'sample_size':
              value = Math.min((product.sentiment?.sample_size || 0) / 10, 100); // Scale for visualization
              break;
            case 'opportunity_score':
              value = ((product.sentiment?.confidence_score || 0) + (product.trend_prediction?.confidence || 0)) * 50;
              break;
            case 'model_accuracy':
              value = (product.raw_data?.sales_forecast?.confidence || 0) * 100;
              break;
            default:
              value = 0;
          }
          obj[product.product] = Math.round(value);
        });
        return obj;
      });
      
      setComparisonData(formattedData);
      generateComparisonInsights(data.data);
    }
  }, [data]);

  const generateComparisonInsights = (products) => {
    if (!products || products.length === 0) return;

    const insights = {
      winner: null,
      strengths: {},
      weaknesses: {},
      recommendations: []
    };

    // Find overall winner based on combined scores
    let bestProduct = null;
    let bestScore = 0;

    products.forEach(product => {
      const score = ((product.sentiment?.confidence_score || 0) + (product.trend_prediction?.confidence || 0)) * 50;
      if (score > bestScore) {
        bestScore = score;
        bestProduct = product.product;
      }

      // Analyze strengths and weaknesses
      insights.strengths[product.product] = [];
      insights.weaknesses[product.product] = [];

      if ((product.sentiment?.confidence_score || 0) > 0.8) {
        insights.strengths[product.product].push('High sentiment confidence');
      }
      if ((product.trend_prediction?.confidence || 0) > 0.8) {
        insights.strengths[product.product].push('Strong trend prediction');
      }
      if ((product.sentiment?.sample_size || 0) > 1000) {
        insights.strengths[product.product].push('Large data sample');
      }

      if ((product.sentiment?.confidence_score || 0) < 0.6) {
        insights.weaknesses[product.product].push('Low sentiment confidence');
      }
      if (product.trend_prediction?.predicted_trend === 'drop') {
        insights.weaknesses[product.product].push('Declining trend predicted');
      }
      if ((product.sentiment?.sample_size || 0) < 100) {
        insights.weaknesses[product.product].push('Limited data available');
      }
    });

    insights.winner = bestProduct;
    
    // Generate recommendations
    if (products.length > 1) {
      insights.recommendations.push(`${bestProduct} shows the highest overall performance score`);
      
      const positiveProducts = products.filter(p => p.sentiment?.overall_sentiment === 'positive');
      if (positiveProducts.length > 0) {
        insights.recommendations.push(`Focus on products with positive sentiment: ${positiveProducts.map(p => p.product).join(', ')}`);
      }
      
      const surgingProducts = products.filter(p => p.trend_prediction?.predicted_trend === 'surge');
      if (surgingProducts.length > 0) {
        insights.recommendations.push(`Consider increasing investment in trending products: ${surgingProducts.map(p => p.product).join(', ')}`);
      }
    }

    setComparisonInsights(insights);
  };

  // Auto-fetch comparison when products change
  useEffect(() => {
    if (selectedProducts.length > 0) {
      fetchComparisonData();
    } else {
      setComparisonData([]);
      setComparisonInsights(null);
    }
  }, [selectedProducts]);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const selectedNames = selectedProducts.join(',');
      
      const response = await fetch('http://localhost:8000/api/compare/export', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({ products: selectedNames })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'product_comparison_report.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        setError('Failed to export report. Please try again.');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      setError('Failed to export report. Please try again.');
    }
  };

  const addProduct = (productName) => {
    if (!selectedProducts.includes(productName) && selectedProducts.length < 5) {
      setSelectedProducts([...selectedProducts, productName]);
    }
    setShowProductSelector(false);
    setSearchTerm('');
  };

  const removeProduct = (productName) => {
    setSelectedProducts(selectedProducts.filter(p => p !== productName));
  };

  const getTrendIcon = (trend, size = 16) => {
    switch(trend) {
      case 'surge':
        return <ArrowUpRight size={size} className="text-green-500" />;
      case 'drop':
        return <ArrowDownRight size={size} className="text-red-500" />;
      case 'stable':
        return <Minus size={size} className="text-yellow-500" />;
      default:
        return <Activity size={size} className="text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'negative':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'neutral':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const TREND_COLORS = {
    surge: '#10B981',
    drop: '#EF4444',
    stable: '#F59E0B'
  };

  // Prepare data for radar chart
  const radarData = comparisonData.length > 0 ? 
    comparisonData.map(item => ({
      subject: item.name,
      ...Object.fromEntries(selectedProducts.map((product, idx) => [
        product, item[product] || 0
      ]))
    })) : [];

  // Prepare data for trend chart
  const trendChartData = data?.data ? data.data.map(product => ({
    name: product.product,
    sentiment: (product.sentiment?.confidence_score || 0) * 100,
    trend: (product.trend_prediction?.confidence || 0) * 100,
    sample: Math.min((product.sentiment?.sample_size || 0) / 50, 100),
    opportunity: ((product.sentiment?.confidence_score || 0) + (product.trend_prediction?.confidence || 0)) * 50
  })) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl">
                <ArrowLeftRight className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              AI-Powered Product Comparison
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Compare multiple products using advanced machine learning insights and trend predictions
            </p>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">View:</span>
                {['metrics', 'trends', 'details'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                      viewMode === mode
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={fetchProducts}
              disabled={refreshing}
              className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200"
            >
              <RefreshCw size={16} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl">
            <div className="flex items-center">
              <AlertCircle className="text-red-400 mr-2" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Product Selection */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-white/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Target className="h-5 w-5 text-indigo-600 mr-2" />
              Selected Products for Comparison
            </h2>
            <span className="text-sm text-gray-500">
              {selectedProducts.length}/5 products selected
            </span>
          </div>
          
          {selectedProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products selected</h3>
              <p className="text-gray-500 mb-6">Add products to start your comparison analysis</p>
              <button
                onClick={() => setShowProductSelector(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center mx-auto"
              >
                <Plus size={18} className="mr-2" />
                Add Products
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 mb-6">
                {selectedProducts.map(product => {
                  const productData = availableProducts.find(p => p.name === product);
                  return (
                    <div key={product} className="group relative bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4 transition-all duration-200 hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{product}</h3>
                          {productData && (
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getSentimentColor(productData.sentiment)}`}>
                                {productData.sentiment}
                              </span>
                              {getTrendIcon(productData.trend)}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeProduct(product)}
                          className="p-1 text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {selectedProducts.length < 5 && (
                  <button
                    onClick={() => setShowProductSelector(true)}
                    className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-all duration-200 min-w-[200px]"
                  >
                    <Plus size={20} className="mr-2" />
                    Add Product
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Product Selection Modal */}
        {showProductSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Select Products to Compare</h3>
                  <button
                    onClick={() => {
                      setShowProductSelector(false);
                      setSearchTerm('');
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {refreshing ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="animate-spin text-indigo-600" size={24} />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Globe size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">
                      {searchTerm ? 'No products match your search.' : 'No products available. Analyze some products first.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredProducts
                      .filter(product => !selectedProducts.includes(product.name))
                      .map(product => (
                        <button
                          key={product.id || product.name}
                          onClick={() => addProduct(product.name)}
                          className="p-4 text-left bg-gray-50 border border-gray-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900 group-hover:text-indigo-700">
                                {product.name}
                              </h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getSentimentColor(product.sentiment)}`}>
                                  {product.sentiment}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {Math.round((product.confidence || 0) * 100)}% confidence
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {getTrendIcon(product.trend)}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Comparison Insights */}
        {comparisonInsights && selectedProducts.length > 1 && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-lg border border-indigo-100 p-6 mb-8">
            <div className="flex items-center mb-4 cursor-pointer" onClick={() => toggleSection('insights')}>
              <Brain className="h-6 w-6 text-indigo-600 mr-2" />
              <h3 className="text-xl font-semibold text-gray-900">AI Comparison Insights</h3>
              {comparisonInsights.winner && (
                <div className="ml-auto">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center">
                    <Award size={14} className="mr-1" />
                    Winner: {comparisonInsights.winner}
                  </span>
                </div>
              )}
              <ChevronDown className={`ml-2 transform transition-transform ${expandedSections.insights ? 'rotate-180' : ''}`} />
            </div>
            
            {expandedSections.insights && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                    Key Strengths
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(comparisonInsights.strengths).map(([product, strengths]) => (
                      <div key={product}>
                        {strengths.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-800">{product}:</p>
                            <ul className="text-sm text-gray-600 ml-2">
                              {strengths.map((strength, idx) => (
                                <li key={idx} className="flex items-start">
                                  <div className="w-1 h-1 bg-green-500 rounded-full mr-2 mt-2 flex-shrink-0"></div>
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <XCircle className="h-4 w-4 text-red-600 mr-1" />
                    Areas of Concern
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(comparisonInsights.weaknesses).map(([product, weaknesses]) => (
                      <div key={product}>
                        {weaknesses.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-800">{product}:</p>
                            <ul className="text-sm text-gray-600 ml-2">
                              {weaknesses.map((weakness, idx) => (
                                <li key={idx} className="flex items-start">
                                  <div className="w-1 h-1 bg-red-500 rounded-full mr-2 mt-2 flex-shrink-0"></div>
                                  {weakness}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Sparkles className="h-4 w-4 text-indigo-600 mr-1" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {comparisonInsights.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2 mt-2 flex-shrink-0"></div>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comparison Results */}
        {loading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 border border-white/50">
            <LoadingSpinner message="Analyzing and comparing selected products..." />
          </div>
        ) : comparisonData.length > 0 ? (
          <div className="space-y-8">
            
            {/* Metrics View */}
            {viewMode === 'metrics' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
                <div className="flex items-center justify-between mb-6 cursor-pointer" onClick={() => toggleSection('metrics')}>
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <BarChart3 className="h-5 w-5 text-indigo-600 mr-2" />
                    Performance Metrics Comparison
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={fetchComparisonData}
                      disabled={loading}
                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                    <ChevronDown className={`transform transition-transform ${expandedSections.metrics ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                
                {expandedSections.metrics && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-2">
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                          data={comparisonData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Legend />
                          {selectedProducts.map((productName, idx) => (
                            <Bar
                              key={productName}
                              dataKey={productName}
                              fill={COLORS[idx % COLORS.length]}
                              radius={[4, 4, 0, 0]}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="lg:col-span-2">
                      <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                        <TargetIcon className="h-5 w-5 text-indigo-600 mr-2" />
                        Radar Chart Comparison
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          {selectedProducts.map((product, idx) => (
                            <Radar
                              key={product}
                              name={product}
                              dataKey={product}
                              stroke={COLORS[idx % COLORS.length]}
                              fill={COLORS[idx % COLORS.length]}
                              fillOpacity={0.2}
                            />
                          ))}
                          <Legend />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trends View */}
            {viewMode === 'trends' && data?.data && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
                <div className="flex items-center justify-between mb-6 cursor-pointer" onClick={() => toggleSection('trends')}>
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <TrendingUpIcon className="h-5 w-5 text-indigo-600 mr-2" />
                    Trend Analysis Comparison
                  </h3>
                  <ChevronDown className={`transform transition-transform ${expandedSections.trends ? 'rotate-180' : ''}`} />
                </div>
                
                {expandedSections.trends && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                        <LineChartIcon className="h-5 w-5 text-indigo-600 mr-2" />
                        Multi-Metric Comparison
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart
                          data={trendChartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="sentiment" fill="#6366F1" name="Sentiment Confidence" />
                          <Bar dataKey="trend" fill="#10B981" name="Trend Confidence" />
                          <Line type="monotone" dataKey="opportunity" stroke="#8B5CF6" name="Opportunity Score" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                        <PieChartIcon className="h-5 w-5 text-indigo-600 mr-2" />
                        Sentiment Distribution
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={data.data.map(product => ({
                              name: product.product,
                              value: (product.sentiment?.confidence_score || 0) * 100
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {data.data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Details View */}
            {viewMode === 'details' && data?.data && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
                <div className="flex items-center justify-between mb-6 cursor-pointer" onClick={() => toggleSection('details')}>
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Info className="h-5 w-5 text-indigo-600 mr-2" />
                    Detailed Analysis Data
                  </h3>
                  <ChevronDown className={`transform transition-transform ${expandedSections.details ? 'rotate-180' : ''}`} />
                </div>
                
                {expandedSections.details && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sentiment
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trend
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Confidence
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sample Size
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.data.map((product, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {product.product}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(product.sentiment?.overall_sentiment)}`}>
                                {product.sentiment?.overall_sentiment || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center">
                                {getTrendIcon(product.trend_prediction?.predicted_trend, 14)}
                                <span className="ml-1 capitalize">
                                  {product.trend_prediction?.predicted_trend || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {Math.round((product.trend_prediction?.confidence || 0) * 100)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.sentiment?.sample_size || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Export Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Export Comparison Report</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Download a detailed comparison report (PDF)
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <button 
                    onClick={handleExport}
                    disabled={selectedProducts.length === 0}
                    className={`px-4 py-2 rounded-md flex items-center ${
                      selectedProducts.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    <Download size={18} className="mr-2" />
                    Export Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : selectedProducts.length > 0 && !loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 border border-white/50 text-center">
            <BarChart3 size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Comparison Data</h3>
            <p className="text-gray-500">
              No comparison data available for the selected products. Please ensure all products have been analyzed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedProductComparison;