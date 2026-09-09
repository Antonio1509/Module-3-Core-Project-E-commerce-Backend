import Cart from '../models/cart.js';

// GET /api/cart - Get cart items
export const getCart = async (req, res) => {
    try {
        const summary = await Cart.getCartSummary(req.user.id);
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cart'
        });
    }
};

// POST /api/cart/add - Add item to cart
export const addToCart = async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;
        
        if (!product_id) {
            return res.status(400).json({
                success: false,
                error: 'Product ID is required'
            });
        }
        
        const items = await Cart.addItem(req.user.id, product_id, quantity);
        const totals = await Cart.getTotal(req.user.id);
        
        res.json({
            success: true,
            data: { items, totals }
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to add to cart'
        });
    }
};

// PUT /api/cart/update - Update cart item quantity
export const updateCartItem = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        
        if (!product_id || quantity === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Product ID and quantity are required'
            });
        }
        
        const items = await Cart.updateQuantity(req.user.id, product_id, quantity);
        const totals = await Cart.getTotal(req.user.id);
        
        res.json({
            success: true,
            data: { items, totals }
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to update cart'
        });
    }
};

// DELETE /api/cart/remove/:product_id - Remove item from cart
export const removeFromCart = async (req, res) => {
    try {
        const productId = parseInt(req.params.product_id);
        
        if (isNaN(productId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID'
            });
        }
        
        const items = await Cart.removeItem(req.user.id, productId);
        const totals = await Cart.getTotal(req.user.id);
        
        res.json({
            success: true,
            data: { items, totals }
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove from cart'
        });
    }
};

// DELETE /api/cart/clear - Clear entire cart
export const clearCart = async (req, res) => {
    try {
        // Clear the cart
        await Cart.clearCart(req.user.id);
        
        // Get fresh totals after clearing
        const totals = await Cart.getTotal(req.user.id);

        res.json({
            success: true,
            data: {
                items: [],
                totals: {
                    subtotal: totals.subtotal || 0,
                    vendor_count: totals.vendor_count || 0,
                    total_items: totals.total_items || 0
                }
            }
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear cart'
        });
    }
};

// GET /api/cart/summary - Get cart summary
export const getCartSummary = async (req, res) => {
    try {
        const summary = await Cart.getCartSummary(req.user.id);
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get cart summary error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get cart summary'
        });
    }
};