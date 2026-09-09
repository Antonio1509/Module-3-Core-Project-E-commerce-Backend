import express from 'express';
import userRoutes from './userRoutes.js';
import productRoutes from './productRoutes.js';
import authRoutes from './authRoutes.js';  // ← ADD THIS

const router = express.Router();

router.use('/auth', authRoutes);           // ← ADD THIS
router.use('/users', userRoutes);
router.use('/products', productRoutes);

router.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;