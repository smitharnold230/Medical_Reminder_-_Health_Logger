import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  Area,
  AreaChart
} from 'recharts';
import { format, parseISO } from 'date-fns';
import '../styles.css';

// Utility to read CSS variables for dynamic theming
const getCSSVar = (name, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);
  return value ? value.trim() : fallback;
};

const AdvancedChart = ({ data, title, type = 'line', height = 400, showTrend = true, showBrush = true }) => {
  // Theme colours (default fallbacks provided)
  const accentColor   = getCSSVar('--accent-color', '#4A7C74');
  const gridColor     = getCSSVar('--border-light', '#E5E7EB');
  const textColor     = getCSSVar('--text-secondary', '#6B7280');

  // Process data for visualization
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .filter(item => item && item.date) // Filter out items with null/undefined dates
      .map(item => ({
        ...item,
        date: format(parseISO(item.date), 'MMM dd'),
        fullDate: parseISO(item.date),
        Value: parseFloat(item.value) || 0
      }))
      .sort((a, b) => a.fullDate - b.fullDate);
  }, [data]);

  // Calculate trend line
  const trendData = useMemo(() => {
    if (!showTrend || processedData.length < 2) return null;

    const n = processedData.length;
    const sumX = processedData.reduce((sum, _, index) => sum + index, 0);
    const sumY = processedData.reduce((sum, item) => sum + item.Value, 0);
    const sumXY = processedData.reduce((sum, item, index) => sum + (index * item.Value), 0);
    const sumXX = processedData.reduce((sum, _, index) => sum + (index * index), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return processedData.map((item, index) => ({
      ...item,
      trend: slope * index + intercept
    }));
  }, [processedData, showTrend]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-date">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.payload.unit && ` ${entry.payload.unit}`}
            </p>
          ))}
          {payload[0]?.payload.trend && (
            <p style={{ color: '#888', fontSize: '12px' }}>
              Trend: {payload[0].payload.trend.toFixed(1)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  CustomTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.array,
    label: PropTypes.string
  };

  // Remove legend for single metric type (no color box or 'Value' label)
  const showLegend = false; // Always hide legend for single metric

  if (!data || data.length === 0) {
    return (
      <div className="chart-container empty">
        <h3>{title}</h3>
        <p>No data available for visualization</p>
      </div>
    );
  }

  const chartData = trendData || processedData;

  return (
    <div className="advanced-chart-container">
      {title && (
        <div className="chart-header">
          <h3>{title}</h3>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        {type === 'area' ? (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="2 4" stroke={gridColor} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: textColor }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 11, fill: textColor }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey="Value"
              stroke={accentColor}
              fill={accentColor}
              fillOpacity={0.3}
            />
            {showTrend && trendData && (
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#ff7300"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Trend"
              />
            )}
            {showBrush && (
              <Brush
                dataKey="date"
                height={30}
                stroke={accentColor}
              />
            )}
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="2 4" stroke={gridColor} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: textColor }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 11, fill: textColor }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey="Value"
              stroke={accentColor}
              strokeWidth={2}
              dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
            />
            {showTrend && trendData && (
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#ff7300"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Trend"
              />
            )}
            {showBrush && (
              <Brush
                dataKey="date"
                height={30}
                stroke={accentColor}
              />
            )}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

AdvancedChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    type: PropTypes.string,
    unit: PropTypes.string
  })).isRequired,
  title: PropTypes.string,
  type: PropTypes.oneOf(['line', 'area']),
  height: PropTypes.number,
  showTrend: PropTypes.bool,
  showBrush: PropTypes.bool
};

export default AdvancedChart; 