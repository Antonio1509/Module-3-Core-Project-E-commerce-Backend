export function validateRegistration(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
    }

    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Valid email is required');
    }

    if (!data.password || data.password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }

    return { isValid: errors.length === 0, errors };
}

export function validateLogin(data) {
    const errors = [];

    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Valid email is required');
    }

    if (!data.password || data.password.length < 1) {
        errors.push('Password is required');
    }

    return { isValid: errors.length === 0, errors };
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}