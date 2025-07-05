import React, { useState, useEffect } from 'react';
import { FiBell, FiXCircle } from 'react-icons/fi';
import { fetchMedicationReminders } from '../api';
import '../styles.css';

const Notification = () => {
  const [reminders, setReminders] = useState([]);
  const [error, setError] = useState('');

  const loadReminders = async () => {
    try {
      const data = await fetchMedicationReminders();
      setReminders(data);
      setError('');
    } catch (err) {
      setError('Failed to load medication reminders');
    }
  };

  useEffect(() => {
    loadReminders();
    const interval = setInterval(loadReminders, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <div className="notification-error">{error}</div>;
  }

  if (reminders.length === 0) {
    return null; // No reminders to show
  }

  return (
    <div className="notification-container" role="region" aria-live="polite" aria-label="Medication reminders">
      <h3><FiBell /> Medication Reminders</h3>
      <ul className="notification-list">
        {reminders.map(reminder => (
          <li key={reminder.id} className="notification-item">
            <span>{reminder.name} at {reminder.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notification;
