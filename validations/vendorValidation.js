/* =========================================================
   LocalCart — Validations/vendorValidation.js
   Input validation for every vendor-related request body,
   kept separate from vendorController.js so the controller
   stays focused on orchestration rather than field-checking.

   VendorValidation holds the pure logic (easy to unit test —
   no req/res involved). The exported *Rules functions below it
   are thin Express middleware wrappers around that logic, ready
   to drop into vendorRoutes.js, e.g.:

     router.post("/register", registerVendorRules, vendorController.registerVendor);

   Not wired into the routes yet — plug them in when you're
   ready, or ask and I'll do it.
   ========================================================= */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SA_PHONE_REGEX = /^(0\d{9}|\+27\d{9})$/; // e.g. 0821234567 or +27821234567
const PASSWORD_MIN_LENGTH = 8;

const VALID_CATEGORIES = [
  "Bakery", "Crafts", "Skincare", "Clothing", "Home & Decor",
  "Food Truck", "Beverages", "Handmade", "Wellness", "Jewelry"
];

const VALID_PRODUCT_STATUSES = ["published", "draft", "archived"];

class VendorValidation {
  /** POST /api/vendors/register */
  static registerVendor({ ownerName, email, phone, password, storeName, category, location } = {}) {
    const errors = [];

    if (!ownerName || !ownerName.trim()) errors.push("ownerName is required");
    if (!storeName || !storeName.trim()) errors.push("storeName is required");
    if (!location || !location.trim()) errors.push("location is required");

    if (!email) {
      errors.push("email is required");
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push("email is not a valid email address");
    }

    if (!phone) {
      errors.push("phone is required");
    } else if (!SA_PHONE_REGEX.test(phone.replace(/\s/g, ""))) {
      errors.push("phone must be a valid South African number (e.g. 0821234567 or +27821234567)");
    }

    if (!password) {
      errors.push("password is required");
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      errors.push(`password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }

    if (!category) {
      errors.push("category is required");
    } else if (!VALID_CATEGORIES.includes(category)) {
      errors.push(`category must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /** POST /api/vendors/login */
  static loginVendor({ email, password } = {}) {
    const errors = [];

    if (!email) {
      errors.push("email is required");
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push("email is not a valid email address");
    }

    if (!password) errors.push("password is required");

    return { isValid: errors.length === 0, errors };
  }

  /**
   * PUT /api/vendors/:id
   * This is a partial update — only fields that were actually
   * sent get validated. Sending nothing at all is also an error,
   * since it means there's nothing to update.
   */
  static updateVendor(fields = {}) {
    const errors = [];
    const allowedFields = [
      "name", "category", "location", "cover_image", "description",
      "about", "response_time", "delivery_area", "shipping_info"
    ];

    const sentFields = Object.keys(fields).filter(key => fields[key] !== undefined);

    if (sentFields.length === 0) {
      errors.push("At least one field must be provided to update");
      return { isValid: false, errors };
    }

    const unknownFields = sentFields.filter(key => !allowedFields.includes(key));
    if (unknownFields.length > 0) {
      errors.push(`Unknown field(s): ${unknownFields.join(", ")}`);
    }

    if (fields.category !== undefined && !VALID_CATEGORIES.includes(fields.category)) {
      errors.push(`category must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }

    if (fields.name !== undefined && !fields.name.trim()) {
      errors.push("name cannot be empty");
    }

    if (fields.cover_image !== undefined && fields.cover_image && !/^https?:\/\//.test(fields.cover_image)) {
      errors.push("cover_image must be a valid URL");
    }

    return { isValid: errors.length === 0, errors };
  }

  /** POST /api/vendors/:id/contact */
  static contactVendor({ name, email, message } = {}) {
    const errors = [];

    if (!name || !name.trim()) errors.push("name is required");

    if (!email) {
      errors.push("email is required");
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push("email is not a valid email address");
    }

    if (!message || !message.trim()) {
      errors.push("message is required");
    } else if (message.trim().length < 10) {
      errors.push("message must be at least 10 characters");
    } else if (message.length > 2000) {
      errors.push("message must be under 2000 characters");
    }

    return { isValid: errors.length === 0, errors };
  }

  /** POST /api/vendors/:id/products */
  static addProduct({ name, price, unit, stock, category, status } = {}) {
    const errors = [];

    if (!name || !name.trim()) errors.push("name is required");

    if (price === undefined || price === null || price === "") {
      errors.push("price is required");
    } else if (isNaN(price) || Number(price) <= 0) {
      errors.push("price must be a positive number");
    }

    if (stock !== undefined && (isNaN(stock) || Number(stock) < 0 || !Number.isInteger(Number(stock)))) {
      errors.push("stock must be a non-negative whole number");
    }

    if (unit !== undefined && typeof unit !== "string") {
      errors.push("unit must be text (e.g. 'each', '100ml', 'pack')");
    }

    if (category !== undefined && category !== null && !VALID_CATEGORIES.includes(category)) {
      errors.push(`category must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }

    if (status !== undefined && !VALID_PRODUCT_STATUSES.includes(status)) {
      errors.push(`status must be one of: ${VALID_PRODUCT_STATUSES.join(", ")}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /** Shared helper for any route with an :id param — catches "/api/vendors/abc" typos early. */
  static isValidId(id) {
    return /^\d+$/.test(String(id));
  }
}

/* ---------------------------------------------------------
   Express middleware wrappers.
   Each runs the matching VendorValidation check and either
   calls next() or responds 400 with the collected error list.
--------------------------------------------------------- */

const registerVendorRules = (req, res, next) => {
  const { isValid, errors } = VendorValidation.registerVendor(req.body);
  if (!isValid) return res.status(400).json({ success: false, errors });
  next();
};

const loginVendorRules = (req, res, next) => {
  const { isValid, errors } = VendorValidation.loginVendor(req.body);
  if (!isValid) return res.status(400).json({ success: false, errors });
  next();
};

const updateVendorRules = (req, res, next) => {
  if (!VendorValidation.isValidId(req.params.id)) {
    return res.status(400).json({ success: false, errors: ["Vendor id must be a number"] });
  }
  const { isValid, errors } = VendorValidation.updateVendor(req.body);
  if (!isValid) return res.status(400).json({ success: false, errors });
  next();
};

const contactVendorRules = (req, res, next) => {
  if (!VendorValidation.isValidId(req.params.id)) {
    return res.status(400).json({ success: false, errors: ["Vendor id must be a number"] });
  }
  const { isValid, errors } = VendorValidation.contactVendor(req.body);
  if (!isValid) return res.status(400).json({ success: false, errors });
  next();
};

const addProductRules = (req, res, next) => {
  if (!VendorValidation.isValidId(req.params.id)) {
    return res.status(400).json({ success: false, errors: ["Vendor id must be a number"] });
  }
  const { isValid, errors } = VendorValidation.addProduct(req.body);
  if (!isValid) return res.status(400).json({ success: false, errors });
  next();
};

module.exports = {
  VendorValidation,
  registerVendorRules,
  loginVendorRules,
  updateVendorRules,
  contactVendorRules,
  addProductRules
};