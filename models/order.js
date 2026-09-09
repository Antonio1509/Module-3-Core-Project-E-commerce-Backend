import pool from '../config/database.js';

class Order {
    // Creates a new order
    static async create(orderData) {
        const { 
            user_id, 
            items, 
            shipping_address, 
            city, 
            postal_code, 
            payment_method,
            delivery_fee = 60 
        } = orderData;
        
        // Generates a unique order number
        const timestamp = Date.now().toString().slice(-5);
        const orderNumber = `LC-${timestamp}`;
        
        // Calculate the totals
        let subtotal = 0;
        for (const item of items) {
            subtotal += item.price * item.quantity;
        }
        const total = subtotal + delivery_fee;
        
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        try {
            // Creates the order
            const [orderResult] = await connection.query(
                `INSERT INTO orders (
                    order_number, 
                    user_id, 
                    total_amount, 
                    subtotal_amount,
                    delivery_fee, 
                    shipping_address, 
                    city, 
                    postal_code, 
                    payment_method,
                    status,
                    payment_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'paid')`,
                [orderNumber, user_id, total, subtotal, delivery_fee, 
                 shipping_address, city, postal_code, payment_method]
            );
            
            const orderId = orderResult.insertId;
            
            // Creates the order items
            for (const item of items) {
                await connection.query(
                    `INSERT INTO order_items (
                        order_id, 
                        product_id, 
                        vendor_id, 
                        quantity, 
                        price, 
                        product_name
                    ) VALUES (?, ?, ?, ?, ?, ?)`,
                    [orderId, item.product_id, item.vendor_id, 
                     item.quantity, item.price, item.name]
                );
                
                // Updates the stock
                await connection.query(
                    'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
                    [item.quantity, item.product_id, item.quantity]
                );
            }
            
            // Clears the cart
            await connection.query('DELETE FROM cart_items WHERE user_id = ?', [user_id]);
            
            await connection.commit();
            connection.release();
            
            return this.findByOrderNumber(orderNumber);
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    }

    // Finds the order by ID
    static async findById(id) {
        const [rows] = await pool.query(
            `SELECT 
                o.*,
                u.name as customer_name,
                u.email as customer_email,
                u.phone as customer_phone
             FROM orders o
             JOIN users u ON o.user_id = u.id
             WHERE o.id = ?`,
            [id]
        );
        
        if (rows.length === 0) return null;
        
        const order = rows[0];
        const [items] = await pool.query(
            `SELECT 
                oi.*,
                p.image,
                v.name as vendor_name,
                v.id as vendor_id
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             LEFT JOIN vendors v ON oi.vendor_id = v.id
             WHERE oi.order_id = ?`,
            [id]
        );
        
        order.items = items;
        
        // Gets the shipment info if exists
        const [shipment] = await pool.query(
            'SELECT * FROM shipments WHERE order_id = ?',
            [id]
        );
        order.shipment = shipment[0] || null;
        
        return order;
    }

    // Finds the order by order number
    static async findByOrderNumber(orderNumber) {
        const [rows] = await pool.query(
            'SELECT id FROM orders WHERE order_number = ?',
            [orderNumber]
        );
        
        if (rows.length === 0) return null;
        return this.findById(rows[0].id);
    }

    // Get all orders for a user
    static async findByUser(userId) {
        const [rows] = await pool.query(
            `SELECT 
                o.*,
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
                (SELECT GROUP_CONCAT(DISTINCT vendor_name) FROM order_items oi 
                 JOIN vendors v ON oi.vendor_id = v.id 
                 WHERE oi.order_id = o.id) as vendors
             FROM orders o
             WHERE o.user_id = ?
             ORDER BY o.created_at DESC`,
            [userId]
        );
        
        return rows;
    }

    // Updates the order status
    static async updateStatus(orderId, status) {
        await pool.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, orderId]
        );
        return this.findById(orderId);
    }

    // Gets the order summary
    static async getOrderSummary(orderNumber) {
        const order = await this.findByOrderNumber(orderNumber);
        if (!order) return null;
        
        // Counts the unique vendors
        const vendorIds = new Set(order.items.map(item => item.vendor_id));
        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        
        // Calculates the estimated delivery
        const date = new Date(order.created_at);
        date.setDate(date.getDate() + 3);
        
        return {
            order_number: order.order_number,
            total: order.total_amount,
            subtotal: order.subtotal_amount,
            delivery_fee: order.delivery_fee,
            item_count: itemCount,
            vendor_count: vendorIds.size,
            status: order.status,
            created_at: order.created_at,
            estimated_delivery: date.toISOString().split('T')[0],
            shipping_address: {
                address: order.shipping_address,
                city: order.city,
                postal_code: order.postal_code
            }
        };
    }

    // Gets the order timeline
    static async getOrderTimeline(orderNumber) {
        const order = await this.findByOrderNumber(orderNumber);
        if (!order) return [];
        
        const timeline = [];
        
        // Order placed
        timeline.push({
            status: 'placed',
            label: 'Order placed',
            timestamp: order.created_at,
            completed: true,
            icon: 'check'
        });
        
        // Payment confirmed
        timeline.push({
            status: 'confirmed',
            label: 'Payment confirmed',
            timestamp: order.created_at,
            completed: true,
            icon: 'check'
        });
        
        // Status based on order status
        const statusMap = {
            'pending': { label: 'Packing', completed: false, icon: 'package' },
            'confirmed': { label: 'Packing', completed: false, icon: 'package' },
            'packing': { label: 'Packing', completed: true, icon: 'package' },
            'shipped': { label: 'Out for delivery', completed: true, icon: 'truck' },
            'delivered': { label: 'Delivered', completed: true, icon: 'home' },
            'cancelled': { label: 'Cancelled', completed: false, icon: 'x' }
        };
        
        const currentStatus = statusMap[order.status] || statusMap['pending'];
        
        // Adds the shipment status if available
        if (order.shipment) {
            const shipmentStatusMap = {
                'processing': 'Shipment created',
                'in_transit': 'In transit to pickup point',
                'at_rank': 'At pickup point',
                'collected': 'Collected by customer',
                'delivered': 'Delivered'
            };
            
            timeline.push({
                status: order.shipment.status,
                label: shipmentStatusMap[order.shipment.status] || 'Shipment in progress',
                timestamp: order.shipment.updated_at,
                completed: ['collected', 'delivered'].includes(order.shipment.status),
                icon: 'package'
            });
        } else {
            timeline.push({
                status: order.status,
                label: currentStatus.label,
                timestamp: order.updated_at || order.created_at,
                completed: currentStatus.completed,
                icon: currentStatus.icon || 'package'
            });
        }
        
        return timeline;
    }
}

export default Order;