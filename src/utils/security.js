/**
 * Security Utilities - Noor Wallarts & Gifts (Admin)
 * XSS, injection, and input sanitization helpers
 */

export const sanitizeText = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const cleanInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
};

export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const isValidPin = (pin) => /^\d{6}$/.test(String(pin));

export const isValidPrice = (price) => {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0;
};

export const sanitizeFormData = (formData) => {
  const result = {};
  for (const [key, value] of Object.entries(formData)) {
    result[key] = typeof value === 'string' ? cleanInput(value) : value;
  }
  return result;
};

const rateLimitMap = new Map();
export const isRateLimited = (actionKey, maxAttempts = 5, windowMs = 60000) => {
  const now = Date.now();
  const attempts = rateLimitMap.get(actionKey) || [];
  const recent = attempts.filter(t => now - t < windowMs);
  if (recent.length >= maxAttempts) return true;
  rateLimitMap.set(actionKey, [...recent, now]);
  return false;
};

export const isValidCouponCode = (code) => /^[A-Z0-9_-]{3,20}$/.test(String(code));
