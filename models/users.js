import pool from "../config/database.js";
import bcrypt from "bcryptjs";

// ============================================================
// CLASS WITH STATIC METHODS (primary API)
// ============================================================
class User {
  /**
   * Find a user by their ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, location, bio,
                    avatar_initials, is_vendor, joined, created_at
             FROM users WHERE id = ?`,
      [id],
    );
    return rows[0] || null;
  }

  /**
   * Find a user by their email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object (includes password_hash) or null
   */
  static async findByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0] || null;
  }

  /**
   * Alias for findByEmail — kept for teammate compatibility
   * (some code uses findByEmailWithPassword)
   */
  static async findByEmailWithPassword(email) {
    return this.findByEmail(email);
  }

  /**
   * Create a new user (hashes the password automatically)
   * @param {Object} userData - User data
   * @param {string} userData.name - Full name
   * @param {string} userData.email - Email address
   * @param {string} userData.password - PLAIN password (will be hashed)
   * @param {string} [userData.phone] - Phone number
   * @param {string} [userData.location] - Location
   * @param {string} [userData.bio] - Bio
   * @param {boolean} [userData.is_vendor] - Vendor flag
   * @returns {Promise<Object>} The newly created user
   */
  static async create(userData) {
    const {
      name,
      email,
      password,
      password_hash,
      phone,
      location,
      bio,
      is_vendor = false,
    } = userData;

    // Hash password if plain password was provided
    const hash =
      password_hash || (password ? await bcrypt.hash(password, 10) : null);

    if (!hash) {
      throw new Error("Password is required to create a user");
    }

    // Generate avatar initials from name
    const avatar_initials = name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 10);

    const [result] = await pool.query(
      `INSERT INTO users
                (name, email, password_hash, phone, location, bio, avatar_initials, is_vendor)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        hash,
        phone || null,
        location || null,
        bio || null,
        avatar_initials,
        Boolean(is_vendor),
      ],
    );

    // Return the newly created user (without password_hash)
    return this.findById(result.insertId);
  }

  /**
   * Update a user's profile
   * @param {number} id - User ID
   * @param {Object} userData - Fields to update
   * @returns {Promise<boolean>} True if updated
   */
  static async update(id, userData) {
    const { name, email, phone, location, bio, avatar_initials } = userData;
    const [result] = await pool.query(
      `UPDATE users
             SET name = ?, email = ?, phone = ?, location = ?, bio = ?, avatar_initials = ?
             WHERE id = ?`,
      [name, email, phone, location, bio, avatar_initials, id],
    );
    return result.affectedRows > 0;
  }

  /**
   * Update a user's password
   * @param {number} id - User ID
   * @param {string} password_hash - Hashed password
   * @returns {Promise<boolean>} True if updated
   */
  static async updatePassword(id, password_hash) {
    const [result] = await pool.query(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [password_hash, id],
    );
    return result.affectedRows > 0;
  }

  /**
   * Compare a plain password against a stored hash
   * @param {string} password - Plain password
   * @param {string} passwordHash - Stored bcrypt hash
   * @returns {Promise<boolean>} True if match
   */
  static async comparePassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
  }
}

// ============================================================
// NAMED EXPORTS
// ============================================================
const findByEmail = (email) => User.findByEmail(email);
const findByEmailWithPassword = (email) => User.findByEmail(email);
const findById = (id) => User.findById(id);
const create = (userData) => User.create(userData);
const update = (id, userData) => User.update(id, userData);
const updatePassword = (id, hash) => User.updatePassword(id, hash);
const comparePassword = (password, hash) =>
  User.comparePassword(password, hash);

// ============================================================
// EXPORTS — both styles supported
// ============================================================
export default User;
export {
  User,
  findByEmail,
  findByEmailWithPassword,
  findById,
  create,
  update,
  updatePassword,
  comparePassword,
};
