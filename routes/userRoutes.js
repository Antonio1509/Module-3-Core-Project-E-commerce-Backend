import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getProfile, updateProfile, changePassword, getAllUsers, getFollowing, followVendor, unfollowVendor } from '../controllers/userController.js';


const router = express.Router();


router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.get('/', authenticate, getAllUsers);
router.get('/following', authenticate, getFollowing);
router.post('/following/:vendorId', authenticate, followVendor);
router.delete('/following/:vendorId', authenticate, unfollowVendor);


export default router;
