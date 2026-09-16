import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/users.js';


// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};


// @desc    Register a customer or vendor
// @route   POST /api/auth/register
export const register = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      name, username, email, password, phone,
      street, suburb, city, province, postal_code, gender,
      location, bio,
      is_vendor = false,
      // vendor-only fields
      storeName, storeEmail, storePhone, ownerId, ownerName,
      vendStreet, vendSuburb, vendCity, vendProvince, vendPostalCode
    } = req.body;


    // --- Validation ---
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (is_vendor && !storeName) {
      return res.status(400).json({ message: 'storeName is required for vendors' });
    }


    // --- Email uniqueness ---
    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }


    // --- Transaction ---
    await conn.beginTransaction();


    const passwordHash = await bcrypt.hash(password, 10);


    // 1. Insert user
    const [userResult] = await conn.query(
      `INSERT INTO users
         (name, username, email, password_hash, phone,
          street, suburb, city, province, postal_code, gender,
          location, bio, avatar_initials, is_vendor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, username || null, email, passwordHash, phone || null,
        street || null, suburb || null, city || null,
        province || null, postal_code || null, gender || null,
        location || city || null, bio || null,
        name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase(),
        is_vendor ? 1 : 0
      ]
    );


    const userId = userResult.insertId;
    let vendorId = null;


    // 2. If vendor, insert vendor row linked to user
    if (is_vendor) {
      // Build a fallback "location" from address pieces if not provided
      const vendorLocation =
        location || [vendCity, vendProvince].filter(Boolean).join(', ') || city || null;


      const [vendorResult] = await conn.query(
        `INSERT INTO vendors
           (user_id, name, category, location, logo_text, description, about,
            response_time, delivery_area, shipping_info)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          storeName,
          'Bakery', // or take from req.body.category
          vendorLocation,
          storeName.slice(0, 2).toUpperCase(),
          bio || null,
          bio || null,
          'Usually replies within a day',
          'Cape Town Metro',
          'Local delivery'
        ]
      );
      vendorId = vendorResult.insertId;
    }


    await conn.commit();


    // --- Success ---
    const token = generateToken(userId);


    res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        email,
        is_vendor: !!is_vendor,
        vendor_id: vendorId
      }
    });
  } catch (error) {
    await conn.rollback();
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};


// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }


    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }


    const isMatch = await User.comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }


    const token = generateToken(user.id);


    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_vendor: user.is_vendor
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// @desc    Get current user (protected)
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  res.json(req.user);
};
