
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================================
// MySQL Connection Pool
// ============================================================
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'localcart',

    // Pool configuration
    waitForConnections: true,   // Queue requests when no connections available
    connectionLimit: 10,        // Max number of connections in the pool
    queueLimit: 0,              // Unlimited queue size

    // Keep connections alive to prevent timeouts
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

async function testConnection() {
    try {
        const conn = await pool.getConnection();
        console.log(' MySQL connected:', process.env.DB_NAME || 'localcart');
        conn.release();
    } catch (err) {
        console.error(' MySQL connection failed:', err.message);
    }
}

// Run the connection test
testConnection();

// ============================================================
// Export the pool for use in models (ES6 default export)
// ============================================================
export default pool;