/**
 * @fileoverview Main application controller for ElectIQ.
 * Handles initialization, navigation, section management, theme control,
 * and Google Services bootstrapping.
 * @module app
 */

import { APP_CONFIG, CHART_CONFIG, PARTICLE_SYMBOLS } from './constants.js';
import { enforceCSP } from './security.js';
import { qs, qsa, throttle, showToast } from './utils.js';
import { initAccessibility, announce, prefersReducedMotion, toggleHighContrast, adjustFontSize } from './accessibility.js';
import { initAssistant } from './assistant.js';
import { initTimeline } from './timeline.js';
import { initSimulator } from './simulator.js';
import { initQuiz } from './quiz.js';
import { initFirebase, trackSectionView, logAnalyticsEvent } from './firebase-config.js';
import { initGoogleServices } from './google-services.js';

/** @type {string} Currently active section ID */
let activeSection = 'hero';

/**
 * Initializes the entire application.
 * Called when the DOM is fully loaded.
 * @returns {Promise<void>}
 */
async function initApp() {
  /* Security first */
  enforceCSP();

  /* Accessibility setup */
  initAccessibility();

  /* Navigation setup */
  setupNavigation();
  setupMobileMenu();
  setupScrollEffects();

  /* Initialize Firebase (Auth, Firestore, Analytics) */
  await initFirebase();
  logAnalyticsEvent('app_initialized', { version: APP_CONFIG.APP_VERSION });

  /* Initialize feature modules */
  initTimeline();
  initAssistant();
  initSimulator();
  initQuiz();

  /* Initialize Google Services (Translate, Calendar, Maps) */
  initGoogleServices();

  /* Setup accessibility toolbar */
  setupAccessibilityToolbar();

  /* Animate hero section */
  animateHero();

  /* Google Charts integration */
  loadGoogleCharts();

  announce('ElectIQ application loaded. Navigate using the menu or scroll through sections.');
}

/**
 * Sets up the main navigation with smooth scrolling and active state tracking.
 */
function setupNavigation() {
  const navLinks = qsa('.nav__link');

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetId = link.getAttribute('href')?.replace('#', '');
      if (targetId) {
        navigateToSection(targetId);
        /* Close mobile menu if open */
        const navMenu = qs('.nav__menu');
        if (navMenu) {
          navMenu.classList.remove('nav__menu--open');
        }
      }
    });
  });

  /* Track active section on scroll */
  const sections = qsa('section[id]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          updateActiveNav(entry.target.id);
          trackSectionView(entry.target.id);
        }
      });
    },
    { threshold: APP_CONFIG.INTERSECTION_THRESHOLD }
  );

  sections.forEach((section) => observer.observe(section));
}

/**
 * Navigates to a specific section with smooth scrolling.
 * @param {string} sectionId - The ID of the target section.
 */
function navigateToSection(sectionId) {
  const section = qs(`#${sectionId}`);
  if (!section) {
    return;
  }

  activeSection = sectionId;
  section.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  });

  updateActiveNav(sectionId);
  announce(`Navigated to ${sectionId.replace(/-/g, ' ')} section`);
}

/**
 * Updates the active navigation link visual state.
 * @param {string} sectionId - The currently active section ID.
 */
function updateActiveNav(sectionId) {
  const navLinks = qsa('.nav__link');
  navLinks.forEach((link) => {
    const href = link.getAttribute('href')?.replace('#', '');
    const isActive = href === sectionId;
    link.classList.toggle('nav__link--active', isActive);
    link.setAttribute('aria-current', isActive ? 'true' : 'false');
  });
}

/**
 * Sets up the mobile hamburger menu toggle.
 */
function setupMobileMenu() {
  const toggleBtn = qs('#nav-toggle');
  const navMenu = qs('.nav__menu');

  if (!toggleBtn || !navMenu) {
    return;
  }

  toggleBtn.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('nav__menu--open');
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    toggleBtn.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    announce(isOpen ? 'Navigation menu opened' : 'Navigation menu closed');
  });

  /* Close on Escape */
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navMenu.classList.contains('nav__menu--open')) {
      navMenu.classList.remove('nav__menu--open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.focus();
    }
  });
}

