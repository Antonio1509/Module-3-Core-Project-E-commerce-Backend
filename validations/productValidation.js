export function validateProduct(productData) {
    const errors = [];

    if (!productData.name || productData.name.trim().length < 2) {
        errors.push('Product name is required and must be at least 2 characters');
    }

    if (!productData.price || isNaN(parseFloat(productData.price)) || parseFloat(productData.price) <= 0) {
        errors.push('Valid product price is required');
    }

    if (!productData.category) {
        errors.push('Product category is required');
    }

    if (productData.stock !== undefined && (isNaN(parseInt(productData.stock)) || parseInt(productData.stock) < 0)) {
        errors.push('Stock quantity must be a valid number');
    }

    if (productData.description && productData.description.length > 500) {
        errors.push('Description cannot exceed 500 characters');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function validateProductUpdate(productData) {
    const errors = [];

    if (productData.name !== undefined && productData.name.trim().length < 2) {
        errors.push('Product name must be at least 2 characters');
    }

    if (productData.price !== undefined && (isNaN(parseFloat(productData.price)) || parseFloat(productData.price) <= 0)) {
        errors.push('Price must be a valid positive number');
    }

    if (productData.stock !== undefined && (isNaN(parseInt(productData.stock)) || parseInt(productData.stock) < 0)) {
        errors.push('Stock must be a valid non-negative number');
    }

    if (productData.status && !['published', 'draft', 'archived'].includes(productData.status)) {
        errors.push('Invalid status value');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}