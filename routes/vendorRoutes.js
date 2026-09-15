import express from 'express';
import * as vendorController from '../controllers/vendorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public vendor directory routes
router.get('/', vendorController.getAllVendors);
router.get('/:id', vendorController.getVendorById);
router.get('/:id/products', vendorController.getVendorProducts);

// Authentication routes
router.post('/register', vendorController.registerVendor);
router.post('/login', vendorController.loginVendor);

// Public — a customer contacting a vendor doesn't require an account
router.post('/:id/contact', vendorController.contactVendor);

// Vendor management routes — require a logged-in account.
// NOTE: approveVendor was previously open to anyone with no login at
// all — it's now at least behind `protect`, but there's no admin/role
// system in this schema yet, so any logged-in user can currently call
// it. Add a real role check (e.g. an `is_admin` column on `users`)
// before relying on this in production.
router.patch('/:id/approve', protect, vendorController.approveVendor);

// updateVendor / addProduct now also verify inside the controller that
// the logged-in user actually owns the vendor id in the URL.
router.put('/:id', protect, vendorController.updateVendor);
router.post('/:id/products', protect, vendorController.addProduct);

export default router;