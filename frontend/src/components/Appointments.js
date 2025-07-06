import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEdit, FiSave, FiX, FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import '../styles.css';
import { config } from '../config';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Form state for adding
  const [newAppointmentTitle, setNewAppointmentTitle] = useState('');
  const [newAppointmentDate, setNewAppointmentDate] = useState('');
  const [newAppointmentTime, setNewAppointmentTime] = useState('');
  const [newAppointmentLocation, setNewAppointmentLocation] = useState('');

  // State for inline editing
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDate, setEditingDate] = useState('');
  const [editingTime, setEditingTime] = useState('');
  const [editingLocation, setEditingLocation] = useState('');

  const loadAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    setFilteredAppointments(
      (appointments || []).filter(
        appointment =>
          typeof appointment?.title === 'string' &&
          appointment.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, appointments]);

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    setError('');
    if (!newAppointmentTitle || !newAppointmentDate || !newAppointmentTime) {
      setError('Title, date, and time are required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await fetch(`${config.API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newAppointmentTitle,
          date: newAppointmentDate,
          time: newAppointmentTime,
          location: newAppointmentLocation,
        }),
      });
      setNewAppointmentTitle('');
      setNewAppointmentDate('');
      setNewAppointmentTime('');
      setNewAppointmentLocation('');
      loadAppointments();
    } catch (err) {
      setError('Failed to add appointment');
    }
  };

  const handleDeleteAppointment = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${config.API_BASE_URL}/appointments/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      loadAppointments();
    } catch (err) {
      setError('Failed to delete appointment');
    }
  };

  const handleEdit = (appointment) => {
    setEditingId(appointment.id);
    setEditingTitle(appointment.title);
    // Ensure ISO date strings with time are trimmed for the date input
    const dateOnly = appointment.date ? appointment.date.split('T')[0] : '';
    setEditingDate(dateOnly);
    setEditingTime(appointment.time);
    setEditingLocation(appointment.location || '');
  };

  const handleSave = async (id) => {
    setError('');
    if (!editingTitle || !editingDate || !editingTime) {
      setError('Title, date, and time are required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await fetch(`${config.API_BASE_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingTitle,
          date: editingDate,
          time: editingTime,
          location: editingLocation,
        }),
      });
      setEditingId(null);
      loadAppointments();
    } catch (err) {
      setError('Failed to save appointment');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Appointments</h1>
        <input
          type="text"
          placeholder="Search appointments..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="add-metric-section">
        <h2>Add New Appointment</h2>
        <form onSubmit={handleAddAppointment} className="add-metric-form">
          <input
            type="text"
            placeholder="Appointment title"
            className="form-input"
            value={newAppointmentTitle}
            onChange={(e) => setNewAppointmentTitle(e.target.value)}
            required
          />
          <input
            type="date"
            className="form-input"
            value={newAppointmentDate}
            onChange={(e) => setNewAppointmentDate(e.target.value)}
            required
          />
          <input
            type="time"
            className="form-input"
            value={newAppointmentTime}
            onChange={(e) => setNewAppointmentTime(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Location (optional)"
            className="form-input"
            value={newAppointmentLocation}
            onChange={(e) => setNewAppointmentLocation(e.target.value)}
          />
          <button type="submit" className="btn-add">
            <FiPlus /> Add
          </button>
        </form>
      </div>

      <div className="item-list">
        {filteredAppointments.length === 0 ? (
          <p className="empty-message">No appointments scheduled yet.</p>
        ) : (
          filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="item-card">
              {editingId === appointment.id ? (
                <div className="item-card-edit-controls">
                  <div className="edit-form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      required
                    />
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
                  <div className="edit-form-group">
                    <label>Time</label>
                    <input
                      type="time"
                      value={editingTime}
                      onChange={(e) => setEditingTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="edit-form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      placeholder="Location"
                      value={editingLocation}
                      onChange={(e) => setEditingLocation(e.target.value)}
                    />
                  </div>
                  <div className="item-card-buttons">
                    <button onClick={() => handleSave(appointment.id)} className="btn-save">
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="btn-cancel">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="item-card-content">
                  <div className="item-card-details">
                    <span className="item-card-title">{appointment.title}</span>
                    <div className="item-card-info">
                      <span><FiCalendar /> {formatDate(appointment.date)}</span>
                      <span><FiClock /> {formatTime(appointment.time)}</span>
                      {appointment.location && (
                        <span><FiMapPin /> {appointment.location}</span>
                      )}
                    </div>
                  </div>
                  <div className="item-card-buttons">
                    <button onClick={() => handleEdit(appointment)} className="btn-icon">
                      <FiEdit />
                    </button>
                    <button onClick={() => handleDeleteAppointment(appointment.id)} className="btn-icon btn-icon-delete">
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

export default Appointments;
