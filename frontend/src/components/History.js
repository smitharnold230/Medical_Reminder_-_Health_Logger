import React, { useState, useEffect } from 'react';
import {
  fetchHealthMetricsHistory,
  fetchMedicationActions,
  revertMedicationAction,
  deleteMedicationAction,
} from '../api';
import { FiActivity, FiClock } from 'react-icons/fi';
import '../styles.css';

const History = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [metrics, setMetrics] = useState([]);
  const [medActions, setMedActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = async (date) => {
    setLoading(true);
    setError('');
    try {
      const metricsData = await fetchHealthMetricsHistory(date);
      setMetrics(metricsData);
    } catch (err) {
      setError('Failed to fetch health metrics: ' + (err.message || 'Unknown error'));
      setLoading(false);
      return;
    }
    try {
      const actionsData = await fetchMedicationActions(date);
      setMedActions(actionsData);
    } catch (err) {
      setError('Failed to fetch medication actions: ' + (err.message || 'Unknown error'));
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHistory(selectedDate);
  }, [selectedDate]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>History</h1>
      </div>

      <div className="page-filters">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 500 }}>Filter by date</span>
          <input
            type="date"
            aria-label="history-date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="search-input"
            style={{ minWidth: 180 }}
          />
          <button
            className="btn btn-dark"
            onClick={() => setSelectedDate('')}
            style={{ marginLeft: 8 }}
            disabled={!selectedDate}
          >
            Show All
          </button>
        </div>
      </div>
      {loading ? (
        <div className="loading-message">Loading history...</div>
      ) : error ? (
        <div className="error-message">Failed to load history</div>
      ) : (
        <div className="dashboard-grid">
          <div className="card health-metrics-card">
            <div className="card-header">
              <h2 className="card-title">Health Metrics</h2>
              <FiActivity className="card-icon" />
            </div>
            {metrics.length > 0 ? (
              <div className="metrics-list">
                {metrics.map((metric, idx) => (
                  <div key={idx} className="metric-item">
                    <div className="metric-date">
                      {new Date(metric.metric_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="metric-value">{metric.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <p>No health metrics found for this date.</p>
              </div>
            )}
          </div>
          <div className="card upcoming-medications-card">
            <div className="card-header">
              <h2 className="card-title">Medication Actions</h2>
              <FiClock className="card-icon" />
            </div>
            {medActions.length > 0 ? (
              <div className="medication-list">
                {medActions.map((act) => (
                  <div key={act.id} className="medication-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="medication-item-info">
                      <span className="medication-item-name">{act.name}</span>
                      <span className="medication-item-details">{act.new_taken ? 'Taken' : 'Not Taken'} • {new Date(act.action_time).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {!act.reverted && (
                        <button className="btn btn-secondary btn-sm" onClick={async () => { await revertMedicationAction(act.id); loadHistory(selectedDate); }}>
                          Revert
                        </button>
                      )}
                      {act.reverted && <span className="badge badge-success">Reverted</span>}
                      <button className="btn btn-danger btn-sm" onClick={async () => {
                        try {
                          await deleteMedicationAction(act.id);
                          setMedActions(prev => prev.filter(a => a.id !== act.id));
                        } catch (err) {
                          loadHistory(selectedDate);
                        }
                      }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <p>No medication actions found for this date.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default History; 