/**
 * @fileoverview Gamified Quiz Engine module for ElectIQ.
 * Provides an interactive election knowledge quiz with timer, scoring,
 * streak tracking, difficulty indicators, and detailed results.
 * @module quiz
 */

import { QUIZ_QUESTIONS, APP_CONFIG, DIFFICULTY_COLORS, QUIZ_GRADE_THRESHOLDS } from './constants.js';
import { qs, createElement, showToast, storage, delay, formatScore } from './utils.js';
import { announce } from './accessibility.js';
import { escapeHTML } from './security.js';
import { saveQuizScore, logAnalyticsEvent } from './firebase-config.js';

/** @type {Array<Object>} Shuffled quiz questions for current session */
let questions = [];

/** @type {number} Current question index */
let currentIndex = 0;

/** @type {number} Total correct answers */
let correctCount = 0;

/** @type {number} Current answer streak */
let streak = 0;

/** @type {number} Best streak achieved */
let bestStreak = 0;

/** @type {number|null} Timer interval ID */
let timerInterval = null;

/** @type {number} Seconds remaining for current question */
let timeRemaining = 0;

/** @type {Array<Object>} Detailed results for each question */
let results = [];

/** @type {boolean} Whether quiz is active */
let isActive = false;

/**
 * Initializes the quiz module.
 * Sets up the start screen and event listeners.
 */
export function initQuiz() {
  renderStartScreen();
  setupEventListeners();
}

/**
 * Renders the quiz start screen with stats and start button.
 */
function renderStartScreen() {
  const container = qs('#quiz-container');
  if (!container) {
    return;
  }

  const highScore = storage.get('quiz_high_score', 0);
  const totalAttempts = storage.get('quiz_attempts', 0);

  container.innerHTML = `
    <div class="quiz__start">
      <div class="quiz__start-icon" aria-hidden="true">🧠</div>
      <h3 class="quiz__start-title">Test Your Election Knowledge</h3>
      <p class="quiz__start-desc">
        Answer ${QUIZ_QUESTIONS.length} questions about the democratic election process.
        Challenge yourself with a timed quiz featuring easy, medium, and hard questions!
      </p>
      <div class="quiz__stats-grid">
        <div class="quiz__stat">
          <span class="quiz__stat-value">${QUIZ_QUESTIONS.length}</span>
          <span class="quiz__stat-label">Questions</span>
        </div>
        <div class="quiz__stat">
          <span class="quiz__stat-value">${APP_CONFIG.QUIZ_TIME_PER_QUESTION_S}s</span>
          <span class="quiz__stat-label">Per Question</span>
        </div>
        <div class="quiz__stat">
          <span class="quiz__stat-value">${highScore}%</span>
          <span class="quiz__stat-label">Best Score</span>
        </div>
        <div class="quiz__stat">
          <span class="quiz__stat-value">${totalAttempts}</span>
          <span class="quiz__stat-label">Attempts</span>
        </div>
      </div>
      <button class="btn btn--primary btn--lg" id="quiz-start-btn">
        🚀 Start Quiz
      </button>
    </div>
  `;
}

/**
 * Sets up event listeners for quiz interaction.
 */
function setupEventListeners() {
  const container = qs('#quiz-container');
  if (!container) {
    return;
  }

  container.addEventListener('click', (event) => {
    const target = event.target;

    if (target.id === 'quiz-start-btn') {
      startQuiz();
    } else if (target.id === 'quiz-restart-btn') {
      startQuiz();
    } else if (target.id === 'quiz-home-btn') {
      renderStartScreen();
    } else if (target.closest('.quiz__option') && isActive) {
      const optionBtn = target.closest('.quiz__option');
      const index = Number(optionBtn.dataset.optionIndex);
      handleAnswer(index);
    }
  });
}

/**
 * Starts a new quiz session.
 * Shuffles questions and resets all state.
 */
function startQuiz() {
  /* Shuffle questions */
  questions = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
  currentIndex = 0;
  correctCount = 0;
  streak = 0;
  bestStreak = 0;
  results = [];
  isActive = true;

  /* Increment attempt counter */
  const attempts = storage.get('quiz_attempts', 0);
  storage.set('quiz_attempts', attempts + 1);

  renderQuestion();
  announce('Quiz started! Good luck!');
}

/**
 * Renders the current question with options and timer.
 */
