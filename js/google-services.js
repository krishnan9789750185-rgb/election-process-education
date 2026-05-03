/**
 * @fileoverview Google Services integration module for ElectIQ.
 * Integrates Google Translate, Google Calendar, and Google Maps Platform
 * for a comprehensive Google ecosystem experience.
 * @module google-services
 */

import { APP_CONFIG, ELECTION_DATES, GOOGLE_TRANSLATE_CONFIG } from './constants.js';
import { qs, createElement, showToast } from './utils.js';
import { escapeHTML } from './security.js';
import { announce } from './accessibility.js';
import { logAnalyticsEvent, trackInteraction } from './firebase-config.js';
import { ENV } from './env.js';

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
          pageLanguage: GOOGLE_TRANSLATE_CONFIG.PAGE_LANGUAGE,
          includedLanguages: GOOGLE_TRANSLATE_CONFIG.INCLUDED_LANGUAGES,
          layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        GOOGLE_TRANSLATE_CONFIG.ELEMENT_ID
      );
      trackInteraction('google_translate', 'initialized');
    } catch (error) {
      /* Google Translate init failed — widget will show fallback text */
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
 * Initializes the Google Calendar date cards with "Add to Calendar" links.
 * Renders interactive cards for each election date with Google Calendar integration.
 */
export function initGoogleCalendar() {
  const container = qs('#calendar-dates');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  ELECTION_DATES.forEach((event) => {
    const card = createElement('div', { className: 'calendar-card' });
    const eventDateObj = new Date(event.date + 'T09:00:00');
    const formattedDate = eventDateObj.toLocaleDateString('en-US', {
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
         id="cal-add-${event.date}">
        📅 Add to Calendar
      </a>
    `;

    /* Track calendar add events via click listener instead of inline handler */
    const addBtn = card.querySelector('.calendar-card__btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        trackInteraction('google_calendar', 'add_event');
        logAnalyticsEvent('calendar_event_added', { event_title: event.title });
      });
    }

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
 * @returns {string} The Google Calendar URL for creating the event.
 */
export function generateGoogleCalendarURL(event) {
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
 * Uses the Maps Embed API for embedding maps with search functionality.
 */
export function initGoogleMaps() {
  const container = qs('#maps-container');
  if (!container) {
    return;
  }

  const mapsApiKey = APP_CONFIG.MAPS_EMBED_API_KEY;

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
              src="https://www.google.com/maps/embed/v1/search?key=${mapsApiKey}&q=polling+stations+near+me"
              width="100%" height="400"
              style="border:0;border-radius:var(--radius-lg)"
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
    /**
     * Performs a polling station search on the map.
     */
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

  const mapsApiKey = ENV.MAPS_EMBED_API_KEY;
  const encodedQuery = encodeURIComponent(query);
  iframe.src = `https://www.google.com/maps/embed/v1/search?key=${mapsApiKey}&q=${encodedQuery}`;
  iframe.title = `Google Maps showing results for: ${query}`;
  announce(`Map updated to show results for: ${query}`);
}

/* ============================================================
 * INITIALIZATION
 * ============================================================ */

/**
 * Initializes all Google Services integrations.
 * Bootstraps Google Translate, Calendar, and Maps modules.
 */
export function initGoogleServices() {
  initGoogleTranslate();
  initGoogleCalendar();
  initGoogleMaps();
}
