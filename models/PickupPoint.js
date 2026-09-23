import pool from '../config/database.js';

class PickupPoint {
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT id, name, address, city,
              latitude, longitude, opening_hours,
              eta, color, is_recommended
       FROM pickup_points
       WHERE is_active = 1
       ORDER BY is_recommended DESC, name ASC`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, name, address, city,
              latitude, longitude, opening_hours,
              eta, color, is_recommended
       FROM pickup_points
       WHERE id = ? AND is_active = 1`,
      [id]
    );
    return rows[0] || null;
  }

  // Haversine distance in km
  static async findNearest(lat, lng, limit = 5) {
    const [rows] = await pool.query(
      `SELECT id, name, address, city,
              latitude, longitude, opening_hours,
              eta, color, is_recommended,
              (6371 * ACOS(
                 COS(RADIANS(?)) * COS(RADIANS(latitude)) *
                 COS(RADIANS(longitude) - RADIANS(?)) +
                 SIN(RADIANS(?)) * SIN(RADIANS(latitude))
              )) AS distance_km
       FROM pickup_points
       WHERE is_active = 1
       ORDER BY distance_km ASC
       LIMIT ?`,
      [lat, lng, lat, limit]
    );
    return rows;
  }
}

export default PickupPoint;