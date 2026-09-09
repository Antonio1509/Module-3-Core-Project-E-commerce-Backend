import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getProfile, updateProfile, changePassword, getAllUsers } from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.get('/', authenticate, getAllUsers); 

export default router;