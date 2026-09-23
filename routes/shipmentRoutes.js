import express from 'express';
import { protect, requireVendor } from '../middleware/auth.js';
import {
  getVendorStats,
  getVendorOverview,
  getTopPickupPoints,
  getRecentActivity,
  getPickupPoints,
  getNearbyPickupPoints,
  getUnshippedOrders,
  createShipment,
} from '../controllers/shipmentController.js';

const router = express.Router();

router.use(protect, requireVendor);

// rankoverview.html
router.get('/vendor/stats', getVendorStats);
router.get('/vendor/overview', getVendorOverview);
router.get('/vendor/top-pickups', getTopPickupPoints);
router.get('/vendor/recent', getRecentActivity);

// rankdelivery.html
router.get('/pickup-points', getPickupPoints);
router.get('/pickup-points/nearby', getNearbyPickupPoints);

// createshipment.html
router.get('/unshipped', getUnshippedOrders);
router.post('/', createShipment);

export default router;