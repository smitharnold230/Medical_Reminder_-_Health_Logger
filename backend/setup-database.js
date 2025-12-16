const db = require('./db');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Smart SQL statement splitter that respects dollar-quoted strings
function splitSQLStatements(sqlContent) {
  const statements = [];
  let currentStatement = '';
  let inDollarQuote = false;
  let dollarQuoteDelimiter = '';
  
  for (let i = 0; i < sqlContent.length; i++) {
    const char = sqlContent[i];
    const prevChar = i > 0 ? sqlContent[i - 1] : '';
    const nextChars = sqlContent.substring(i, i + 10);
    
    // Check for dollar quote start/end
    if (char === '$' && (prevChar === ' ' || prevChar === '\n' || prevChar === '\t' || i === 0)) {
      const dollarMatch = nextChars.match(/^\$([a-zA-Z_][a-zA-Z0-9_]*)?\$/);
      if (dollarMatch) {
        const delimiter = dollarMatch[0];
        if (!inDollarQuote) {
          inDollarQuote = true;
          dollarQuoteDelimiter = delimiter;
          currentStatement += delimiter;
          i += delimiter.length - 1;
          continue;
        } else if (delimiter === dollarQuoteDelimiter) {
          inDollarQuote = false;
          currentStatement += delimiter;
          i += delimiter.length - 1;
          continue;
        }
      }
    }
    
    if (char === ';' && !inDollarQuote) {
      currentStatement += char;
      const trimmed = currentStatement.trim();
      if (trimmed.length > 0 && !trimmed.startsWith('--')) {
        statements.push(trimmed);
      }
      currentStatement = '';
    } else {
      currentStatement += char;
    }
  }
  
  // Add any remaining statement
  const trimmed = currentStatement.trim();
  if (trimmed.length > 0 && !trimmed.startsWith('--')) {
    statements.push(trimmed);
  }
  
  return statements;
}

async function setupDatabase(closeConnection = true) {
  try {
    logger.info('Starting database setup...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements using smart parser
    const statements = splitSQLStatements(schema);
    
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
            logger.warn(`Table already exists, skipping statement ${i + 1}`);
          } else if (error.code === '42P09') { // duplicate_object
            logger.warn(`Object already exists, skipping statement ${i + 1}`);
          } else {
            logger.error(`Error executing statement ${i + 1}: ${error.message}`);
            throw error;
          }
        }
      }
    }
    
    logger.info('✅ Database setup completed successfully!');
    
    // Test the connection by running a simple query
    const result = await db.query('SELECT NOW() as current_time');
    logger.info(`Database connection test successful: ${result.rows[0].current_time}`);
    
  } catch (error) {
    logger.error('Database setup failed:', error);
    if (closeConnection) {
      process.exit(1);
    } else {
      throw error;
    }
  } finally {
    // Only close connection if this was run as standalone script
    if (closeConnection) {
      await db.pool.end();
    }
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupDatabase(true);
}

module.exports = {
  run: () => setupDatabase(false), // For calling from server.js (don't close connection)
  setupDatabase: setupDatabase // For direct calls
}; 