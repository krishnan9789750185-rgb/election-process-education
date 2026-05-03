/**
 * @fileoverview Firebase integration for ElectIQ.
 * Provides Firebase Authentication (anonymous), Firestore database persistence,
 * and Firebase Analytics event tracking for comprehensive Google Services integration.
 * @module firebase-config
 */

import { APP_CONFIG } from './constants.js';
import { storage } from './utils.js';

/* ============================================================
 * FIREBASE CDN IMPORTS (v10 Modular SDK)
 * ============================================================ */

/** @type {Object|null} Firebase app instance */
let firebaseApp = null;

/** @type {Object|null} Firestore database instance */
let db = null;

/** @type {Object|null} Firebase Analytics instance */
let analytics = null;

/** @type {Object|null} Firebase Auth instance */
let auth = null;

/** @type {string|null} Current anonymous user ID */
let currentUserId = null;

/** @type {boolean} Whether Firebase is successfully initialized */
let isInitialized = false;

/** @type {Object} Firebase SDK module references */
const firebaseModules = {};

/**
 * Firebase project configuration.
 * Uses the Google Cloud project for seamless integration.
 * @constant {Object}
 */
const FIREBASE_CONFIG = Object.freeze({
  apiKey: 'AIzaSyBOWRq6-7AiVrYhSpHl37X09gGOdWP0KmQ',
  authDomain: 'prompt-war-493707.firebaseapp.com',
  projectId: 'prompt-war-493707',
  storageBucket: 'prompt-war-493707.firebasestorage.app',
  messagingSenderId: '912679656092',
  appId: '1:912679656092:web:electiq2026app',
  measurementId: 'G-ELECTIQ2026',
});

/**
 * Firestore collection names used throughout the application.
 * @constant {Object<string, string>}
 */
const COLLECTIONS = Object.freeze({
  QUIZ_SCORES: 'quiz_scores',
  USER_PROGRESS: 'user_progress',
  SIMULATOR_RESULTS: 'simulator_results',
  LEADERBOARD: 'leaderboard',
  FEEDBACK: 'feedback',
});

/**
 * Initializes Firebase services: App, Auth, Firestore, and Analytics.
 * Gracefully degrades if Firebase SDK cannot be loaded.
 * @returns {Promise<boolean>} Whether initialization was successful.
 */
export async function initFirebase() {
  if (isInitialized) {
    return true;
  }

  try {
    /* Dynamically import Firebase SDK modules from CDN */
    const [appModule, authModule, firestoreModule, analyticsModule] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js'),
    ]);

    /* Store module references for later use */
    firebaseModules.app = appModule;
    firebaseModules.auth = authModule;
    firebaseModules.firestore = firestoreModule;
    firebaseModules.analytics = analyticsModule;

    /* Initialize Firebase App */
    firebaseApp = appModule.initializeApp(FIREBASE_CONFIG);

    /* Initialize Firebase Analytics */
    try {
      analytics = analyticsModule.getAnalytics(firebaseApp);
      analyticsModule.logEvent(analytics, 'app_loaded', {
        app_name: APP_CONFIG.APP_NAME,
        app_version: APP_CONFIG.APP_VERSION,
      });
    } catch {
      console.warn('[ElectIQ] Analytics initialization skipped');
    }

    /* Initialize Firestore */
    db = firestoreModule.getFirestore(firebaseApp);

    /* Initialize Firebase Auth with anonymous sign-in */
    auth = authModule.getAuth(firebaseApp);
    await signInAnonymously();

    isInitialized = true;
    console.info('[ElectIQ] Firebase initialized successfully');
    return true;
  } catch (error) {
    console.warn('[ElectIQ] Firebase initialization failed, using localStorage fallback:', error.message);
    return false;
  }
}

/**
 * Signs in the user anonymously to enable Firestore operations.
 * Persists the user ID for session continuity.
 * @returns {Promise<string|null>} The anonymous user ID or null.
 */
