/**
 * @fileoverview Role-Based Election Simulator module for ElectIQ.
 * Allows users to experience the election process from different perspectives
 * (Voter, Candidate, Election Officer) through branching interactive scenarios.
 * @module simulator
 */

import { SIMULATOR_ROLES, SIMULATOR_SCENARIOS, APP_CONFIG, SIMULATOR_GRADE_THRESHOLDS } from './constants.js';
import { qs, createElement, showToast, storage, delay } from './utils.js';
import { announce } from './accessibility.js';
import { escapeHTML } from './security.js';
import { saveSimulatorResult, logAnalyticsEvent } from './firebase-config.js';

/** @type {string|null} Currently selected role ID */
let currentRole = null;

/** @type {number} Current step index in the scenario */
let currentStepIndex = 0;

/** @type {number} Total score accumulated during simulation */
let totalScore = 0;

/** @type {Array<Object>} History of choices made during simulation */
let choiceHistory = [];

/** @type {boolean} Whether the simulation is in progress */
let isSimulating = false;

/**
 * Initializes the simulator module.
 * Sets up role selection cards and event listeners.
 */
export function initSimulator() {
  renderRoleSelection();
  setupEventListeners();

  /* Check for saved progress */
  const savedProgress = storage.get('simulator_progress', null);
  if (savedProgress && savedProgress.role) {
    offerResumePrompt(savedProgress);
  }
}

/**
 * Renders the role selection cards.
 */
function renderRoleSelection() {
  const container = qs('#simulator-roles');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  Object.values(SIMULATOR_ROLES).forEach((role) => {
    const card = createElement('button', {
      className: 'role-card',
      id: `role-card-${role.id}`,
      'aria-label': `Play as ${role.title}: ${role.description}`,
      dataset: { role: role.id },
    });

    card.innerHTML = `
      <span class="role-card__icon" aria-hidden="true">${role.icon}</span>
      <h3 class="role-card__title">${escapeHTML(role.title)}</h3>
      <p class="role-card__desc">${escapeHTML(role.description)}</p>
      <span class="role-card__cta">Start Simulation →</span>
    `;

    container.appendChild(card);
  });
}

/**
 * Sets up event listeners for the simulator.
 */
