/**
 * @fileoverview Interactive Election Timeline module for ElectIQ.
 * Renders a visual, scroll-animated timeline of the election process with
 * expandable step details, progress tracking, and keyboard navigation.
 * @module timeline
 */

import { ELECTION_TIMELINE } from './constants.js';
import { qs, qsa, createElement, scrollToElement, storage } from './utils.js';
import { announce, initKeyboardNav } from './accessibility.js';
import { escapeHTML } from './security.js';

/** @type {number} Currently active/expanded step index */
let activeStep = -1;

/** @type {Set<number>} Set of visited step IDs */
let visitedSteps = new Set();

/**
 * Initializes the timeline module.
 * Renders timeline steps, sets up observers and event listeners.
 */
export function initTimeline() {
  const container = qs('#timeline-container');
  if (!container) {
    return;
  }

  /* Load visited steps from storage */
  const saved = storage.get('visited_steps', []);
  visitedSteps = new Set(saved);

  renderTimeline(container);
  setupScrollObserver();
  setupEventListeners();
  updateProgress();
}

/**
 * Renders the full timeline into the container.
 * @param {Element} container - The timeline container element.
 */
function renderTimeline(container) {
  container.innerHTML = '';

  /* Progress bar */
  const progressBar = createElement('div', { className: 'timeline__progress', id: 'timeline-progress' });
  const progressFill = createElement('div', {
    className: 'timeline__progress-fill',
    id: 'timeline-progress-fill',
    role: 'progressbar',
    'aria-valuenow': '0',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-label': 'Election process learning progress',
  });
  progressBar.appendChild(progressFill);
  container.appendChild(progressBar);

  /* Progress text */
  const progressText = createElement(
    'p',
    { className: 'timeline__progress-text', id: 'timeline-progress-text' },
    '0 of 10 steps explored'
  );
  container.appendChild(progressText);

  /* Timeline steps */
  const stepsContainer = createElement('div', {
    className: 'timeline__steps',
    role: 'list',
    'aria-label': 'Election process steps',
  });

  ELECTION_TIMELINE.forEach((step, index) => {
    const stepEl = createStepElement(step, index);
    stepsContainer.appendChild(stepEl);
  });

  container.appendChild(stepsContainer);

  /* Initialize keyboard navigation */
  initKeyboardNav(stepsContainer, '.timeline__step-header');
}

/**
 * Creates a timeline step element.
 * @param {Object} step - The step data from ELECTION_TIMELINE.
 * @param {number} index - The step index.
 * @returns {Element} The constructed step element.
 */
function createStepElement(step, index) {
  const isVisited = visitedSteps.has(step.id);

  const stepEl = createElement('div', {
    className: `timeline__step ${isVisited ? 'timeline__step--visited' : ''}`,
    id: `timeline-step-${step.id}`,
    role: 'listitem',
    dataset: { stepId: String(step.id) },
  });

  /* Connector line */
  if (index > 0) {
    stepEl.appendChild(createElement('div', { className: 'timeline__connector' }));
  }

  /* Step number badge */
  const badge = createElement(
    'div',
    { className: 'timeline__badge' },
    createElement('span', { className: 'timeline__badge-number' }, String(step.id)),
    createElement('span', { className: 'timeline__badge-icon' }, step.icon)
  );

  /* Step header (clickable) */
  const header = createElement('button', {
    className: 'timeline__step-header',
    'aria-expanded': 'false',
    'aria-controls': `step-details-${step.id}`,
    id: `step-header-${step.id}`,
    tabindex: index === 0 ? '0' : '-1',
  });

  const headerContent = createElement('div', { className: 'timeline__step-header-content' });
  headerContent.appendChild(createElement('span', { className: 'timeline__duration' }, step.duration));
  headerContent.appendChild(createElement('h3', { className: 'timeline__step-title' }, step.title));
  headerContent.appendChild(createElement('p', { className: 'timeline__step-summary' }, step.summary));

  header.appendChild(badge);
  header.appendChild(headerContent);
  header.appendChild(createElement('span', { className: 'timeline__expand-icon', 'aria-hidden': 'true' }, '▼'));

  /* Step details (collapsed by default) */
  const details = createElement('div', {
    className: 'timeline__step-details',
    id: `step-details-${step.id}`,
    role: 'region',
    'aria-labelledby': `step-header-${step.id}`,
    hidden: 'true',
  });

  const detailsList = createElement('ul', { className: 'timeline__details-list' });
  step.details.forEach((detail) => {
    detailsList.appendChild(createElement('li', {}, detail));
  });
  details.appendChild(detailsList);

  /* Key fact callout */
  const keyFact = createElement(
    'div',
    { className: 'timeline__key-fact' },
    createElement('span', { className: 'timeline__key-fact-icon', 'aria-hidden': 'true' }, '💡'),
    createElement('span', {}, createElement('strong', {}, 'Key Fact: '), step.keyFact)
  );
  details.appendChild(keyFact);

  stepEl.appendChild(header);
  stepEl.appendChild(details);

  return stepEl;
}