/**
 * Sets up scroll-based effects for the navigation bar.
 */
function setupScrollEffects() {
  const nav = qs('.nav');
  if (!nav) {
    return;
  }

  const handleScroll = throttle(() => {
    const scrollY = window.scrollY;
    nav.classList.toggle('nav--scrolled', scrollY > APP_CONFIG.SCROLL_THRESHOLD_PX);
  });

  window.addEventListener('scroll', handleScroll, { passive: true });
}

/**
 * Sets up the accessibility toolbar buttons.
 */
function setupAccessibilityToolbar() {
  const contrastBtn = qs('#btn-contrast');
  const fontIncBtn = qs('#btn-font-inc');
  const fontDecBtn = qs('#btn-font-dec');

  if (contrastBtn) {
    contrastBtn.addEventListener('click', toggleHighContrast);
  }
  if (fontIncBtn) {
    fontIncBtn.addEventListener('click', () => adjustFontSize('increase'));
  }
  if (fontDecBtn) {
    fontDecBtn.addEventListener('click', () => adjustFontSize('decrease'));
  }
}

/**
 * Animates the hero section elements on load.
 */
function animateHero() {
  if (prefersReducedMotion()) {
    /* Show everything immediately without animation */
    qsa('.hero__animate').forEach((el) => el.classList.add('hero__animate--visible'));
    return;
  }

  const elements = qsa('.hero__animate');
  elements.forEach((el, index) => {
    setTimeout(() => {
      el.classList.add('hero__animate--visible');
    }, APP_CONFIG.HERO_ANIMATION_BASE_DELAY_MS + index * APP_CONFIG.HERO_ANIMATION_STAGGER_MS);
  });

  /* Start particle animation */
  initParticles();
}

/**
 * Initializes the decorative particle animation in the hero section.
 * Creates floating ballot/democracy-themed particles.
 */
function initParticles() {
  const canvas = qs('#hero-particles');
  if (!canvas || prefersReducedMotion()) {
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  let particles = [];
  let animFrameId = null;

  /**
   * Resizes canvas to match its parent container dimensions.
   */
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  /**
   * Creates a single particle with random properties.
   * @returns {Object} A particle object with position, velocity, size, opacity, and symbol.
   */
  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - APP_CONFIG.PARTICLE_VELOCITY_RANGE) * APP_CONFIG.PARTICLE_VELOCITY_RANGE,
      vy: (Math.random() - APP_CONFIG.PARTICLE_VELOCITY_RANGE) * APP_CONFIG.PARTICLE_VELOCITY_RANGE,
      size: APP_CONFIG.PARTICLE_MIN_SIZE + Math.random() * APP_CONFIG.PARTICLE_SIZE_RANGE,
      opacity: APP_CONFIG.PARTICLE_MIN_OPACITY + Math.random() * APP_CONFIG.PARTICLE_OPACITY_RANGE,
      symbol: PARTICLE_SYMBOLS[Math.floor(Math.random() * PARTICLE_SYMBOLS.length)],
    };
  }

  /**
   * Runs the particle animation loop, updating positions and drawing each frame.
   */
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      const wrapOffset = APP_CONFIG.PARTICLE_WRAP_OFFSET;
      /* Wrap around edges */
      if (p.x < -wrapOffset) { p.x = canvas.width + wrapOffset; }
      if (p.x > canvas.width + wrapOffset) { p.x = -wrapOffset; }
      if (p.y < -wrapOffset) { p.y = canvas.height + wrapOffset; }
      if (p.y > canvas.height + wrapOffset) { p.y = -wrapOffset; }

      ctx.globalAlpha = p.opacity;
      ctx.font = `${p.size}px serif`;
      ctx.fillText(p.symbol, p.x, p.y);
    });

    ctx.globalAlpha = 1;
    animFrameId = requestAnimationFrame(animate);
  }

  resize();
  particles = Array.from({ length: APP_CONFIG.PARTICLE_COUNT }, createParticle);
  animate();

  window.addEventListener('resize', throttle(resize));

  /* Cleanup on page unload */
  window.addEventListener('beforeunload', () => {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
    }
  });
}

/**
 * Loads Google Charts library and renders the election data visualization.
 */
