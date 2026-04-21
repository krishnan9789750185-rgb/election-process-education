/**
 * @fileoverview Main application controller for ElectIQ.
 * Handles initialization, navigation, section management, theme control,
 * and Google Services bootstrapping.
 * @module app
 */

import { APP_CONFIG } from './constants.js';
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
    { threshold: 0.3 }
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
    nav.classList.toggle('nav--scrolled', scrollY > 60);
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
    }, 200 + index * 150);
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

  const PARTICLE_COUNT = 30;
  const PARTICLE_SYMBOLS = ['🗳️', '✓', '⭐', '📋', '🏛️', '✦', '◆'];

  let particles = [];
  let animFrameId = null;

  /** Resizes canvas to match container */
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  /** Creates a single particle */
  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: 10 + Math.random() * 14,
      opacity: 0.1 + Math.random() * 0.3,
      symbol: PARTICLE_SYMBOLS[Math.floor(Math.random() * PARTICLE_SYMBOLS.length)],
    };
  }

  /** Animation loop */
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      /* Wrap around edges */
      if (p.x < -20) { p.x = canvas.width + 20; }
      if (p.x > canvas.width + 20) { p.x = -20; }
      if (p.y < -20) { p.y = canvas.height + 20; }
      if (p.y > canvas.height + 20) { p.y = -20; }

      ctx.globalAlpha = p.opacity;
      ctx.font = `${p.size}px serif`;
      ctx.fillText(p.symbol, p.x, p.y);
    });

    ctx.globalAlpha = 1;
    animFrameId = requestAnimationFrame(animate);
  }

  resize();
  particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
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
 * Draws election data charts using Google Charts.
 */
function drawCharts() {
  drawVoterTurnoutChart();
  drawElectionMethodsChart();
}

/**
 * Draws the voter turnout trend chart.
 */
function drawVoterTurnoutChart() {
  const container = qs('#turnout-chart');
  if (!container || typeof google === 'undefined') {
    return;
  }

  const data = google.visualization.arrayToDataTable([
    ['Year', 'Voter Turnout %', { role: 'style' }],
    ['2004', 58.07, '#6C63FF'],
    ['2009', 58.19, '#7B73FF'],
    ['2014', 66.44, '#00D4AA'],
    ['2019', 67.40, '#00E4BA'],
    ['2024', 65.79, '#FFB347'],
  ]);

  const options = {
    title: 'Voter Turnout Trends in Indian General Elections',
    titleTextStyle: { color: '#E8E8FF', fontSize: 14, bold: true },
    backgroundColor: 'transparent',
    legend: { position: 'none' },
    hAxis: {
      title: 'Election Year',
      titleTextStyle: { color: '#A0A0CC' },
      textStyle: { color: '#A0A0CC' },
      gridlines: { color: '#1E2250' },
    },
    vAxis: {
      title: 'Turnout (%)',
      titleTextStyle: { color: '#A0A0CC' },
      textStyle: { color: '#A0A0CC' },
      gridlines: { color: '#1E2250' },
      minValue: 50,
    },
    chartArea: { width: '75%', height: '70%' },
    animation: { startup: true, duration: 1000, easing: 'out' },
  };

  const chart = new google.visualization.ColumnChart(container);
  chart.draw(data, options);
}

/**
 * Draws the global election methods pie chart.
 */
function drawElectionMethodsChart() {
  const container = qs('#methods-chart');
  if (!container || typeof google === 'undefined') {
    return;
  }

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
    titleTextStyle: { color: '#E8E8FF', fontSize: 14, bold: true },
    backgroundColor: 'transparent',
    legend: { position: 'right', textStyle: { color: '#A0A0CC', fontSize: 11 } },
    pieSliceTextStyle: { color: '#fff' },
    colors: ['#6C63FF', '#00D4AA', '#FFB347', '#FF6B8A', '#A78BFA'],
    chartArea: { width: '85%', height: '80%' },
    pieHole: 0.4,
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
