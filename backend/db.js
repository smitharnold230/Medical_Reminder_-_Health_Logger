const { Pool } = require('pg');
const logger = require('./logger');
require('dotenv').config({ path: './environment.env' });

// Parse DATABASE_URL if provided (Render format)
let poolConfig = {};

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL (Render format)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Always require SSL for cloud DBs
    // Add connection pooling configuration
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  };
} else {
  // Use individual environment variables (local development)
  poolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'express_auth',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    // Add connection pooling configuration
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  };
}

const pool = new Pool(poolConfig);

let connectionEstablished = false;

// Test the connection
pool.on('connect', () => {
  logger.info('✅ Connected to PostgreSQL database');
  logger.info(`📍 Host: ${poolConfig.host}, DB: ${poolConfig.database}`);
  connectionEstablished = true;
});

pool.on('error', (err) => {
  if (!connectionEstablished) {
    logger.error('❌ Failed to connect to PostgreSQL');
    logger.error(`Host: ${poolConfig.host}:${poolConfig.port}`);
    logger.error(`Database: ${poolConfig.database}`);
    logger.error(`User: ${poolConfig.user}`);
    logger.error(`Error: ${err.message}`);
    logger.error('');
    logger.error('Please update your environment.env with correct Docker PostgreSQL credentials:');
    logger.error('  - DB_HOST: Docker container name or localhost');
    logger.error('  - DB_PORT: Port mapping (default 5432)');
    logger.error('  - DB_USER: Database user (usually postgres)');
    logger.error('  - DB_PASSWORD: Database password');
    logger.error('  - DB_NAME: Database name');
  } else {
    logger.error('Unexpected error on idle client', err);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
