CREATE DATABASE IF NOT EXISTS localcart;
USE localcart;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS vendor_subscriptions;
DROP TABLE IF EXISTS subscription_plans;
DROP TABLE IF EXISTS pickup_points;
DROP TABLE IF EXISTS delivery_methods;
DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS user_follows_vendor;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS users; 
DROP TABLE IF EXISTS categories;

SET FOREIGN_KEY_CHECKS = 1;

-- USERS TABLE
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    street VARCHAR(150),
    suburb VARCHAR(100),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    gender VARCHAR(20),
    location VARCHAR(100),
    joined DATE DEFAULT (CURRENT_DATE),
    bio TEXT,
    avatar_initials VARCHAR(10),
    is_vendor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_is_vendor (is_vendor)
) ENGINE=InnoDB;

-- VENDORS TABLE
CREATE TABLE vendors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    cover_image VARCHAR(255),
    logo_text VARCHAR(10),
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    joined DATE DEFAULT (CURRENT_DATE),
    description TEXT,
    about TEXT,
    response_time VARCHAR(100),
    delivery_area VARCHAR(255),
    shipping_info VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_is_active (is_active),
    INDEX idx_rating (rating DESC)
) ENGINE=InnoDB;

-- PRODUCTS TABLE
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50),
    image VARCHAR(255),
    stock INT DEFAULT 0,
    category VARCHAR(50),
    description TEXT,
    status ENUM('published', 'draft', 'archived') DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_price (price),
    INDEX idx_stock (stock)
) ENGINE=InnoDB;

