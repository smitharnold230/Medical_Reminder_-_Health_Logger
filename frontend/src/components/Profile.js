import React, { useState, useEffect } from 'react';
import '../styles.css';
// 'updatePreferences' was removed as it's not exported from api.js
import { fetchProfile, updateProfile, updatePassword } from '../api'; 
import Notification from './Notification';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiSave, 
  FiAlertCircle, 
  FiCheckCircle,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';



const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState({
    username: '',
    email: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);


  // Password-related state
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchProfile();
          setUser(data);
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleInfoChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);
    try {
      const updated = await updateProfile({
        username: user.username,
        email: user.email,
      });
      setUser(updated);
      setMessage('Profile updated successfully!');
    } catch (err)      {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // FIX: Restored the missing handlePasswordSubmit function
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setPasswordErrors([]);
    setIsSubmitting(true);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      await updatePassword({
        currentPassword: password,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      });
      
      setMessage('Password changed successfully!');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors([]);
    } catch (err) {
      if (err.code === 'INVALID_PASSWORD' && err.details) {
        setPasswordErrors(err.details);
      } else {
        setError(err.message || 'Failed to change password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };



  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderProfileTab = () => (
    <div className="profile-card">
      <h2>Profile</h2>
      <p className="text-muted">This information will be displayed publicly.</p>
      <form onSubmit={handleInfoSubmit} className="profile-form">
        <div className="form-group">
          <label htmlFor="username" className="form-label">
            <FiUser className="input-icon" />
            Full Name
          </label>
          <input
            id="username"
            type="text"
            name="username"
            className="form-input"
            value={user.username || ""}
            onChange={handleInfoChange}
            required
            placeholder="Enter your full name"
            aria-describedby="username-error"
            aria-invalid={!!error}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            <FiMail className="input-icon" />
            Email Address
          </label>
          <input
            id="email"
            type="email"
            name="email"
            className="form-input"
            value={user.email || ""}
            onChange={handleInfoChange}
            required
            placeholder="Enter your email"
            aria-describedby="email-error"
            aria-invalid={!!error}
          />
        </div>

        <div className="button-group">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
             {isSubmitting ? 'Saving...' : <><FiSave /> Save Changes</>}
          </button>
          <button type="button" className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const renderPasswordTab = () => {
    return (
      <div className="profile-card">
        <h2>Change Password</h2>
        <p className="text-muted">Update your password to keep your account secure.</p>
        
        {passwordErrors.length > 0 && (
          <div className="password-requirements error">
            <h3>Password Requirements:</h3>
            <ul>
              {passwordErrors.map((error, index) => (
                <li key={index} className="error-text">
                  <FiAlertCircle className="error-icon" />
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="current-password" className="form-label">
              <FiLock className="input-icon" />
              Current Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your current password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              >
                {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="new-password" className="form-label">
              <FiLock className="input-icon" />
              New Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                {showNewPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password" className="form-label">
              <FiLock className="input-icon" />
              Confirm New Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="password-requirements">
            <h3>Password Requirements:</h3>
            <ul>
              <li>At least 8 characters long</li>
              <li>Contains at least one uppercase letter</li>
              <li>Contains at least one lowercase letter</li>
              <li>Contains at least one number</li>
              <li>Contains at least one special character (!@#$%^&*)</li>
            </ul>
          </div>

          <div className="button-group">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner small"></div>
                  Updating...
                </>
              ) : (
                <>
                  <FiSave />
                  Update Password
                </>
              )}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                setPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordErrors([]);
                setError('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };



  return (
    <>
      <Notification />
      <div className="settings-container">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            <a 
              href="#profile" 
              className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('profile');
              }}
            >
              <FiUser className="nav-icon" />
              Profile
            </a>
            <a 
              href="#password" 
              className={`settings-nav-item ${activeTab === 'password' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('password');
              }}
            >
              <FiLock className="nav-icon" />
              Password
            </a>
          </nav>
        </div>

        <div className="settings-content">
          <div className="page-header">
            <h1>Settings</h1>
            <p className="text-muted">Manage your account settings and preferences.</p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <FiAlertCircle className="alert-icon" />
              {error}
            </div>
          )}
          {message && (
            <div className="alert alert-success" role="alert">
              <FiCheckCircle className="alert-icon" />
              {message}
            </div>
          )}

          <div className="profile-grid">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'password' && renderPasswordTab()}
          {/* Removed notifications tab content as per user request */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;