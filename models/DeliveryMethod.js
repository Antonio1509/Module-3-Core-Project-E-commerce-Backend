import pool from '../config/database.js';

class DeliveryMethod {
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT id, code, name, tagline, description, price, price_note,
              time_estimate, features, is_popular, display_order
       FROM delivery_methods
       WHERE is_active = 1
       ORDER BY display_order ASC`
    );

    // MySQL2 returns JSON columns as strings unless auto-parsed;
    // parse them so the API returns real arrays.
    return rows.map(r => ({
      ...r,
      price: Number(r.price),
      features: typeof r.features === 'string'
        ? JSON.parse(r.features || '[]')
        : (r.features || []),
      is_popular: Boolean(r.is_popular),
    }));
  }

  static async findByCode(code) {
    const [rows] = await pool.query(
      `SELECT id, code, name, tagline, description, price, price_note,
              time_estimate, features, is_popular, display_order
       FROM delivery_methods
       WHERE code = ? AND is_active = 1`,
      [code]
    );
    const r = rows[0];
    if (!r) return null;

    return {
      ...r,
      price: Number(r.price),
      features: typeof r.features === 'string'
        ? JSON.parse(r.features || '[]')
        : (r.features || []),
      is_popular: Boolean(r.is_popular),
    };
  }
}

export default DeliveryMethod;