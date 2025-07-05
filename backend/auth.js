const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const logger = require('./logger');
require('dotenv').config({ path: './environment.env' });

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// Input validation middleware
const validateRegistration = (req, res, next) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    logger.warn('Registration validation failed: Missing required fields');
    return res.status(400).json({ 
      error: 'Missing required fields',
      code: 'MISSING_FIELDS'
    });
  }
  
  if (username.length < 3 || username.length > 50) {
    logger.warn(`Registration validation failed: Invalid username length (${username.length})`);
    return res.status(400).json({ 
      error: 'Username must be between 3 and 50 characters',
      code: 'INVALID_USERNAME'
    });
  }
  
  if (password.length < 6) {
    logger.warn('Registration validation failed: Password too short');
    return res.status(400).json({ 
      error: 'Password must be at least 6 characters long',
      code: 'INVALID_PASSWORD'
    });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    logger.warn(`Registration validation failed: Invalid email format (${email})`);
    return res.status(400).json({ 
      error: 'Invalid email format',
      code: 'INVALID_EMAIL'
    });
  }
  
  next();
};

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    logger.info(`Registration attempt for user: ${username} (${email})`);
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );
    const user = result.rows[0];
    logger.info(`User registered successfully: ${username} (ID: ${user.id})`);
    res.status(201).json({ 
      user,
      message: 'Registration successful'
    });
  } catch (err) {
    if (err.code === '23505') { // unique violation
      logger.warn(`Registration failed: Username or email already exists (${username}, ${email})`);
      return res.status(409).json({ 
        error: 'Username or email already exists',
        code: 'DUPLICATE_USER'
      });
    }
    logger.error(`Registration error for ${username}: ${err.message}`);
    res.status(500).json({ 
      error: 'Registration failed',
      code: 'REGISTRATION_FAILED'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    logger.warn('Login attempt failed: Missing email or password');
    return res.status(400).json({ 
      error: 'Missing email or password',
      code: 'MISSING_CREDENTIALS'
    });
  }
  
  try {
    logger.info(`Login attempt for email: ${email}`);
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) {
      logger.warn(`Login failed: User not found for email ${email}`);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      logger.warn(`Login failed: Invalid password for user ${user.username} (${email})`);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    logger.info(`User logged in successfully: ${user.username} (ID: ${user.id})`);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      },
      message: 'Login successful'
    });
  } catch (err) {
    logger.error(`Login error for ${email}: ${err.message}`);
    res.status(500).json({ 
      error: 'Login failed',
      code: 'LOGIN_FAILED'
    });
  }
});

module.exports = router;
