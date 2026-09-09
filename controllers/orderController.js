import Order from '../models/order.js';
import Cart from '../models/cart.js';

// POST /api/orders/create
export const createOrder = async (req, res) => {
    try {
        // Gets cart items
        const cartSummary = await Cart.getCartSummary(req.user.id);
        
        // Checks if cart is empty
        if (cartSummary.items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Cart is empty'
            });
        }
        
        // Gets shipping details from request body
        const { shipping_address, city, postal_code, payment_method } = req.body;
        
        // Validates required fields
        if (!shipping_address || !city || !postal_code) {
            return res.status(400).json({
                success: false,
                error: 'Shipping address, city, and postal code are required'
            });
        }
        
        // Prepares order data
        const orderData = {
            user_id: req.user.id,
            items: cartSummary.items.map(item => ({
                product_id: item.product_id,
                vendor_id: item.vendor_id,
                quantity: item.quantity,
                price: item.price,
                name: item.name
            })),
            shipping_address,
            city,
            postal_code,
            payment_method: payment_method || 'card',
            delivery_fee: cartSummary.delivery_fee || 60
        };
        
        // Creates the order
        const order = await Order.create(orderData);
        
        // Returns success response with order number
        res.status(201).json({
            success: true,
            data: {
                order_number: order.order_number,
                redirect: `/confirmation.html?order=${order.order_number}`
            }
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create order'
        });
    }
};

// GET /api/orders/number/:orderNumber - Get order by number
export const getOrderByNumber = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        
        // Finds order by order number
        const order = await Order.findByOrderNumber(orderNumber);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        
        // Checks if user owns this order
        if (order.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        
        // Gets order summary and timeline
        const summary = await Order.getOrderSummary(orderNumber);
        const timeline = await Order.getOrderTimeline(orderNumber);
        
        // Builds items with vendor info
        const items = order.items.map(item => ({
            name: item.product_name,
            vendor: item.vendor_name || 'Unknown Vendor',
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
        }));
        
        // Groups items by vendor
        const vendors = {};
        items.forEach(item => {
            if (!vendors[item.vendor]) {
                vendors[item.vendor] = {
                    name: item.vendor,
                    items: [],
                    total: 0
                };
            }
            vendors[item.vendor].items.push(item);
            vendors[item.vendor].total += item.total;
        });
        
        // Prepares confirmation data
        const confirmationData = {
            orderNumber: order.order_number,
            orderId: order.id,
            placedDate: order.created_at,
            status: order.status,
            total: order.total_amount,
            subtotal: order.subtotal_amount,
            deliveryFee: order.delivery_fee,
            itemCount: summary.item_count,
            vendorCount: summary.vendor_count,
            estimatedDelivery: summary.estimated_delivery,
            shippingAddress: {
                address: order.shipping_address,
                city: order.city,
                postalCode: order.postal_code
            },
            paymentMethod: order.payment_method,
            items: items,
            vendors: Object.values(vendors),
            timeline: timeline,
            trackingUrl: `/track-order.html?order=${order.order_number}`
        };
        
        res.json({
            success: true,
            data: confirmationData
        });
    } catch (error) {
        console.error('Get order by number error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order'
        });
    }
};

// GET /api/orders/my
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findByUser(req.user.id);
        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Get my orders error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders'
        });
    }
};

// GET /api/orders/:id - Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        
        // Validates order ID
        if (isNaN(orderId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order ID'
            });
        }
        
        // Finds order by ID
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        
        // Checks if user owns this order
        if (order.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        
        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order'
        });
    }
};

// PATCH /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { status } = req.body;
        
        // Validates order ID
        if (isNaN(orderId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order ID'
            });
        }
        
        // Validates status
        if (!status) {
            return res.status(400).json({
                success: false,
                error: 'Status is required'
            });
        }
        
        const validStatuses = ['pending', 'confirmed', 'packing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }
        
        // Finds order
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        
        // Checks if user owns this order (only for cancellation)
        if (status === 'cancelled' && order.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized to cancel this order'
            });
        }
        
        // Updates order status
        const updated = await Order.updateStatus(orderId, status);
        
        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update order status'
        });
    }
};

// GET /api/orders/track/:orderNumber - Get tracking info
export const getOrderTracking = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        
        // Finds order
        const order = await Order.findByOrderNumber(orderNumber);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        
        // Checks if user owns this order
        if (order.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        
        // Gets timeline and summary
        const timeline = await Order.getOrderTimeline(orderNumber);
        const summary = await Order.getOrderSummary(orderNumber);
        
        res.json({
            success: true,
            data: {
                orderNumber: order.order_number,
                status: order.status,
                timeline: timeline,
                summary: summary,
                items: order.items.map(item => ({
                    name: item.product_name,
                    vendor: item.vendor_name,
                    quantity: item.quantity,
                    price: item.price
                }))
            }
        });
    } catch (error) {
        console.error('Get order tracking error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get tracking info'
        });
    }
};