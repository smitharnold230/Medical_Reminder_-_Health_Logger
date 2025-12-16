// Centralized Request Validation Middleware
// Standardizes error responses across all API endpoints

const logger = require('./logger');

/**
 * Standard error response format
 */
const sendErrorResponse = (res, statusCode, error, code) => {
  res.status(statusCode).json({
    error,
    code,
    timestamp: new Date().toISOString()
  });
};

/**
 * Validate required fields in request body
 * @param {Array} requiredFields - Array of required field names
 * @param {Object} data - Object to validate
 * @returns {Object} - { isValid: boolean, missingFields: Array }
 */
const validateRequiredFields = (requiredFields, data) => {
  const missingFields = requiredFields.filter(field => !data[field] || data[field].toString().trim() === '');
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      error: 'Password must be at least 6 characters long'
    };
  }
  return { isValid: true };
};

/**
 * Validate date format (YYYY-MM-DD)
 */
const validateDateFormat = (dateString) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Validate time format (HH:MM)
 */
const validateTimeFormat = (timeString) => {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

/**
 * Medication validation
 */
const validateMedication = (data) => {
  const { name, dosage, start_date, end_date, time } = data;
  const errors = [];

  if (!name || name.toString().trim() === '') {
    errors.push('Medication name is required');
  }
  if (!dosage || dosage.toString().trim() === '') {
    errors.push('Dosage is required');
  }
  if (!start_date || !validateDateFormat(start_date)) {
    errors.push('Valid start date (YYYY-MM-DD) is required');
  }
  if (!end_date || !validateDateFormat(end_date)) {
    errors.push('Valid end date (YYYY-MM-DD) is required');
  }
  if (!time || !validateTimeFormat(time)) {
    errors.push('Valid time (HH:MM) is required');
  }
  if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
    errors.push('Start date must be before end date');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Health metric validation
 */
const validateHealthMetric = (data) => {
  const { metric_type, metric_value, unit, recorded_date } = data;
  const errors = [];

  if (!metric_type || metric_type.toString().trim() === '') {
    errors.push('Metric type is required');
  }
  if (metric_value === undefined || metric_value === null || metric_value === '') {
    errors.push('Metric value is required');
  }
  if (isNaN(metric_value)) {
    errors.push('Metric value must be a number');
  }
  if (!unit || unit.toString().trim() === '') {
    errors.push('Unit is required');
  }
  if (recorded_date && !validateDateFormat(recorded_date)) {
    errors.push('Valid recorded date (YYYY-MM-DD) is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Appointment validation
 */
const validateAppointment = (data) => {
  const { doctor_name, appointment_date, time } = data;
  const errors = [];

  if (!doctor_name || doctor_name.toString().trim() === '') {
    errors.push('Doctor name is required');
  }
  if (!appointment_date || !validateDateFormat(appointment_date)) {
    errors.push('Valid appointment date (YYYY-MM-DD) is required');
  }
  if (!time || !validateTimeFormat(time)) {
    errors.push('Valid time (HH:MM) is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  sendErrorResponse,
  validateRequiredFields,
  validateEmail,
  validatePassword,
  validateDateFormat,
  validateTimeFormat,
  validateMedication,
  validateHealthMetric,
  validateAppointment
};
