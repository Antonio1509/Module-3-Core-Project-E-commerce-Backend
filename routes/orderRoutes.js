import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    createOrder,
    getOrderByNumber,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    getOrderTracking
} from '../controllers/orderController.js';

const router = express.Router();

router.use(authenticate);

router.post('/create', createOrder);

router.get('/number/:orderNumber', getOrderByNumber);

router.get('/my', getMyOrders);

router.get('/track/:orderNumber', getOrderTracking);

router.patch('/:id/status', updateOrderStatus);

router.get('/:id', getOrderById);

export default router;