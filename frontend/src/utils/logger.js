import log from 'loglevel';
import remote from 'loglevel-plugin-remote';

// Configure loglevel
const safeProcess = typeof window !== 'undefined' && window.process ? window.process : { env: {} };
const LOG_LEVEL = safeProcess.env.REACT_APP_LOG_LEVEL || 'info';
const REMOTE_LOGGING_ENABLED = safeProcess.env.REACT_APP_REMOTE_LOGGING === 'true';
const REMOTE_LOG_URL = safeProcess.env.REACT_APP_REMOTE_LOG_URL || 'http://localhost:5000/api/logs';

// Set log level
log.setLevel(LOG_LEVEL);

// Configure remote logging if enabled
if (REMOTE_LOGGING_ENABLED) {
  remote.apply(log, {
    url: REMOTE_LOG_URL,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    format: (level, name, timestamp, message) => ({
      level,
      name,
      timestamp,
      message,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId') || 'anonymous',
    }),
  });
}

// Create a custom logger with additional context
class Logger {
  constructor(name = 'App') {
    this.name = name;
  }

  // Helper to format log messages with context
  formatMessage(message, data = null) {
    const context = {
      component: this.name,
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
      userId: localStorage.getItem('userId') || 'anonymous',
    };

    if (data) {
      return { message, data, context };
    }
    return { message, context };
  }

  // Log levels
  trace(message, data = null) {
    log.trace(this.formatMessage(message, data));
  }

  debug(message, data = null) {
    log.debug(this.formatMessage(message, data));
  }

  info(message, data = null) {
    log.info(this.formatMessage(message, data));
  }

  warn(message, data = null) {
    log.warn(this.formatMessage(message, data));
  }

  error(message, error = null) {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : null;
    log.error(this.formatMessage(message, errorData));
  }

  // Specialized logging methods
  apiCall(method, url, data = null) {
    this.info(`API ${method} ${url}`, data);
  }

  apiResponse(method, url, status, data = null) {
    this.info(`API ${method} ${url} - ${status}`, data);
  }

  apiError(method, url, error) {
    this.error(`API ${method} ${url} failed`, error);
  }

  userAction(action, data = null) {
    this.info(`User action: ${action}`, data);
  }

  authEvent(event, data = null) {
    this.info(`Auth event: ${event}`, data);
  }

  componentLifecycle(component, lifecycle, data = null) {
    this.debug(`Component ${component} ${lifecycle}`, data);
  }

  performance(operation, duration, data = null) {
    this.debug(`Performance: ${operation} took ${duration}ms`, data);
  }
}

// Create default logger instance
const defaultLogger = new Logger('App');

// Export both the class and default instance
export { Logger, defaultLogger as logger };

// Export loglevel for direct access if needed
export { log };

// Export convenience methods
export const trace = (message, data) => defaultLogger.trace(message, data);
export const debug = (message, data) => defaultLogger.debug(message, data);
export const info = (message, data) => defaultLogger.info(message, data);
export const warn = (message, data) => defaultLogger.warn(message, data);
export const error = (message, error) => defaultLogger.error(message, error);

// Export specialized methods
export const apiCall = (method, url, data) => defaultLogger.apiCall(method, url, data);
export const apiResponse = (method, url, status, data) => defaultLogger.apiResponse(method, url, status, data);
export const apiError = (method, url, error) => defaultLogger.apiError(method, url, error);
export const userAction = (action, data) => defaultLogger.userAction(action, data);
export const authEvent = (event, data) => defaultLogger.authEvent(event, data);
export const componentLifecycle = (component, lifecycle, data) => defaultLogger.componentLifecycle(component, lifecycle, data);
export const performance = (operation, duration, data) => defaultLogger.performance(operation, duration, data); 