function renderQuestion() {
  const container = qs('#quiz-container');
  if (!container || currentIndex >= questions.length) {
    return;
  }

  const question = questions[currentIndex];
  const totalQ = questions.length;

  /* Clear previous timer */
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  timeRemaining = APP_CONFIG.QUIZ_TIME_PER_QUESTION_S;

  const difficultyColor = DIFFICULTY_COLORS[question.difficulty] || DIFFICULTY_COLORS.medium;

  container.innerHTML = `
    <div class="quiz__question-view">
      <div class="quiz__header">
        <div class="quiz__progress-info">
          <span class="quiz__counter">Question ${currentIndex + 1}/${totalQ}</span>
          <span class="quiz__streak" title="Current streak">🔥 ${streak}</span>
        </div>
        <div class="quiz__timer" id="quiz-timer" role="timer" aria-label="Time remaining">
          <svg class="quiz__timer-svg" viewBox="0 0 36 36" aria-hidden="true">
            <circle class="quiz__timer-bg" cx="18" cy="18" r="16"/>
            <circle class="quiz__timer-ring" id="quiz-timer-ring" cx="18" cy="18" r="16"
              stroke-dasharray="100" stroke-dashoffset="0"/>
          </svg>
          <span class="quiz__timer-text" id="quiz-timer-text">${timeRemaining}</span>
        </div>
      </div>

      <div class="quiz__progress-bar">
        <div class="quiz__progress-fill" style="width: ${(currentIndex / totalQ) * 100}%"></div>
      </div>

      <div class="quiz__body">
        <span class="quiz__difficulty" style="--diff-color: ${difficultyColor}">
          ${escapeHTML(question.difficulty.toUpperCase())} • ${escapeHTML(question.category)}
        </span>
        <h3 class="quiz__question-text">${escapeHTML(question.question)}</h3>

        <div class="quiz__options" role="radiogroup" aria-label="Answer options">
          ${question.options
            .map(
              (opt, i) => `
            <button class="quiz__option" id="quiz-opt-${i}" data-option-index="${i}"
              role="radio" aria-checked="false" aria-label="Option ${String.fromCharCode(65 + i)}: ${escapeHTML(opt)}">
              <span class="quiz__option-letter">${String.fromCharCode(65 + i)}</span>
              <span class="quiz__option-text">${escapeHTML(opt)}</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;

  /* Start timer */
  startTimer();
  announce(`Question ${currentIndex + 1}: ${question.question}`);
}

/**
 * Starts the countdown timer for the current question.
 */
function startTimer() {
  const timerText = qs('#quiz-timer-text');
  const timerRing = qs('#quiz-timer-ring');
  const totalTime = APP_CONFIG.QUIZ_TIME_PER_QUESTION_S;

  timerInterval = setInterval(() => {
    timeRemaining--;

    if (timerText) {
      timerText.textContent = timeRemaining;
    }

    if (timerRing) {
      const offset = ((totalTime - timeRemaining) / totalTime) * 100;
      timerRing.style.strokeDashoffset = String(offset);
    }

    /* Visual warning when time is low */
    const timerEl = qs('#quiz-timer');
    if (timerEl && timeRemaining <= APP_CONFIG.TIMER_WARNING_THRESHOLD_S) {
      timerEl.classList.add('quiz__timer--warning');
    }

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      handleTimeout();
    }
  }, 1000);
}

/**
 * Handles when time runs out for a question.
 */
function handleTimeout() {
  if (!isActive) {
    return;
  }

  const question = questions[currentIndex];

  results.push({
    question: question.question,
    userAnswer: null,
    correctAnswer: question.options[question.correct],
    isCorrect: false,
    timedOut: true,
  });

  streak = 0;
  showCorrectAnswer(question, -1);
  announce('Time is up! Moving to next question.');
}

/**
 * Handles the user's answer selection.
 * @param {number} selectedIndex - The index of the selected option.
 */