function setupEventListeners() {
  const rolesContainer = qs('#simulator-roles');
  const resetBtn = qs('#simulator-reset-btn');

  if (rolesContainer) {
    rolesContainer.addEventListener('click', (event) => {
      const card = event.target.closest('.role-card');
      if (card) {
        const roleId = card.dataset.role;
        startSimulation(roleId);
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetSimulation);
  }
}

/**
 * Offers to resume a previously saved simulation.
 * @param {Object} savedProgress - The saved progress data.
 */
function offerResumePrompt(savedProgress) {
  const role = SIMULATOR_ROLES[savedProgress.role];
  if (!role) {
    return;
  }

  showToast(
    `You have a saved ${role.title} simulation. Select the role again to restart.`,
    'info'
  );
}

/**
 * Starts a new simulation with the selected role.
 * @param {string} roleId - The role identifier.
 */
function startSimulation(roleId) {
  if (!SIMULATOR_ROLES[roleId] || !SIMULATOR_SCENARIOS[roleId]) {
    showToast('Invalid role selected', 'error');
    return;
  }

  currentRole = roleId;
  currentStepIndex = 0;
  totalScore = 0;
  choiceHistory = [];
  isSimulating = true;

  /* Hide role selection, show simulation area */
  const rolesSection = qs('#simulator-roles');
  const simArea = qs('#simulator-area');
  const resetBtn = qs('#simulator-reset-btn');

  if (rolesSection) {
    rolesSection.classList.add('hidden');
  }
  if (simArea) {
    simArea.classList.remove('hidden');
  }
  if (resetBtn) {
    resetBtn.classList.remove('hidden');
  }

  const role = SIMULATOR_ROLES[roleId];
  announce(`Starting simulation as ${role.title}`);

  renderCurrentStep();
}

/**
 * Renders the current scenario step.
 */
function renderCurrentStep() {
  const simArea = qs('#simulator-area');
  if (!simArea || !currentRole) {
    return;
  }

  const scenarios = SIMULATOR_SCENARIOS[currentRole];
  const step = scenarios[currentStepIndex];
  const role = SIMULATOR_ROLES[currentRole];
  const totalSteps = scenarios.length;

  simArea.innerHTML = '';

  /* Progress header */
  const progressHeader = createElement('div', { className: 'sim__progress-header' });
  progressHeader.innerHTML = `
    <div class="sim__role-badge" style="--role-color: ${role.color}">
      <span aria-hidden="true">${role.icon}</span>
      <span>${escapeHTML(role.title)}</span>
    </div>
    <div class="sim__step-counter">Step ${currentStepIndex + 1} of ${totalSteps}</div>
    <div class="sim__score">Score: <strong>${totalScore}</strong></div>
  `;

  /* Progress bar */
  const progressBar = createElement('div', { className: 'sim__progress-bar' });
  const progressFill = createElement('div', {
    className: 'sim__progress-fill',
    role: 'progressbar',
    'aria-valuenow': String(Math.round(((currentStepIndex) / totalSteps) * 100)),
    'aria-valuemin': '0',
    'aria-valuemax': '100',
  });
  progressFill.style.width = `${((currentStepIndex) / totalSteps) * 100}%`;
  progressBar.appendChild(progressFill);

  /* Step content */
  const stepContent = createElement('div', { className: 'sim__step-content' });
  stepContent.innerHTML = `
    <h3 class="sim__step-title">${step.icon || '📌'} ${escapeHTML(step.title)}</h3>
    <p class="sim__narrative">${escapeHTML(step.narrative)}</p>
  `;

  /* Choice buttons */
  const choicesContainer = createElement('div', {
    className: 'sim__choices',
    role: 'group',
    'aria-label': 'Choose your action',
  });

  step.choices.forEach((choice, index) => {
    const choiceBtn = createElement('button', {
      className: 'sim__choice-btn',
      id: `sim-choice-${index}`,
      dataset: { choiceIndex: String(index) },
      'aria-label': choice.text,
    });
    choiceBtn.innerHTML = `
      <span class="sim__choice-letter">${String.fromCharCode(65 + index)}</span>
      <span class="sim__choice-text">${escapeHTML(choice.text)}</span>
    `;

    choiceBtn.addEventListener('click', () => handleChoice(index));
    choicesContainer.appendChild(choiceBtn);
  });

  simArea.appendChild(progressHeader);
  simArea.appendChild(progressBar);
  simArea.appendChild(stepContent);
  simArea.appendChild(choicesContainer);

  announce(`Step ${currentStepIndex + 1}: ${step.title}. ${step.narrative}`);
}

/**
 * Handles the user's choice selection.
 * @param {number} choiceIndex - The index of the selected choice.
 */
async function handleChoice(choiceIndex) {
  if (!currentRole) {
    return;
  }

  const scenarios = SIMULATOR_SCENARIOS[currentRole];
  const step = scenarios[currentStepIndex];
  const choice = step.choices[choiceIndex];

  if (!choice) {
    return;
  }

  /* Disable all choice buttons */
  const buttons = qs('#simulator-area').querySelectorAll('.sim__choice-btn');
  buttons.forEach((btn) => {
    btn.disabled = true;
  });

  /* Highlight selected choice */
  const selectedBtn = qs(`#sim-choice-${choiceIndex}`);
  if (selectedBtn) {
    selectedBtn.classList.add(choice.isOptimal ? 'sim__choice-btn--correct' : 'sim__choice-btn--suboptimal');
  }

  /* Show optimal choice if different */
  if (!choice.isOptimal) {
    const optimalIndex = step.choices.findIndex((c) => c.isOptimal);
    const optimalBtn = qs(`#sim-choice-${optimalIndex}`);
    if (optimalBtn) {
      optimalBtn.classList.add('sim__choice-btn--correct');
    }
  }

  /* Record choice */
  totalScore += choice.points;
  choiceHistory.push({
    step: currentStepIndex + 1,
    title: step.title,
    chose: choice.text,
    isOptimal: choice.isOptimal,
    points: choice.points,
  });

  /* Show outcome */
  const outcomeEl = createElement('div', {
    className: `sim__outcome ${choice.isOptimal ? 'sim__outcome--good' : 'sim__outcome--warn'}`,
    role: 'alert',
  });
  outcomeEl.innerHTML = `
    <span class="sim__outcome-icon" aria-hidden="true">${choice.isOptimal ? '✅' : '💡'}</span>
    <p>${escapeHTML(choice.outcome)}</p>
    <span class="sim__outcome-points">${choice.isOptimal ? '+' : ''}${choice.points} points</span>
  `;

  const simArea = qs('#simulator-area');
  if (simArea) {
    simArea.appendChild(outcomeEl);
  }

  announce(choice.outcome);

  /* Log specific simulator decision to Firebase Analytics */
  logAnalyticsEvent('simulator_decision_made', {
    role: currentRole,
    step: currentStepIndex + 1,
    is_optimal: choice.isOptimal,
    points_earned: choice.points
  });

  /* Save progress */
  storage.set('simulator_progress', {
    role: currentRole,
    step: currentStepIndex,
    score: totalScore,
  });

  /* Next step button */
  await delay(APP_CONFIG.CHOICE_OUTCOME_DELAY_MS);

  const isLastStep = currentStepIndex >= scenarios.length - 1;
  const nextBtn = createElement(
    'button',
    {
      className: 'sim__next-btn btn btn--primary',
      id: 'sim-next-btn',
    },
    isLastStep ? '🏁 See Results' : '➡️ Next Step'
  );

  nextBtn.addEventListener('click', () => {
    if (isLastStep) {
      showResults();
    } else {
      currentStepIndex++;
      renderCurrentStep();
    }
  });

  if (simArea) {
    simArea.appendChild(nextBtn);
    nextBtn.focus();
  }
}

/**
 * Displays the final simulation results with score breakdown.
 */
function showResults() {
  const simArea = qs('#simulator-area');
  if (!simArea || !currentRole) {
    return;
  }

  const role = SIMULATOR_ROLES[currentRole];
  const scenarios = SIMULATOR_SCENARIOS[currentRole];
  const maxScore = scenarios.reduce(
    (sum, step) => sum + Math.max(...step.choices.map((c) => c.points)),
    0
  );
  const percentage = Math.round((totalScore / maxScore) * 100);

  let grade, gradeClass, gradeMessage;
  if (percentage >= SIMULATOR_GRADE_THRESHOLDS.EXCELLENT) {
    grade = '🌟 Excellent!';
    gradeClass = 'excellent';
    gradeMessage = 'You demonstrated outstanding knowledge of the election process!';
  } else if (percentage >= SIMULATOR_GRADE_THRESHOLDS.GOOD) {
    grade = '👍 Good Job!';
    gradeClass = 'good';
    gradeMessage = 'You have a solid understanding. Review the areas where you could improve.';
  } else {
    grade = '📚 Keep Learning!';
    gradeClass = 'learning';
    gradeMessage = 'Great effort! Explore the timeline to learn more about each step.';
  }

  simArea.innerHTML = '';

  const resultsEl = createElement('div', { className: 'sim__results' });
  resultsEl.innerHTML = `
    <div class="sim__results-header">
      <h3 class="sim__results-grade sim__results-grade--${gradeClass}">${grade}</h3>
      <p class="sim__results-message">${escapeHTML(gradeMessage)}</p>
    </div>
    <div class="sim__results-score">
      <div class="sim__score-circle" style="--score-pct: ${percentage}%">
        <span class="sim__score-value">${percentage}%</span>
        <span class="sim__score-label">${totalScore} / ${maxScore} pts</span>
      </div>
    </div>
    <div class="sim__results-breakdown">
      <h4>Decision Breakdown</h4>
      <div class="sim__choices-review">
        ${choiceHistory
          .map(
            (ch) => `
          <div class="sim__review-item ${ch.isOptimal ? 'sim__review-item--optimal' : ''}">
            <span class="sim__review-step">Step ${ch.step}</span>
            <span class="sim__review-title">${escapeHTML(ch.title)}</span>
            <span class="sim__review-result">${ch.isOptimal ? '✅' : '💡'} ${ch.points}pts</span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;

  /* Action buttons */
  const actions = createElement('div', { className: 'sim__results-actions' });

  const retryBtn = createElement('button', { className: 'btn btn--primary', id: 'sim-retry-btn' }, '🔄 Try Again');
  retryBtn.addEventListener('click', () => startSimulation(currentRole));

  const changeRoleBtn = createElement('button', { className: 'btn btn--secondary', id: 'sim-change-btn' }, '🔀 Try Another Role');
  changeRoleBtn.addEventListener('click', resetSimulation);

  actions.appendChild(retryBtn);
  actions.appendChild(changeRoleBtn);
  resultsEl.appendChild(actions);

  simArea.appendChild(resultsEl);
  announce(`Simulation complete! Your score: ${percentage}%. ${gradeMessage}`);

  /* Clear saved progress and save to Firestore */
  storage.remove('simulator_progress');
  saveSimulatorResult({
    role: currentRole,
    score: totalScore,
    maxScore: maxScore,
    choices: choiceHistory
  });
}

/**
 * Resets the simulation to role selection.
 */
function resetSimulation() {
  currentRole = null;
  currentStepIndex = 0;
  totalScore = 0;
  choiceHistory = [];
  isSimulating = false;

  const rolesSection = qs('#simulator-roles');
  const simArea = qs('#simulator-area');
  const resetBtn = qs('#simulator-reset-btn');

  if (rolesSection) {
    rolesSection.classList.remove('hidden');
  }
  if (simArea) {
    simArea.classList.add('hidden');
    simArea.innerHTML = '';
  }
  if (resetBtn) {
    resetBtn.classList.add('hidden');
  }

  storage.remove('simulator_progress');
  announce('Simulation reset. Choose a role to begin.');
}
