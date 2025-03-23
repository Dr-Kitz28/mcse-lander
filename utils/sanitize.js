/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} text - The text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeText(text) {
    if (!text) return '';

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
}

/**
 * Sanitizes usernames to only allow safe characters
 * @param {string} username - The username to sanitize
 * @returns {string} Sanitized username
 */
export function sanitizeUsername(username) {
    if (!username) return '';

    // Only allow alphanumeric, underscore, dot, and hyphen
    return username.replace(/[^a-zA-Z0-9_.-]/g, '');
}

/**
 * Normalizes an email address
 * @param {string} email - The email to normalize
 * @returns {string} Normalized email (lowercase, trimmed)
 */
export function normalizeEmail(email) {
    if (!email) return '';
    return email.toLowerCase().trim();
}