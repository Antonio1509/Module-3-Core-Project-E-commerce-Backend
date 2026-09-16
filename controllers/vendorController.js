import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import emailService from "../services/emailService.js";
import sms from "../services/smsService.js";

const SALT_ROUNDS = 10;

/* ---------------------------------------------------------
   GET /api/vendors
   Query params: ?category=Bakery&search=sourdough&page=1&limit=12
   Only active storefronts are listed; only published products
   count toward product_count.
--------------------------------------------------------- */
export async function getAllVendors(req, res) {
  try {
    const { category, search = "", page = 1, limit = 12 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let sql = `
                 SELECT v.id, v.name, v.category, v.location, v.cover_image, v.logo_text,
                   COALESCE(review_stats.rating, v.rating) AS rating,
                   COALESCE(review_stats.review_count, v.review_count) AS review_count,
                   v.description, v.joined,
                   COUNT(CASE WHEN p.status = 'published' THEN 1 END) AS product_count
            FROM vendors v
            LEFT JOIN products p ON p.vendor_id = v.id
                 LEFT JOIN (
                SELECT p2.vendor_id, AVG(r.rating) AS rating, COUNT(r.id) AS review_count
                FROM products p2
                JOIN reviews r ON r.product_id = p2.id
                GROUP BY p2.vendor_id
                 ) review_stats ON review_stats.vendor_id = v.id
            WHERE v.is_active = TRUE
        `;
    const params = [];

    if (category && category !== "All") {
      sql += " AND v.category = ?";
      params.push(category);
    }

    if (search) {
      sql += " AND (v.name LIKE ? OR v.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += " GROUP BY v.id ORDER BY v.rating DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), offset);

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, vendors: rows });
  } catch (err) {
    console.error("getAllVendors error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Could not fetch vendors" });
  }
}

/* ---------------------------------------------------------
   GET /api/vendors/:id
   Public storefront profile. Deliberately does NOT return the
   linked user's email/phone — customers reach a vendor through
   POST /:id/contact instead.
--------------------------------------------------------- */
export async function getVendorById(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT v.id, v.name, v.category, v.location, v.cover_image, v.logo_text,
                COALESCE(review_stats.rating, v.rating) AS rating,
                COALESCE(review_stats.review_count, v.review_count) AS review_count,
                v.joined, v.description, v.about, v.response_time,
                v.delivery_area, v.shipping_info, v.is_active
              FROM vendors v
              LEFT JOIN (
             SELECT p.vendor_id, AVG(r.rating) AS rating, COUNT(r.id) AS review_count
             FROM products p
             JOIN reviews r ON r.product_id = p.id
             GROUP BY p.vendor_id
              ) review_stats ON review_stats.vendor_id = v.id
              WHERE v.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    res.json({ success: true, vendor: rows[0] });
  } catch (err) {
    console.error("getVendorById error:", err.message);
    res.status(500).json({ success: false, message: "Could not fetch vendor" });
  }
}

/* ---------------------------------------------------------
   GET /api/vendors/:id/products
   Only 'published' products are shown to customers.
--------------------------------------------------------- */
export async function getVendorProducts(req, res) {
  try {
    const { id } = req.params;

    const [vendorRows] = await pool.query(
      "SELECT id FROM vendors WHERE id = ?",
      [id],
    );
    if (vendorRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    const [products] = await pool.query(
      `SELECT id, name, price, unit, image, stock, category, description
             FROM products WHERE vendor_id = ? AND status = 'published'
             ORDER BY created_at DESC`,
      [id],
    );

    res.json({ success: true, count: products.length, products });
  } catch (err) {
    console.error("getVendorProducts error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Could not fetch products" });
  }
}

