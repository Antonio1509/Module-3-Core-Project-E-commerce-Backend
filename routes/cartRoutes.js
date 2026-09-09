import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartSummary
} from '../controllers/cartController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:product_id', removeFromCart);
router.delete('/clear', clearCart);
router.get('/summary', getCartSummary);

export default router;