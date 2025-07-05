import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, user }) => {
  const location = useLocation();

  // Check if user is authenticated
  const isAuthenticated = () => {
    if (!user) return false;
    
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        // Token expired, remove it
        localStorage.removeItem('token');
        return false;
      }
      
      return true;
    } catch (error) {
      // Invalid token, remove it
      localStorage.removeItem('token');
      return false;
    }
  };

  if (!isAuthenticated()) {
    // Redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  user: PropTypes.object
};

export default ProtectedRoute; 