import express from 'express';
import { protect, requireVendor } from '../middleware/auth.js';
import {
  getPlans,
  getMySubscription,
  subscribe,
  cancelSubscription,
} from '../controllers/subscriptionController.js';


const router = express.Router();


// Public — the plans list
router.get('/plans', getPlans);


// Vendor-only — manage my own subscription
router.get('/me',           protect, requireVendor, getMySubscription);
router.post('/subscribe',   protect, requireVendor, subscribe);
router.post('/cancel',      protect, requireVendor, cancelSubscription);


export default router;
