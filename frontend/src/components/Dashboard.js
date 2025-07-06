import React, { useEffect, useState } from 'react';
import { fetchMedications, fetchHealthScore, fetchHealthMetrics, fetchMedicationReminders } from '../api';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import HealthMetricsTrend from './HealthMetricsTrend';
import { isAfter, isBefore, isSameDay, parseISO } from 'date-fns';
import { config } from '../config';

// Icons
import { FiPlus, FiCalendar, FiActivity, FiCheckCircle, FiClock, FiTrendingUp } from 'react-icons/fi';

import '../styles.css';

const Dashboard = ({ user }) => {
  const [medications, setMedications] = useState([]);
  const [healthScore, setHealthScore] = useState({});
  const [healthMetrics, setHealthMetrics] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchMedications().then(setMedications).catch(console.error);
      fetchHealthScore().then(setHealthScore).catch(console.error);
      fetchHealthMetrics().then(setHealthMetrics).catch(console.error);
      fetchMedicationReminders().catch(console.error);
    }
  }, [user, navigate]);

  // Schedule automatic refresh at next midnight
  useEffect(() => {
    if (!user) return;
    const scheduleNextRefresh = () => {
      const now = new Date();
      const next = new Date(now);
      // Set to next day at 00:05
      next.setDate(now.getDate() + 1);
      next.setHours(0, 5, 0, 0);
      return next - now;
    };

    const timer = setTimeout(() => {
      fetchMedications().then(setMedications).catch(console.error);
    }, scheduleNextRefresh());

    return () => clearTimeout(timer);
  }, [user]);

  const handleMedicationToggle = async (medId, currentTakenStatus) => {
    const originalMedications = [...medications];
    const updatedTaken = !currentTakenStatus;

    // Optimistically update UI
    setMedications(meds => meds.map(m => m.id === medId ? { ...m, taken: updatedTaken } : m));

    // Find the medication to get all its properties for the PUT request
    const medToUpdate = originalMedications.find(m => m.id === medId);

    try {
      await fetch(`${config.API_BASE_URL}/medications/${medId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...medToUpdate,
          taken: updatedTaken,
        }),
      });
      // Refresh health score after medication toggle
      refreshHealthScore();
    } catch (err) {
      const message = err.message || 'Failed to update medication status';
      console.error('Failed to update medication status', message);
      // Revert UI on failure
      setMedications(originalMedications);
    }
  };

  // Add a function to refresh health score
  const refreshHealthScore = async () => {
    const score = await fetchHealthScore();
    setHealthScore(score);
  };

  if (!user) {
    return (
      <div className="page-container">
        <h1>Welcome to Your Health Dashboard</h1>
        <p>You are not logged in. Please log in to view your health data.</p>
        <button onClick={() => navigate('/login')} className="btn btn-dark">Go to Login</button>
      </div>
    );
  }

  // ... before return, compute today's medications
  const today = new Date();
  const todaysMedications = medications.filter((med) => {
    const start = med.start_date ? parseISO(med.start_date) : null;
    const end = med.end_date ? parseISO(med.end_date) : null;
    if (!start || !end) return false;
    return (isSameDay(start, today) || isBefore(start, today)) && (isSameDay(end, today) || isAfter(end, today));
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="card-title">Dashboard</h1>
      </div>

      <div className="dashboard-grid">
        {/* Health Score Card */}
        <div className="dashboard-card health-score-card card">
          <div className="card-header">
            <h2 className="card-title">Health Score</h2>
            <FiTrendingUp className="trend-icon" />
          </div>
          <div className="health-score-content">
            <h3 className="health-score-value">
              {healthScore.score || '0'}/100
            </h3>
            <p className="health-score-trend">
              +{healthScore.trend || '0'} from last week
            </p>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="dashboard-card quick-actions-card card">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div className="quick-actions" style={{ paddingTop: '8px' }}>
            <button 
              className="quick-action-btn" 
              onClick={() => navigate('/medications')}
              aria-label="Add new medication"
            >
              <FiPlus className="action-icon" />
              Add Medication
            </button>
            <button 
              className="quick-action-btn" 
              onClick={() => navigate('/healthmetrics')}
              aria-label="Add health metric"
            >
              <FiActivity className="action-icon" />
              Add Metric
            </button>
            <button 
              className="quick-action-btn" 
              onClick={() => navigate('/appointments')}
              aria-label="Schedule appointment"
            >
              <FiCalendar className="action-icon" />
              Schedule
            </button>
          </div>
        </div>

        {/* Upcoming Medications Card */}
        <div className="dashboard-card card">
          <div className="card-header">
            <h2 className="card-title">Upcoming Medications</h2>
          </div>
          <p className="card-subtitle" style={{ marginTop: '-8px' }}>Your medication schedule for today</p>
          <div className="medications-list" role="region" aria-label="Medication schedule">
            {todaysMedications.length === 0 ? (
              <p className="empty-message">No medications scheduled for today.</p>
            ) : (
              todaysMedications.map((med) => (
                <div key={med.id} className="medication-item">
                  <div className="medication-status-icon">
                    {med.taken ? (
                      <div className="icon-circle success">
                        <FiCheckCircle className="status-icon" />
                      </div>
                    ) : (
                      <div className="icon-circle pending">
                        <FiClock className="status-icon" />
                      </div>
                    )}
                  </div>
                  <div className="medication-info">
                    <h3 className="medication-name">{med.name}</h3>
                    <p className="medication-details">
                      {med.dosage} • {med.time}
                    </p>
                  </div>
                  <div className="medication-toggle">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={med.taken}
                        onChange={() => handleMedicationToggle(med.id, med.taken)}
                        aria-label={`Mark ${med.name} as ${med.taken ? 'not taken' : 'taken'}`}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Health Metrics Trend Card */}
        <HealthMetricsTrend healthMetrics={healthMetrics} />
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string
  })
};

export default Dashboard;
