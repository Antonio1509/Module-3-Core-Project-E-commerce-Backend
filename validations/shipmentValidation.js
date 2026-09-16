
// ============================================================
// CONSTANTS
// ============================================================

const VALID_SHIPMENT_STATUSES = [
    'processing',
    'in_transit',
    'at_rank',
    'collected',
    'delivered'
];

const VALID_DELIVERY_METHODS = [
    'rankdrop',
    'self_delivery',
    'home_delivery'
];

const VALID_PICKUP_POINT_COLORS = [
    'green',
    'orange',
    'purple',
    'blue',
    'yellow'
];

// Status flow — shipment can only move forward
const SHIPMENT_STATUS_FLOW = {
    processing: ['in_transit'],
    in_transit: ['at_rank'],
    at_rank: ['collected'],
    collected: ['delivered'],
    delivered: []
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Checks if a value is a non-empty string after trimming.
 */
function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Checks if a value is a positive number.
 */
function isPositiveNumber(value) {
    return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Checks if a value is a valid latitude (-90 to 90).
 */
function isValidLatitude(lat) {
    return typeof lat === 'number' && lat >= -90 && lat <= 90;
}

/**
 * Checks if a value is a valid longitude (-180 to 180).
 */
function isValidLongitude(lng) {
    return typeof lng === 'number' && lng >= -180 && lng <= 180;
}

// ============================================================
// COLLECTION CODE
// ============================================================

/**
 * Validates a collection code (4-10 digits/letters).
 * Used by RankDrop for pickup verification.
 * @param {string} code
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateCollectionCode(code) {
    const errors = [];

    if (!isNonEmptyString(code)) {
        errors.push('Collection code is required');
        return { isValid: false, errors };
    }

    const cleaned = code.trim();

    if (cleaned.length < 4) {
        errors.push('Collection code must be at least 4 characters');
    }

    if (cleaned.length > 10) {
        errors.push('Collection code must be at most 10 characters');
    }

    if (!/^[A-Z0-9]+$/i.test(cleaned)) {
        errors.push('Collection code must contain only letters and numbers');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// ============================================================
// TRACKING NUMBER
// ============================================================

/**
 * Validates a RankDrop tracking number (e.g., RD-2001).
 * @param {string} trackingNumber
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateTrackingNumber(trackingNumber) {
    const errors = [];

    if (!isNonEmptyString(trackingNumber)) {
        errors.push('Tracking number is required');
        return { isValid: false, errors };
    }

    const cleaned = trackingNumber.trim();

    if (cleaned.length < 5) {
        errors.push('Tracking number must be at least 5 characters');
    }

    if (cleaned.length > 50) {
        errors.push('Tracking number must be at most 50 characters');
    }

    if (!/^[A-Z0-9\-]+$/i.test(cleaned)) {
        errors.push('Tracking number can only contain letters, numbers, and hyphens');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// ============================================================
// PICKUP POINT VALIDATION
// ============================================================

/**
 * Validates a pickup point.
 * @param {Object} point
 * @param {string} point.name - Pickup point name
 * @param {string} point.address - Full address
 * @param {string} point.city - City
 * @param {number} point.latitude - Latitude
 * @param {number} point.longitude - Longitude
 * @param {string} [point.opening_hours] - Opening hours
 * @param {string} [point.color] - UI color tag
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validatePickupPoint(point) {
    const errors = [];

    // Name
    if (!isNonEmptyString(point.name)) {
        errors.push('Pickup point name is required');
    } else if (point.name.trim().length > 100) {
        errors.push('Pickup point name is too long (max 100 characters)');
    }

    // Address
    if (!isNonEmptyString(point.address)) {
        errors.push('Pickup point address is required');
    } else if (point.address.trim().length > 255) {
        errors.push('Pickup point address is too long (max 255 characters)');
    }

    // City
    if (!isNonEmptyString(point.city)) {
        errors.push('City is required');
    } else if (point.city.trim().length > 100) {
        errors.push('City is too long (max 100 characters)');
    }

    // Latitude
    if (point.latitude === undefined || point.latitude === null) {
        errors.push('Latitude is required');
    } else if (!isValidLatitude(Number(point.latitude))) {
        errors.push('Latitude must be a number between -90 and 90');
    }

    // Longitude
    if (point.longitude === undefined || point.longitude === null) {
        errors.push('Longitude is required');
    } else if (!isValidLongitude(Number(point.longitude))) {
        errors.push('Longitude must be a number between -180 and 180');
    }

    // Optional: opening hours
    if (point.opening_hours && point.opening_hours.length > 100) {
        errors.push('Opening hours string is too long (max 100 characters)');
    }

    // Optional: color
    if (point.color && !VALID_PICKUP_POINT_COLORS.includes(point.color)) {
        errors.push(`Color must be one of: ${VALID_PICKUP_POINT_COLORS.join(', ')}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// ============================================================
// DELIVERY METHOD VALIDATION
// ============================================================

/**
 * Validates a delivery method value.
 * @param {string} method
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateDeliveryMethod(method) {
    const errors = [];

    if (!isNonEmptyString(method)) {
        errors.push('Delivery method is required');
        return { isValid: false, errors };
    }

    if (!VALID_DELIVERY_METHODS.includes(method)) {
        errors.push(`Delivery method must be one of: ${VALID_DELIVERY_METHODS.join(', ')}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// ============================================================
// FULL SHIPMENT VALIDATION
// ============================================================

/**
 * Validates a new shipment before creation.
 *
 * @param {Object} shipmentData
 * @param {number} shipmentData.order_id - Order ID
 * @param {number} shipmentData.vendor_id - Vendor ID
 * @param {string} shipmentData.pickup_point - Pickup point name
 * @param {string} [shipmentData.collection_code] - Collection code
 * @param {string} [shipmentData.delivery_method] - Delivery method
 * @param {string} [shipmentData.customer_name] - Customer name
 * @param {string} [shipmentData.destination] - Destination
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateShipment(shipmentData) {
    const errors = [];

    // Required: order_id
    if (!isPositiveNumber(shipmentData.order_id)) {
        errors.push('Order ID is required');
    }

    // Required: vendor_id
    if (!isPositiveNumber(shipmentData.vendor_id)) {
        errors.push('Vendor ID is required');
    }

    // Required: pickup_point
    if (!isNonEmptyString(shipmentData.pickup_point)) {
        errors.push('Pickup point is required');
    } else if (shipmentData.pickup_point.trim().length > 255) {
        errors.push('Pickup point is too long (max 255 characters)');
    }

    // Optional: collection code
    if (shipmentData.collection_code !== undefined && shipmentData.collection_code !== null) {
        const codeCheck = validateCollectionCode(shipmentData.collection_code);
        if (!codeCheck.isValid) {
            errors.push(...codeCheck.errors);
        }
    }

    // Optional: delivery method
    if (shipmentData.delivery_method !== undefined) {
        const methodCheck = validateDeliveryMethod(shipmentData.delivery_method);
        if (!methodCheck.isValid) {
            errors.push(...methodCheck.errors);
        }
    }

    // Optional: customer_name
    if (shipmentData.customer_name && shipmentData.customer_name.length > 100) {
        errors.push('Customer name is too long (max 100 characters)');
    }

    // Optional: destination
    if (shipmentData.destination && shipmentData.destination.length > 255) {
        errors.push('Destination is too long (max 255 characters)');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// ============================================================
// PARTIAL SHIPMENT UPDATE
// ============================================================

/**
 * Validates a partial shipment update.
 * @param {Object} updates
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateShipmentUpdate(updates) {
    const errors = [];

    // Optional: pickup_point
    if (updates.pickup_point !== undefined) {
        if (!isNonEmptyString(updates.pickup_point)) {
            errors.push('Pickup point cannot be empty');
        } else if (updates.pickup_point.trim().length > 255) {
            errors.push('Pickup point is too long (max 255 characters)');
        }
    }

    // Optional: collection_code
    if (updates.collection_code !== undefined) {
        const codeCheck = validateCollectionCode(updates.collection_code);
        if (!codeCheck.isValid) {
            errors.push(...codeCheck.errors);
        }
    }

    // Optional: delivery_method
    if (updates.delivery_method !== undefined) {
        const methodCheck = validateDeliveryMethod(updates.delivery_method);
        if (!methodCheck.isValid) {
            errors.push(...methodCheck.errors);
        }
    }

    // Optional: customer_name
    if (updates.customer_name !== undefined) {
        if (!isNonEmptyString(updates.customer_name)) {
            errors.push('Customer name cannot be empty');
        } else if (updates.customer_name.length > 100) {
            errors.push('Customer name is too long (max 100 characters)');
        }
    }

    // Optional: destination
    if (updates.destination !== undefined) {
        if (!isNonEmptyString(updates.destination)) {
            errors.push('Destination cannot be empty');
        } else if (updates.destination.length > 255) {
            errors.push('Destination is too long (max 255 characters)');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// ============================================================
// SHIPMENT STATUS UPDATE
// ============================================================

/**
 * Validates a shipment status update.
 * @param {string} newStatus
 * @param {string} [currentStatus]
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateShipmentStatus(newStatus, currentStatus = null) {
    const errors = [];

    // 1. Status must be valid
    if (!isNonEmptyString(newStatus)) {
        errors.push('Shipment status is required');
        return { isValid: false, errors };
    }

    if (!VALID_SHIPMENT_STATUSES.includes(newStatus)) {
        errors.push(
            `Invalid shipment status. Must be one of: ${VALID_SHIPMENT_STATUSES.join(', ')}`
        );
        return { isValid: false, errors };
    }

    // 2. If current status provided, check transition
    if (currentStatus && VALID_SHIPMENT_STATUSES.includes(currentStatus)) {
        const allowedNext = SHIPMENT_STATUS_FLOW[currentStatus] || [];

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

// ============================================================
// EXPRESS MIDDLEWARE-STYLE VALIDATORS (OPTIONAL)
// ============================================================

export function validateShipmentMiddleware(req, res, next) {
    const result = validateShipment(req.body);

    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: 'Shipment validation failed',
            errors: result.errors
        });
    }

    next();
}

/**
 * Express middleware for validating shipment status updates.
 */
export function validateShipmentStatusMiddleware(req, res, next) {
    const { status } = req.body;
    const currentStatus = req.shipment?.status || null;

    const result = validateShipmentStatus(status, currentStatus);

    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: 'Invalid shipment status',
            errors: result.errors
        });
    }

    next();
}

// ============================================================
// DEFAULT EXPORT — all validators in one object
// ============================================================

export default {
    validateShipment,
    validateShipmentUpdate,
    validateShipmentStatus,
    validatePickupPoint,
    validateCollectionCode,
    validateTrackingNumber,
    validateDeliveryMethod,
    validateShipmentMiddleware,
    validateShipmentStatusMiddleware,
    VALID_SHIPMENT_STATUSES,
    VALID_DELIVERY_METHODS,
    VALID_PICKUP_POINT_COLORS,
    SHIPMENT_STATUS_FLOW
};