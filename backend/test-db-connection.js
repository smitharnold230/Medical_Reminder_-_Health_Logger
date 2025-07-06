const db = require('./db');
const logger = require('./logger');

async function testConnection() {
  try {
    logger.info('Testing database connection...');
    
    // Test basic connection
    const result = await db.query('SELECT NOW() as current_time, version() as version');
    
    logger.info('✅ Database connection successful!');
    logger.info(`Current time: ${result.rows[0].current_time}`);
    logger.info(`PostgreSQL version: ${result.rows[0].version}`);
    
    // Test if our database exists
    const dbResult = await db.query('SELECT current_database() as database_name');
    logger.info(`Connected to database: ${dbResult.rows[0].database_name}`);
    
    // Check if tables exist
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      logger.info('📋 Existing tables:');
      tablesResult.rows.forEach(row => {
        logger.info(`  - ${row.table_name}`);
      });
    } else {
      logger.info('📋 No tables found - database is empty');
    }
    
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    // Close the database connection
    await db.pool.end();
    logger.info('Database connection closed');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testConnection();
}

module.exports = testConnection; 