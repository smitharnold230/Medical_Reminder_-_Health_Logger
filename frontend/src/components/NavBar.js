import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiUser, FiSun, FiMoon } from 'react-icons/fi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import HeartIcon from './HeartIcon';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import '../styles.css';
import { config } from '../config';

const NavBar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);

  useEffect(() => {
    // Fetch upcoming medication notifications
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_BASE_URL}/medication-reminders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setNotifications(await response.json());
        }
      } catch (err) {
        // Ignore errors for now
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-brand">
        <HeartIcon />
        <span className="navbar-title">HealthTracker</span>
      </div>
      
      {user ? (
        <>
          <nav className="navbar-nav" role="menubar">
            <NavLink 
              to="/" 
              className={({ isActive }) => "header-nav-link" + (isActive ? " active" : "")}
              role="menuitem"
              aria-label="Dashboard"
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/medications" 
              className={({ isActive }) => "header-nav-link" + (isActive ? " active" : "")}
              role="menuitem"
              aria-label="Medications"
            >
              Medications
            </NavLink>
            <NavLink 
              to="/healthmetrics" 
              className={({ isActive }) => "header-nav-link" + (isActive ? " active" : "")}
              role="menuitem"
              aria-label="Health Metrics"
            >
              Health Metrics
            </NavLink>
            <NavLink 
              to="/appointments" 
              className={({ isActive }) => "header-nav-link" + (isActive ? " active" : "")}
              role="menuitem"
              aria-label="Appointments"
            >
              Appointments
            </NavLink>
            <NavLink 
              to="/history" 
              className={({ isActive }) => "header-nav-link" + (isActive ? " active" : "")}
              role="menuitem"
              aria-label="History"
            >
              History
            </NavLink>
            {/* Removed Profile tab from navbar as per user request */}
          </nav>
          <div className="header-actions">
            <button 
              className="theme-toggle" 
              onClick={toggleTheme} 
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <FiSun /> : <FiMoon />}
            </button>
            <div className="navbar-notification">
              <button 
                className="notification-bell" 
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label={`${notifications.length} medication reminders`}
                aria-expanded={showNotifications}
                aria-haspopup="true"
              >
              <FontAwesomeIcon icon={faBell} style={{ fontSize: '0.8em' }} />
                {notifications.length > 0 && <span className="notification-dot" aria-hidden="true" />}
              </button>
              {showNotifications && (
                <div className="notification-dropdown" role="menu" aria-label="Medication reminders">
                  {notifications.length === 0 ? (
                    <div className="notification-empty" role="menuitem">No upcoming medications</div>
                  ) : (
                    notifications.map((notif, idx) => (
                      <div key={idx} className="notification-item" role="menuitem">
                        <strong>{notif.name}</strong> at {notif.time}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="profile-dropdown-wrapper" ref={profileRef}>
              <button className="header-icon-button" onClick={() => setProfileOpen((open) => !open)}
                title={profileOpen ? 'Close profile menu' : 'Open profile menu'}
                aria-label={profileOpen ? 'Close profile menu' : 'Open profile menu'}
              >
                <FiUser />
              </button>
              {profileOpen && (
                <div className="profile-dropdown">
              {/* Replace Profile button with rendering Profile component */}
              {/* Removed Profile button to replace with Profile component */}
              <button className="profile-dropdown-item" onClick={handleLogout}>Logout</button>
            </div>
          )}
          {profileOpen && (
            <div className="profile-dropdown">
              <button className="profile-dropdown-item" onClick={() => { setProfileOpen(false); navigate('/profile'); }}>
                Profile
              </button>
              <button className="profile-dropdown-item" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
            </div>
          </div>
        </>
      ) : (
        <>
          <NavLink to="/login" className={({ isActive }) => "header-nav-link" + (isActive ? " active" : "")}>Login</NavLink>
          <NavLink to="/register" className={({ isActive }) => "header-nav-link" + (isActive ? " active" : "")}>Register</NavLink>
        </>
      )}
    </nav>
  );
};

NavBar.propTypes = {
  user: PropTypes.object,
  onLogout: PropTypes.func.isRequired
};

export default NavBar;
