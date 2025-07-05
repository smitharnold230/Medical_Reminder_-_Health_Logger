const cron = require('node-cron');
const db = require('./db');
const logger = require('./logger');
const notificationService = require('./notificationService');

// Daily medication reset job (default 00:05 server time)
const resetCronExpr = process.env.MED_RESET_CRON || '5 0 * * *';
cron.schedule(resetCronExpr, async () => {
  try {
    logger.info('Starting daily medication reset job');
    const result = await db.query(`
      UPDATE medications
      SET taken = FALSE
      WHERE taken = TRUE
        AND start_date <= CURRENT_DATE
        AND end_date >= CURRENT_DATE
      RETURNING id;
    `);

    if (result.rowCount > 0) {
      logger.info(`Daily medication reset: ${result.rowCount} medication(s) marked as not taken`);
    } else {
      logger.debug('Daily medication reset: no medications needed resetting');
    }
  } catch (err) {
    logger.error(`Failed to reset daily medication statuses: ${err.message}`);
  }
});

// Medication reminder check job (every 15 minutes)
const reminderCronExpr = process.env.MED_REMINDER_CRON || '*/15 * * * *';
cron.schedule(reminderCronExpr, async () => {
  try {
    logger.debug('Checking for medication reminders');
    const result = await db.query(`
      SELECT m.id, m.name, m.time, u.email, u.username
      FROM medications m
      JOIN users u ON m.user_id = u.id
      WHERE m.start_date <= CURRENT_DATE
        AND m.end_date >= CURRENT_DATE
        AND (m.taken = FALSE OR m.taken IS NULL)
        AND m.time IS NOT NULL
        AND m.time >= CURRENT_TIME
        AND m.time <= (CURRENT_TIME + INTERVAL '15 minutes')
      ORDER BY m.time;
    `);

    if (result.rows.length > 0) {
      logger.info(`Found ${result.rows.length} medication reminder(s) due in the next 15 minutes`);
      // Create notifications for each medication reminder
      result.rows.forEach(med => {
        logger.info(`Reminder: ${med.username} needs to take ${med.name} at ${med.time}`);
        notificationService.createMedicationReminder(med.user_id, {
          id: med.id,
          name: med.name,
          dosage: med.dosage || 'as prescribed',
          time: med.time
        });
      });
    } else {
      logger.debug('No medication reminders due in the next 15 minutes');
    }
  } catch (err) {
    logger.error(`Failed to check medication reminders: ${err.message}`);
  }
});

// Daily health score calculation job (6:00 AM daily)
const healthScoreCronExpr = process.env.HEALTH_SCORE_CRON || '0 6 * * *';
cron.schedule(healthScoreCronExpr, async () => {
  try {
    logger.info('Starting daily health score calculation job');
    
    // Get all users
    const usersResult = await db.query('SELECT id FROM users');
    
    for (const user of usersResult.rows) {
      try {
        // Calculate health score for each user
        const metricsResult = await db.query(
          'SELECT * FROM health_metrics WHERE user_id = $1 AND metric_date >= CURRENT_DATE - INTERVAL \'30 days\' ORDER BY metric_date DESC',
          [user.id]
        );
        
        const medsResult = await db.query(
          'SELECT COUNT(*) as total, SUM(CASE WHEN taken THEN 1 ELSE 0 END) as taken FROM medications WHERE user_id = $1',
          [user.id]
        );
        
        const appointmentsResult = await db.query(
          'SELECT COUNT(*) as upcoming FROM appointments WHERE user_id = $1 AND date >= CURRENT_DATE',
          [user.id]
        );
        
        // Calculate score (same logic as in healthscore endpoint)
        let score = 50; // Base score
        
        if (metricsResult.rows.length > 0) {
          const recentMetrics = metricsResult.rows.slice(0, 5);
          const consistencyBonus = Math.min(recentMetrics.length * 6, 30);
          score += consistencyBonus;
        }
        
        if (medsResult.rows[0].total > 0) {
          const adherenceRate = medsResult.rows[0].taken / medsResult.rows[0].total;
          score += Math.round(adherenceRate * 20);
        }
        
        if (appointmentsResult.rows[0].upcoming > 0) {
          score += Math.min(appointmentsResult.rows[0].upcoming * 5, 10);
        }
        
        score = Math.max(0, Math.min(100, score));
        
        // Store the calculated score
        try {
          await db.query(
            'INSERT INTO health_score (user_id, score, score_date) VALUES ($1, $2, CURRENT_DATE)',
            [user.id, score]
          );
        } catch (insertErr) {
          if (insertErr.code === '23505') { // unique_violation
            await db.query(
              'UPDATE health_score SET score = $1 WHERE user_id = $2 AND score_date = CURRENT_DATE',
              [score, user.id]
            );
          } else {
            throw insertErr;
          }
        }
        
        logger.debug(`Health score calculated for user ${user.id}: ${score}`);
        
        // Create notification for health score update
        notificationService.createHealthScoreNotification(user.id, score, 0); // trend = 0 for daily calculation
      } catch (userErr) {
        logger.error(`Failed to calculate health score for user ${user.id}: ${userErr.message}`);
      }
    }
    
    logger.info('Daily health score calculation job completed');
  } catch (err) {
    logger.error(`Failed to run daily health score calculation: ${err.message}`);
  }
});

// Log when cron jobs are initialized
logger.info('Medication scheduler cron jobs initialized');
logger.info(`- Daily reset: ${resetCronExpr}`);
logger.info(`- Reminder check: ${reminderCronExpr}`);
logger.info(`- Health score: ${healthScoreCronExpr}`); 