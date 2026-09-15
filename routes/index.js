import express from 'express';

// ============================================================
// ROUTE IMPORTS
// ============================================================

import cartRoutes from './cartRoutes.js';
import orderRoutes from './orderRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import productRoutes from './productRoutes.js';
import vendorRoutes from './vendorRoutes.js';
import shipmentRoutes from './shipmentRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import deliveryRoutes from './deliveryRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';

// ============================================================
// ROUTER SETUP
// ============================================================
const router = express.Router();

router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payment', paymentRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/vendors', vendorRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/analytics', analyticsRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

export default router;