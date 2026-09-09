import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Loads the environment variabbles
dotenv.config();

const pool = mysql.createPool({
    // Database connection details from environment variables
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // Pool configuration
    waitForConnections: true, // Queue requests when no connections are available
    connectionLimit: 10, // maximum number of connections in the pool
    queueLimit: 0, // unlimited queue size
    // keeps all the connections alive to prevent timeouts
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Exports the pool for use in models
export default pool;