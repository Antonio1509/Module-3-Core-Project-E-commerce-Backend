
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
 * Validates an email address format.
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
    if (!isNonEmptyString(email)) return false;
    // Simple but effective email check
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * @param {string} password
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validatePassword(password) {
    const errors = [];

    if (!isNonEmptyString(password)) {
        errors.push('Password is required');
        return { isValid: false, errors };
    }

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-zA-Z]/.test(password)) {
        errors.push('Password must contain at least one letter');
    }

    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (password.length > 100) {
        errors.push('Password is too long (max 100 characters)');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * @param {string} phone
 * @returns {boolean}
 */
export function validatePhone(phone) {
    if (!isNonEmptyString(phone)) return false;
    const cleaned = phone.replace(/[\s\-()]/g, '');
    return /^(\+27|0)[6-8][0-9]{8}$/.test(cleaned);
}

/**
 * Validates a South African postal code (4 digits).
 */
export function validatePostalCode(code) {
    if (!isNonEmptyString(code)) return false;
    return /^\d{4}$/.test(code.trim());
}

// ============================================================
// REGISTRATION VALIDATION
// ============================================================

/**
 * Validates a new user registration.
 *
 * @param {Object} userData - Registration data
 * @param {string} userData.name - Full name
 * @param {string} userData.email - Email
 * @param {string} userData.password - Plain password
 * @param {string} [userData.confirmPassword] - Password confirmation
 * @param {string} [userData.phone] - Phone number (optional)
 * @param {string} [userData.location] - Location (optional)
 * @param {string} [userData.bio] - Bio (optional)
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateRegister(userData) {
    const errors = [];

    // ----- Name -----
    if (!isNonEmptyString(userData.name)) {
        errors.push('Name is required');
    } else if (userData.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
    } else if (userData.name.trim().length > 100) {
        errors.push('Name is too long (max 100 characters)');
    }

    // ----- Email -----
    if (!isNonEmptyString(userData.email)) {
        errors.push('Email is required');
    } else if (!validateEmail(userData.email)) {
        errors.push('Please enter a valid email address');
    } else if (userData.email.length > 100) {
        errors.push('Email is too long (max 100 characters)');
    }

    // ----- Password -----
    const passwordCheck = validatePassword(userData.password);
    if (!passwordCheck.isValid) {
        errors.push(...passwordCheck.errors);
    }

    // ----- Confirm password (if provided) -----
    if (userData.confirmPassword !== undefined) {
        if (userData.password !== userData.confirmPassword) {
            errors.push('Passwords do not match');
        }
    }

    // ----- Phone (optional but must be valid if provided) -----
    if (userData.phone && !validatePhone(userData.phone)) {
        errors.push('Please enter a valid South African phone number');
    }

    // ----- Location (optional, max length) -----
    if (userData.location && userData.location.length > 100) {
        errors.push('Location is too long (max 100 characters)');
    }

    // ----- Bio (optional, max length) -----
    if (userData.bio && userData.bio.length > 1000) {
        errors.push('Bio is too long (max 1000 characters)');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// ============================================================
// LOGIN VALIDATION
// ============================================================

/**
 * Validates login credentials.
 *
 * @param {Object} credentials - Login data
 * @param {string} credentials.email - Email
 * @param {string} credentials.password - Password
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateLogin(credentials) {
    const errors = [];

    if (!isNonEmptyString(credentials.email)) {
        errors.push('Email is required');
    } else if (!validateEmail(credentials.email)) {
        errors.push('Please enter a valid email address');
    }

    if (!isNonEmptyString(credentials.password)) {
        errors.push('Password is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// ============================================================
// PASSWORD CHANGE VALIDATION
// ============================================================

/**
 * Validates a password change request.
 *
 * @param {Object} data - Password change data
 * @param {string} data.currentPassword - Current password
 * @param {string} data.newPassword - New password
 * @param {string} [data.confirmPassword] - New password confirmation
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validatePasswordChange(data) {
    const errors = [];

    if (!isNonEmptyString(data.currentPassword)) {
        errors.push('Current password is required');
    }

    const newPasswordCheck = validatePassword(data.newPassword);
    if (!newPasswordCheck.isValid) {
        errors.push(...newPasswordCheck.errors);
    }

    if (data.confirmPassword !== undefined && data.newPassword !== data.confirmPassword) {
        errors.push('New passwords do not match');
    }

    if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
        errors.push('New password must be different from current password');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// ============================================================
// EXPRESS MIDDLEWARE-STYLE VALIDATORS (OPTIONAL)
// ============================================================

export function validateRegisterMiddleware(req, res, next) {
    const result = validateRegister(req.body);

    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: result.errors
        });
    }

    next();
}

export function validateLoginMiddleware(req, res, next) {
    const result = validateLogin(req.body);

    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: result.errors
        });
    }

    next();
}

// ============================================================
// DEFAULT EXPORT — all validators in one object
// ============================================================

export default {
    validateRegister,
    validateLogin,
    validatePasswordChange,
    validateEmail,
    validatePassword,
    validatePhone,
    validatePostalCode,
    validateRegisterMiddleware,
    validateLoginMiddleware
};