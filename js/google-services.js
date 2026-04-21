/**
 * @fileoverview Google Services integration module for ElectIQ.
 * Integrates Google Translate, Google Calendar, and Google Maps Platform
 * for a comprehensive Google ecosystem experience.
 * @module google-services
 */

import { qs, createElement, showToast } from './utils.js';
import { escapeHTML } from './security.js';
import { announce } from './accessibility.js';
import { logAnalyticsEvent, trackInteraction } from './firebase-config.js';
import { ELECTION_TIMELINE } from './constants.js';

/* ============================================================
 * GOOGLE TRANSLATE INTEGRATION
 * ============================================================ */

/**
 * Initializes the Google Translate widget for multi-language support.
 * Loads the Google Translate Element script and renders the widget.
 */
export function initGoogleTranslate() {
  /* Define the callback that Google Translate calls */
  window.googleTranslateElementInit = () => {
    try {
      new google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,hi,ta,te,bn,mr,gu,kn,ml,pa,ur,es,fr,de,zh-CN,ja,ar',
          layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google-translate-widget'
      );
      trackInteraction('google_translate', 'initialized');
    } catch (error) {
      console.warn('[ElectIQ] Google Translate initialization failed:', error.message);
    }
  };

  /* Load the Google Translate script */
  const script = document.createElement('script');
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  script.onerror = () => {
    const widget = qs('#google-translate-widget');
    if (widget) {
      widget.innerHTML = '<p class="translate-fallback">🌐 Translation requires internet connection</p>';
    }
  };
  document.head.appendChild(script);
}

/* ============================================================
 * GOOGLE CALENDAR INTEGRATION
 * ============================================================ */

/**
 * Election dates for calendar integration.
 * @constant {Array<Object>}
 */
const ELECTION_DATES = Object.freeze([
  {
    title: 'Voter Registration Deadline',
    date: '2026-09-15',
    description: 'Last day to register or update your voter registration for the upcoming election.',
    location: 'Your Local Election Office',
  },
  {
    title: 'Early Voting Begins',
    date: '2026-10-20',
    description: 'Early voting period opens. Cast your vote before Election Day at designated centers.',
    location: 'Early Voting Centers',
  },
  {
    title: 'Election Day',
    date: '2026-11-03',
    description: 'General Election Day. Vote at your assigned polling station.',
    location: 'Your Assigned Polling Station',
  },
  {
    title: 'Results Declaration',
    date: '2026-11-10',
    description: 'Official election results are expected to be declared.',
    location: 'Election Commission Headquarters',
  },
]);

/**
 * Initializes the Google Calendar date cards with "Add to Calendar" links.
 */
export function initGoogleCalendar() {
  const container = qs('#calendar-dates');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  ELECTION_DATES.forEach((event) => {
    const card = createElement('div', { className: 'calendar-card' });
    const formattedDate = new Date(event.date + 'T09:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    card.innerHTML = `
      <div class="calendar-card__date">
        <span class="calendar-card__month">${new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
        <span class="calendar-card__day">${new Date(event.date).getDate()}</span>
      </div>
      <div class="calendar-card__info">
        <h4 class="calendar-card__title">${escapeHTML(event.title)}</h4>
        <p class="calendar-card__desc">${escapeHTML(event.description)}</p>
        <p class="calendar-card__fulldate">${formattedDate}</p>
      </div>
      <a href="${generateGoogleCalendarURL(event)}" target="_blank" rel="noopener noreferrer"
         class="btn btn--secondary calendar-card__btn"
         aria-label="Add ${escapeHTML(event.title)} to Google Calendar"
         onclick="this.dispatchEvent(new CustomEvent('calendar-add'))">
        📅 Add to Calendar
      </a>
    `;

    card.addEventListener('calendar-add', () => {
      trackInteraction('google_calendar', 'add_event');
      logAnalyticsEvent('calendar_event_added', { event_title: event.title });
    });

    container.appendChild(card);
  });
}

/**
 * Generates a Google Calendar event creation URL.
 * @param {Object} event - The event data.
 * @param {string} event.title - Event title.
 * @param {string} event.date - Event date (YYYY-MM-DD).
 * @param {string} event.description - Event description.
 * @param {string} event.location - Event location.
 * @returns {string} The Google Calendar URL.
 */
function generateGoogleCalendarURL(event) {
  const startDate = event.date.replace(/-/g, '');
  const endDate = startDate; /* All-day event */
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDate}/${endDate}`,
    details: event.description + '\n\nReminder from ElectIQ - Election Process Education Platform',
    location: event.location,
    sf: 'true',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ============================================================
 * GOOGLE MAPS PLATFORM INTEGRATION
 * ============================================================ */

/**
 * Initializes the Google Maps polling station finder.
 * Uses the Maps Embed API for zero-cost, no-API-key-required embedding.
 */
export function initGoogleMaps() {
  const container = qs('#maps-container');
  if (!container) {
    return;
  }

  /* Render the maps search interface */
  container.innerHTML = `
    <div class="maps__search">
      <div class="maps__search-bar">
        <input type="text" id="maps-search-input"
               placeholder="Enter your area, city, or ZIP code"
               aria-label="Search for polling stations near you"
               class="maps__input" autocomplete="off">
        <button id="maps-search-btn" class="btn btn--primary maps__search-btn"
                aria-label="Search polling stations">
          🔍 Find Stations
        </button>
      </div>
      <p class="maps__hint">Search for "polling stations near [your location]" to find nearby voting centers</p>
    </div>
    <div class="maps__frame-container" id="maps-frame-container">
      <iframe id="maps-embed"
              class="maps__iframe"
              src="https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=polling+stations+near+me"
              width="100%" height="400" style="border:0;border-radius:var(--radius-lg)"
              allowfullscreen loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              title="Google Maps showing nearby polling stations"
              aria-label="Map showing nearby polling stations">
      </iframe>
    </div>
  `;

  /* Event listeners */
  const searchBtn = qs('#maps-search-btn');
  const searchInput = qs('#maps-search-input');

  if (searchBtn && searchInput) {
    const performSearch = () => {
      const query = searchInput.value.trim();
      if (!query) {
        showToast('Please enter a location to search', 'warning');
        return;
      }
      updateMapSearch(`polling stations near ${query}`);
      trackInteraction('google_maps', 'search');
      logAnalyticsEvent('maps_search', { query });
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }
}

/**
 * Updates the Google Maps embed with a new search query.
 * @param {string} query - The search query for the map.
 */
function updateMapSearch(query) {
  const iframe = qs('#maps-embed');
  if (!iframe) {
    return;
  }

  const encodedQuery = encodeURIComponent(query);
  iframe.src = `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedQuery}`;
  announce(`Map updated to show results for: ${query}`);
}

/* ============================================================
 * INITIALIZATION
 * ============================================================ */

/**
 * Initializes all Google Services integrations.
 */
export function initGoogleServices() {
  initGoogleTranslate();
  initGoogleCalendar();
  initGoogleMaps();
}
