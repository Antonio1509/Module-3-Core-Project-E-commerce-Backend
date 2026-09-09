import pool from '../config/database.js';

class Product {
    static async findAll(filters = {}) {
        let query = `
            SELECT p.*, v.name as vendor_name, v.id as vendor_id 
            FROM products p
            JOIN vendors v ON p.vendor_id = v.id
            WHERE p.status = 'published'
        `;
        const params = [];

        if (filters.category) {
            query += ' AND p.category = ?';
            params.push(filters.category);
        }

        if (filters.search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        if (filters.vendor_id) {
            query += ' AND p.vendor_id = ?';
            params.push(filters.vendor_id);
        }

        query += ' ORDER BY p.created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.query(
            `SELECT p.*, v.name as vendor_name, v.id as vendor_id 
             FROM products p
             JOIN vendors v ON p.vendor_id = v.id
             WHERE p.id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async findByVendor(vendorId) {
        const [rows] = await pool.query(
            'SELECT * FROM products WHERE vendor_id = ? ORDER BY created_at DESC',
            [vendorId]
        );
        return rows;
    }

    static async create(productData) {
        const { vendor_id, name, price, category, description, stock, image, status } = productData;
        const [result] = await pool.query(
            `INSERT INTO products (vendor_id, name, price, category, description, stock, image, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [vendor_id, name, price, category, description, stock, image, status || 'published']
        );
        return result.insertId;
    }

    static async update(id, productData) {
        const { name, price, category, description, stock, image, status } = productData;
        const [result] = await pool.query(
            `UPDATE products 
             SET name = ?, price = ?, category = ?, description = ?, stock = ?, image = ?, status = ? 
             WHERE id = ?`,
            [name, price, category, description, stock, image, status, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async updateStock(id, quantity) {
        const [result] = await pool.query(
            'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
            [quantity, id, quantity]
        );
        return result.affectedRows > 0;
    }
}

export default Product;