import express from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
    getAllProducts,
    getProductById,
    getProductReviews,
    createProductReview,
    getVendorProducts,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';


const router = express.Router();


// Public routes
router.get('/', optionalAuth, getAllProducts);
router.get('/:id/reviews', optionalAuth, getProductReviews);
router.post('/:id/reviews', authenticate, createProductReview);
router.get('/:id', optionalAuth, getProductById);
router.get('/vendor/:vendorId', getVendorProducts);


// Protected routes
router.post('/', authenticate, upload.single('image'), createProduct);
router.put('/:id', authenticate, upload.single('image'), updateProduct);
router.delete('/:id', authenticate, deleteProduct);


export default router;
