import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  FiTrash2, FiEdit, FiDownload
} from 'react-icons/fi';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../styles.css';
import { fetchMedications, addMedication, updateMedication, deleteMedication } from '../api';

const Medications = (props) => {
  const [medications, setMedications] = useState([]);
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Form state for adding
  const [newMedicationName, setNewMedicationName] = useState('');
  const [newMedicationDosage, setNewMedicationDosage] = useState('');
  const [newMedicationStartDate, setNewMedicationStartDate] = useState('');
  const [newMedicationEndDate, setNewMedicationEndDate] = useState('');
  const [newMedicationTime, setNewMedicationTime] = useState('');
  const [newMedicationNotes, setNewMedicationNotes] = useState('');

  // State for inline editing
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingDosage, setEditingDosage] = useState('');
  const [editingStartDate, setEditingStartDate] = useState('');
  const [editingEndDate, setEditingEndDate] = useState('');
  const [editingTime, setEditingTime] = useState('');
  const [editingNotes, setEditingNotes] = useState('');

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const loadMedications = async () => {
    try {
      const data = await fetchMedications();
      setMedications(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadMedications();
  }, []);

  useEffect(() => {
    setFilteredMedications(
      medications.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, medications]);

  const handleAddMedication = async (e) => {
    e.preventDefault();
    setError('');
    if (!newMedicationName || !newMedicationDosage || !newMedicationStartDate || !newMedicationEndDate || !newMedicationTime) {
      setError('All fields are required');
      return;
    }
    try {
      await addMedication({
        name: newMedicationName,
        dosage: newMedicationDosage,
        start_date: newMedicationStartDate,
        end_date: newMedicationEndDate,
        time: newMedicationTime
      });
      setNewMedicationName('');
      setNewMedicationDosage('');
      setNewMedicationStartDate('');
      setNewMedicationEndDate('');
      setNewMedicationTime('');
      loadMedications();
      if (props.refreshHealthScore) props.refreshHealthScore();
    } catch (err) {
      const message = err.message || 'Failed to add medication';
      setError(message);
    }
  };

  const handleDeleteMedication = async (id) => {
    try {
      await deleteMedication(id);
      loadMedications();
      if (props.refreshHealthScore) props.refreshHealthScore();
    } catch (err) {
      const message = err.message || 'Failed to delete medication';
      setError(message);
    }
  };

  const handleEdit = (med) => {
    setEditingId(med.id);
    setEditingName(med.name);
    setEditingDosage(med.dosage);
    setEditingStartDate(med.start_date ? med.start_date.split('T')[0] : '');
    setEditingEndDate(med.end_date ? med.end_date.split('T')[0] : '');
    setEditingTime(med.time || '');
    setEditingNotes(med.notes || '');
  };

  const handleSave = async (id) => {
    setError('');
    if (!editingName || !editingDosage || !editingStartDate || !editingEndDate || !editingTime) {
      setError('All fields are required');
      return;
    }
    try {
      await updateMedication(id, {
        name: editingName,
        dosage: editingDosage,
        start_date: editingStartDate,
        end_date: editingEndDate,
        time: editingTime,
        notes: editingNotes
      });
      setEditingId(null);
      loadMedications();
      if (props.refreshHealthScore) props.refreshHealthScore();
    } catch (err) {
      const message = err.message || 'Failed to save medication';
      setError(message);
    }
  };

  const handleToggleTaken = async (medId, currentTakenStatus) => {
    try {
      const medToUpdate = medications.find(m => m.id === medId);
      if (!medToUpdate) return;

      await updateMedication(medId, { 
        ...medToUpdate, 
        taken: !currentTakenStatus 
      });
      loadMedications();
      if (props.refreshHealthScore) props.refreshHealthScore();
    } catch (err) {
      const message = err.message || 'Failed to update medication status';
      setError(message);
    }
  };

  // Export as CSV
  const handleExportCSV = () => {
    // Format the data to match PDF output
    const formattedData = medications.map(medication => ({
      "Name": medication.name || '',
      "Dosage": medication.dosage || '',
      "Start Date": medication.start_date ? new Date(medication.start_date).toLocaleDateString() : '',
      "End Date": medication.end_date ? new Date(medication.end_date).toLocaleDateString() : '',
      "Time": medication.time || '',
      "Taken": medication.taken ? 'Yes' : 'No'
    }));

    const csv = Papa.unparse(formattedData, {
      quotes: true, // Force quotes around all fields
      header: true,
      delimiter: ",",
      newline: "\r\n"
    });

    // Add BOM for Excel to properly detect UTF-8
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `medications_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the URL object
  };

  // Export as PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Medications', 14, 16);
    doc.autoTable({
      head: [['Name', 'Dosage', 'Start Date', 'End Date', 'Time', 'Taken']],
      body: medications.map(m => [m.name, m.dosage, m.start_date, m.end_date, m.time, m.taken ? 'Yes' : 'No']),
      startY: 22,
    });
    doc.save('medications.pdf');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Medications</h1>
        <div className="page-filters">
          <input
            type="text"
            placeholder="Search medications..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search medications"
          />
          <button 
            className="btn-export" 
            onClick={handleExportCSV} 
            title="Export as CSV"
            aria-label="Export medications as CSV"
          >
            <FiDownload /> CSV
          </button>
          <button 
            className="btn-export" 
            onClick={handleExportPDF} 
            title="Export as PDF"
            aria-label="Export medications as PDF"
          >
            <FiDownload /> PDF
          </button>
        </div>
      </div>

      {!searchTerm && (
        <div className="card add-item-card">
          <h2>Add New Medication</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleAddMedication} className="add-item-form-grid">
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="medicationName">Medication Name *</label>
              <input
                id="medicationName"
                type="text"
                className="form-input"
                value={newMedicationName}
                onChange={(e) => setNewMedicationName(e.target.value)}
                placeholder="Enter medication name"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="medicationDosage">Dosage *</label>
              <input
                id="medicationDosage"
                type="text"
                className="form-input"
                value={newMedicationDosage}
                onChange={(e) => setNewMedicationDosage(e.target.value)}
                placeholder="e.g., 10mg"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                id="startDate"
                type="date"
                className="form-input"
                value={newMedicationStartDate}
                onChange={(e) => setNewMedicationStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date *</label>
              <input
                id="endDate"
                type="date"
                className="form-input"
                value={newMedicationEndDate}
                onChange={(e) => setNewMedicationEndDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="medicationTime">Time *</label>
              <input
                id="medicationTime"
                type="time"
                className="form-input"
                value={newMedicationTime}
                onChange={(e) => setNewMedicationTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group form-group-full-width">
              <label htmlFor="medicationNotes">Notes (Optional)</label>
              <textarea
                id="medicationNotes"
                className="form-textarea"
                value={newMedicationNotes}
                onChange={(e) => setNewMedicationNotes(e.target.value)}
                placeholder="Add any additional notes"
                rows={3}
              />
            </div>

            <div className="form-group form-group-full-width">
              <button type="submit" className="btn-add">
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {searchTerm && filteredMedications.length === 0 ? (
        <div className="no-results">
          <p>No medications found matching &ldquo;{searchTerm}&rdquo;</p>
        </div>
      ) : (
        <div className="item-list" role="region" aria-label="Medications list">
          {filteredMedications.length === 0 ? (
            <div className="no-data-message">No medications added yet.</div>
          ) : (
            filteredMedications.map((medication) => (
              <div key={medication.id} className="item-card">
                {editingId === medication.id ? (
                  <div className="item-card-edit-controls">
                    <div className="edit-form-row">
                      <div className="edit-form-group">
                        <label htmlFor={`edit-name-${medication.id}`}>Medication Name</label>
                        <input
                          id={`edit-name-${medication.id}`}
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="edit-form-row">
                      <div className="edit-form-group dosage-field">
                        <label htmlFor={`edit-dosage-${medication.id}`}>Dosage</label>
                        <input
                          id={`edit-dosage-${medication.id}`}
                          type="text"
                          value={editingDosage}
                          onChange={(e) => setEditingDosage(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="edit-form-row">
                      <div className="edit-form-group">
                        <label htmlFor={`edit-start-date-${medication.id}`}>Start Date</label>
                        <input
                          id={`edit-start-date-${medication.id}`}
                          type="date"
                          value={editingStartDate}
                          onChange={(e) => setEditingStartDate(e.target.value)}
                        />
                      </div>
                      <div className="edit-form-group">
                        <label htmlFor={`edit-end-date-${medication.id}`}>End Date</label>
                        <input
                          id={`edit-end-date-${medication.id}`}
                          type="date"
                          value={editingEndDate}
                          onChange={(e) => setEditingEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="edit-form-row">
                      <div className="edit-form-group">
                        <label htmlFor={`edit-time-${medication.id}`}>Time</label>
                        <input
                          id={`edit-time-${medication.id}`}
                          type="time"
                          value={editingTime}
                          onChange={(e) => setEditingTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="edit-form-row">
                      <div className="edit-form-group full-width">
                        <label htmlFor={`edit-notes-${medication.id}`}>Notes</label>
                        <textarea
                          id={`edit-notes-${medication.id}`}
                          placeholder="Notes (optional)"
                          value={editingNotes}
                          onChange={(e) => setEditingNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="item-card-buttons">
                      <button 
                        onClick={() => handleSave(medication.id)} 
                        className="btn-save"
                        aria-label="Save changes"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setEditingId(null)} 
                        className="btn-cancel"
                        aria-label="Cancel editing"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="item-card-content">
                    <div className="item-card-details">
                      <div className="item-card-header">
                        <span className="item-card-title">
                          {medication.name}
                        </span>
                        <div className="item-card-status">
                          <span className={`status-badge status-${medication.status}`}>
                            {medication.status}
                          </span>
                          <label className="taken-toggle">
                            <input
                              type="checkbox"
                              checked={medication.taken}
                              onChange={() => handleToggleTaken(medication.id, !medication.taken)}
                              aria-label={`Mark ${medication.name} as ${medication.taken ? 'not taken' : 'taken'}`}
                            />
                            <span className="taken-label">
                              {medication.taken ? 'Taken' : 'Not Taken'}
                            </span>
                          </label>
                        </div>
                      </div>
                      <div className="item-card-info">
                        <span><strong>Dosage:</strong> {medication.dosage}</span>
                        <span><strong>Start:</strong> {formatDate(medication.start_date)}</span>
                        {medication.end_date && (
                          <span><strong>End:</strong> {formatDate(medication.end_date)}</span>
                        )}
                        {medication.time && (
                          <span><strong>Time:</strong> {medication.time}</span>
                        )}
                        {medication.notes && (
                          <span><strong>Notes:</strong> {medication.notes}</span>
                        )}
                      </div>
                    </div>
                    <div className="item-card-buttons">
                      <button 
                        onClick={() => handleEdit(medication)} 
                        className="btn-icon"
                        aria-label={`Edit ${medication.name}`}
                      >
                        <FiEdit />
                      </button>
                      <button 
                        onClick={() => handleDeleteMedication(medication.id)} 
                        className="btn-icon btn-icon-delete"
                        aria-label={`Delete ${medication.name}`}
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
      )}
    </div>
  );
};

Medications.propTypes = {
  refreshHealthScore: PropTypes.func
};

export default Medications;