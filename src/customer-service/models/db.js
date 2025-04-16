// Load environment variables
require('dotenv').config();

// Import MySQL client
const mysql = require('mysql2');

// Create connection pool with environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export promise-based pool for async/await usage
module.exports = pool.promise(); 