/* ---------------------------------------------------------
   GET /api/vendors/:id/followers
   Vendor-only follower list for the signed-in store owner.
--------------------------------------------------------- */
export async function getVendorFollowers(req, res) {
  try {
    const { id } = req.params;

    if (Number(req.user.vendor_id) !== Number(id)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view these followers",
      });
    }

    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar_initials, f.followed_at
             FROM user_follows_vendor f
             JOIN users u ON u.id = f.user_id
             WHERE f.vendor_id = ?
             ORDER BY f.followed_at DESC`,
      [id],
    );

    res.json({ success: true, count: rows.length, followers: rows });
  } catch (err) {
    console.error("getVendorFollowers error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Could not fetch followers" });
  }
}

/* ---------------------------------------------------------
   POST /api/vendors/register
   Creates a `users` row (is_vendor = TRUE) AND a `vendors` row
   in a single transaction — if either insert fails, both are
   rolled back so you never end up with a "half" vendor account.
   New storefronts start with is_active = FALSE until approved.
--------------------------------------------------------- */
export async function registerVendor(req, res) {
  const {
    ownerName,
    email,
    phone,
    password,
    storeName,
    category,
    location,
    description,
    about,
  } = req.body;

  if (
    !ownerName ||
    !email ||
    !phone ||
    !password ||
    !storeName ||
    !category ||
    !location
  ) {
    return res.status(400).json({
      success: false,
      message:
        "ownerName, email, phone, password, storeName, category and location are required",
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );
    if (existing.length > 0) {
      await conn.rollback();
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const avatarInitials = ownerName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const [userResult] = await conn.query(
      `INSERT INTO users (name, email, password_hash, phone, location, avatar_initials, is_vendor)
             VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [ownerName, email, passwordHash, phone, location, avatarInitials],
    );
    const userId = userResult.insertId;

    const logoText = storeName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const [vendorResult] = await conn.query(
      `INSERT INTO vendors (user_id, name, category, location, logo_text, description, about, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [
        userId,
        storeName,
        category,
        location,
        logoText,
        description || "",
        about || "",
      ],
    );

    await conn.commit();

    const newVendor = {
      id: vendorResult.insertId,
      name: storeName,
      email,
      phone,
    };

    // Fire-and-forget — registration still succeeds even if these fail
    emailService.sendVendorWelcomeEmail(newVendor);
    sms.sendVendorWelcomeSMS(newVendor);

    res.status(201).json({
      success: true,
      message: "Vendor registered. Storefront is pending approval.",
      vendor: { vendorId: vendorResult.insertId, userId, storeName, email },
    });
  } catch (err) {
    await conn.rollback();
    console.error("registerVendor error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Could not register vendor" });
  } finally {
    conn.release();
  }
}

/* ---------------------------------------------------------
   POST /api/vendors/login
   Authenticates against the `users` table. No token is issued
   here — this simply confirms the email/password are correct
   and returns the vendor's basic info.
--------------------------------------------------------- */
export async function loginVendor(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "email and password are required" });
    }

    const [rows] = await pool.query(
      `SELECT u.id AS user_id, u.password_hash, u.is_vendor,
                    v.id AS vendor_id, v.name AS store_name, v.is_active
             FROM users u
             JOIN vendors v ON v.user_id = u.id
             WHERE u.email = ?`,
      [email],
    );

    if (rows.length === 0 || !rows[0].is_vendor) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const account = rows[0];
    const passwordMatches = await bcrypt.compare(
      password,
      account.password_hash,
    );
    if (!passwordMatches) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    res.json({
      success: true,
      message: "Login successful",
      vendor: {
        id: account.vendor_id,
        name: account.store_name,
        isActive: !!account.is_active,
      },
    });
  } catch (err) {
    console.error("loginVendor error:", err.message);
    res.status(500).json({ success: false, message: "Login failed" });
  }
}

/* ---------------------------------------------------------
   PATCH /api/vendors/:id/approve
   Flips a pending storefront to active and notifies the vendor.
--------------------------------------------------------- */
export async function approveVendor(req, res) {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "UPDATE vendors SET is_active = TRUE WHERE id = ?",
      [id],
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    const [rows] = await pool.query(
      `SELECT v.name, u.email, u.phone FROM vendors v
             LEFT JOIN users u ON v.user_id = u.id WHERE v.id = ?`,
      [id],
    );

    if (rows[0]?.email) {
      emailService.sendVendorApprovedEmail(rows[0]);
      sms.sendVendorApprovedSMS(rows[0]);
    }

    res.json({
      success: true,
      message: "Vendor approved and now visible in the directory",
    });
  } catch (err) {
    console.error("approveVendor error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Could not approve vendor" });
  }
}

/* ---------------------------------------------------------
   PUT /api/vendors/:id
   Updates editable profile fields.
--------------------------------------------------------- */
export async function updateVendor(req, res) {
  try {
    const { id } = req.params;

    if (Number(req.user.vendor_id) !== Number(id)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this vendor",
      });
    }

    const allowedFields = [
      "name",
      "category",
      "location",
      "cover_image",
      "description",
      "about",
      "response_time",
      "delivery_area",
      "shipping_info",
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid fields to update" });
    }

    values.push(id);
    const [result] = await pool.query(
      `UPDATE vendors SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    res.json({ success: true, message: "Vendor profile updated" });
  } catch (err) {
    console.error("updateVendor error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Could not update vendor" });
  }
}

/* ---------------------------------------------------------
   POST /api/vendors/:id/contact
   Customer → vendor enquiry. Looks up the vendor's email via
   the users table.
--------------------------------------------------------- */
export async function contactVendor(req, res) {
  try {
    const { id } = req.params;
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "name, email and message are required",
      });
    }

    const [rows] = await pool.query(
      `SELECT v.id, v.name, u.email AS vendor_email
             FROM vendors v LEFT JOIN users u ON v.user_id = u.id
             WHERE v.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    if (!rows[0].vendor_email) {
      return res.status(422).json({
        success: false,
        message: "This vendor hasn't linked a contact email yet",
      });
    }

    const result = await emailService.sendCustomerInquiryEmail(
      { name: rows[0].name, email: rows[0].vendor_email },
      { name, email, message },
    );

    res.json({
      success: true,
      message: "Message sent to vendor",
      emailDelivered: result.success,
    });
  } catch (err) {
    console.error("contactVendor error:", err.message);
    res.status(500).json({ success: false, message: "Could not send message" });
  }
}

/* ---------------------------------------------------------
   POST /api/vendors/:id/products
   Adds a product to a vendor.
--------------------------------------------------------- */
export async function addProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, price, unit, image, stock, category, description, status } =
      req.body;

    if (Number(req.user.vendor_id) !== Number(id)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to add products to this vendor",
      });
    }

    if (!name || price === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "name and price are required" });
    }

    const [vendorRows] = await pool.query(
      "SELECT id FROM vendors WHERE id = ?",
      [id],
    );
    if (vendorRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    const [result] = await pool.query(
      `INSERT INTO products (vendor_id, name, price, unit, image, stock, category, description, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        price,
        unit || "each",
        image || null,
        stock || 0,
        category || null,
        description || null,
        status || "published",
      ],
    );

    res.status(201).json({
      success: true,
      message: "Product added",
      productId: result.insertId,
    });
  } catch (err) {
    console.error("addProduct error:", err.message);
    res.status(500).json({ success: false, message: "Could not add product" });
  }
}
