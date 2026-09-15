import pool from '../config/database.js';

// NOTE: This controller was an empty file in the original project (no
// endpoints existed at all). The functions below are a best-effort,
// reasonable implementation built to match the style of the existing
// shipmentController "vendor/*" endpoints. Confirm the shape of each
// response against whatever the frontend dashboard actually expects,
// and adjust field names/queries as needed.

// @desc    Revenue, order count, and average order value for the
//          logged-in vendor, plus how that compares to the previous
//          30-day period.
// @route   GET /api/analytics/vendor/summary
export const getVendorSummary = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    const [[current]] = await pool.query(
      `SELECT
         COUNT(DISTINCT oi.order_id) AS order_count,
         COALESCE(SUM(oi.price * oi.quantity), 0) AS revenue
       FROM order_items oi
       WHERE oi.vendor_id = ?
         AND oi.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [vendorId]
    );

    const [[previous]] = await pool.query(
      `SELECT
         COUNT(DISTINCT oi.order_id) AS order_count,
         COALESCE(SUM(oi.price * oi.quantity), 0) AS revenue
       FROM order_items oi
       WHERE oi.vendor_id = ?
         AND oi.created_at >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
         AND oi.created_at <  DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [vendorId]
    );

    const [[productStats]] = await pool.query(
      `SELECT COUNT(*) AS product_count
       FROM products
       WHERE vendor_id = ? AND status = 'published'`,
      [vendorId]
    );

    const revenue = Number(current.revenue);
    const orderCount = Number(current.order_count);
    const avgOrderValue = orderCount ? revenue / orderCount : 0;

    const revenueChangePct = previous.revenue > 0
      ? Math.round(((revenue - previous.revenue) / previous.revenue) * 100)
      : null;
    const orderChangePct = previous.order_count > 0
      ? Math.round(((orderCount - previous.order_count) / previous.order_count) * 100)
      : null;

    res.json({
      period: 'last_30_days',
      revenue: Number(revenue.toFixed(2)),
      orders: orderCount,
      avg_order_value: Number(avgOrderValue.toFixed(2)),
      published_products: productStats.product_count,
      revenue_change_pct: revenueChangePct,
      order_change_pct: orderChangePct
    });
  } catch (error) {
    console.error('getVendorSummary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Revenue grouped by day for the last 30 days (for a chart).
// @route   GET /api/analytics/vendor/sales-over-time
export const getVendorSalesOverTime = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    const [rows] = await pool.query(
      `SELECT
         DATE(oi.created_at) AS date,
         COALESCE(SUM(oi.price * oi.quantity), 0) AS revenue,
         COUNT(DISTINCT oi.order_id) AS orders
       FROM order_items oi
       WHERE oi.vendor_id = ?
         AND oi.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(oi.created_at)
       ORDER BY date ASC`,
      [vendorId]
    );

    res.json(
      rows.map(r => ({
        date: r.date,
        revenue: Number(r.revenue),
        orders: r.orders
      }))
    );
  } catch (error) {
    console.error('getVendorSalesOverTime error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Best-selling products by units sold / revenue.
// @route   GET /api/analytics/vendor/top-products
export const getVendorTopProducts = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;
    const limit = parseInt(req.query.limit) || 5;

    const [rows] = await pool.query(
      `SELECT
         oi.product_id,
         oi.product_name,
         SUM(oi.quantity) AS units_sold,
         COALESCE(SUM(oi.price * oi.quantity), 0) AS revenue
       FROM order_items oi
       WHERE oi.vendor_id = ?
       GROUP BY oi.product_id, oi.product_name
       ORDER BY revenue DESC
       LIMIT ?`,
      [vendorId, limit]
    );

    res.json(
      rows.map(r => ({
        product_id: r.product_id,
        name: r.product_name,
        units_sold: r.units_sold,
        revenue: Number(r.revenue)
      }))
    );
  } catch (error) {
    console.error('getVendorTopProducts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
