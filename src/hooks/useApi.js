// src/hooks/useApi.js
import { useState, useCallback } from 'react';
import * as api from '../services/api';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const analyzeProduct = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.analyzeProduct(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAnalysisHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getAnalysisHistory();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getProducts();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const compareProducts = useCallback(async (productNames) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.compareProducts(productNames);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportReport = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.exportReport(data);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAnalysis = useCallback(async (analysisId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.deleteAnalysis(analysisId);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    data,
    analyzeProduct,
    getAnalysisHistory,
    getProducts,
    compareProducts,
    exportReport,
    deleteAnalysis
  };
};

export default useApi;