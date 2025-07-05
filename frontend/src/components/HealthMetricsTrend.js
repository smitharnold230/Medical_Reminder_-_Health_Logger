import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import AdvancedChart from './AdvancedChart';
import { FiDownload } from 'react-icons/fi';

const HealthMetricsTrend = ({ healthMetrics }) => {
  const [selectedMetricType, setSelectedMetricType] = useState('all');

  // Get unique metric types for the filter dropdown
  const getMetricTypes = () => {
    const types = [...new Set(healthMetrics.map(m => m.type).filter(Boolean))];
    return types.sort();
  };

  // Enhanced chart data processing
  const chartData = useMemo(() => {
    if (!healthMetrics || healthMetrics.length === 0) return [];
    
    return healthMetrics
      .filter(metric => 
        metric && 
        (metric.date || metric.metric_date) && 
        metric.value != null && 
        (selectedMetricType === 'all' || metric.type === selectedMetricType)
      )
      .map(metric => ({
        date: metric.date || metric.metric_date, // Handle both date formats
        value: parseFloat(metric.value),
        type: metric.type,
        unit: metric.unit
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [healthMetrics, selectedMetricType]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const values = chartData.map(d => d.value);
    return {
      average: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
      min: Math.min(...values).toFixed(1),
      max: Math.max(...values).toFixed(1)
    };
  }, [chartData]);

  return (
    <div className="dashboard-card card" style={{ gridColumn: '1 / span 3' }}>
      <div className="card-header">
        <div className="metric-header">
          <h2 className="card-title">Health Metrics Trend</h2>
          <p className="card-subtitle">Track your health metrics over time</p>
        </div>
        <div className="card-filters">
          <select
            className="filter-select form-select"
            value={selectedMetricType}
            onChange={(e) => setSelectedMetricType(e.target.value)}
            aria-label="Filter health metrics chart by type"
          >
            <option value="all">All Metrics</option>
            {getMetricTypes().map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <AdvancedChart 
        data={chartData}
        title=""
        type="line"
        height={160}
        showTrend={false}
        showBrush={false}
      />
      {statistics && (
        <div className="metric-statistics">
          <div className="stat-item">
            <span className="stat-label">Average:</span>
            <span className="stat-value">{statistics.average}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Min:</span>
            <span className="stat-value">{statistics.min}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Max:</span>
            <span className="stat-value">{statistics.max}</span>
          </div>
        </div>
      )}
    </div>
  );
};

HealthMetricsTrend.propTypes = {
  healthMetrics: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string,
      metric_date: PropTypes.string, // API returns metric_date
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      type: PropTypes.string,
      unit: PropTypes.string
    })
  ).isRequired
};

export default HealthMetricsTrend; 