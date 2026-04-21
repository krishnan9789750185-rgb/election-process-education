/**
 * @fileoverview Security utilities for ElectIQ.
 * Provides input sanitization, XSS prevention, rate limiting, and CSP enforcement.
 * @module security
 */

import { SECURITY, APP_CONFIG } from './constants.js';

/**
 * HTML entity map for character escaping.
 * @constant {Object<string, string>}
 */
const HTML_ENTITIES = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
});

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return str.replace(/[&<>"'/`]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitizes HTML content by removing disallowed tags and attributes.
 * Allows only tags specified in SECURITY.ALLOWED_TAGS.
 * @param {string} html - The HTML string to sanitize.
 * @returns {string} The sanitized HTML string.
 */
export function sanitizeHTML(html) {
  if (typeof html !== 'string') {
    return '';
  }

  const allowedTagPattern = SECURITY.ALLOWED_TAGS.join('|');
  const tagRegex = new RegExp(`<(?!\\/?(${allowedTagPattern})\\b)[^>]*>`, 'gi');
  let sanitized = html.replace(tagRegex, '');

  /* Remove event handlers and javascript: URLs */
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  sanitized = sanitized.replace(/data\s*:/gi, '');

  return sanitized;
}

/**
 * Validates and sanitizes user text input.
 * @param {string} input - The user input to validate.
 * @param {number} [maxLength] - Maximum allowed length.
 * @returns {{ isValid: boolean, sanitized: string, error: string }} Validation result.
 */
export function validateInput(input, maxLength = APP_CONFIG.MAX_INPUT_LENGTH) {
  if (typeof input !== 'string') {
    return { isValid: false, sanitized: '', error: 'Invalid input type' };
  }

  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { isValid: false, sanitized: '', error: 'Input cannot be empty' };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      sanitized: '',
      error: `Input exceeds maximum length of ${maxLength} characters`,
    };
  }

  const sanitized = escapeHTML(trimmed);
  return { isValid: true, sanitized, error: '' };
}

/**
 * Rate limiter to prevent API abuse.
 * Tracks request timestamps within a sliding window.
 */
class RateLimiter {
  /** @type {Map<string, Array<number>>} */
  #requests = new Map();

  /**
   * Creates a new RateLimiter instance.
   * @param {number} maxRequests - Maximum requests allowed per window.
   * @param {number} windowMs - Time window in milliseconds.
   */
  constructor(
    maxRequests = SECURITY.MAX_RATE_LIMIT_REQUESTS,
    windowMs = SECURITY.RATE_LIMIT_WINDOW_MS
  ) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Checks if a request is allowed for the given key.
   * @param {string} [key='default'] - The rate limit key (e.g., user ID or endpoint).
   * @returns {{ allowed: boolean, retryAfterMs: number }} Whether the request is allowed.
   */
  check(key = 'default') {
    const now = Date.now();
    const timestamps = this.#requests.get(key) || [];

    /* Remove expired timestamps outside the window */
    const validTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      const oldestValid = validTimestamps[0];
      const retryAfterMs = this.windowMs - (now - oldestValid);
      return { allowed: false, retryAfterMs };
    }

    validTimestamps.push(now);
    this.#requests.set(key, validTimestamps);
    return { allowed: true, retryAfterMs: 0 };
  }

  /**
   * Resets the rate limiter for a specific key or all keys.
   * @param {string} [key] - Optional key to reset. Resets all if omitted.
   */
  reset(key) {
    if (key) {
      this.#requests.delete(key);
    } else {
      this.#requests.clear();
    }
  }
}

/** @type {RateLimiter} Singleton rate limiter instance */
export const rateLimiter = new RateLimiter();

/**
 * Validates a Gemini API key format.
 * @param {string} key - The API key to validate.
 * @returns {boolean} Whether the key format appears valid.
 */
export function isValidAPIKey(key) {
  if (typeof key !== 'string') {
    return false;
  }
  const trimmed = key.trim();
  return trimmed.length >= APP_CONFIG.MIN_API_KEY_LENGTH && /^[A-Za-z0-9_-]+$/.test(trimmed);
}

/**
 * Creates a nonce for Content Security Policy.
 * @returns {string} A random base64-encoded nonce string.
 */
export function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Sets up Content Security Policy meta tag.
 * Enforces strict CSP to mitigate XSS and injection attacks.
 */
export function enforceCSP() {
  const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingMeta) {
    return; /* CSP already set */
  }

  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://generativelanguage.googleapis.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');

  document.head.prepend(meta);
}
