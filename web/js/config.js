/**
 * =============================================================================
 * config.js — Settings for the whole app
 * =============================================================================
 * Load this file FIRST on every page (before api.js and mock-handlers.js).
 *
 * When your PHP backend is ready:
 *   1. Set useMock to false
 *   2. Point baseUrl to your API folder (e.g. "../api")
 * =============================================================================
 */

// Main switch: true = fake data from JSON files, false = real PHP requests
var API_CONFIG = {
  baseUrl: "/autoconnect/backend/api",
  useMock: false,
  mockDelayMs: 350,
  logMockCalls: false
};

/**
 * Maps a short name we use in JavaScript → the real PHP file name.
 * Example: getProviders() uses key "providers" → fetches providers.php
 * Do not rename these keys in api.js; only change the PHP file names here if needed.
 */
var API_ENDPOINTS = {
  providers: "/providers.php",
  providerById: "/provider.php",
  categories: "/categories.php",
  regions: "/regions.php",
  user: "/user.php",
  login: "/login.php",
  register: "/register.php",
  addProvider: "/add_provider.php",
  editProvider: "/edit_provider.php",
  updatePassword: "/update_password.php",
  reviews: "/reviews.php",
  favorites: "/favorites.php",
  toggleFavorite: "/toggle_favorite.php"
};

/**
 * Test account for demo / graduation presentation.
 * Used on login page when useMock is true (see auth.js → prefillDemoLogin).
 */
var MOCK_DEMO_AUTH = {
  email: "demo@autoconnect.com",
  password: "demo1234"
};