-- PRODUCT REVIEWS TABLE
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_product_review (product_id, user_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- CART ITEMS TABLE
CREATE TABLE cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (user_id, product_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- ORDERS TABLE
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    status ENUM('pending', 'confirmed', 'packing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    subtotal_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    shipping_address TEXT NOT NULL,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    payment_method VARCHAR(50),
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    delivery_method ENUM('rankdrop', 'self_delivery', 'home_delivery') DEFAULT 'home_delivery',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_order_number (order_number),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB;

-- ORDER ITEMS TABLE
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    vendor_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_vendor_id (vendor_id)
) ENGINE=InnoDB;

-- SHIPMENTS TABLE
CREATE TABLE shipments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shipment_id VARCHAR(50) UNIQUE NOT NULL,
    order_id INT NOT NULL,
    vendor_id INT NOT NULL,
    pickup_point VARCHAR(255) NOT NULL,
    collection_code VARCHAR(10),
    status ENUM('processing', 'in_transit', 'at_rank', 'collected', 'delivered') DEFAULT 'processing',
    delivery_method ENUM('rankdrop', 'self_delivery') DEFAULT 'rankdrop',
    delivery_type ENUM('normal', 'return') NOT NULL DEFAULT 'normal',
    customer_name VARCHAR(100),
    destination TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    INDEX idx_shipment_id (shipment_id),
    INDEX idx_status (status),
    INDEX idx_order_id (order_id)
) ENGINE=InnoDB;

-- USER FOLLOWS VENDOR
CREATE TABLE user_follows_vendor (
    user_id INT NOT NULL,
    vendor_id INT NOT NULL,
    followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, vendor_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- CATEGORIES TABLE
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- DELIVERY METHODS TABLE
-- Queried by models/DeliveryMethod.js (findAll / findByCode)
CREATE TABLE delivery_methods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    tagline VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_note VARCHAR(100),
    time_estimate VARCHAR(100),
    features JSON,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- PICKUP POINTS TABLE
-- Queried by models/PickupPoint.js (findAll / findById / findNearest)
CREATE TABLE pickup_points (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    opening_hours VARCHAR(150),
    eta VARCHAR(100),
    color VARCHAR(20),
    is_recommended BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active),
    INDEX idx_city (city)
) ENGINE=InnoDB;

-- SUBSCRIPTION PLANS TABLE
-- Queried by models/subscription.js (getAllPlans / getPlanBySlug / getPlanById)
CREATE TABLE subscription_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    tagline VARCHAR(150),
    price DECIMAL(10,2) NOT NULL,
    billing_period ENUM('monthly', 'yearly') DEFAULT 'monthly',
    description TEXT,
    rankdrop_rate_note VARCHAR(150),
    features JSON,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- VENDOR SUBSCRIPTIONS TABLE
-- Queried by models/subscription.js (getActiveForVendor / subscribe / cancel)
CREATE TABLE vendor_subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    plan_id INT NOT NULL,
    status ENUM('active', 'cancelled', 'expired') DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- INSERT DEFAULT CATEGORIES
INSERT IGNORE INTO categories (name) VALUES
('All'), ('Bakery'), ('Crafts'), ('Skincare'), ('Clothing'),
('Home & Decor'), ('Food Truck'), ('Beverages'), ('Handmade'),
('Wellness'), ('Jewelry');

-- Default delivery methods
INSERT IGNORE INTO delivery_methods (code, name, tagline, description, price, price_note, time_estimate, features, is_popular, display_order) VALUES
('rankdrop', 'RankDrop', 'Collect it at your local taxi rank', 'Drop-off at a nearby pickup point, no waiting around at home.', 35.00, 'per order', '1-2 days', JSON_ARRAY('Cheapest option', 'Collect any time', 'SMS when ready'), TRUE, 1),
('home_delivery', 'Home Delivery', 'Straight to your door', 'Courier delivery direct to your address.', 60.00, 'per order', '2-4 days', JSON_ARRAY('Doorstep delivery', 'Track your parcel'), FALSE, 2),
('self_delivery', 'Vendor Delivery', 'Delivered by the vendor themselves', 'Some vendors deliver locally themselves - ask before you order.', 0.00, 'varies by vendor', 'Same/next day', JSON_ARRAY('Arranged directly with vendor'), FALSE, 3);

-- Default pickup points (RankDrop locations)
INSERT IGNORE INTO pickup_points (name, address, city, latitude, longitude, opening_hours, eta, color, is_recommended) VALUES
('Site B Rank', 'Site B Taxi Rank, Khayelitsha', 'Cape Town', -34.0331, 18.6790, '06:00 - 19:00', 'Ready in 1-2 days', '#22c55e', TRUE),
('Bellville Rank', 'Voortrekker Rd, Bellville', 'Cape Town', -33.8996, 18.6292, '05:30 - 20:00', 'Ready in 1-2 days', '#3b82f6', FALSE),
('Warwick Junction', 'Warwick Ave, Durban CBD', 'Durban', -29.8579, 31.0179, '06:00 - 18:30', 'Ready in 1-2 days', '#f97316', TRUE);

-- Default subscription plans
INSERT IGNORE INTO subscription_plans (slug, name, tagline, price, billing_period, description, rankdrop_rate_note, features, is_popular, display_order) VALUES
('free', 'Free', 'Get started selling', 0.00, 'monthly', 'Get started selling on LocalCart.', 'Standard RankDrop rates apply', JSON_ARRAY('Up to 10 products', 'Standard storefront'), FALSE, 1),
('growth', 'Growth', 'For vendors ready to scale', 149.00, 'monthly', 'For vendors ready to scale up.', '10% off RankDrop rates', JSON_ARRAY('Unlimited products', 'Featured placement', 'Sales analytics'), TRUE, 2),
('pro', 'Pro', 'Full toolkit for established stores', 349.00, 'monthly', 'Full toolkit for established stores.', '20% off RankDrop rates', JSON_ARRAY('Everything in Growth', 'Priority support', 'Custom storefront branding'), FALSE, 3);

-- Sample Users
INSERT IGNORE INTO users (name, email, password_hash, phone, location, bio, avatar_initials, is_vendor) VALUES
('Thabo Mokoena', 'thabo@example.com', '$2b$10$YQ8P0hYXgJUbC.zSx5S1MeqWZ8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8', '0821234567', 'Durban, KZN', 'Foodie, craft-market regular', 'TM', 0),
('Maya Smith', 'maya@example.com', '$2b$10$YQ8P0hYXgJUbC.zSx5S1MeqWZ8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8', '0832345678', 'Cape Town, WC', 'Passionate baker', 'MS', 1),
('Sipho Nkosi', 'sipho@example.com', '$2b$10$YQ8P0hYXgJUbC.zSx5S1MeqWZ8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8', '0843456789', 'Johannesburg, GP', 'Street food connoisseur', 'SN', 0),
('Aisha Adams', 'aisha@example.com', '$2b$10$YQ8P0hYXgJUbC.zSx5S1MeqWZ8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8', '0854567890', 'Cape Town, WC', 'Skincare enthusiast', 'AA', 0);

-- Sample Vendors
INSERT IGNORE INTO vendors (user_id, name, category, location, cover_image, logo_text, description, about, response_time, delivery_area, shipping_info) VALUES
(2, 'Thandi''s Kitchen', 'Bakery', 'Durban, KZN', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=60', 'TK', 'Small-batch sourdough, amagwinya and celebration cakes', 'Thandi''s Kitchen started as a Saturday market stall in 2021', 'Usually replies within 2 hours', 'Durban Metro', 'Local delivery & collection'),
(NULL, 'Kwela Crafts', 'Crafts', 'Cape Town, WC', 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&q=60', 'KC', 'Handwoven baskets and beadwork', 'Kwela Crafts is a collective of eight artisans', 'Usually replies within a day', 'Nationwide (courier)', 'Courier, 2-4 working days'),
(NULL, 'Karoo Botanicals', 'Skincare', 'Oudtshoorn, WC', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=60', 'KB', 'Cold-pressed skincare made with indigenous Karoo botanicals', 'We formulate every product in small batches', 'Usually replies within 3 hours', 'Nationwide', 'Courier, 1-3 working days');

-- Sample Products
INSERT IGNORE INTO products (vendor_id, name, price, unit, stock, category, image, status) VALUES
(1, 'Farmhouse Sourdough Loaf', 65.00, 'each', 12, 'Bakery', 'https://i.ibb.co/G47bVMcD/farmhouse-white-sourdough-recipe-card.jpg', 'published'),
(1, 'Amagwinya (6-pack)', 45.00, 'pack', 20, 'Bakery', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=60', 'published'),
(1, 'Malva Pudding Cake', 180.00, 'whole cake', 4, 'Bakery', 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500&q=60', 'published'),
(2, 'Telephone-Wire Basket, Large', 620.00, 'each', 6, 'Crafts', 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=500&q=60', 'published'),
(2, 'Beaded Coaster Set (4)', 210.00, 'set', 15, 'Crafts', 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=60', 'published'),
(3, 'Buchu & Rooibos Face Serum', 285.00, '30ml', 18, 'Skincare', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=60', 'published'),
(3, 'Kalahari Melon Body Oil', 220.00, '100ml', 25, 'Skincare', 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=500&q=60', 'published');

-- Sample Cart Items
INSERT IGNORE INTO cart_items (user_id, product_id, quantity) VALUES
(1, 1, 2),
(1, 2, 1),
(1, 6, 1);

-- Sample Order
INSERT IGNORE INTO orders (order_number, user_id, status, total_amount, subtotal_amount, delivery_fee, shipping_address, city, postal_code, payment_method, payment_status) VALUES
('LC-10482', 1, 'confirmed', 615.00, 555.00, 60.00, '12 Vygieboom Street, Khayelitsha', 'Cape Town', '7784', 'card', 'paid');

-- Sample Order Items
INSERT IGNORE INTO order_items (order_id, product_id, vendor_id, quantity, price, product_name) VALUES
(1, 1, 1, 2, 65.00, 'Farmhouse Sourdough Loaf'),
(1, 2, 1, 1, 45.00, 'Amagwinya (6-pack)'),
(1, 6, 3, 1, 285.00, 'Buchu & Rooibos Face Serum');

-- Sample Shipment
INSERT IGNORE INTO shipments (shipment_id, order_id, vendor_id, pickup_point, collection_code, status) VALUES
('RD-10482', 1, 1, 'Site B Rank', '2841', 'processing');

-- VERIFY DATA
SELECT 'Users' as Table_Name, COUNT(*) as Count FROM users
UNION ALL
SELECT 'Vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Cart Items', COUNT(*) FROM cart_items
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Order Items', COUNT(*) FROM order_items
UNION ALL
SELECT 'Shipments', COUNT(*) FROM shipments
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories
UNION ALL
SELECT 'Delivery Methods', COUNT(*) FROM delivery_methods
UNION ALL
SELECT 'Pickup Points', COUNT(*) FROM pickup_points
UNION ALL
SELECT 'Subscription Plans', COUNT(*) FROM subscription_plans;