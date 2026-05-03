/**
 * @fileoverview Environment configuration template for ElectIQ.
 * Copy this file to env.js and replace with your actual API keys.
 * NEVER commit env.js with real credentials to version control.
 *
 * Steps:
 * 1. Copy: cp js/env.example.js js/env.js
 * 2. Replace placeholder values with your actual API keys
 * 3. Restrict keys by HTTP referrer in Google Cloud Console
 */

export const ENV = Object.freeze({
  /* Firebase Configuration — Get from Firebase Console > Project Settings */
  FIREBASE_API_KEY: 'YOUR_FIREBASE_API_KEY',
  FIREBASE_AUTH_DOMAIN: 'YOUR_PROJECT.firebaseapp.com',
  FIREBASE_PROJECT_ID: 'YOUR_PROJECT_ID',
  FIREBASE_STORAGE_BUCKET: 'YOUR_PROJECT.firebasestorage.app',
  FIREBASE_MESSAGING_SENDER_ID: 'YOUR_SENDER_ID',
  FIREBASE_APP_ID: 'YOUR_APP_ID',
  FIREBASE_MEASUREMENT_ID: 'G-XXXXXXXXXX',

  /* Google Maps Embed API Key — Get from Google Cloud Console > APIs & Services */
  MAPS_EMBED_API_KEY: 'YOUR_MAPS_EMBED_API_KEY',
});