/**
 * Sets up event listeners for timeline interaction.
 */
function setupEventListeners() {
  const stepsContainer = qs('.timeline__steps');
  if (!stepsContainer) {
    return;
  }

  /* Event delegation for step headers */
  stepsContainer.addEventListener('click', (event) => {
    const header = event.target.closest('.timeline__step-header');
    if (header) {
      const stepEl = header.closest('.timeline__step');
      const stepId = Number(stepEl.dataset.stepId);
      toggleStep(stepId);
    }
  });

  /* Keyboard support */
  stepsContainer.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      const header = event.target.closest('.timeline__step-header');
      if (header) {
        event.preventDefault();
        const stepEl = header.closest('.timeline__step');
        const stepId = Number(stepEl.dataset.stepId);
        toggleStep(stepId);
      }
    }
  });
}

/**
 * Toggles the expanded/collapsed state of a timeline step.
 * @param {number} stepId - The step ID to toggle.
 */
function toggleStep(stepId) {
  const stepEl = qs(`#timeline-step-${stepId}`);
  const header = qs(`#step-header-${stepId}`);
  const details = qs(`#step-details-${stepId}`);

  if (!stepEl || !header || !details) {
    return;
  }

  const isExpanded = header.getAttribute('aria-expanded') === 'true';

  /* Collapse previously active step */
  if (activeStep !== -1 && activeStep !== stepId) {
    collapseStep(activeStep);
  }

  if (isExpanded) {
    collapseStep(stepId);
    activeStep = -1;
  } else {
    expandStep(stepId);
    activeStep = stepId;

    /* Mark as visited */
    if (!visitedSteps.has(stepId)) {
      visitedSteps.add(stepId);
      stepEl.classList.add('timeline__step--visited');
      storage.set('visited_steps', Array.from(visitedSteps));
      updateProgress();
    }
  }
}

/**
 * Expands a timeline step to show its details.
 * @param {number} stepId - The step ID to expand.
 */
function expandStep(stepId) {
  const header = qs(`#step-header-${stepId}`);
  const details = qs(`#step-details-${stepId}`);
  const stepEl = qs(`#timeline-step-${stepId}`);

  if (!header || !details || !stepEl) {
    return;
  }

  header.setAttribute('aria-expanded', 'true');
  details.removeAttribute('hidden');
  stepEl.classList.add('timeline__step--active');

  const step = ELECTION_TIMELINE.find((s) => s.id === stepId);
  if (step) {
    announce(`Expanded: ${step.title}. ${step.summary}`);
  }
}

/**
 * Collapses a timeline step to hide its details.
 * @param {number} stepId - The step ID to collapse.
 */
function collapseStep(stepId) {
  const header = qs(`#step-header-${stepId}`);
  const details = qs(`#step-details-${stepId}`);
  const stepEl = qs(`#timeline-step-${stepId}`);

  if (!header || !details || !stepEl) {
    return;
  }

  header.setAttribute('aria-expanded', 'false');
  details.setAttribute('hidden', 'true');
  stepEl.classList.remove('timeline__step--active');
}

/**
 * Sets up IntersectionObserver for scroll-based step animations.
 */
function setupScrollObserver() {
  const steps = qsa('.timeline__step');

  if (!steps.length || !('IntersectionObserver' in window)) {
    /* Fallback: show all steps immediately */
    steps.forEach((step) => step.classList.add('timeline__step--visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('timeline__step--visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
  );

  steps.forEach((step) => observer.observe(step));
}

/**
 * Updates the progress bar and text based on visited steps.
 */
function updateProgress() {
  const total = ELECTION_TIMELINE.length;
  const visited = visitedSteps.size;
  const percentage = Math.round((visited / total) * 100);

  const progressFill = qs('#timeline-progress-fill');
  const progressText = qs('#timeline-progress-text');

  if (progressFill) {
    progressFill.style.width = `${percentage}%`;
    progressFill.setAttribute('aria-valuenow', String(percentage));
  }

  if (progressText) {
    progressText.textContent = `${visited} of ${total} steps explored (${percentage}%)`;
  }

  if (visited === total) {
    announce('Congratulations! You have explored all steps of the election process!');
  }
}