function loadGoogleCharts() {
  const chartContainer = qs('#turnout-chart');
  if (!chartContainer) {
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://www.gstatic.com/charts/loader.js';
  script.async = true;
  script.onload = () => {
    if (typeof google !== 'undefined' && google.charts) {
      google.charts.load('current', { packages: ['corechart', 'bar'] });
      google.charts.setOnLoadCallback(drawCharts);
    }
  };
  script.onerror = () => {
    chartContainer.innerHTML = '<p class="chart-fallback">📊 Chart visualization requires an internet connection.</p>';
  };
  document.head.appendChild(script);
}

/**
 * Draws all election data charts.
 */
function drawCharts() {
  drawVoterTurnoutChart();
  drawElectionMethodsChart();
}

/**
 * Draws the voter turnout trend chart using Google Charts ColumnChart.
 */
function drawVoterTurnoutChart() {
  const container = qs('#turnout-chart');
  if (!container || typeof google === 'undefined') {
    return;
  }

  const { COLORS } = CHART_CONFIG;

  const data = google.visualization.arrayToDataTable([
    ['Year', 'Voter Turnout %', { role: 'style' }],
    ['2004', 58.07, COLORS.PRIMARY],
    ['2009', 58.19, COLORS.PRIMARY_LIGHT],
    ['2014', 66.44, COLORS.SECONDARY],
    ['2019', 67.40, COLORS.SECONDARY_LIGHT],
    ['2024', 65.79, COLORS.TERTIARY],
  ]);

  const options = {
    title: 'Voter Turnout Trends in Indian General Elections',
    titleTextStyle: { color: COLORS.TEXT, fontSize: CHART_CONFIG.TITLE_FONT_SIZE, bold: true },
    backgroundColor: 'transparent',
    legend: { position: 'none' },
    hAxis: {
      title: 'Election Year',
      titleTextStyle: { color: COLORS.TEXT_MUTED },
      textStyle: { color: COLORS.TEXT_MUTED },
      gridlines: { color: COLORS.GRID },
    },
    vAxis: {
      title: 'Turnout (%)',
      titleTextStyle: { color: COLORS.TEXT_MUTED },
      textStyle: { color: COLORS.TEXT_MUTED },
      gridlines: { color: COLORS.GRID },
      minValue: CHART_CONFIG.TURNOUT_MIN_VALUE,
    },
    chartArea: CHART_CONFIG.CHART_AREA_BAR,
    animation: { startup: true, duration: APP_CONFIG.CHART_ANIMATION_DURATION_MS, easing: 'out' },
  };

  const chart = new google.visualization.ColumnChart(container);
  chart.draw(data, options);
}

/**
 * Draws the global election methods pie chart using Google Charts PieChart.
 */
function drawElectionMethodsChart() {
  const container = qs('#methods-chart');
  if (!container || typeof google === 'undefined') {
    return;
  }

  const { COLORS } = CHART_CONFIG;

  const data = google.visualization.arrayToDataTable([
    ['Method', 'Countries Using'],
    ['First Past The Post', 44],
    ['Proportional Representation', 85],
    ['Mixed Systems', 30],
    ['Two-Round System', 22],
    ['Other Systems', 12],
  ]);

  const options = {
    title: 'Electoral Systems Used Worldwide',
    titleTextStyle: { color: COLORS.TEXT, fontSize: CHART_CONFIG.TITLE_FONT_SIZE, bold: true },
    backgroundColor: 'transparent',
    legend: { position: 'right', textStyle: { color: COLORS.TEXT_MUTED, fontSize: CHART_CONFIG.LEGEND_FONT_SIZE } },
    pieSliceTextStyle: { color: '#fff' },
    colors: [COLORS.PRIMARY, COLORS.SECONDARY, COLORS.TERTIARY, COLORS.DANGER, COLORS.PURPLE],
    chartArea: CHART_CONFIG.CHART_AREA_PIE,
    pieHole: CHART_CONFIG.PIE_HOLE_SIZE,
  };

  const chart = new google.visualization.PieChart(container);
  chart.draw(data, options);
}

/* ============================================================
 * APPLICATION BOOTSTRAP
 * ============================================================ */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
