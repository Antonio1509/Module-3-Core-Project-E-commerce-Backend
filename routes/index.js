// routes/index.js - Temporary placeholder
import express from 'express';
import cartRoutes from './cartRoutes.js';
import orderRoutes from './orderRoutes.js';
router.use('/auth', authRoutes);

const router = express.Router();

// working routes
router.use('/auth', authRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);

// Health check
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

export default router;