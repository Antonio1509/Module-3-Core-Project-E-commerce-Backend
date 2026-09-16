import Product from '../models/product.js';
import pool from '../config/database.js';
import { validateProduct, validateProductUpdate } from '../validations/productValidation.js';


export async function getAllProducts(req, res) {
    try {
        const { category, search, limit } = req.query;
        const products = await Product.findAll({ category, search, limit });


        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}


export async function getProductById(req, res) {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);


        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }


        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export async function getProductReviews(req, res) {
    const [rows] = await pool.query(
        `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
         FROM reviews r JOIN users u ON u.id = r.user_id
         WHERE r.product_id = ? ORDER BY r.created_at DESC`,
        [req.params.id]
    );
    res.json({ success: true, data: rows });
}

export async function createProductReview(req, res) {
    const productId = Number(req.params.id);
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || '').trim();
    if (!Number.isInteger(productId) || !Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) {
        return res.status(400).json({ message: 'Product, rating from 1 to 5, and comment are required' });
    }
    await pool.query(
        `INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
        [productId, req.user.id, rating, comment]
    );
    res.status(201).json({ success: true, message: 'Review saved' });
}


export async function getVendorProducts(req, res) {
    try {
        const vendorId = req.params.vendorId || req.user.vendor_id;
        const products = await Product.findByVendor(vendorId);


        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Error fetching vendor products:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}


export async function createProduct(req, res) {
    try {
        const vendorId = req.body.vendor_id || req.user.vendor_id;

        if (!vendorId) {
            return res.status(403).json({
                success: false,
                message: 'A vendor profile is required to create products'
            });
        }


        const productData = {
            vendor_id: vendorId,
            name: req.body.name,
            price: parseFloat(req.body.price),
            category: req.body.category,
            description: req.body.description || '',
            stock: parseInt(req.body.stock) || 0,
            image: req.file ? `/uploads/products/${req.file.filename}` : null,
            status: req.body.status || 'published'
        };


        const validation = validateProduct(productData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }


        const productId = await Product.create(productData);
        const product = await Product.findById(productId);


        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}


export async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);


        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }


        if (product.vendor_id !== req.user.vendor_id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to update this product'
            });
        }


        const productData = {
            name: req.body.name,
            price: req.body.price ? parseFloat(req.body.price) : undefined,
            category: req.body.category,
            description: req.body.description,
            stock: req.body.stock ? parseInt(req.body.stock) : undefined,
            status: req.body.status
        };


        if (req.file) {
            productData.image = `/uploads/products/${req.file.filename}`;
        }


        const validation = validateProductUpdate(productData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }


        const updated = await Product.update(id, productData);
        if (!updated) {
            return res.status(400).json({
                success: false,
                message: 'Failed to update product'
            });
        }


        const updatedProduct = await Product.findById(id);


        res.json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}


export async function deleteProduct(req, res) {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);


        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }


        if (product.vendor_id !== req.user.vendor_id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete this product'
            });
        }


        const deleted = await Product.delete(id);
        if (!deleted) {
            return res.status(400).json({
                success: false,
                message: 'Failed to delete product'
            });
        }


        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}
