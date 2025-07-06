const db = require('./db');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

async function setupDatabase() {
  try {
    logger.info('Starting database setup...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    logger.info(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          logger.info(`Executing statement ${i + 1}/${statements.length}`);
          await db.query(statement);
          logger.info(`Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Some statements might fail if tables already exist, that's okay
          if (error.code === '42P07') { // duplicate_table
            logger.warn(`Table already exists, skipping: ${error.message}`);
          } else {
            logger.error(`Error executing statement ${i + 1}: ${error.message}`);
            throw error;
          }
        }
      }
    }
    
    logger.info('Database setup completed successfully!');
    
    // Test the connection by running a simple query
    const result = await db.query('SELECT NOW() as current_time');
    logger.info(`Database connection test successful: ${result.rows[0].current_time}`);
    
  } catch (error) {
    logger.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await db.pool.end();
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase; 