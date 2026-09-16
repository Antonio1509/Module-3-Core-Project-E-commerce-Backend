import jwt from 'jsonwebtoken';
import User from '../models/users.js';
import pool from '../config/database.js';

// Attaches vendor_id onto req.user when the logged-in user is a vendor
const attachVendorId = async (user) => {
  if (user && user.is_vendor) {
    const [vendorRows] = await pool.query(
      'SELECT id FROM vendors WHERE user_id = ? LIMIT 1',
      [user.id]
    );
    if (vendorRows.length) {
      user.vendor_id = vendorRows[0].id;
    }
  }
  return user;
};

// Requires a valid token. Rejects the request if missing/invalid.
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    req.user = await attachVendorId(user);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Same behavior as `protect` — kept as a separate name because some
// route files were written against `authenticate` instead of `protect`.
const authenticate = protect;

// Attaches req.user if a valid token is present, but never blocks the
// request when the token is missing or invalid (for public-but-personalized routes).
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = await attachVendorId(user);
    }
  } catch (error) {
    // Invalid/expired token on an optional route — just proceed unauthenticated.
  }
  next();
};

const requireVendor = (req, res, next) => {
  if (!req.user || !req.user.vendor_id) {
    return res.status(403).json({ message: 'Vendor profile required' });
  }
  next();
};

export { protect, authenticate, optionalAuth, requireVendor };
