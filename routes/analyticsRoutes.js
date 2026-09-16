import express from "express";
import { protect, requireVendor } from "../middleware/auth.js";
import {
  getVendorSummary,
  getVendorSalesOverTime,
  getVendorTopProducts,
  getVendorOrders,
} from "../controllers/analyticsController.js";

const router = express.Router();

// All analytics routes are vendor-only (a store's own sales data).
router.use(protect, requireVendor);

router.get("/vendor/summary", getVendorSummary);
router.get("/vendor/sales-over-time", getVendorSalesOverTime);
router.get("/vendor/top-products", getVendorTopProducts);
router.get("/vendor/orders", getVendorOrders);

export default router;
