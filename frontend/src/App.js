import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Medications from './components/Medications';
import HealthMetrics from './components/HealthMetrics';
import Appointments from './components/Appointments';
import NavBar from './components/NavBar';
import Profile from './components/Profile';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { jwtDecode } from 'jwt-decode';
import { useState, useEffect } from 'react';
import { logger, authEvent, componentLifecycle, userAction } from './utils/logger';
import History from './components/History';
import { ThemeProvider } from './contexts/ThemeContext';

// A wrapper component to conditionally render NavBar
const AppContent = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    componentLifecycle('AppContent', 'mount');
    
    // On app load, check for token in localStorage
    const initializeAuth = () => {
      logger.info('Initializing authentication');
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decodedUser = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedUser.exp < currentTime) {
            // Token expired
            logger.warn('Authentication token expired');
            localStorage.removeItem('token');
            setUser(null);
            authEvent('token_expired');
          } else {
            logger.info('User authenticated from token', { userId: decodedUser.userId });
            setUser(decodedUser);
            authEvent('token_valid', { userId: decodedUser.userId });
          }
        } catch (error) {
          // Invalid token
          logger.warn('Invalid authentication token', error);
          localStorage.removeItem('token');
          setUser(null);
          authEvent('token_invalid');
        }
      } else {
        logger.info('No authentication token found');
        authEvent('no_token');
      }
      setLoading(false);
    };

    initializeAuth();

    return () => {
      componentLifecycle('AppContent', 'unmount');
    };
  }, []);

  const handleLoginSuccess = (token) => {
    logger.info('Login successful');
    localStorage.setItem('token', token);
    const decodedUser = jwtDecode(token);
    setUser(decodedUser);
    authEvent('login_success', { userId: decodedUser.userId });
    userAction('login');
  };

  const handleLogout = () => {
    logger.info('User logging out');
    localStorage.removeItem('token');
    setUser(null);
    authEvent('logout');
    userAction('logout');
  };

  const handleRegisterSuccess = (data) => {
    // Registration successful, user can now login
    logger.info('Registration successful', { username: data.user.username });
    authEvent('registration_success', { userId: data.user.id });
    userAction('register', { username: data.user.username });
  };

  const showNavBar = location.pathname !== '/login' && location.pathname !== '/register';

  if (loading) {
    logger.debug('App is loading');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#6B7280'
      }}>
        Loading...
      </div>
    );
  }

  logger.debug('App rendered', { 
    path: location.pathname, 
    userAuthenticated: !!user,
    showNavBar 
  });

  return (
    <ErrorBoundary>
      {showNavBar && <NavBar user={user} onLogout={handleLogout} />}
      <div className="app-container">
        <main id="main-content" role="main">
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute user={user}>
                  <Dashboard user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/medications" 
              element={
                <ProtectedRoute user={user}>
                  <Medications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/healthmetrics" 
              element={
                <ProtectedRoute user={user}>
                  <HealthMetrics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/appointments" 
              element={
                <ProtectedRoute user={user}>
                  <Appointments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute user={user}>
                  <Profile user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/history" 
              element={
                <ProtectedRoute user={user}>
                  <History />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/login"
              element={<Login onLoginSuccess={handleLoginSuccess} />}
            />
            <Route
              path="/register"
              element={<Register onRegisterSuccess={handleRegisterSuccess} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </ErrorBoundary>
  );
}

function App() {
  componentLifecycle('App', 'mount');
  
  useEffect(() => {
    logger.info('Health Management App started');
    return () => {
      componentLifecycle('App', 'unmount');
    };
  }, []);

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <div className="App">
            <main id="main-content" role="main">
              <AppContent />
            </main>
          </div>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
