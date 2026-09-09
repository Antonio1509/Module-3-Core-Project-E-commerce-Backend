import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import pool from './config/database.js';  

// loads the environment variables from the .env file
dotenv.config();

// Initialize Express application
const app = express();

// Sets the port from the environment variable or default to 5000
const PORT = process.env.PORT || 5000;

// DATABASE CONNECTION TEST
const testDatabase = async () => {
    try {
        // Gets a connection from the pool
        const connection = await pool.getConnection();

        console.log('MySQL Database connected successfully!');
        console.log(`Database: ${process.env.DB_NAME}`);
        console.log(`Host: ${process.env.DB_HOST}`);

        // Releases the connection back to the pool
        connection.release();
        return true;


    } catch (error) {

        console.error('MySQL Database connection failed:', error.message);
        console.error('Please check your .env file and MySQL service.');
        return false;

    }
};

// MIDDLEWARE

// Helmet for security headers which protect against common attacks
app.use(helmet());

// Compresses response bodies for faster loading times
app.use(compression());

//CORS allows cross-origin requests from frontend applications
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

app.get('/api/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            success: true,
            status: 'OK',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'ERROR',
            database: 'disconnected',
            error: error.message
        });
    }
});

app.get('/api/test-db', async (_req, res) => {
    try {
        const [result] = await pool.query('SELECT 1 + 1 AS test');
        const [tables] = await pool.query('SHOW TABLES');
        res.json({
            success: true,
            message: 'Database is working!',
            test: result,
            tables: tables.map(t => Object.values(t)[0]),
            table_count: tables.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Error handler
app.use((err, _req, res, _next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

const startServer = async () => {
    const dbConnected = await testDatabase();
    
    if (!dbConnected) {
        console.error('Server startup aborted - Database connection failed');
        process.exit(1);
    }
    
    app.listen(PORT, () => {
        console.log(`LocalCart API running on http://localhost:${PORT}`);
        console.log(`API Documentation: http://localhost:${PORT}/api/health`);
        console.log(`Test Database: http://localhost:${PORT}/api/test-db`);
    });
};

startServer();

export default app;