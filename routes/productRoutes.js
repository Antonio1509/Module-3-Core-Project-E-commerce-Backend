import express from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
    getAllProducts,
    getProductById,
    getVendorProducts,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getAllProducts);
router.get('/:id', optionalAuth, getProductById);
router.get('/vendor/:vendorId', getVendorProducts);

// Protected routes
router.post('/', authenticate, upload.single('image'), createProduct);
router.put('/:id', authenticate, upload.single('image'), updateProduct);
router.delete('/:id', authenticate, deleteProduct);

export default router;