import axios from 'axios';
import axiosRetry from 'axios-retry';
import { config } from './config';
import { apiCall, apiResponse, apiError, logger } from './utils/logger';

const API_BASE_URL = config.API_BASE_URL;

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure retry logic for transient network errors
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry only on network errors or 5xx responses
    return axiosRetry.isNetworkError(error) || (error.response && error.response.status >= 500);
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log API call
    apiCall(config.method?.toUpperCase(), config.url, {
      data: config.data,
      params: config.params,
      headers: config.headers,
    });
    
    return config;
  },
  (error) => {
    logger.error('Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log successful API response
    apiResponse(
      response.config.method?.toUpperCase(),
      response.config.url,
      response.status,
      {
        data: response.data,
        headers: response.headers,
      }
    );
    return response;
  },
  (error) => {
    // Log API error
    apiError(
      error.config?.method?.toUpperCase(),
      error.config?.url,
      error
    );
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      logger.warn('Authentication token expired, redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.error || 'An error occurred',
      code: error.response.data?.code || 'UNKNOWN_ERROR',
      status: error.response.status,
    };
  } else if (error.request) {
    // Network error
    return {
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
      status: 0,
    };
  } else {
    // Other error
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      status: 0,
    };
  }
};

// API functions with consistent error handling
export const fetchMedications = async () => {
  try {
    logger.info('Fetching medications');
    const response = await apiClient.get('/medications');
    logger.debug(`Retrieved ${response.data.length} medications`);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch medications', error);
    throw handleApiError(error);
  }
};

export const fetchAppointment = async () => {
  try {
    logger.info('Fetching appointment');
    const response = await apiClient.get('/appointment');
    logger.debug('Appointment data retrieved', response.data);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch appointment', error);
    throw handleApiError(error);
  }
};

export const fetchHealthScore = async () => {
  try {
    logger.info('Fetching health score');
    const response = await apiClient.get('/healthscore');
    logger.debug('Health score retrieved', response.data);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch health score', error);
    throw handleApiError(error);
  }
};

export const fetchHealthMetrics = async () => {
  try {
    logger.info('Fetching health metrics');
    const response = await apiClient.get('/health-metrics');
    // Transform metric_date to date for frontend compatibility
    const transformedData = response.data.map(metric => ({
      ...metric,
      date: metric.metric_date,  // Map metric_date to date
    }));
    logger.debug(`Retrieved ${transformedData.length} health metrics`);
    return transformedData;
  } catch (error) {
    logger.error('Failed to fetch health metrics', error);
    throw handleApiError(error);
  }
};

export const fetchProfile = async () => {
  try {
    logger.info('Fetching user profile');
    const response = await apiClient.get('/profile');
    logger.debug('Profile data retrieved', response.data);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch profile', error);
    throw handleApiError(error);
  }
};

export const updateProfile = async (profileData) => {
  try {
    logger.info('Updating user profile', { fields: Object.keys(profileData) });
    const response = await apiClient.put('/profile', profileData);
    logger.info('Profile updated successfully');
    return response.data;
  } catch (error) {
    logger.error('Failed to update profile', error);
    throw handleApiError(error);
  }
};

export const fetchMedicationReminders = async () => {
  try {
    logger.info('Fetching medication reminders');
    const response = await apiClient.get('/medication-reminders');
    logger.debug(`Retrieved ${response.data.length} medication reminders`);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch medication reminders', error);
    throw handleApiError(error);
  }
};

export const fetchHealthMetricsHistory = async (date) => {
  try {
    logger.info('Fetching health metrics history', { date });
    const response = await apiClient.get('/health-metrics/history', { params: date ? { date } : {} });
    logger.debug(`Retrieved ${response.data.length} health metrics history`);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch health metrics history', error);
    throw handleApiError(error);
  }
};

export const fetchMedicationsHistory = async (date) => {
  try {
    logger.info('Fetching medications history', { date });
    const response = await apiClient.get('/medications/history', { params: date ? { date } : {} });
    logger.debug(`Retrieved ${response.data.length} medications history`);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch medications history', error);
    throw handleApiError(error);
  }
};

export const fetchAppointments = async () => {
  try {
    logger.info('Fetching appointments');
    const response = await apiClient.get('/appointments');
    logger.debug(`Retrieved ${response.data.length} appointments`);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch appointments', error);
    throw handleApiError(error);
  }
};

export const addMedication = async (medication) => {
  try {
    logger.info('Adding medication', medication);
    const response = await apiClient.post('/medications', medication);
    logger.info('Medication added successfully');
    return response.data;
  } catch (error) {
    logger.error('Failed to add medication', error);
    throw handleApiError(error);
  }
};

export const updateMedication = async (id, medication) => {
  try {
    logger.info('Updating medication', { id, ...medication });
    const response = await apiClient.put(`/medications/${id}`, medication);
    logger.info('Medication updated successfully');
    return response.data;
  } catch (error) {
    logger.error('Failed to update medication', error);
    throw handleApiError(error);
  }
};

export const deleteMedication = async (id) => {
  try {
    logger.info('Deleting medication', { id });
    const response = await apiClient.delete(`/medications/${id}`);
    logger.info('Medication deleted successfully');
    return response.data;
  } catch (error) {
    logger.error('Failed to delete medication', error);
    throw handleApiError(error);
  }
};

export const getProfile = async () => {
  const token = localStorage.getItem('token');
  const response = await apiClient.get('/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updatePassword = async (passwordData) => {
  try {
    logger.info('Updating password');
    const response = await apiClient.put('/profile/password', passwordData);
    logger.info('Password updated successfully');
    return response.data;
  } catch (error) {
    logger.error('Failed to update password', error);
    const apiError = handleApiError(error);
    
    // Add password-specific error handling
    if (error.response?.data?.code === 'INVALID_PASSWORD' && error.response?.data?.details) {
      apiError.details = error.response.data.details;
    }
    
    throw apiError;
  }
};

export const fetchMedicationActions = async (date) => {
  try {
    logger.info('Fetching medication actions history', { date });
    const params = date ? { params: { date } } : {};
    const response = await apiClient.get('/medication-actions', params);
    logger.debug(`Retrieved ${response.data.length} medication actions`);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch medication actions', error);
    throw handleApiError(error);
  }
};

export const revertMedicationAction = async (actionId) => {
  try {
    logger.info('Reverting medication action', { actionId });
    const response = await apiClient.post(`/medication-actions/${actionId}/revert`);
    logger.info('Medication action reverted');
    return response.data;
  } catch (error) {
    logger.error('Failed to revert medication action', error);
    throw handleApiError(error);
  }
};

export const deleteMedicationAction = async (actionId) => {
  try {
    logger.info('Deleting medication action', { actionId });
    const response = await apiClient.delete(`/medication-actions/${actionId}`);
    logger.info('Medication action deleted');
    return response.data;
  } catch (error) {
    logger.error('Failed to delete medication action', error);
    throw handleApiError(error);
  }
};

// Export the client for direct use if needed
export default apiClient;
