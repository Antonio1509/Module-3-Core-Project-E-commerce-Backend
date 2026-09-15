import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import pool from './config/database.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// EXPRESS APP INITIALIZATION
// ============================================================
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// CREATE UPLOADS DIRECTORY
// ============================================================
const uploadDir = path.join(__dirname, 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(' Created uploads/products directory');
}

// ============================================================
// DATABASE CONNECTION TEST
// ============================================================
const testDatabase = async () => {
    try {
        const connection = await pool.getConnection();
        console.log(' MySQL Database connected successfully!');
        console.log(` Database: ${process.env.DB_NAME}`);
        console.log(`  Host: ${process.env.DB_HOST}`);
        connection.release();
        return true;
    } catch (error) {
        console.error(' MySQL Database connection failed:', error.message);
        console.error(' Please check your .env file and MySQL service.');
        return false;
    }
};

// ============================================================
// MIDDLEWARE
// ============================================================

// Helmet — security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Compression — gzip responses
app.use(compression());

// CORS — allow multiple frontend origins
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:5000',
        process.env.CORS_ORIGIN
    ].filter(Boolean),
    credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Morgan — HTTP request logging
app.use(morgan('dev'));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// ROUTES — all team routes via single aggregator
// ============================================================
app.use('/api', routes);

// ============================================================
// ROOT ENDPOINT — API info
// ============================================================
app.get('/', (_req, res) => {
    res.json({
        message: ' LocalCart API is running!',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/health',
            testDb: 'GET /api/test-db',
            cart: 'GET /api/cart',
            orders: 'POST /api/orders/create',
            payments: 'POST /api/payment/initiate',
            auth: 'POST /api/auth/login',
            products: 'GET /api/products',
            vendors: 'GET /api/vendors',
            users: 'GET /api/users',
            shipments: 'GET /api/shipments',
            subscriptions: 'GET /api/subscriptions',
            delivery: 'GET /api/delivery'
        }
    });
});

// ============================================================
// HEALTH CHECK — with DB status
// ============================================================
app.get('/api/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            success: true,
            status: 'OK',
            database: 'connected',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'ERROR',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================================
// TEST DB — tables list
// ============================================================
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

// ============================================================
// 404 HANDLER
// ============================================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use((err, _req, res, _next) => {
    console.error(' Error:', err.message); 
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// ============================================================
// START SERVER
// ============================================================
const startServer = async () => {
    const dbConnected = await testDatabase();

    if (!dbConnected) {
        console.error(' Server startup aborted — Database connection failed');
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(` LocalCart API running on http://localhost:${PORT}`);
        console.log(` API Documentation: http://localhost:${PORT}/`);
        console.log(`  Health Check: http://localhost:${PORT}/api/health`);
        console.log(` Test Database: http://localhost:${PORT}/api/test-db`);
    });
};

startServer();

// ============================================================
// EXPORT (for testing)
// ============================================================
export default app;