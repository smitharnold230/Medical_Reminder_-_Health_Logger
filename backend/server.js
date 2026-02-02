require('dotenv').config({ path: './environment.env' });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db');
const authRoutes = require('./auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const logger = require('./logger');
const profileRoutes = require('./profile');
const notificationService = require('./notificationService');
// Import scheduler to initialize daily medication reset job
require('./medicationScheduler');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use env variable in production
const NODE_ENV = process.env.NODE_ENV || 'development';

// Log application startup
logger.info(`Starting Health Management API server in ${NODE_ENV} mode`);
logger.info(`Server will run on port ${PORT}`);

// Security middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['https://medical-reminder-health-logger-5qad-391ayzy5t.vercel.app/','https://mhs.codes' 'http://localhost:3000'];

const corsOptions = {
  origin: corsOrigins,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Security header to prevent MIME-sniffing
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// HTTP request logging
app.use(morgan('combined', { stream: logger.stream }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Root endpoint for basic testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'MedHel Backend API is running!',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    endpoints: {
      health: '/api/health',
      register: '/api/register',
      login: '/api/login'
    }
  });
});

// Health check endpoint for deployment testing
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await db.query('SELECT 1 as test');
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: NODE_ENV
    });
  } catch (error) {
    logger.error('Health check failed:', error.message);
    res.status(500).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

app.use('/api', authRoutes);
app.use('/api/profile', authenticateToken, profileRoutes);

// Middleware to authenticate and extract user ID from token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    logger.warn(`Authentication failed: No token provided for ${req.method} ${req.path}`);
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'TOKEN_MISSING'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        logger.warn(`Authentication failed: Token expired for ${req.method} ${req.path}`);
        return res.status(401).json({ 
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      logger.warn(`Authentication failed: Invalid token for ${req.method} ${req.path}`);
      return res.status(403).json({ 
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    req.userId = user.userId;
    logger.debug(`User ${user.userId} authenticated for ${req.method} ${req.path}`);
    next();
  });
}

app.get('/api/medications', authenticateToken, async (req, res) => {
  try {
    // Return all medications for the user
    const result = await db.query(
      `SELECT * FROM medications WHERE user_id = $1 ORDER BY time`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error(`Failed to fetch medications for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
});

app.get('/api/medications/history', authenticateToken, async (req, res) => {
  const { date } = req.query;
  try {
    let result;
    if (date) {
      logger.info(`Fetching medications history for user ${req.userId} on ${date}`);
      result = await db.query(
        'SELECT * FROM medications WHERE user_id = $1 AND medication_date = $2 ORDER BY time',
        [req.userId, date]
      );
    } else {
      logger.info(`Fetching all medications history for user ${req.userId}`);
      result = await db.query(
        'SELECT * FROM medications WHERE user_id = $1 AND medication_date < CURRENT_DATE ORDER BY medication_date DESC, time',
        [req.userId]
      );
    }
    logger.debug(`Retrieved ${result.rows.length} medications history for user ${req.userId}`);
    res.json(result.rows);
  } catch (err) {
    logger.error(`Failed to fetch medications history for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch medications history' });
  }
});

app.get('/api/appointment', authenticateToken, async (req, res) => {
  try {
    logger.info(`Fetching next upcoming appointment for user ${req.userId}`);
    const result = await db.query(
      'SELECT * FROM appointments WHERE user_id = $1 AND date >= CURRENT_DATE ORDER BY date, time LIMIT 1',
      [req.userId]
    );
    logger.debug(`Retrieved next appointment for user ${req.userId}: ${result.rows.length > 0 ? 'found' : 'not found'}`);
    res.json(result.rows[0] || {});
  } catch (err) {
    logger.error(`Failed to fetch next appointment for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

app.get('/api/healthscore', authenticateToken, async (req, res) => {
  try {
    logger.info(`Fetching health score for user ${req.userId}`);
    
    // Get recent health metrics (last 30 days)
    const metricsResult = await db.query(
      'SELECT * FROM health_metrics WHERE user_id = $1 AND metric_date >= CURRENT_DATE - INTERVAL \'30 days\' ORDER BY metric_date DESC',
      [req.userId]
    );
    
    // Get medication adherence (last 7 days)
    const medsResult = await db.query(
      'SELECT COUNT(*) as total, COALESCE(SUM(CASE WHEN taken THEN 1 ELSE 0 END), 0) as taken FROM medications WHERE user_id = $1 AND medication_date >= CURRENT_DATE - INTERVAL \'7 days\'',
      [req.userId]
    );
    
    // Get count of upcoming appointments (no GROUP BY)
    const appointmentsResult = await db.query(
      'SELECT COUNT(*) as upcoming FROM appointments WHERE user_id = $1 AND date >= CURRENT_DATE',
      [req.userId]
    );
    
    // Calculate dynamic health score
    let score = 50; // Base score
    
    // Health metrics contribution (up to 30 points)
    if (metricsResult.rows.length > 0) {
      const recentMetrics = metricsResult.rows.slice(0, 5); // Last 5 metrics
      const consistencyBonus = Math.min(recentMetrics.length * 6, 30);
      score += consistencyBonus;
    }
    
    // Medication adherence contribution (up to 20 points)
    if (medsResult.rows[0].total > 0) {
      const adherenceRate = medsResult.rows[0].taken / medsResult.rows[0].total;
      score += Math.round(adherenceRate * 20);
    }
    
    // Appointment planning bonus (up to 10 points)
    if (appointmentsResult.rows[0].upcoming > 0) {
      score += Math.min(appointmentsResult.rows[0].upcoming * 5, 10);
    }
    
    // Ensure score is between 0-100
    score = Math.max(0, Math.min(100, score));
    
    // Store the calculated score - use UPSERT pattern that works without unique constraint
    try {
      // Try to insert first
    await db.query(
        'INSERT INTO health_score (user_id, score, score_date) VALUES ($1, $2, CURRENT_DATE)',
      [req.userId, score]
    );
    } catch (insertErr) {
      // If insert fails (duplicate), update instead
      if (insertErr.code === '23505') { // unique_violation
        await db.query(
          'UPDATE health_score SET score = $1 WHERE user_id = $2 AND score_date = CURRENT_DATE',
          [score, req.userId]
        );
      } else {
        throw insertErr; // Re-throw if it's not a duplicate key error
      }
    }
    
    // Get health score history for trend visualization
    const historyResult = await db.query(
      'SELECT score, score_date FROM health_score WHERE user_id = $1 AND score_date >= CURRENT_DATE - INTERVAL \'7 days\' ORDER BY score_date',
      [req.userId]
    );

    // Trend: difference from previous score (if available)
    let trend = 0;
    if (historyResult.rows.length >= 2) {
      const lastScore = historyResult.rows[historyResult.rows.length - 1].score;
      const prevScore = historyResult.rows[historyResult.rows.length - 2].score;
      trend = lastScore - prevScore;
    }
    
    logger.debug(`Calculated health score for user ${req.userId}: ${score} (trend ${trend})`);
    res.json({ 
      score, 
      trend,
      score_date: new Date().toISOString().split('T')[0],
      history: historyResult.rows
    });
  } catch (err) {
    logger.error(`Failed to fetch health score for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch health score' });
  }
});

app.get('/api/healthmetrics', authenticateToken, async (req, res) => {
  try {
    logger.info(`Fetching today's health metrics for user ${req.userId}`);
    const result = await db.query(
      'SELECT * FROM health_metrics WHERE user_id = $1 AND metric_date = CURRENT_DATE ORDER BY metric_date',
      [req.userId]
    );
    logger.debug(`Retrieved ${result.rows.length} health metrics for user ${req.userId} (today)`);
    res.json(result.rows);
  } catch (err) {
    logger.error(`Failed to fetch today's health metrics for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch health metrics' });
  }
});

// Health metrics history (all or by date)
app.get('/api/health-metrics/history', authenticateToken, async (req, res) => {
  const { date } = req.query;
  try {
    let result;
    if (date) {
      logger.info(`Fetching health metrics history for user ${req.userId} on ${date}`);
      result = await db.query(
        'SELECT * FROM health_metrics WHERE user_id = $1 AND metric_date = $2 ORDER BY metric_date',
        [req.userId, date]
      );
    } else {
      logger.info(`Fetching all health metrics history for user ${req.userId}`);
      result = await db.query(
        'SELECT * FROM health_metrics WHERE user_id = $1 AND metric_date < CURRENT_DATE ORDER BY metric_date DESC',
        [req.userId]
      );
    }
    logger.debug(`Retrieved ${result.rows.length} health metrics history for user ${req.userId}`);
    res.json(result.rows);
  } catch (err) {
    logger.error(`Failed to fetch health metrics history for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch health metrics history' });
  }
});

// Add the hyphenated version that frontend expects
app.get('/api/health-metrics', authenticateToken, async (req, res) => {
  try {
    logger.info(`Fetching health metrics (hyphenated) for user ${req.userId}`);
    const result = await db.query('SELECT * FROM health_metrics WHERE user_id = $1 ORDER BY metric_date', [req.userId]);
    logger.debug(`Retrieved ${result.rows.length} health metrics for user ${req.userId}`);
    res.json(result.rows);
  } catch (err) {
    logger.error(`Failed to fetch health metrics for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch health metrics' });
  }
});

// GET all appointments for the user
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    logger.info(`Fetching appointments (plural) for user ${req.userId}`);
    const result = await db.query('SELECT * FROM appointments WHERE user_id = $1 ORDER BY date, time', [req.userId]);
    logger.debug(`Retrieved ${result.rows.length} appointments for user ${req.userId}`);
    res.json(result.rows);
  } catch (err) {
    logger.error(`Failed to fetch appointments for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// POST new appointment
app.post('/api/appointments', authenticateToken, async (req, res) => {
  const { title, date, time, location } = req.body;
  if (!title || !date || !time) {
    logger.warn(`Invalid appointment data from user ${req.userId}: missing title, date, or time`);
    return res.status(400).json({ error: 'Title, date, and time are required' });
  }
  try {
    logger.info(`Adding appointment for user ${req.userId} on ${date}`);
    const result = await db.query(
      'INSERT INTO appointments (user_id, title, date, time, location) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, title, date, time, location]
    );
    logger.info(`Appointment added successfully for user ${req.userId} on ${date}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error(`Failed to add appointment for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to add appointment' });
  }
});

// PUT update appointment
app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, date, time, location } = req.body;
  try {
    logger.info(`Updating appointment ${id} for user ${req.userId}`);
    const result = await db.query(
      'UPDATE appointments SET title=$1, date=$2, time=$3, location=$4 WHERE id=$5 AND user_id=$6 RETURNING *',
      [title, date, time, location, id, req.userId]
    );
    if (result.rows.length === 0) {
      logger.warn(`Appointment ${id} not found for user ${req.userId}`);
      return res.status(404).json({ error: 'Appointment not found' });
    }
    logger.info(`Appointment ${id} updated successfully for user ${req.userId}`);
    res.json(result.rows[0]);
  } catch (err) {
    logger.error(`Failed to update appointment ${id} for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// DELETE appointment
app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    logger.info(`Deleting appointment ${id} for user ${req.userId}`);
    const result = await db.query(
      'DELETE FROM appointments WHERE id=$1 AND user_id=$2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      logger.warn(`Appointment ${id} not found for user ${req.userId}`);
      return res.status(404).json({ error: 'Appointment not found' });
    }
    logger.info(`Appointment ${id} deleted successfully for user ${req.userId}`);
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    logger.error(`Failed to delete appointment ${id} for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

app.post('/api/health-metrics', authenticateToken, async (req, res) => {
  const { metric_date, value, type, unit } = req.body;
  if (!metric_date || value === undefined || !type || !unit) {
    logger.warn(`Invalid health metric data from user ${req.userId}: missing required fields`);
    return res.status(400).json({ error: 'Metric date, type, unit and value are required' });
  }
  try {
    logger.info(`Adding health metric for user ${req.userId} on ${metric_date}: ${value}`);
    const result = await db.query(
      'INSERT INTO health_metrics (user_id, metric_date, type, value, unit) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, metric_date, type, value, unit]
    );
    logger.info(`Health metric added successfully for user ${req.userId} on ${metric_date}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error(`Failed to add health metric for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to add health metric' });
  }
});

app.put('/api/health-metrics/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { metric_date, value, type, unit } = req.body;
  try {
    logger.info(`Updating health metric ${id} for user ${req.userId}`);
    const result = await db.query(
      'UPDATE health_metrics SET metric_date=$1, value=$2, type=$3, unit=$4 WHERE id=$5 AND user_id=$6 RETURNING *',
      [metric_date, value, type, unit, id, req.userId]
    );
    if (result.rows.length === 0) {
      logger.warn(`Health metric ${id} not found for user ${req.userId}`);
      return res.status(404).json({ error: 'Health metric not found' });
    }
    logger.info(`Health metric ${id} updated successfully for user ${req.userId}`);
    res.json(result.rows[0]);
  } catch (err) {
    logger.error(`Failed to update health metric ${id} for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to update health metric' });
  }
});

app.delete('/api/health-metrics/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    logger.info(`Deleting health metric ${id} for user ${req.userId}`);
    const result = await db.query(
      'DELETE FROM health_metrics WHERE id=$1 AND user_id=$2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      logger.warn(`Health metric ${id} not found for user ${req.userId}`);
      return res.status(404).json({ error: 'Health metric not found' });
    }
    logger.info(`Health metric ${id} deleted successfully for user ${req.userId}`);
    res.json({ message: 'Health metric deleted' });
  } catch (err) {
    logger.error(`Failed to delete health metric ${id} for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete health metric' });
  }
});

// Get current user's profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    logger.info(`Fetching profile for user ${req.userId}`);
    const result = await db.query('SELECT username, email FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      logger.warn(`User ${req.userId} not found when fetching profile`);
      return res.status(404).json({ error: 'User not found' });
    }
    logger.debug(`Profile retrieved successfully for user ${req.userId}`);
    res.json(result.rows[0]);
  } catch (err) {
    logger.error(`Failed to fetch profile for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update current user's profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email) {
    logger.warn(`Invalid profile update data from user ${req.userId}: missing username or email`);
    return res.status(400).json({ error: 'Username and email are required' });
  }
  try {
    logger.info(`Updating profile for user ${req.userId}`);
    let query, params;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET username = $1, email = $2, password_hash = $3 WHERE id = $4 RETURNING username, email';
      params = [username, email, hashedPassword, req.userId];
      logger.debug(`Password update included for user ${req.userId}`);
    } else {
      query = 'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING username, email';
      params = [username, email, req.userId];
    }
    const result = await db.query(query, params);
    if (result.rows.length === 0) {
      logger.warn(`User ${req.userId} not found when updating profile`);
      return res.status(404).json({ error: 'User not found' });
    }
    logger.info(`Profile updated successfully for user ${req.userId}`);
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // unique violation
      logger.warn(`Profile update failed for user ${req.userId}: username or email already exists`);
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    logger.error(`Failed to update profile for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT update password (separate endpoint for password changes)
app.put('/api/profile/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  
  try {
    logger.info(`Password update attempt for user ${req.userId}`);
    
    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      logger.warn(`Password update failed for user ${req.userId}: Missing required fields`);
      return res.status(400).json({ 
        error: 'Current password, new password, and confirm password are required',
        code: 'MISSING_FIELDS'
      });
    }
    
    if (newPassword !== confirmPassword) {
      logger.warn(`Password update failed for user ${req.userId}: New passwords do not match`);
      return res.status(400).json({ 
        error: 'New password and confirm password do not match',
        code: 'PASSWORD_MISMATCH'
      });
    }
    
    if (newPassword.length < 6) {
      logger.warn(`Password update failed for user ${req.userId}: New password too short`);
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long',
        code: 'INVALID_PASSWORD',
        details: ['Password must be at least 6 characters long']
      });
    }
    
    // Get current user to verify current password
    const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    if (userResult.rows.length === 0) {
      logger.warn(`Password update failed: User ${req.userId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValidPassword) {
      logger.warn(`Password update failed for user ${req.userId}: Invalid current password`);
      return res.status(401).json({ 
        error: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      });
    }
    
    // Hash new password
    const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    
    // Update password
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, req.userId]);
    
    logger.info(`Password updated successfully for user ${req.userId}`);
    res.json({ message: 'Password updated successfully' });
    
  } catch (err) {
    logger.error(`Failed to update password for user ${req.userId}: ${err.message}`);
    res.status(500).json({ 
      error: 'Failed to update password',
      code: 'PASSWORD_UPDATE_FAILED'
    });
  }
});

// Frontend logging endpoint
app.post('/api/logs', (req, res) => {
  try {
    const { level, name, timestamp, message, userAgent, url, userId } = req.body;
    
    // Log the frontend log entry
    logger.info(`Frontend log [${level}]: ${message}`, {
      source: 'frontend',
      component: name,
      timestamp,
      userAgent,
      url,
      userId,
      level
    });
    
    res.status(200).json({ message: 'Log received' });
  } catch (err) {
    logger.error('Failed to process frontend log', err);
    res.status(500).json({ error: 'Failed to process log' });
  }
});

app.get('/api/medication-reminders', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, time FROM medications
       WHERE user_id = $1
         AND start_date <= CURRENT_DATE
         AND end_date >= CURRENT_DATE
         AND (taken = FALSE OR taken IS NULL)
         AND time IS NOT NULL
         AND time >= CURRENT_TIME
         AND time <= (CURRENT_TIME + INTERVAL '10 minutes')
       ORDER BY time`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error(`Failed to fetch medication reminders for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch medication reminders' });
  }
});

// PUT update medication
app.put('/api/medications/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, dosage, medication_date, time, taken } = req.body;
  try {
    logger.info(`Updating medication ${id} for user ${req.userId}`);

    // Fetch current taken status to detect change
    const currentRes = await db.query('SELECT taken FROM medications WHERE id=$1 AND user_id=$2', [id, req.userId]);
    if (currentRes.rows.length === 0) {
      logger.warn(`Medication ${id} not found for user ${req.userId}`);
      return res.status(404).json({ error: 'Medication not found' });
    }
    const previousTaken = currentRes.rows[0].taken;

    const result = await db.query(
      'UPDATE medications SET name=$1, dosage=$2, medication_date=$3, time=$4, taken=$5 WHERE id=$6 AND user_id=$7 RETURNING *',
      [name, dosage, medication_date, time, taken, id, req.userId]
    );
    if (result.rows.length === 0) {
      logger.warn(`Medication ${id} not found for user ${req.userId}`);
      return res.status(404).json({ error: 'Medication not found' });
    }

    // Log action if taken status changed
    if (typeof taken === 'boolean' && taken !== previousTaken) {
      await db.query(
        'INSERT INTO medication_actions (user_id, medication_id, previous_taken, new_taken) VALUES ($1, $2, $3, $4)',
        [req.userId, id, previousTaken, taken]
      );
      logger.info(`Medication action logged for medication ${id} (taken ${previousTaken} -> ${taken}) user ${req.userId}`);
    }

    logger.info(`Medication ${id} updated successfully for user ${req.userId}`);
    res.json(result.rows[0]);
  } catch (err) {
    logger.error(`Failed to update medication ${id} for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to update medication' });
  }
});

// Get medication actions history
app.get('/api/medication-actions', authenticateToken, async (req, res) => {
  const { date } = req.query; // optional YYYY-MM-DD filter
  try {
    logger.info(`Fetching medication actions for user ${req.userId}`);
    let query = 'SELECT ma.*, m.name FROM medication_actions ma JOIN medications m ON ma.medication_id = m.id WHERE ma.user_id = $1';
    const params = [req.userId];
    if (date) {
      query += ' AND DATE(ma.action_time) = $2';
      params.push(date);
    }
    query += ' ORDER BY ma.action_time DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    logger.error(`Failed to fetch medication actions for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch medication actions' });
  }
});

// Revert a medication action
app.post('/api/medication-actions/:id/revert', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch action record
    const actionRes = await db.query('SELECT * FROM medication_actions WHERE id=$1 AND user_id=$2', [id, req.userId]);
    if (actionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Action not found' });
    }
    const action = actionRes.rows[0];
    if (action.reverted) {
      return res.status(400).json({ error: 'Action already reverted' });
    }

    // Revert medication taken status
    await db.query('UPDATE medications SET taken=$1 WHERE id=$2 AND user_id=$3', [action.previous_taken, action.medication_id, req.userId]);

    // Mark action as reverted
    await db.query('UPDATE medication_actions SET reverted = TRUE WHERE id=$1', [id]);

    logger.info(`Medication action ${id} reverted by user ${req.userId}`);
    res.json({ message: 'Action reverted' });
  } catch (err) {
    logger.error(`Failed to revert medication action ${id} for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to revert medication action' });
  }
});

// DELETE medication
app.delete('/api/medications/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    logger.info(`Deleting medication ${id} for user ${req.userId}`);
    const result = await db.query(
      'DELETE FROM medications WHERE id=$1 AND user_id=$2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      logger.warn(`Medication ${id} not found for user ${req.userId}`);
      return res.status(404).json({ error: 'Medication not found' });
    }
    logger.info(`Medication ${id} deleted successfully for user ${req.userId}`);
    res.json({ message: 'Medication deleted' });
  } catch (err) {
    logger.error(`Failed to delete medication ${id} for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete medication' });
  }
});

// POST new medication
app.post('/api/medications', authenticateToken, async (req, res) => {
  const { name, dosage, start_date, end_date, time } = req.body;
  if (!name || !dosage || !start_date || !end_date || !time) {
    logger.warn(`Invalid medication data from user ${req.userId}: missing required fields`);
    return res.status(400).json({ error: 'Name, dosage, start_date, end_date, and time are required' });
  }
  try {
    const result = await db.query(
      'INSERT INTO medications (user_id, name, dosage, start_date, end_date, time, taken) VALUES ($1, $2, $3, $4, $5, $6, FALSE) RETURNING *',
      [req.userId, name, dosage, start_date, end_date, time]
    );
    logger.info(`Medication added for user ${req.userId}: ${name} (${dosage})`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error(`Failed to add medication for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to add medication' });
  }
});

// Delete a medication action (optional cleanup). Only the owner can delete
app.delete('/api/medication-actions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const delRes = await db.query('DELETE FROM medication_actions WHERE id=$1 AND user_id=$2 RETURNING *', [id, req.userId]);
    if (delRes.rows.length === 0) {
      return res.status(404).json({ error: 'Action not found' });
    }
    logger.info(`Medication action ${id} deleted by user ${req.userId}`);
    res.json({ message: 'Action deleted' });
  } catch (err) {
    logger.error(`Failed to delete medication action ${id} for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete medication action' });
  }
});

// GET notifications for user
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const notifications = notificationService.getNotifications(req.userId, unreadOnly === 'true');
    logger.debug(`Retrieved ${notifications.length} notifications for user ${req.userId}`);
    res.json(notifications);
  } catch (err) {
    logger.error(`Failed to fetch notifications for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET notification count
app.get('/api/notifications/count', authenticateToken, async (req, res) => {
  try {
    const count = notificationService.getNotificationCount(req.userId, true);
    res.json({ count });
  } catch (err) {
    logger.error(`Failed to get notification count for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to get notification count' });
  }
});

// PUT mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const success = notificationService.markAsRead(req.userId, parseInt(id));
    if (success) {
      logger.debug(`Notification ${id} marked as read for user ${req.userId}`);
      res.json({ message: 'Notification marked as read' });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (err) {
    logger.error(`Failed to mark notification ${id} as read for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// PUT mark all notifications as read
app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    notificationService.markAllAsRead(req.userId);
    logger.debug(`All notifications marked as read for user ${req.userId}`);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    logger.error(`Failed to mark all notifications as read for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// DELETE notification
app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const success = notificationService.deleteNotification(req.userId, parseInt(id));
    if (success) {
      logger.debug(`Notification ${id} deleted for user ${req.userId}`);
      res.json({ message: 'Notification deleted' });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (err) {
    logger.error(`Failed to delete notification ${id} for user ${req.userId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});



// Notification Routes
// ... existing code ...
// (remove until before Global error handler)

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Global error handler: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.userId || 'unauthenticated'
  });
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      error: 'Invalid JSON format',
      code: 'INVALID_JSON'
    });
  }
  res.status(500).json({ 
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR'
  });
});

// Function to check if database tables exist
async function checkAndInitializeDatabase() {
  try {
    logger.info('Checking database schema...');
    
    // Check if users table exists
    const result = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const tablesExist = result.rows[0].exists;
    
    if (!tablesExist) {
      logger.warn('Database tables not found. Running setup script...');
      const setupDatabase = require('./setup-database');
      await setupDatabase.run();
      logger.info('✅ Database initialization completed');
    } else {
      logger.info('✅ Database tables already exist');
    }
  } catch (error) {
    logger.error('Failed to initialize database:', error.message);
    throw error;
  }
}

if (require.main === module) {
  // Initialize database before starting server
  checkAndInitializeDatabase()
    .then(() => {
      app.listen(PORT, () => {
        logger.info(`Health Management API server is running on port ${PORT}`);
        logger.info(`Environment: ${NODE_ENV}`);
        logger.info(`CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
      });
    })
    .catch((error) => {
      logger.error('Failed to start server:', error.message);
      process.exit(1);
    });
}

module.exports = app;
