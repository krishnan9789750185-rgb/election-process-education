/**
 * @fileoverview Shared utility functions for ElectIQ.
 * Provides DOM helpers, formatting, storage wrappers, and performance utilities.
 * @module utils
 */

import { APP_CONFIG } from './constants.js';

/**
 * Shorthand for document.querySelector.
 * @param {string} selector - CSS selector string.
 * @param {Element} [parent=document] - Parent element to query within.
 * @returns {Element|null} The first matching element or null.
 */
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Shorthand for document.querySelectorAll, returns a real Array.
 * @param {string} selector - CSS selector string.
 * @param {Element} [parent=document] - Parent element to query within.
 * @returns {Array<Element>} Array of matching elements.
 */
export function qsa(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/**
 * Creates a DOM element with attributes and children.
 * @param {string} tag - HTML tag name.
 * @param {Object<string, string|Function|Object>} [attrs={}] - Attributes, dataset, or event listeners.
 * @param  {...(string|Element)} children - Child nodes or text content.
 * @returns {Element} The created element.
 */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Element) {
      el.appendChild(child);
    }
  }

  return el;
}

/**
 * Creates a debounced version of a function.
 * @param {Function} fn - The function to debounce.
 * @param {number} [delay] - Debounce delay in milliseconds.
 * @returns {Function} The debounced function.
 */
export function debounce(fn, delay = APP_CONFIG.DEBOUNCE_DELAY_MS) {
  let timeoutId = null;

  const debounced = (...args) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };

  /** Cancels the pending debounced call. */
  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Creates a throttled version of a function.
 * @param {Function} fn - The function to throttle.
 * @param {number} [delay] - Throttle delay in milliseconds.
 * @returns {Function} The throttled function.
 */
export function throttle(fn, delay = APP_CONFIG.THROTTLE_DELAY_MS) {
  let lastCall = 0;
  let timeoutId = null;

  return (...args) => {
    const now = Date.now();
    const remaining = delay - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn(...args);
    } else if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };
}

/**
 * Safe wrapper for localStorage operations.
 * All keys are prefixed with the app namespace.
 */
export const storage = {
  /**
   * Retrieves a value from localStorage.
   * @param {string} key - Storage key (without prefix).
   * @param {*} [defaultValue=null] - Default value if key not found.
   * @returns {*} The stored value or default.
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_PREFIX + key);
      return item !== null ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  /**
   * Stores a value in localStorage.
   * @param {string} key - Storage key (without prefix).
   * @param {*} value - Value to store (will be JSON-serialized).
   * @returns {boolean} Whether the operation succeeded.
   */
  set(key, value) {
    try {
      localStorage.setItem(APP_CONFIG.LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Removes a value from localStorage.
   * @param {string} key - Storage key (without prefix).
   */
  remove(key) {
    try {
      localStorage.removeItem(APP_CONFIG.LOCAL_STORAGE_PREFIX + key);
    } catch {
      /* Silently fail for storage errors */
    }
  },
};

/**
 * Formats a number as a score string with leading zeros.
 * @param {number} score - The score value.
 * @param {number} [digits=4] - Number of digits to pad to.
 * @returns {string} The formatted score string.
 */
export function formatScore(score, digits = 4) {
  return String(Math.max(0, Math.floor(score))).padStart(digits, '0');
}

/**
 * Generates a unique ID string.
 * @param {string} [prefix='id'] - Optional prefix for the ID.
 * @returns {string} A unique identifier.
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Waits for a specified duration.
 * @param {number} ms - Duration in milliseconds.
 * @returns {Promise<void>} Resolves after the specified delay.
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Smoothly scrolls an element into view.
 * @param {Element|string} target - Element or selector to scroll to.
 * @param {Object} [options] - Scroll options.
 * @param {string} [options.behavior='smooth'] - Scroll behavior.
 * @param {string} [options.block='start'] - Vertical alignment.
 */
function scrollToElement(target, options = {}) {
  const element = typeof target === 'string' ? qs(target) : target;
  if (!element) {
    return;
  }
  element.scrollIntoView({
    behavior: options.behavior || 'smooth',
    block: options.block || 'start',
  });
}

/**
 * Shows a toast notification to the user.
 * @param {string} message - The message to display.
 * @param {string} [type='info'] - Toast type: 'info', 'success', 'warning', 'error'.
 * @param {number} [duration] - Duration in milliseconds before auto-dismiss.
 */
export function showToast(message, type = 'info', duration = APP_CONFIG.TOAST_DURATION_MS) {
  const container = qs('#toast-container') || createToastContainer();

  const toast = createElement(
    'div',
    {
      className: `toast toast--${type}`,
      role: 'alert',
      'aria-live': 'polite',
    },
    createElement('span', { className: 'toast__icon' }, getToastIcon(type)),
    createElement('span', { className: 'toast__message' }, message),
    createElement('button', {
      className: 'toast__close',
      'aria-label': 'Dismiss notification',
      onClick: () => dismissToast(toast),
    }, '✕')
  );

  container.appendChild(toast);

  /* Trigger entrance animation */
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }
}

/**
 * Creates the toast notification container.
 * @returns {Element} The toast container element.
 */
function createToastContainer() {
  const container = createElement('div', {
    id: 'toast-container',
    'aria-label': 'Notifications',
    role: 'region',
  });
  document.body.appendChild(container);
  return container;
}

/**
 * Dismisses a toast notification with exit animation.
 * @param {Element} toast - The toast element to dismiss.
 */
function dismissToast(toast) {
  if (!toast || !toast.parentElement) {
    return;
  }
  toast.classList.remove('toast--visible');
  toast.classList.add('toast--exit');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
  /* Fallback removal if animation doesn't fire */
  setTimeout(() => toast.remove(), APP_CONFIG.ANIMATION_DURATION_MS);
}

/**
 * Returns an emoji icon for the toast type.
 * @param {string} type - Toast type.
 * @returns {string} Emoji icon character.
 */
function getToastIcon(type) {
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  return icons[type] || icons.info;
}
