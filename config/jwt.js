import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export function generateToken(userId, email) {
    return jwt.sign(
        { id: userId, email },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

export { JWT_SECRET };