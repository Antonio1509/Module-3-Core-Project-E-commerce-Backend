import express from 'express';
import {
  getDeliveryMethods,
  previewDelivery,
} from '../controllers/deliveryController.js';

const router = express.Router();

// Public routes — the delivery step happens before login/checkout
router.get('/methods', getDeliveryMethods);
router.post('/preview', previewDelivery);

export default router;