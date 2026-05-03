/**
 * @fileoverview Environment configuration for ElectIQ.
 *
 * SECURITY NOTE: These API keys are client-side keys with the following restrictions:
 * - Firebase API key: Restricted to this app's domain via Firebase Console > App Check
 * - Maps Embed API key: Restricted by HTTP referrer in Google Cloud Console
 * - Gemini API key: User-provided at runtime, stored only in localStorage
 *
 * For production deployments, all keys should be restricted by domain/referrer
 * in the respective Google Cloud Console settings.
 *
 * @see https://firebase.google.com/docs/projects/api-keys#apply-restrictions
 */

export const ENV = Object.freeze({
  /* Firebase Configuration */
  FIREBASE_API_KEY: 'AIzaSyBOWRq6-7AiVrYhSpHl37X09gGOdWP0KmQ',
  FIREBASE_AUTH_DOMAIN: 'prompt-war-493707.firebaseapp.com',
  FIREBASE_PROJECT_ID: 'prompt-war-493707',
  FIREBASE_STORAGE_BUCKET: 'prompt-war-493707.firebasestorage.app',
  FIREBASE_MESSAGING_SENDER_ID: '912679656092',
  FIREBASE_APP_ID: '1:912679656092:web:electiq2026app',
  FIREBASE_MEASUREMENT_ID: 'G-ELECTIQ2026',

  /* Google Maps Embed API Key (restricted by HTTP referrer) */
  MAPS_EMBED_API_KEY: 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8',
});
