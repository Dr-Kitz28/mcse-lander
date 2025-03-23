/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {object} Validation result with valid flag and message
 */
export function validateEmail(email) {
    // RFC 5322 compliant regex
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (!email || !regex.test(email)) {
        return { valid: false, message: 'Please enter a valid email address' };
    }

    // Check for disposable email domains if needed
    const disposableDomains = ['mailinator.com', 'tempmail.com', 'fakeinbox.com'];
    const domain = email.split('@')[1];

    if (disposableDomains.includes(domain)) {
        return { valid: false, message: 'Please use your university email' };
    }

    return { valid: true };
}

/**
 * Validates a username
 * @param {string} username - The username to validate
 * @returns {object} Validation result with valid flag and message
 */
export function validateUsername(username) {
    if (!username || username.length < 3) {
        return { valid: false, message: 'Username must be at least 3 characters' };
    }

    if (username.length > 20) {
        return { valid: false, message: 'Username must be less than 20 characters' };
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
        return {
            valid: false,
            message: 'Username can only contain letters, numbers, underscores, dots, and hyphens'
        };
    }

    return { valid: true };
}

/**
 * Validates a password
 * @param {string} password - The password to validate
 * @returns {object} Validation result with valid flag and message
 */
export function validatePassword(password) {
    if (!password || password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters' };
    }

    // Check for complexity
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!(hasUpper && hasLower && (hasNumber || hasSpecial))) {
        return {
            valid: false,
            message: 'Password must contain uppercase, lowercase, and either numbers or special characters'
        };
    }

    return { valid: true };
}