// src/services/api.js
import apiInstance from './apiInstance';

// Analysis functions
export const analyzeProduct = async (data) => {
  try {
    const response = await apiInstance.post('/analyze', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Analysis failed');
  }
};

export const getAnalysisHistory = async () => {
  try {
    const response = await apiInstance.get('/analyses');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to load history');
  }
};

// Product functions
export const getProducts = async () => {
  try {
    const response = await apiInstance.get('/products');
    return response.data;
  } catch (error) {
    console.error('Products endpoint not available, using fallback data');
    // Return fallback data if endpoint doesn't exist
    return {
      success: true,
      products: [
        { id: 1, name: 'iPhone' },
        { id: 2, name: 'InstantPot' },
        { id: 3, name: 'Fitbit' }
      ]
    };
  }
};

// Comparison functions
export const compareProducts = async (productNames) => {
  try {
    const response = await apiInstance.get('/compare', {
      params: { products: productNames }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Comparison failed');
  }
};

// Export functions
export const exportReport = async (data) => {
  try {
    const response = await apiInstance.post('/export-report', data, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Export failed');
  }
};

export const deleteAnalysis = async (analysisId) => {
  try {
    const response = await apiInstance.delete(`/analysis/${analysisId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Delete failed');
  }
};

// Profile functions
export const getUserProfile = async () => {
  try {
    const response = await apiInstance.get('/profile');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to load profile');
  }
};
