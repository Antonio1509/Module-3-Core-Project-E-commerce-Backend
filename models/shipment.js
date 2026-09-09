// models/shipment.js
import pool from '../config/database.js';

class Shipment {
    static async findByOrderId(orderId) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM shipments WHERE order_id = ?',
                [orderId]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Shipment.findByOrderId error:', error);
            return null;
        }
    }

    static async getTrackingInfo(shipmentId) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM shipments WHERE shipment_id = ?',
                [shipmentId]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Shipment.getTrackingInfo error:', error);
            return null;
        }
    }

    static async create(data) {
        // Placeholder - team will implement
        return null;
    }

    static async updateStatus(shipmentId, status) {
        // Placeholder - team will implement
        return null;
    }

    static async getPickupPoints() {
        // Placeholder - team will implement
        return [];
    }
}

export default Shipment;