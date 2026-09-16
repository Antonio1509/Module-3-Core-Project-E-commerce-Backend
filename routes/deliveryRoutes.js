import express from 'express';
import { getDeliveryMethods, previewDelivery } from '../controllers/deliveryController.js';

const router = express.Router();

router.get('/methods', getDeliveryMethods);
router.post('/preview', previewDelivery);

export default router;
