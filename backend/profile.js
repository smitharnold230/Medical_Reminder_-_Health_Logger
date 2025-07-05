const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');
const logger = require('./logger');
const router = express.Router();

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    // Get user profile
    const userResult = await db.query(
      'SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (!userResult.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userResult.rows[0]);
  } catch (err) {
    logger.error(`Failed to fetch profile for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  const { username, email } = req.body;
  
  try {
    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    // Update user profile
    const result = await db.query(
      `UPDATE users 
       SET username = COALESCE($1, username),
           email = COALESCE($2, email)
       WHERE id = $3
       RETURNING id, username, email, updated_at`,
      [username, email, req.userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // unique violation
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    logger.error(`Failed to update profile for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Password validation helper
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Update user password
router.put('/profile/password', async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Basic validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ 
      error: 'All password fields are required',
      code: 'MISSING_FIELDS'
    });
  }

  // Confirm passwords match
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ 
      error: 'New passwords do not match',
      code: 'PASSWORD_MISMATCH'
    });
  }

  // Validate new password strength
  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    return res.status(400).json({ 
      error: 'Password requirements not met',
      code: 'INVALID_PASSWORD',
      details: validation.errors
    });
  }

  try {
    // Verify current password
    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.userId]
    );

    if (!userResult.rows[0]) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const match = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!match) {
      return res.status(401).json({ 
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Prevent reuse of current password
    const newPasswordMatch = await bcrypt.compare(newPassword, userResult.rows[0].password_hash);
    if (newPasswordMatch) {
      return res.status(400).json({ 
        error: 'New password must be different from current password',
        code: 'PASSWORD_REUSE'
      });
    }

    // Update password with higher security (increased rounds)
    const BCRYPT_ROUNDS = 12;
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.userId]
    );

    // Log the password change
    logger.info(`Password changed successfully for user ${req.userId}`);

    res.json({ 
      message: 'Password updated successfully',
      code: 'PASSWORD_UPDATED'
    });
  } catch (err) {
    logger.error(`Failed to update password for user ${req.userId}: ${err.message}`);
    res.status(500).json({ 
      error: 'Failed to update password',
      code: 'UPDATE_FAILED'
    });
  }
});



module.exports = router;