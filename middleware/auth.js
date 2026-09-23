import jwt from 'jsonwebtoken';
import User from '../models/users.js';
import pool from '../config/database.js';

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
    req.user = user;

    if (user.is_vendor) {
      const [vendorRows] = await pool.query(
        'SELECT id FROM vendors WHERE user_id = ? LIMIT 1',
        [user.id]
      );

      if (vendorRows.length) {
        req.user.vendor_id = vendorRows[0].id;
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const requireVendor = (req, res, next) => {
  if (!req.user || !req.user.vendor_id) {
    return res.status(403).json({ message: 'Vendor profile required' });
  }

  next();
};

export { protect, requireVendor };