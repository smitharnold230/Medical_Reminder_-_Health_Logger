const db = require('./db');
const fs = require('fs');
const path = require('path');

async function checkAndApplySchema() {
  try {
    console.log('Checking database schema...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} schema statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await db.query(statement);
          console.log(`✓ Executed statement ${i + 1}`);
        } catch (err) {
          if (err.code === '42P07') { // duplicate_table
            console.log(`- Statement ${i + 1} skipped (table already exists)`);
          } else if (err.code === '42710') { // duplicate_object
            console.log(`- Statement ${i + 1} skipped (object already exists)`);
          } else {
            console.error(`✗ Error in statement ${i + 1}:`, err.message);
          }
        }
      }
    }
    
    console.log('Schema check/update completed!');
    
    // Test the health_score table structure
    try {
      const result = await db.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'health_score' 
        ORDER BY ordinal_position
      `);
      console.log('\nHealth score table structure:');
      result.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
      
      // Check for unique constraints
      const constraints = await db.query(`
        SELECT constraint_name, constraint_type 
        FROM information_schema.table_constraints 
        WHERE table_name = 'health_score' AND constraint_type = 'UNIQUE'
      `);
      console.log('\nUnique constraints on health_score:');
      if (constraints.rows.length > 0) {
        constraints.rows.forEach(row => {
          console.log(`  ${row.constraint_name}: ${row.constraint_type}`);
        });
      } else {
        console.log('  No unique constraints found');
      }
      
    } catch (err) {
      console.error('Error checking table structure:', err.message);
    }
    
  } catch (err) {
    console.error('Schema check failed:', err.message);
  } finally {
    process.exit(0);
  }
}

checkAndApplySchema(); 