async function signInAnonymously() {
  if (!auth || !firebaseModules.auth) {
    return null;
  }

  try {
    const { signInAnonymously: signInAnon } = firebaseModules.auth;
    const userCredential = await signInAnon(auth);
    currentUserId = userCredential.user.uid;
    storage.set('firebase_uid', currentUserId);
    logAnalyticsEvent('user_authenticated', { method: 'anonymous' });
    return currentUserId;
  } catch (error) {
    console.warn('[ElectIQ] Anonymous auth failed:', error.message);
    currentUserId = storage.get('firebase_uid', `local_${Date.now()}`);
    return currentUserId;
  }
}

/* ============================================================
 * ANALYTICS TRACKING
 * ============================================================ */

/**
 * Logs a custom analytics event to Firebase Analytics.
 * Falls back silently if Analytics is not available.
 * @param {string} eventName - The event name (snake_case).
 * @param {Object} [params={}] - Optional event parameters.
 */
export function logAnalyticsEvent(eventName, params = {}) {
  if (!analytics || !firebaseModules.analytics) {
    return;
  }

  try {
    firebaseModules.analytics.logEvent(analytics, eventName, {
      ...params,
      timestamp: new Date().toISOString(),
      user_id: currentUserId,
    });
  } catch {
    /* Silently fail — analytics should never break the app */
  }
}

/**
 * Tracks a page/section view in Analytics.
 * @param {string} sectionName - The name of the section viewed.
 */
export function trackSectionView(sectionName) {
  logAnalyticsEvent('section_view', { section_name: sectionName });
}

/**
 * Tracks a feature interaction in Analytics.
 * @param {string} feature - The feature name.
 * @param {string} action - The action performed.
 */
export function trackInteraction(feature, action) {
  logAnalyticsEvent('feature_interaction', { feature, action });
}

/* ============================================================
 * FIRESTORE OPERATIONS
 * ============================================================ */

/**
 * Saves a quiz score to Firestore and updates the leaderboard.
 * @param {Object} scoreData - The quiz score data.
 * @param {number} scoreData.score - The percentage score.
 * @param {number} scoreData.correct - Number of correct answers.
 * @param {number} scoreData.total - Total number of questions.
 * @param {number} scoreData.bestStreak - Best answer streak.
 * @returns {Promise<boolean>} Whether the save was successful.
 */
export async function saveQuizScore(scoreData) {
  logAnalyticsEvent('quiz_completed', {
    score: scoreData.score,
    correct: scoreData.correct,
    total: scoreData.total,
    best_streak: scoreData.bestStreak,
  });

  if (!db || !currentUserId || !firebaseModules.firestore) {
    /* Fallback to localStorage */
    const scores = storage.get('quiz_scores', []);
    scores.push({ ...scoreData, timestamp: Date.now() });
    storage.set('quiz_scores', scores);
    return false;
  }

  try {
    const { collection, addDoc, doc, setDoc, getDoc } = firebaseModules.firestore;

    /* Save individual score */
    await addDoc(collection(db, COLLECTIONS.QUIZ_SCORES), {
      userId: currentUserId,
      ...scoreData,
      timestamp: new Date().toISOString(),
    });

    /* Update leaderboard with best score */
    const leaderboardRef = doc(db, COLLECTIONS.LEADERBOARD, currentUserId);
    const leaderboardSnap = await getDoc(leaderboardRef);

    if (!leaderboardSnap.exists() || scoreData.score > leaderboardSnap.data().bestScore) {
      await setDoc(leaderboardRef, {
        userId: currentUserId,
        bestScore: scoreData.score,
        bestStreak: scoreData.bestStreak,
        totalAttempts: (leaderboardSnap.exists() ? leaderboardSnap.data().totalAttempts : 0) + 1,
        lastAttempt: new Date().toISOString(),
      }, { merge: true });
    }

    return true;
  } catch (error) {
    console.warn('[ElectIQ] Failed to save quiz score to Firestore:', error.message);
    return false;
  }
}

