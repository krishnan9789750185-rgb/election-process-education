/**
 * @fileoverview Accessibility utilities for ElectIQ.
 * Manages ARIA attributes, keyboard navigation, focus trapping, screen reader
 * announcements, and user preference detection.
 * @module accessibility
 */

import { qs, qsa } from './utils.js';
import { storage } from './utils.js';
import { ARIA_LABELS, APP_CONFIG } from './constants.js';

/**
 * Manages focus trapping within modal dialogs.
 * Ensures keyboard users cannot tab outside the modal.
 */
class FocusTrap {
  /** @type {Element|null} The element to trap focus within */
  #container = null;
  /** @type {Element|null} The element that had focus before the trap was activated */
  #previousFocus = null;
  /** @type {Function|null} The bound keydown handler */
  #handleKeyDown = null;

  /**
   * Activates focus trapping within the specified container.
   * @param {Element} container - The container element to trap focus within.
   */
  activate(container) {
    if (!container) {
      return;
    }

    this.#container = container;
    this.#previousFocus = document.activeElement;
    this.#handleKeyDown = this.#onKeyDown.bind(this);

    document.addEventListener('keydown', this.#handleKeyDown);

    const firstFocusable = this.#getFocusableElements()[0];
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  /**
   * Deactivates focus trapping and restores previous focus.
   */
  deactivate() {
    if (this.#handleKeyDown) {
      document.removeEventListener('keydown', this.#handleKeyDown);
      this.#handleKeyDown = null;
    }

    if (this.#previousFocus && typeof this.#previousFocus.focus === 'function') {
      this.#previousFocus.focus();
    }

    this.#container = null;
    this.#previousFocus = null;
  }

  /**
   * Gets all focusable elements within the container.
   * @returns {Array<Element>} Array of focusable elements.
   */
  #getFocusableElements() {
    if (!this.#container) {
      return [];
    }

    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return qsa(selector, this.#container).filter(
      (el) => el.offsetParent !== null /* visible elements only */
    );
  }

  /**
   * Handles Tab key to cycle focus within the container.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  #onKeyDown(event) {
    if (event.key !== 'Tab') {
      return;
    }

    const focusable = this.#getFocusableElements();
    if (focusable.length === 0) {
      return;
    }

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}

/** @type {FocusTrap} Singleton focus trap instance */
export const focusTrap = new FocusTrap();

/**
 * Announces a message to screen readers via an ARIA live region.
 * @param {string} message - The message to announce.
 * @param {string} [priority='polite'] - Announcement priority: 'polite' or 'assertive'.
 */
export function announce(message, priority = 'polite') {
  let region = qs(`#aria-live-${priority}`);

  if (!region) {
    region = document.createElement('div');
    region.id = `aria-live-${priority}`;
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
    region.className = 'sr-only';
    document.body.appendChild(region);
  }

  /* Clear first to ensure repeated messages are announced */
  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

/**
 * Initializes skip-to-content link functionality.
 * Creates a skip link if one doesn't already exist.
 */
export function initSkipLinks() {
  let skipLink = qs('#skip-link');

  if (!skipLink) {
    skipLink = document.createElement('a');
    skipLink.id = 'skip-link';
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.setAttribute('aria-label', ARIA_LABELS.SKIP_LINK);
    document.body.prepend(skipLink);
  }

  skipLink.addEventListener('click', (event) => {
    event.preventDefault();
    const main = qs('#main-content');
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus();
      main.removeAttribute('tabindex');
    }
  });
}

/**
 * Detects if the user prefers reduced motion.
 * @returns {boolean} True if the user prefers reduced motion.
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detects if the user prefers a dark color scheme.
 * @returns {boolean} True if the user prefers dark mode.
 */
export function prefersDarkMode() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Toggles high contrast mode on the document.
 * Persists the preference to localStorage.
 * @returns {boolean} The new high contrast state.
 */
export function toggleHighContrast() {
  const isActive = document.documentElement.classList.toggle('high-contrast');
  storage.set('high_contrast', isActive);
  announce(isActive ? 'High contrast mode enabled' : 'High contrast mode disabled');
  return isActive;
}

/**
 * Adjusts the base font size of the document.
 * @param {'increase'|'decrease'|'reset'} action - The font size action.
 */
export function adjustFontSize(action) {
  const root = document.documentElement;
  const currentSize = parseFloat(getComputedStyle(root).fontSize);

  let newSize = currentSize;

  switch (action) {
    case 'increase':
      newSize = Math.min(currentSize + APP_CONFIG.FONT_SIZE_STEP, APP_CONFIG.FONT_SIZE_MAX);
      break;
    case 'decrease':
      newSize = Math.max(currentSize - APP_CONFIG.FONT_SIZE_STEP, APP_CONFIG.FONT_SIZE_MIN);
      break;
    case 'reset':
      newSize = APP_CONFIG.FONT_SIZE_DEFAULT;
      break;
    default:
      return;
  }

  root.style.fontSize = `${newSize}px`;
  storage.set('font_size', newSize);
  announce(`Font size ${action === 'reset' ? 'reset to default' : action + 'd'}`);
}

/**
 * Initializes keyboard navigation for interactive elements.
 * Adds arrow key support for tab-like components.
 * @param {Element} container - The container with interactive elements.
 * @param {string} itemSelector - CSS selector for the interactive items.
 */
export function initKeyboardNav(container, itemSelector) {
  if (!container) {
    return;
  }

  container.addEventListener('keydown', (event) => {
    const items = qsa(itemSelector, container);
    const currentIndex = items.indexOf(document.activeElement);

    if (currentIndex === -1) {
      return;
    }

    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        newIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = (currentIndex - 1 + items.length) % items.length;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    items[newIndex].focus();
  });
}

/**
 * Restores persisted accessibility preferences on page load.
 */
export function restorePreferences() {
  const highContrast = storage.get('high_contrast', false);
  if (highContrast) {
    document.documentElement.classList.add('high-contrast');
  }

  const fontSize = storage.get('font_size');
  if (fontSize) {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }
}

/**
 * Initializes all accessibility features.
 */
export function initAccessibility() {
  restorePreferences();
  initSkipLinks();

  /* Create ARIA live regions */
  announce('');

  /* Add keyboard shortcut hints */
  document.addEventListener('keydown', (event) => {
    /* Alt+1: Toggle high contrast */
    if (event.altKey && event.key === '1') {
      event.preventDefault();
      toggleHighContrast();
    }
    /* Alt+Plus: Increase font */
    if (event.altKey && event.key === '+') {
      event.preventDefault();
      adjustFontSize('increase');
    }
    /* Alt+Minus: Decrease font */
    if (event.altKey && event.key === '-') {
      event.preventDefault();
      adjustFontSize('decrease');
    }
    /* Alt+0: Reset font */
    if (event.altKey && event.key === '0') {
      event.preventDefault();
      adjustFontSize('reset');
    }
  });
}
