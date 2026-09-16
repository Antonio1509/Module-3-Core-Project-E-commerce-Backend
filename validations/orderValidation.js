// ============================================================
// CONSTANTS
// ============================================================

const VALID_ORDER_STATUSES = [
    'pending',
    'confirmed',
    'packing',
    'shipped',
    'delivered',
    'cancelled'
];

const VALID_PAYMENT_METHODS = [
    'card',
    'payfast',
    'eft',
    'cash',
    'mobile'
];

// Status flow — an order can only move forward (or cancel from early states)
const STATUS_FLOW = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['packing', 'cancelled'],
    packing: ['shipped'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: []
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Checks if a value is a non-empty string after trimming.
 * @param {*} value - Value to check
 * @returns {boolean}
 */
function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Checks if a value is a positive number.
 * @param {*} value - Value to check
 * @returns {boolean}
 */
function isPositiveNumber(value) {
    return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Validates a South African postal code.
 * SA postal codes are exactly 4 digits.
 * @param {string} code - Postal code to validate
 * @returns {boolean}
 */
export function isValidSouthAfricanPostalCode(code) {
    if (!isNonEmptyString(code)) return false;
    return /^\d{4}$/.test(code.trim());
}

/**
 * Validates an email address (basic check).
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
    if (!isNonEmptyString(email)) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// SHIPPING ADDRESS VALIDATION

/**
 * Validates shipping address fields on an order.
 * @param {Object} orderData - Order data containing shipping fields
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateShipping(orderData) {
    const errors = [];

    // Street address
    if (!isNonEmptyString(orderData.shipping_address)) {
        errors.push('Shipping address is required');
    } else if (orderData.shipping_address.trim().length < 5) {
        errors.push('Shipping address must be at least 5 characters');
    } else if (orderData.shipping_address.trim().length > 500) {
        errors.push('Shipping address is too long (max 500 characters)');
    }

    // City
    if (!isNonEmptyString(orderData.city)) {
        errors.push('City is required');
    } else if (orderData.city.trim().length < 2) {
        errors.push('City must be at least 2 characters');
    } else if (orderData.city.trim().length > 100) {
        errors.push('City is too long (max 100 characters)');
    }

    // Postal code
    if (!isNonEmptyString(orderData.postal_code)) {
        errors.push('Postal code is required');
    } else if (!isValidSouthAfricanPostalCode(orderData.postal_code)) {
        errors.push('Postal code must be 4 digits (South African format)');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// ============================================================
// ORDER ITEMS VALIDATION
// ============================================================

/**
 * Validates the items array in an order.
 * @param {Array} items - Array of order items
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateOrderItems(items) {
    const errors = [];

    if (!Array.isArray(items) || items.length === 0) {
        errors.push('Order must contain at least one item');
        return { isValid: false, errors };
    }

    items.forEach((item, index) => {
        const position = index + 1;

        if (!item || typeof item !== 'object') {
            errors.push(`Item ${position}: Invalid item data`);
            return;
        }

        if (!isPositiveNumber(item.product_id)) {
            errors.push(`Item ${position}: Product ID is required`);
        }

        if (!isPositiveNumber(item.quantity)) {
            errors.push(`Item ${position}: Quantity must be a positive number`);
        } else if (item.quantity > 1000) {
            errors.push(`Item ${position}: Quantity seems too high (max 1000 per item)`);
        }

        if (!isPositiveNumber(item.price)) {
            errors.push(`Item ${position}: Price must be a positive number`);
        }

        if (!isNonEmptyString(item.name)) {
            errors.push(`Item ${position}: Product name is required`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

// ORDER VALIDATION

/**
 *
 * @param {Object} orderData - Complete order data
 * @param {number} orderData.user_id - User ID placing the order
 * @param {Array}  orderData.items - Array of items
 * @param {string} orderData.shipping_address - Street address
 * @param {string} orderData.city - City
 * @param {string} orderData.postal_code - Postal code
 * @param {string} [orderData.payment_method] - Payment method
 * @param {number} [orderData.delivery_fee] - Delivery fee
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateOrder(orderData) {
    const errors = [];

    // user_id
    if (!isPositiveNumber(orderData.user_id)) {
        errors.push('User ID is required');
    }

    // items
    const itemsCheck = validateOrderItems(orderData.items);
    if (!itemsCheck.isValid) {
        errors.push(...itemsCheck.errors);
    }

    // shipping
    const shippingCheck = validateShipping(orderData);
    if (!shippingCheck.isValid) {
        errors.push(...shippingCheck.errors);
    }

    // payment method
    if (orderData.payment_method !== undefined) {
        if (!VALID_PAYMENT_METHODS.includes(orderData.payment_method)) {
            errors.push(
                `Invalid payment method. Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`
            );
        }
    }

    // delivery fee
    if (orderData.delivery_fee !== undefined) {
        if (typeof orderData.delivery_fee !== 'number' || orderData.delivery_fee < 0) {
            errors.push('Delivery fee must be a non-negative number');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// PARTIAL ORDER UPDATE VALIDATION
/**
 * @param {Object} updates - Fields to update
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateOrderUpdate(updates) {
    const errors = [];

    // shipping fields
    if (updates.shipping_address !== undefined) {
        if (!isNonEmptyString(updates.shipping_address)) {
            errors.push('Shipping address cannot be empty');
        } else if (updates.shipping_address.trim().length < 5) {
            errors.push('Shipping address must be at least 5 characters');
        }
    }

    if (updates.city !== undefined) {
        if (!isNonEmptyString(updates.city)) {
            errors.push('City cannot be empty');
        } else if (updates.city.trim().length < 2) {
            errors.push('City must be at least 2 characters');
        }
    }

    if (updates.postal_code !== undefined) {
        if (!isValidSouthAfricanPostalCode(updates.postal_code)) {
            errors.push('Postal code must be 4 digits (South African format)');
        }
    }

    // payment method
    if (updates.payment_method !== undefined) {
        if (!VALID_PAYMENT_METHODS.includes(updates.payment_method)) {
            errors.push(
                `Invalid payment method. Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`
            );
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// STATUS UPDATE VALIDATION

/**
 * @param {string} newStatus - New status to set
 * @param {string} [currentStatus] - Current status (for transition check)
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateStatusUpdate(newStatus, currentStatus = null) {
    const errors = [];

    // Status must be valid
    if (!isNonEmptyString(newStatus)) {
        errors.push('Status is required');
        return { isValid: false, errors };
    }

    if (!VALID_ORDER_STATUSES.includes(newStatus)) {
        errors.push(
            `Invalid status. Must be one of: ${VALID_ORDER_STATUSES.join(', ')}`
        );
        return { isValid: false, errors };
    }

    // If current status provided, check transition is allowed
    if (currentStatus && VALID_ORDER_STATUSES.includes(currentStatus)) {
        const allowedNext = STATUS_FLOW[currentStatus] || [];

        if (!allowedNext.includes(newStatus) && newStatus !== currentStatus) {
            errors.push(
                `Cannot change status from "${currentStatus}" to "${newStatus}". ` +
                `Allowed: ${allowedNext.length > 0 ? allowedNext.join(', ') : 'none'}`
            );
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function validateOrderMiddleware(req, res, next) {
    // Build a partial order object for validation
    const orderData = {
        user_id: req.user?.id,
        items: req.body.items,
        shipping_address: req.body.shipping_address,
        city: req.body.city,
        postal_code: req.body.postal_code,
        payment_method: req.body.payment_method,
        delivery_fee: req.body.delivery_fee
    };

    const result = validateOrder(orderData);

    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: 'Order validation failed',
            errors: result.errors
        });
    }

    next();
}

// DEFAULT EXPORT — all validators in one object

export default {
    validateOrder,
    validateOrderUpdate,
    validateStatusUpdate,
    validateShipping,
    validateOrderItems,
    validateOrderMiddleware,
    isValidSouthAfricanPostalCode,
    VALID_ORDER_STATUSES,
    VALID_PAYMENT_METHODS,
    STATUS_FLOW
};