/**
 * Saves simulator results to Firestore.
 * @param {Object} resultData - The simulation result data.
 * @param {string} resultData.role - The selected role.
 * @param {number} resultData.score - The total score.
 * @param {number} resultData.maxScore - The maximum possible score.
 * @param {Array} resultData.choices - Array of choices made.
 * @returns {Promise<boolean>} Whether the save was successful.
 */
export async function saveSimulatorResult(resultData) {
  logAnalyticsEvent('simulator_completed', {
    role: resultData.role,
    score: resultData.score,
    max_score: resultData.maxScore,
    percentage: Math.round((resultData.score / resultData.maxScore) * 100),
  });

  if (!db || !currentUserId || !firebaseModules.firestore) {
    return false;
  }

  try {
    const { collection, addDoc } = firebaseModules.firestore;
    await addDoc(collection(db, COLLECTIONS.SIMULATOR_RESULTS), {
      userId: currentUserId,
      ...resultData,
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.warn('[ElectIQ] Failed to save simulator result:', error.message);
    return false;
  }
}

/**
 * Saves or updates the user's learning progress to Firestore.
 * @param {Object} progressData - The progress data.
 * @param {Array<number>} progressData.visitedSteps - Timeline steps visited.
 * @param {number} progressData.quizHighScore - Highest quiz score.
 * @param {number} progressData.quizAttempts - Total quiz attempts.
 * @param {Object} progressData.simulatorScores - Scores per role.
 * @returns {Promise<boolean>} Whether the save was successful.
 */
export async function saveUserProgress(progressData) {
  if (!db || !currentUserId || !firebaseModules.firestore) {
    return false;
  }

  try {
    const { doc, setDoc } = firebaseModules.firestore;
    await setDoc(doc(db, COLLECTIONS.USER_PROGRESS, currentUserId), {
      userId: currentUserId,
      ...progressData,
      lastUpdated: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('[ElectIQ] Failed to save user progress:', error.message);
    return false;
  }
}

/**
 * Retrieves the top leaderboard scores from Firestore.
 * @param {number} [limit=10] - Maximum number of entries to retrieve.
 * @returns {Promise<Array<Object>>} Array of leaderboard entries.
 */
export async function getLeaderboard(limit = APP_CONFIG.LEADERBOARD_DEFAULT_LIMIT) {
  if (!db || !firebaseModules.firestore) {
    return [];
  }

  try {
    const { collection, query, orderBy, limit: limitFn, getDocs } = firebaseModules.firestore;
    const q = query(
      collection(db, COLLECTIONS.LEADERBOARD),
      orderBy('bestScore', 'desc'),
      limitFn(limit)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.warn('[ElectIQ] Failed to fetch leaderboard:', error.message);
    return [];
  }
}

/**
 * Submits user feedback to Firestore.
 * @param {Object} feedbackData - The feedback data.
 * @param {string} feedbackData.message - Feedback message.
 * @param {number} feedbackData.rating - Rating (1-5).
 * @returns {Promise<boolean>} Whether the submission was successful.
 */
export async function submitFeedback(feedbackData) {
  logAnalyticsEvent('feedback_submitted', { rating: feedbackData.rating });

  if (!db || !firebaseModules.firestore) {
    return false;
  }

  try {
    const { collection, addDoc } = firebaseModules.firestore;
    await addDoc(collection(db, COLLECTIONS.FEEDBACK), {
      userId: currentUserId,
      ...feedbackData,
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.warn('[ElectIQ] Failed to submit feedback:', error.message);
    return false;
  }
}

/**
 * Returns whether Firebase has been initialized.
 * @returns {boolean} Initialization status.
 */
export function isFirebaseReady() {
  return isInitialized;
}

/**
 * Returns the current user ID (anonymous or local).
 * @returns {string|null} The user ID.
 */
export function getUserId() {
  return currentUserId;
}

export { COLLECTIONS };
