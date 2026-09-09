import pool from '../config/database.js';

class User {
    static async findById(id) {
        const [rows] = await pool.query(
            'SELECT id, name, email, phone, location, bio, avatar_initials, is_vendor, joined, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async findByEmail(email) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0] || null;
    }

    static async create(userData) {
        const { name, email, password_hash, phone, location, avatar_initials } = userData;
        const [result] = await pool.query(
            `INSERT INTO users (name, email, password_hash, phone, location, avatar_initials) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, password_hash, phone, location, avatar_initials]
        );
        return result.insertId;
    }

    static async update(id, userData) {
        const { name, phone, location, bio, avatar_initials } = userData;
        const [result] = await pool.query(
            `UPDATE users 
             SET name = ?, phone = ?, location = ?, bio = ?, avatar_initials = ? 
             WHERE id = ?`,
            [name, phone, location, bio, avatar_initials, id]
        );
        return result.affectedRows > 0;
    }

    static async updatePassword(id, password_hash) {
        const [result] = await pool.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [password_hash, id]
        );
        return result.affectedRows > 0;
    }

    // NEW: Get user by email with password (for login)
    static async findByEmailWithPassword(email) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0] || null;
    }
}

export default User;