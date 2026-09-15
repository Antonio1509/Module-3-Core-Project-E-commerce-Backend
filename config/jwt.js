import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Fallback secret if .env is missing
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

/** 
 * @param {Object|number} userOrId - User object OR user ID
 * @param {string} [email] - Email (only if first arg is an ID)
 * @returns {string} - Signed JWT token
 */
export function generateToken(userOrId, email) {
    let payload;

    // Detect signature:
    // If first arg is an object → your style: generateToken(user)
    if (typeof userOrId === 'object' && userOrId !== null) {
        payload = {
            id: userOrId.id,
            email: userOrId.email,
            is_vendor: userOrId.is_vendor || false
        };
    } else {
        // Otherwise → teammate's style: generateToken(userId, email)
        payload = {
            id: userOrId,
            email: email
        };
    }

    return jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

/**
 * Verify a JWT token
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object|null} - Decoded payload or null if invalid
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Export the secret (some code may import it)
export { JWT_SECRET };