async function handleAnswer(selectedIndex) {
  if (!isActive) {
    return;
  }

  /* Stop timer */
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  const question = questions[currentIndex];
  const isCorrect = selectedIndex === question.correct;

  /* Disable all options */
  const options = qs('#quiz-container').querySelectorAll('.quiz__option');
  options.forEach((opt) => {
    opt.disabled = true;
  });

  /* Track results */
  results.push({
    question: question.question,
    userAnswer: question.options[selectedIndex],
    correctAnswer: question.options[question.correct],
    isCorrect,
    timedOut: false,
  });

  if (isCorrect) {
    correctCount++;
    streak++;
    bestStreak = Math.max(bestStreak, streak);
  } else {
    streak = 0;
  }

  /* Log specific answer interaction to Firebase Analytics */
  logAnalyticsEvent('quiz_answer_submitted', {
    question_index: currentIndex,
    is_correct: isCorrect,
    streak: streak
  });

  showCorrectAnswer(question, selectedIndex);
  announce(isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${question.options[question.correct]}`);
}

/**
 * Visually highlights the correct and incorrect answers.
 * @param {Object} question - The current question data.
 * @param {number} selectedIndex - The user's selected option index (-1 for timeout).
 */
async function showCorrectAnswer(question, selectedIndex) {
  const options = qs('#quiz-container').querySelectorAll('.quiz__option');

  options.forEach((opt, i) => {
    opt.disabled = true;
    if (i === question.correct) {
      opt.classList.add('quiz__option--correct');
    } else if (i === selectedIndex && selectedIndex !== question.correct) {
      opt.classList.add('quiz__option--wrong');
    }
  });

  /* Show explanation */
  const body = qs('.quiz__body');
  if (body) {
    const explanation = createElement('div', {
      className: 'quiz__explanation',
      role: 'alert',
    });
    explanation.innerHTML = `
      <span class="quiz__explanation-icon" aria-hidden="true">💡</span>
      <p>${escapeHTML(question.explanation)}</p>
    `;
    body.appendChild(explanation);
  }

  /* Wait then proceed */
  await delay(APP_CONFIG.ANSWER_EXPLANATION_DELAY_MS);

  currentIndex++;
  if (currentIndex >= questions.length) {
    showQuizResults();
  } else {
    renderQuestion();
  }
}

/**
 * Displays the final quiz results with detailed breakdown.
 */
function showQuizResults() {
  isActive = false;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  const container = qs('#quiz-container');
  if (!container) {
    return;
  }

  const totalQ = questions.length;
  const percentage = Math.round((correctCount / totalQ) * 100);

  /* Update high score */
  const currentHighScore = storage.get('quiz_high_score', 0);
  if (percentage > currentHighScore) {
    storage.set('quiz_high_score', percentage);
  }

  /* Save score to Firestore database and Leaderboard */
  saveQuizScore({
    score: percentage,
    correct: correctCount,
    total: totalQ,
    bestStreak: bestStreak
  });

  let grade, gradeEmoji;
  if (percentage >= QUIZ_GRADE_THRESHOLDS.EXPERT) {
    grade = 'Election Expert!';
    gradeEmoji = '🏆';
  } else if (percentage >= QUIZ_GRADE_THRESHOLDS.INFORMED) {
    grade = 'Well Informed Citizen';
    gradeEmoji = '⭐';
  } else if (percentage >= QUIZ_GRADE_THRESHOLDS.LEARNING) {
    grade = 'Learning Democrat';
    gradeEmoji = '📖';
  } else {
    grade = 'Civic Beginner';
    gradeEmoji = '🌱';
  }

  container.innerHTML = `
    <div class="quiz__results">
      <div class="quiz__results-hero">
        <span class="quiz__results-emoji" aria-hidden="true">${gradeEmoji}</span>
        <h3 class="quiz__results-grade">${escapeHTML(grade)}</h3>
        <div class="quiz__results-score-ring" style="--pct: ${percentage}">
          <span class="quiz__results-pct">${percentage}%</span>
        </div>
        <p class="quiz__results-summary">
          You answered <strong>${correctCount}</strong> out of <strong>${totalQ}</strong> correctly
        </p>
      </div>

      <div class="quiz__results-stats">
        <div class="quiz__result-stat">
          <span class="quiz__result-stat-value">${correctCount}</span>
          <span class="quiz__result-stat-label">Correct</span>
        </div>
        <div class="quiz__result-stat">
          <span class="quiz__result-stat-value">${totalQ - correctCount}</span>
          <span class="quiz__result-stat-label">Incorrect</span>
        </div>
        <div class="quiz__result-stat">
          <span class="quiz__result-stat-value">🔥 ${bestStreak}</span>
          <span class="quiz__result-stat-label">Best Streak</span>
        </div>
      </div>

      <details class="quiz__results-breakdown">
        <summary>📋 View Detailed Breakdown</summary>
        <div class="quiz__breakdown-list">
          ${results
            .map(
              (r, i) => `
            <div class="quiz__breakdown-item ${r.isCorrect ? 'quiz__breakdown-item--correct' : 'quiz__breakdown-item--wrong'}">
              <span class="quiz__breakdown-num">${i + 1}</span>
              <div class="quiz__breakdown-content">
                <p class="quiz__breakdown-q">${escapeHTML(r.question)}</p>
                <p class="quiz__breakdown-answer">
                  ${r.timedOut ? '⏱️ Timed out' : r.isCorrect ? '✅ Correct' : `❌ Your answer: ${escapeHTML(r.userAnswer)}`}
                  ${!r.isCorrect ? `<br>✅ Correct: ${escapeHTML(r.correctAnswer)}` : ''}
                </p>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </details>

      <div class="quiz__results-actions">
        <button class="btn btn--primary" id="quiz-restart-btn">🔄 Try Again</button>
        <button class="btn btn--secondary" id="quiz-home-btn">🏠 Back to Start</button>
      </div>
    </div>
  `;

  announce(`Quiz complete! You scored ${percentage}%. ${grade}`);
}
