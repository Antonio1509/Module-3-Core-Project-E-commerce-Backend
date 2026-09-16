import { randomBytes } from "crypto";
import pool from "../config/database.js";
import PickupPoint from "../models/PickupPoint.js";

// @desc    Get vendor shipment stats
// @route   GET /api/shipments/vendor/stats
export const getVendorStats = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id; // attach vendor_id from auth middleware

    const [rows] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'collected' THEN 1 ELSE 0 END) AS collected,
        SUM(CASE WHEN status IN ('processing', 'in_transit', 'at_rank') THEN 1 ELSE 0 END) AS awaiting,
        SUM(CASE WHEN status = 'delivered' AND delivery_type = 'return' THEN 1 ELSE 0 END) AS returns
       FROM shipments
       WHERE vendor_id = ?`,
      [vendorId],
    );

    const stats = rows[0] || {
      total: 0,
      collected: 0,
      awaiting: 0,
      returns: 0,
    };
    res.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get shipment overview (chart data)
// @route   GET /api/shipments/vendor/overview
export const getVendorOverview = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    // Last 30 days – group by day
    const [rows] = await pool.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM shipments
       WHERE vendor_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [vendorId],
    );

    const split = { rankdrop: 63, home: 37 }; // placeholder

    res.json({
      chart: rows,
      split,
    });
  } catch (error) {
    console.error("Overview error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get top pickup points
// @route   GET /api/shipments/vendor/top-pickups
export const getTopPickupPoints = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    const [rows] = await pool.query(
      `SELECT pickup_point, COUNT(*) AS count
       FROM shipments
       WHERE vendor_id = ?
       GROUP BY pickup_point
       ORDER BY count DESC
       LIMIT 5`,
      [vendorId],
    );

    // Calculate percentages
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    const points = rows.map((r) => ({
      name: r.pickup_point,
      count: r.count,
      percentage: total ? Math.round((r.count / total) * 100) : 0,
    }));

    res.json(points);
  } catch (error) {
    console.error("Top pickups error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get recent activity
// @route   GET /api/shipments/vendor/recent
export const getRecentActivity = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    const [rows] = await pool.query(
      `SELECT
        shipment_id AS parcelId,
        CONCAT('#', order_id) AS ' order ',
        pickup_point AS pickupPoint,
        status,
        DATE_FORMAT(created_at, '%d %b, %H:%i') AS time
       FROM shipments
       WHERE vendor_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [vendorId],
    );

    res.json(rows);
  } catch (error) {
    console.error("Recent activity error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get available pickup points
// @route   GET /api/shipments/pickup-points
export const getPickupPoints = async (req, res) => {
  try {
    const points = await PickupPoint.findAll();

    const shaped = points.map((p) => ({
      id: p.id,
      name: p.name,
      place: p.address,
      address: p.address,
      city: p.city,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      hours: p.opening_hours,
      eta: p.eta,
      color: p.color,
      recommended: Boolean(p.is_recommended),
    }));

    res.json(shaped);
  } catch (error) {
    console.error("getPickupPoints error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// @desc    Get nearest pickup points to a coordinate
// @route   GET /api/shipments/pickup-points/nearby?lat=..&lng=..&limit=5
export const getNearbyPickupPoints = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const limit = parseInt(req.query.limit) || 5;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    const points = await PickupPoint.findNearest(lat, lng, limit);

    const shaped = points.map((p) => ({
      id: p.id,
      name: p.name,
      place: p.address,
      address: p.address,
      city: p.city,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      hours: p.opening_hours,
      eta: p.eta,
      color: p.color,
      recommended: Boolean(p.is_recommended),
      distance_km: Number(p.distance_km).toFixed(1),
      distance: `${Number(p.distance_km).toFixed(1)} km away`,
    }));

    res.json(shaped);
  } catch (error) {
    console.error("getNearbyPickupPoints error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get unshipped orders for the logged-in vendor
// @route   GET /api/shipments/unshipped
export const getUnshippedOrders = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    const [rows] = await pool.query(
      `SELECT
         o.id                  AS orderId,
         o.order_number        AS number,
         u.name                AS customer,
         u.email               AS email,
         CASE
           WHEN o.delivery_fee >= 60 THEN 'home_delivery'
           ELSE 'rankdrop'
         END                   AS method,
         o.shipping_address    AS destination,
         o.city,
         o.total_amount        AS total,
         DATE_FORMAT(o.created_at, '%d %b %Y') AS date
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN users u       ON u.id = o.user_id
       LEFT JOIN shipments s ON s.order_id = o.id AND s.vendor_id = ?
       WHERE oi.vendor_id = ?
         AND s.id IS NULL
         AND o.status IN ('pending', 'confirmed', 'packing')
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [vendorId, vendorId],
    );

    // Attach items per order
    const orderIds = rows.map((r) => r.orderId);
    const itemsByOrder = {};

    if (orderIds.length > 0) {
      const [items] = await pool.query(
        `SELECT order_id, product_name, quantity, price
         FROM order_items
         WHERE order_id IN (?) AND vendor_id = ?`,
        [orderIds, vendorId],
      );

      for (const it of items) {
        if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
        itemsByOrder[it.order_id].push({
          name: it.product_name,
          qty: it.quantity,
          price: `R${Number(it.price).toFixed(2)}`,
        });
      }
    }

    const orders = rows.map((r) => ({
      orderId: r.orderId,
      number: r.number,
      customer: r.customer,
      email: r.email,
      method: r.method === "home_delivery" ? "Home Delivery" : "RankDrop",
      destination: r.destination,
      date: r.date,
      total: `R${Number(r.total).toFixed(2)}`,
      items: (itemsByOrder[r.orderId] || []).map((i) => [
        i.name,
        i.qty,
        i.price,
      ]),
    }));

    res.json(orders);
  } catch (error) {
    console.error("getUnshippedOrders error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a shipment for an order
// @route   POST /api/shipments
export const createShipment = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;
    const { orderId, method, pickupPoint } = req.body;

    if (!orderId || !method) {
      return res
        .status(400)
        .json({ message: "orderId and method are required" });
    }
    if (!["rankdrop", "self_delivery"].includes(method)) {
      return res.status(400).json({ message: "Invalid method" });
    }
    // RankDrop uses the customer's saved delivery location automatically.

    // Verify order belongs to vendor and isn't already shipped
    const [orderRows] = await pool.query(
      `SELECT o.id, o.order_number, u.name AS customer, o.shipping_address, o.city
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN users u        ON u.id = o.user_id
       LEFT JOIN shipments s ON s.order_id = o.id AND s.vendor_id = ?
       WHERE o.id = ? AND oi.vendor_id = ? AND s.id IS NULL
       LIMIT 1`,
      [vendorId, orderId, vendorId],
    );

    if (orderRows.length === 0) {
      return res.status(404).json({
        message: "Order not found, not yours, or already shipped",
      });
    }

    const order = orderRows[0];

    // Build shipment identifiers
    const shipmentId = `RD-${order.order_number.replace("LC-", "")}-V${vendorId}`;
    const collectionCode =
      method === "rankdrop"
        ? randomBytes(2).toString("hex").toUpperCase().slice(0, 4)
        : null;

    const finalPickupPoint =
      method === "rankdrop"
        ? [order.shipping_address, order.city].filter(Boolean).join(", ")
        : "Vendor self-delivery";
    const [result] = await pool.query(
      `INSERT INTO shipments
         (shipment_id, order_id, vendor_id, pickup_point, collection_code, status,
          delivery_method, customer_name, destination)
       VALUES (?, ?, ?, ?, ?, 'processing', ?, ?, ?)`,
      [
        shipmentId,
        orderId,
        vendorId,
        finalPickupPoint,
        collectionCode,
        method,
        order.customer,
        order.shipping_address,
      ],
    );

    // Move the order forward
    await pool.query(`UPDATE orders SET status = 'confirmed' WHERE id = ?`, [
      orderId,
    ]);

    res.status(201).json({
      id: result.insertId,
      shipmentId,
      orderNumber: order.order_number,
      method,
      pickupPoint: finalPickupPoint,
      collectionCode,
      status: "processing",
    });
  } catch (error) {
    console.error("createShipment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
