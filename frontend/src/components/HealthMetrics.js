import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FiDownload, FiActivity, FiCalendar, FiEdit2, FiTrash2 } from 'react-icons/fi';
import '../styles.css';
import { config } from '../config';

// Predefined metric types with their common units
const METRIC_TYPES = {
  'Weight': ['kg', 'lbs'],
  'Blood Pressure': ['mmHg'],
  'Heart Rate': ['bpm'],
  'Temperature': ['°C', '°F'],
  'Glucose': ['mg/dL', 'mmol/L'],
  'Cholesterol': ['mg/dL', 'mmol/L'],
  'BMI': ['kg/m²'],
  'SpO2': ['%'],
  'Sleep Duration': ['hours', 'minutes'],
  'Water Intake': ['ml', 'liters', 'cups'],
  'Steps': ['count'],
  'Calories': ['kcal'],
};

const HealthMetrics = (props) => {
  const [metrics, setMetrics] = useState([]);
  const [filteredMetrics, setFilteredMetrics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetricType, setSelectedMetricType] = useState('all');
  const [error, setError] = useState('');

  // Form state for adding
  const [newMetricType, setNewMetricType] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');
  const [newMetricUnit, setNewMetricUnit] = useState('');
  const [newMetricDate, setNewMetricDate] = useState('');

  // State for inline editing
  const [editingId, setEditingId] = useState(null);
  const [editingType, setEditingType] = useState('');
  const [editingValue, setEditingValue] = useState('');
  const [editingUnit, setEditingUnit] = useState('');
  const [editingDate, setEditingDate] = useState('');



  const loadMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/health-metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch health metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  // Get unique metric types for the filter dropdown
  const getMetricTypes = () => {
    const types = [...new Set(metrics.map(m => m.type).filter(Boolean))];
    return types.sort();
  };

  useEffect(() => {
    setFilteredMetrics(
      (metrics || []).filter(
        metric => {
          const matchesSearch = !searchTerm || 
            (metric?.type && metric.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
            metric.value.toString().includes(searchTerm);
          
          const matchesType = selectedMetricType === 'all' || 
            (metric?.type && metric.type === selectedMetricType);
          
          return matchesSearch && matchesType;
        }
      )
    );
  }, [searchTerm, selectedMetricType, metrics]);

  const handleAddMetric = async (e) => {
    e.preventDefault();
    setError('');
    if (!newMetricType || !newMetricValue || !newMetricUnit || !newMetricDate) {
      setError('Type, value, unit, and date are required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/health-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          metric_date: newMetricDate,
          value: parseFloat(newMetricValue),
          type: newMetricType,
          unit: newMetricUnit,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add health metric');
      }
      
      setNewMetricType('');
      setNewMetricValue('');
      setNewMetricUnit('');
      setNewMetricDate('');
      loadMetrics();
      if (props.refreshHealthScore) props.refreshHealthScore();
    } catch (err) {
      setError('Failed to add health metric');
    }
  };

  const handleDeleteMetric = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${config.API_BASE_URL}/health-metrics/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      loadMetrics();
      if (props.refreshHealthScore) props.refreshHealthScore();
    } catch (err) {
      setError('Failed to delete health metric');
    }
  };

  const handleEdit = (metric) => {
    setEditingId(metric.id);
    setEditingType(metric.type || 'Health Metric');
    setEditingValue(metric.value.toString());
    setEditingUnit(metric.unit || '');
    setEditingDate(metric.metric_date ? metric.metric_date.split('T')[0] : '');
  };

  const handleSave = async (id) => {
    setError('');
    if (!editingType || !editingValue || !editingUnit || !editingDate) {
      setError('Type, value, unit, and date are required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/health-metrics/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          metric_date: editingDate,
          value: parseFloat(editingValue),
          type: editingType,
          unit: editingUnit,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save health metric');
      }
      
      setEditingId(null);
      loadMetrics();
      if (props.refreshHealthScore) props.refreshHealthScore();
    } catch (err) {
      setError('Failed to save health metric');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };



  // Export as CSV
  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredMetrics.map(metric => ({
      type: metric.type,
      value: metric.value,
      unit: metric.unit,
      date: metric.date
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'health_metrics.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export as PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Health Metrics', 14, 16);
    doc.autoTable({
      head: [['Type', 'Value', 'Unit', 'Date']],
      body: filteredMetrics.map(m => [m.type || '', m.value, m.unit || '', m.metric_date]),
      startY: 22,
    });
    doc.save('health_metrics.pdf');
  };



  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Health Metrics</h1>
        <div className="page-filters">
          <input
            type="text"
            placeholder="Search metrics..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={selectedMetricType}
            onChange={(e) => setSelectedMetricType(e.target.value)}
            className="search-input"
          >
            <option value="all">All Types</option>
            {getMetricTypes().map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <button onClick={handleExportCSV} className="btn-export">
            <FiDownload /> CSV
          </button>
          <button onClick={handleExportPDF} className="btn-export">
            <FiDownload /> PDF
          </button>
        </div>
      </div>

      <div className="add-metric-section">
        <h2>Add New Health Metric</h2>
        <div className="add-metric-form">
          <select
            value={newMetricType}
            onChange={(e) => {
              setNewMetricType(e.target.value);
              // Auto-set unit to first option when metric type changes
              if (e.target.value && METRIC_TYPES[e.target.value]) {
                setNewMetricUnit(METRIC_TYPES[e.target.value][0]);
              }
            }}
            className="form-input"
          >
            <option value="">Select Metric Type</option>
            {Object.keys(METRIC_TYPES).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input
            type="number"
            step="0.1"
            placeholder="Value"
            value={newMetricValue}
            onChange={(e) => setNewMetricValue(e.target.value)}
            className="form-input"
            required
          />
          <select
            value={newMetricUnit}
            onChange={(e) => setNewMetricUnit(e.target.value)}
            className="form-input"
            disabled={!newMetricType}
          >
            <option value="">Select Unit</option>
            {newMetricType && METRIC_TYPES[newMetricType] && 
              METRIC_TYPES[newMetricType].map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))
            }
          </select>
          <input
            type="date"
            value={newMetricDate}
            onChange={(e) => setNewMetricDate(e.target.value)}
            className="form-input"
            required
          />
          <button type="button" onClick={handleAddMetric} className="btn-add">
            + Add
          </button>
        </div>
      </div>

      <div className="item-list">
        {filteredMetrics.length === 0 ? (
          <div className="no-data-message">No health metrics added yet.</div>
        ) : (
          filteredMetrics.map((metric) => (
            <div key={metric.id} className="item-card">
              {editingId === metric.id ? (
                <div className="item-card-edit-controls">
                  <div className="edit-form-group">
                    <label>Type</label>
                    <select
                      value={editingType}
                      onChange={(e) => {
                        setEditingType(e.target.value);
                        // Auto-set unit to first option when metric type changes
                        if (e.target.value && METRIC_TYPES[e.target.value]) {
                          setEditingUnit(METRIC_TYPES[e.target.value][0]);
                        }
                      }}
                    >
                      <option value="">Select Metric Type</option>
                      {Object.keys(METRIC_TYPES).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="edit-form-row">
                    <div className="edit-form-group">
                      <label>Value</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        required
                      />
                    </div>
                    <div className="edit-form-group">
                      <label>Unit</label>
                      <select
                        value={editingUnit}
                        onChange={(e) => setEditingUnit(e.target.value)}
                        disabled={!editingType}
                      >
                        <option value="">Select Unit</option>
                        {editingType && METRIC_TYPES[editingType] && 
                          METRIC_TYPES[editingType].map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                  <div className="edit-form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={editingDate}
                      onChange={(e) => setEditingDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="item-card-buttons">
                    <button onClick={() => handleSave(metric.id)} className="btn-save">
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="btn-cancel">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="item-card-content">
                  <div className="item-card-header">
                    <div className="item-card-title">
                      <FiActivity /> {metric.type}
                    </div>
                    <span className="unit-badge">{metric.unit || 'No Unit'}</span>
                  </div>
                  <div className="metric-value">{metric.value}</div>
                  <div className="metric-date">
                    <FiCalendar /> {formatDate(metric.metric_date)}
                  </div>
                  <div className="item-card-buttons">
                    <button 
                      onClick={() => handleEdit(metric)} 
                      className="btn-icon"
                      title="Edit"
                    >
                      <FiEdit2 />
                    </button>
                    <button 
                      onClick={() => handleDeleteMetric(metric.id)} 
                      className="btn-icon btn-icon-delete"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

HealthMetrics.propTypes = {
  refreshHealthScore: PropTypes.func
};

export default HealthMetrics;
