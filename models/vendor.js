const pool = require("../config/database");


class Vendor {
  /**
   * Approved, active vendors for the public directory.
   * @param {{category?: string, search?: string, page?: number, limit?: number}} options
   */
  static async findAll({ category, search = "", page = 1, limit = 12 } = {}) {
    const offset = (Number(page) - 1) * Number(limit);


    let sql = `
      SELECT v.id, v.name, v.category, v.location, v.cover_image, v.logo_text,
             v.rating, v.review_count, v.description, v.joined,
             COUNT(CASE WHEN p.status = 'published' THEN 1 END) AS product_count
      FROM vendors v
      LEFT JOIN products p ON p.vendor_id = v.id
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
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, name, category, location, cover_image, logo_text, rating,
              review_count, joined, description, about, response_time,
              delivery_area, shipping_info, is_active
       FROM vendors WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }


  /** True if a vendor row with this id exists (used before nested queries). */
  static async exists(id) {
    const [rows] = await pool.query("SELECT id FROM vendors WHERE id = ?", [id]);
    return rows.length > 0;
  }


  /**
   * Looks up login credentials + storefront info for POST /login.
   * Joins users -> vendors so both the password hash and the
   * storefront name/status come back in one query.
   */
  static async findAuthByEmail(email) {
    const [rows] = await pool.query(
      `SELECT u.id AS user_id, u.password_hash, u.is_vendor,
              v.id AS vendor_id, v.name AS store_name, v.is_active
       FROM users u
       JOIN vendors v ON v.user_id = u.id
       WHERE u.email = ?`,
      [email]
    );
    return rows[0] || null;
  }


  /** Used during registration to reject duplicate emails before inserting. */
  static async emailExists(email, db = pool) {
    const [rows] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    return rows.length > 0;
  }


  /**
   * Inserts a new vendor row linked to an existing user.
   * Pass a transaction connection as `db` when this needs to
   * commit/rollback together with the matching users insert
   * (see vendorController.registerVendor).
   */
  static async create(
    { userId, name, category, location, logoText, description = "", about = "" },
    db = pool
  ) {
    const [result] = await db.query(
      `INSERT INTO vendors (user_id, name, category, location, logo_text, description, about, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [userId, name, category, location, logoText, description, about]
    );
    return result.insertId;
  }


  /**
   * Updates only the fields provided, ignoring anything not in
   * the allow-list. Returns true if a row was actually changed.
   */
  static async update(id, fields) {
    const allowedFields = [
      "name", "category", "location", "cover_image", "description",
      "about", "response_time", "delivery_area", "shipping_info"
    ];


    const updates = [];
    const values = [];


    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(fields[field]);
      }
    }


    if (updates.length === 0) return false;


    values.push(id);
    const [result] = await pool.query(`UPDATE vendors SET ${updates.join(", ")} WHERE id = ?`, values);
    return result.affectedRows > 0;
  }


  /** Flips is_active to TRUE (admin approval). */
  static async approve(id) {
    const [result] = await pool.query("UPDATE vendors SET is_active = TRUE WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }


  /**
   * Vendor's name + linked contact email/phone, for sending
   * notifications (approval emails, customer enquiries). Email
   * may be null if the vendor has no linked user account.
   */
  static async getContactInfo(id) {
    const [rows] = await pool.query(
      `SELECT v.id, v.name, u.email, u.phone
       FROM vendors v
       LEFT JOIN users u ON v.user_id = u.id
       WHERE v.id = ?`,
      [id]
    );
    return rows[0] || null;
  }


  /** Published products only — what customers see on the storefront. */
  static async getProducts(id) {
    const [rows] = await pool.query(
      `SELECT id, name, price, unit, image, stock, category, description
       FROM products WHERE vendor_id = ? AND status = 'published'
       ORDER BY created_at DESC`,
      [id]
    );
    return rows;
  }


  /** Adds a product to this vendor's storefront. */
  static async addProduct(id, { name, price, unit = "each", image = null, stock = 0, category = null, description = null, status = "published" }) {
    const [result] = await pool.query(
      `INSERT INTO products (vendor_id, name, price, unit, image, stock, category, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, price, unit, image, stock, category, description, status]
    );
    return result.insertId;
  }
}


module.exports = Vendor;
