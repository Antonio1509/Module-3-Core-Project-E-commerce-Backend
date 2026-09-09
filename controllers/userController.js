import User from '../models/users.js';
import bcrypt from 'bcrypt';

export async function getProfile(req, res) {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export async function updateProfile(req, res) {
    try {
        const userId = req.user.id;
        const { name, phone, location, bio, avatar_initials } = req.body;

        const updated = await User.update(userId, {
            name,
            phone,
            location,
            bio,
            avatar_initials
        });

        if (!updated) {
            return res.status(400).json({
                success: false,
                message: 'Failed to update profile'
            });
        }

        const user = await User.findById(userId);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export async function changePassword(req, res) {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        const user = await User.findByEmail(req.user.email);
        
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updated = await User.updatePassword(userId, hashedPassword);

        if (!updated) {
            return res.status(400).json({
                success: false,
                message: 'Failed to update password'
            });
        }

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Add this to your userController.js
export async function getAllUsers(req, res) {
    try {
        // Check if user is admin (optional - for now, just return all users)
        // You can add role check later
        const [rows] = await pool.query(
            'SELECT id, name, email, phone, location, is_vendor, joined, created_at FROM users ORDER BY id DESC'
        );
        
        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}