import pool from '../config/database.js';

class Cart {
    // Gets all the cart items for a user
    static async getItems(userId) {
        const [rows] = await pool.query(
            `SELECT 
                ci.id as cart_item_id,
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.image,
                p.unit,
                p.stock,
                v.id as vendor_id,
                v.name as vendor_name,
                v.location as vendor_location
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             JOIN vendors v ON p.vendor_id = v.id
             WHERE ci.user_id = ?
             ORDER BY ci.added_at DESC`,
            [userId]
        );
        return rows;
    }

    // Adds the item to cart
    static async addItem(userId, productId, quantity = 1) {
        // Checks if product exists and has stock quantity
        const [product] = await pool.query(
            'SELECT stock FROM products WHERE id = ? AND status = "published"',
            [productId]
        );
        
        if (product.length === 0) {
            throw new Error('Product not found');
        }
        
        if (product[0].stock < quantity) {
            throw new Error('Insufficient stock');
        }

        // Checks if item already in cart
        const [existing] = await pool.query(
            'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );
        
        if (existing.length > 0) {
            const newQuantity = existing[0].quantity + quantity;
            if (product[0].stock < newQuantity) {
                throw new Error('Insufficient stock');
            }
            await pool.query(
                'UPDATE cart_items SET quantity = ? WHERE id = ?',
                [newQuantity, existing[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [userId, productId, quantity]
            );
        }
        
        return this.getItems(userId);
    }

    // Updates the quantity of a cart item
    static async updateQuantity(userId, productId, quantity) {
        if (quantity <= 0) {
            return this.removeItem(userId, productId);
        }
        
        const [product] = await pool.query(
            'SELECT stock FROM products WHERE id = ? AND status = "published"',
            [productId]
        );
        
        if (product.length === 0) {
            throw new Error('Product not found');
        }
        
        if (product[0].stock < quantity) {
            throw new Error('Insufficient stock');
        }
        
        await pool.query(
            'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
            [quantity, userId, productId]
        );
        
        return this.getItems(userId);
    }

    // Removes the item from cart
    static async removeItem(userId, productId) {
        await pool.query(
            'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );
        return this.getItems(userId);
    }

    // Clears the entire cart
    static async clearCart(userId) {
        await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        return [];
    }

    // Gets the cart totals
    static async getTotal(userId) {
        const [rows] = await pool.query(
            `SELECT 
                SUM(p.price * ci.quantity) as subtotal,
                COUNT(DISTINCT p.vendor_id) as vendor_count,
                SUM(ci.quantity) as total_items
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.user_id = ?`,
            [userId]
        );
        
        return {
            subtotal: parseFloat(rows[0].subtotal) || 0,
            vendor_count: parseInt(rows[0].vendor_count) || 0,
            total_items: parseInt(rows[0].total_items) || 0
        };
    }

    // Get full cart summary (for checkout)
    static async getCartSummary(userId) {
        const items = await this.getItems(userId);
        const totals = await this.getTotal(userId);
        
        // Group by vendor for delivery calculation
        const vendors = {};
        items.forEach(item => {
            if (!vendors[item.vendor_id]) {
                vendors[item.vendor_id] = {
                    vendor_id: item.vendor_id,
                    vendor_name: item.vendor_name,
                    vendor_location: item.vendor_location,
                    items: [],
                    subtotal: 0
                };
            }
            vendors[item.vendor_id].items.push(item);
            vendors[item.vendor_id].subtotal += item.price * item.quantity;
        });
        
        const deliveryFee = totals.vendor_count > 0 ? 60 : 0;
        
        return {
            items,
            vendors: Object.values(vendors),
            subtotal: totals.subtotal,
            vendor_count: totals.vendor_count,
            total_items: totals.total_items,
            delivery_fee: deliveryFee,
            total: totals.subtotal + deliveryFee
        };
    }
}

export default Cart;