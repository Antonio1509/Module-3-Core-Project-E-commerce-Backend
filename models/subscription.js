import pool from "../config/database.js";

class Subscription {
  // All active plans, ordered for display
  static async getAllPlans() {
    const [rows] = await pool.query(
      `SELECT id, slug, name, tagline, price, billing_period,
              description, features, rankdrop_rate_note, is_popular, display_order
       FROM subscription_plans
       WHERE is_active = 1
       ORDER BY display_order ASC`,
    );
    return rows.map((row) => ({
      ...row,
      features:
        typeof row.features === "string"
          ? JSON.parse(row.features || "[]")
          : row.features || [],
    }));
  }

  static async getPlanBySlug(slug) {
    const [rows] = await pool.query(
      "SELECT * FROM subscription_plans WHERE slug = ? AND is_active = 1",
      [slug],
    );
    return rows[0] || null;
  }

  static async getPlanById(id) {
    const [rows] = await pool.query(
      "SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1",
      [id],
    );
    return rows[0] || null;
  }

  // The vendor's current active subscription (with plan details joined)
  static async getActiveForVendor(vendorId) {
    const [rows] = await pool.query(
      `SELECT vs.id, vs.status, vs.started_at, vs.expires_at,
              p.id AS plan_id, p.slug, p.name, p.price, p.rankdrop_rate_note
       FROM vendor_subscriptions vs
       JOIN subscription_plans p ON p.id = vs.plan_id
       WHERE vs.vendor_id = ? AND vs.status = 'active'
       ORDER BY vs.started_at DESC
       LIMIT 1`,
      [vendorId],
    );
    return rows[0] || null;
  }

  // Cancel any existing active subscription, then insert a new one
  static async subscribe(vendorId, planId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Expire anything currently active
      await conn.query(
        `UPDATE vendor_subscriptions
         SET status = 'cancelled', cancelled_at = NOW()
         WHERE vendor_id = ? AND status = 'active'`,
        [vendorId],
      );

      // Insert the new subscription
      const [result] = await conn.query(
        `INSERT INTO vendor_subscriptions (vendor_id, plan_id, status, expires_at)
         VALUES (?, ?, 'active', DATE_ADD(NOW(), INTERVAL 1 MONTH))`,
        [vendorId, planId],
      );

      await conn.commit();
      return result.insertId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async cancel(vendorId) {
    const [result] = await pool.query(
      `UPDATE vendor_subscriptions
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE vendor_id = ? AND status = 'active'`,
      [vendorId],
    );
    return result.affectedRows;
  }
}

export default Subscription;
