import React, { createContext, useContext, useState } from 'react';

const DashboardContext = createContext();

export function useDashboard() {
  return useContext(DashboardContext);
}

export function DashboardProvider({ children }) {
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [chartData, setChartData] = useState([]);

  const value = {
    dashboardMetrics,
    setDashboardMetrics,
    recentAnalyses,
    setRecentAnalyses,
    trendingProducts,
    setTrendingProducts,
    chartData,
    setChartData
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
