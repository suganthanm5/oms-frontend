/* ══════════════════════════════════════════
   Cookie Utilities — secure, light cookies API
   for premium session management.
   ══════════════════════════════════════════ */

/**
 * Save a key-value pair as a secure cookie
 * @param {string} name - Name of the cookie
 * @param {string} value - Value to store
 * @param {number} days - Days until cookie expires (defaults to 7)
 */
export const setCookie = (name, value, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

/**
 * Retrieve a cookie value by name
 * @param {string} name - Name of the cookie to find
 * @returns {string} - Decoded value of the cookie or empty string
 */
export const getCookie = (name) => {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    const key = parts[0]?.trim();
    return key === name ? decodeURIComponent(parts[1] || '') : r;
  }, '');
};

/**
 * Remove a cookie by name
 * @param {string} name - Name of the cookie to delete
 */
export const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};
