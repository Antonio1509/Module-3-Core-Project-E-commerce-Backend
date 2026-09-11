/* =========================================================
   LocalCart — routes/vendorRoutes.js
   Maps each vendor-related URL + HTTP verb to a controller
   function. No auth middleware — every route is open. This is
   fine for local development; see BACKEND_GUIDE.md for how to
   add protection back before deploying anywhere public.
   ========================================================= */

const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");

router.get("/", vendorController.getAllVendors);
router.get("/:id", vendorController.getVendorById);
router.get("/:id/products", vendorController.getVendorProducts);

router.post("/register", vendorController.registerVendor);
router.post("/login", vendorController.loginVendor);

router.patch("/:id/approve", vendorController.approveVendor);
router.put("/:id", vendorController.updateVendor);
router.post("/:id/contact", vendorController.contactVendor);
router.post("/:id/products", vendorController.addProduct);

module.exports = router;