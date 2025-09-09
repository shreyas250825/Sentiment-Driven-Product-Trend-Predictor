import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Filter, Download, Trash2, Eye, BarChart3, TrendingUp,
  TrendingDown, Minus, Clock, AlertCircle, RefreshCw, ChevronLeft,
  Calendar, Target, MessageSquare, Globe, Activity, Brain
} from 'lucide-react';
import useApi from '../hooks/useApi';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const AnalysisHistoryPage = () => {
  const { getAnalysisHistory, deleteAnalysis, loading, error, data } = useApi();
  const [analyses, setAnalyses] = useState([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrend, setFilterTrend] = useState('all');
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadAllAnalyses();
  }, []);

  useEffect(() => {
    if (data?.success && data.data) {
      setAnalyses(data.data);
    }
  }, [data]);

  useEffect(() => {
    filterAndSortAnalyses();
  }, [analyses, searchTerm, filterTrend, filterSentiment, sortBy, sortOrder]);

  const loadAllAnalyses = async () => {
    try {
      setRefreshing(true);
      // Request all analyses by setting a high limit
      const result = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/analyses?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await result.json();
      if (data.success) {
        setAnalyses(data.data);
      }
    } catch (err) {
      console.error('Failed to load analyses:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const filterAndSortAnalyses = () => {
    let filtered = [...analyses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(analysis =>
        analysis.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (analysis.sentiment?.overall_sentiment || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Trend filter
    if (filterTrend !== 'all') {
      filtered = filtered.filter(analysis =>
        analysis.trend_prediction?.predicted_trend === filterTrend
      );
    }

    // Sentiment filter
    if (filterSentiment !== 'all') {
      filtered = filtered.filter(analysis =>
        analysis.sentiment?.overall_sentiment === filterSentiment
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
          break;
        case 'product':
          aValue = a.product.toLowerCase();
          bValue = b.product.toLowerCase();
          break;
        case 'score':
          aValue = Math.round(((a.sentiment?.confidence_score || 0) + (a.trend_prediction?.confidence || 0)) * 50);
          bValue = Math.round(((b.sentiment?.confidence_score || 0) + (b.trend_prediction?.confidence || 0)) * 50);
          break;
        case 'sentiment':
          aValue = a.sentiment?.overall_sentiment || '';
          bValue = b.sentiment?.overall_sentiment || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredAnalyses(filtered);
  };

  const handleDelete = async (analysisId) => {
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      try {
        await deleteAnalysis(analysisId);
        setAnalyses(prev => prev.filter(a => a.id !== analysisId));
      } catch (error) {
        alert('Failed to delete analysis: ' + error.message);
      }
    }
  };

  const handleViewDetails = (analysis) => {
    // Navigate to analysis page with the product pre-filled
    navigate('/analysis', { state: { preSelectedProduct: analysis.product } });
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'surge':
        return <TrendingUp size={16} className="text-green-500" />;
      case 'drop':
        return <TrendingDown size={16} className="text-red-500" />;
      default:
        return <Minus size={16} className="text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'negative':
        return 'text-red-700 bg-red-100 border-red-200';
      default:
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportAllAnalyses = () => {
    const csvContent = [
      ['Product', 'Analysis Date', 'Sentiment', 'Confidence', 'Trend', 'Trend Confidence', 'Data Points', 'Sources'].join(','),
      ...filteredAnalyses.map(analysis => [
        `"${analysis.product}"`,
        `"${formatDate(analysis.timestamp)}"`,
        `"${analysis.sentiment?.overall_sentiment || 'N/A'}"`,
        `"${Math.round((analysis.sentiment?.confidence_score || 0) * 100)}%"`,
        `"${analysis.trend_prediction?.predicted_trend || 'N/A'}"`,
        `"${Math.round((analysis.trend_prediction?.confidence || 0) * 100)}%"`,
        `"${analysis.sentiment?.sample_size || 0}"`,
        `"${(analysis.sources_used || []).join('; ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_analyses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !analyses.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center mb-4 lg:mb-0">
            <Link
              to="/dashboard"
              className="flex items-center text-indigo-600 hover:text-indigo-800 mr-4 transition-colors"
            >
              <ChevronLeft size={20} className="mr-1" />
              Back to Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                <BarChart3 className="h-8 w-8 mr-3" />
                All Analyses
              </h1>
              <p className="text-gray-600 mt-1">Complete history of your AI-powered product analyses</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={loadAllAnalyses}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-xl hover:border-gray-400 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={exportAllAnalyses}
              disabled={filteredAnalyses.length === 0}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50"
            >
              <Download size={16} className="mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-white/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search analyses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Trend Filter */}
            <select
              value={filterTrend}
              onChange={(e) => setFilterTrend(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Trends</option>
              <option value="surge">Surge</option>
              <option value="drop">Drop</option>
              <option value="stable">Stable</option>
            </select>

            {/* Sentiment Filter */}
            <select
              value={filterSentiment}
              onChange={(e) => setFilterSentiment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="timestamp-desc">Newest First</option>
              <option value="timestamp-asc">Oldest First</option>
              <option value="product-asc">Product A-Z</option>
              <option value="product-desc">Product Z-A</option>
              <option value="score-desc">Highest Score</option>
              <option value="score-asc">Lowest Score</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredAnalyses.length} of {analyses.length} analyses</span>
            {(searchTerm || filterTrend !== 'all' || filterSentiment !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterTrend('all');
                  setFilterSentiment('all');
                }}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl mb-8">
            <div className="flex items-center">
              <AlertCircle size={20} className="text-red-400 mr-3" />
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Analyses Table */}
        {filteredAnalyses.length === 0 && !loading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-16 text-center border border-white/50">
            <BarChart3 size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {analyses.length === 0 ? 'No analyses yet' : 'No analyses match your filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {analyses.length === 0
                ? 'Start by analyzing your first product to see insights here'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {analyses.length === 0 && (
              <Link
                to="/analysis"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                <Brain size={18} className="mr-2" />
                Start Analysis
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Analysis Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Sentiment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Trend
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Opportunity Score
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Data Points
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Sources
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-gray-100">
                  {filteredAnalyses.map((analysis) => {
                    const opportunityScore = Math.round(((analysis.sentiment?.confidence_score || 0) + (analysis.trend_prediction?.confidence || 0)) * 50);

                    return (
                      <tr
                        key={analysis.id}
                        className="hover:bg-white/80 transition-all duration-200 cursor-pointer group"
                        onClick={() => handleViewDetails(analysis)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                              <span className="text-white font-bold text-sm">
                                {analysis.product.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {analysis.product}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {analysis.id.slice(-8)}
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
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSentimentColor(analysis.sentiment?.overall_sentiment)}`}>
                              {analysis.sentiment?.overall_sentiment || 'unknown'}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              {Math.round((analysis.sentiment?.confidence_score || 0) * 100)}%
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getTrendIcon(analysis.trend_prediction?.predicted_trend)}
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
                          <div className="flex items-center text-sm text-gray-600">
                            <Globe size={14} className="mr-1" />
                            {analysis.sentiment?.sample_size || 0}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1 max-w-32">
                            {(analysis.sources_used || []).slice(0, 2).map(source => (
                              <span
                                key={source}
                                className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium"
                              >
                                {source}
                              </span>
                            ))}
                            {(analysis.sources_used || []).length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                                +{(analysis.sources_used || []).length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(analysis);
                              }}
                              className="p-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(analysis.id);
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
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisHistoryPage;
