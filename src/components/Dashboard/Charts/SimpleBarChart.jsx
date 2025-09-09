// src/components/Dashboard/Charts/SimpleBarChart.jsx
import React from 'react';
//import { getRemainingTime } from src/utils/constants';


const SimpleBarChart = ({ data, width = 400, height = 200 }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="bg-white p-4 rounded-lg">
      <div className="flex items-end justify-between" style={{ height: `${height}px`, width: `${width}px` }}>
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className="bg-indigo-500 rounded-t transition-all duration-300"
              style={{
                height: `${(item.value / maxValue) * (height - 40)}px`,
                width: `${(width / data.length) - 10}px`,
                minWidth: '20px'
              }}
            />
            <span className="text-xs text-gray-600 mt-2">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleBarChart;