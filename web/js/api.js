/**
 * =============================================================================
 * api.js — THE ONLY PLACE THAT TALKS TO THE SERVER
 * =============================================================================
 * Every HTML page should call functions from this file (getProviders, loginUser, …)
 * and NEVER call fetch() directly. That way you only change this file when PHP is ready.
 *
 * Flow:
 *   Page calls getProviders() → apiRequest() → mock OR real PHP
 *
 * Response shape (mock and PHP should match):
 *   { success: true/false, message: "...", data: ... }
 *
 * Functions that end with .then(unwrap) return only the inner `data` object.
 * Functions like loginUser() return the full { success, message, data } so you can show errors.
 * =============================================================================
 */

/**
 * Sends one API request. This is the single gate between UI and backend.
 *
 * @param {string} endpointKey — name from API_ENDPOINTS in config.js (e.g. "providers")
 * @param {object} options — { method: "GET"|"POST", params: {}, body: {} }
 * @returns {Promise} resolves to { success, message, data }
 */
function apiRequest(endpointKey, options) {
  options = options || {};
  var method = (options.method || "GET").toUpperCase();

  // --- MOCK PATH: use JSON files + fake logic in mock-handlers.js ---
  if (API_CONFIG.useMock) {
    return runMockHandler(endpointKey, options);
  }

  // --- REAL PATH: call PHP with fetch() ---
  var path = API_ENDPOINTS[endpointKey];
  if (!path) {
    return Promise.reject(new Error("Unknown endpoint: " + endpointKey));
  }

  var url = API_CONFIG.baseUrl + path;
  var fetchOptions = {
    method: method,
    headers: { "Content-Type": "application/json" }
  };

  // If user logged in before, send token (PHP can read Authorization header)
  var token = localStorage.getItem("autoconnect_token");
  if (token) {
    fetchOptions.headers["Authorization"] = "Bearer " + token;
  }

  // GET: filters go in URL query string (?category=mechanic&city=Cairo)
  if (options.params && method === "GET") {
    var qs = new URLSearchParams(options.params).toString();
    if (qs) url += (url.indexOf("?") >= 0 ? "&" : "?") + qs;
  }

  // POST: form data goes in JSON body
  if (options.body && method !== "GET") {
    fetchOptions.body = JSON.stringify(options.body);
  }

  return fetch(url, fetchOptions).then(function (response) {
    return response.json();
  });
}

/**
 * Pulls out `data` from a successful response.
 * Throws an Error if success === false (so .catch() can show the message).
 */
function unwrap(response) {
  if (response && response.success === false) {
    var err = new Error(response.message || "Request failed");
    err.response = response;
    throw err;
  }
  return response.data !== undefined ? response.data : response;
}

/**
 * Returns "../" when we are inside /pages/ folder, else "./"
 * Used to load data/providers.json with the correct relative path.
 */
function getDataBasePath() {
  if (window.location.pathname.indexOf("/pages/") !== -1) {
    return "../";
  }
  return "./";
}

// ---------------------------------------------------------------------------
// PROVIDERS (garages, tow trucks, parts shops)
// ---------------------------------------------------------------------------

/** List providers; optional filters — see filterProviders() in utils.js */
function getProviders(filters) {
  return apiRequest("providers", { method: "GET", params: filters || {} }).then(unwrap);
}

/** One provider by id (service detail page uses ?id=1 in URL) */
function getProviderById(id) {
  return apiRequest("providerById", {
    method: "GET",
    params: { id: id }
  }).then(unwrap);
}

// ---------------------------------------------------------------------------
// LOOKUP DATA
// ---------------------------------------------------------------------------

function getCategories() {
  return apiRequest("categories", { method: "GET" }).then(unwrap);
}

function getRegions() {
  return apiRequest("regions", { method: "GET" }).then(unwrap);
}

// ---------------------------------------------------------------------------
// USER ACCOUNT
// ---------------------------------------------------------------------------

function getUser() {
  return apiRequest("user", { method: "GET" }).then(unwrap);
}

/** Returns full response — check res.success before redirecting */
function loginUser(email, password) {
  return apiRequest("login", {
    method: "POST",
    body: { email: email, password: password }
  });
}

/**
 * Register customer OR provider (register page sends role + different fields).
 * Returns full response.
 */
function registerUser(data) {
  return apiRequest("register", { method: "POST", body: data });
}

function updatePassword(data) {
  return apiRequest("updatePassword", {
    method: "POST",
    body: {
      current: data.current,
      new: data.new,
      confirm: data.confirm
    }
  });
}

/** Standalone “join as workshop” page — adds row to providers table */
function addProvider(data) {
  return apiRequest("addProvider", { method: "POST", body: data });
}

// ---------------------------------------------------------------------------
// REVIEWS & FAVORITES
// ---------------------------------------------------------------------------

function getReviews(providerId) {
  return apiRequest("reviews", {
    method: "GET",
    params: { provider_id: providerId }
  }).then(unwrap);
}

function getFavorites() {
  return apiRequest("favorites", { method: "GET" }).then(unwrap);
}

function toggleFavorite(providerId) {
  return apiRequest("toggleFavorite", {
    method: "POST",
    body: { provider_id: providerId }
  });
}

/** Optional: load all JSON into memory at once (open console and call preloadMockData()) */
function preloadMockData() {
  if (!API_CONFIG.useMock) return Promise.resolve();
  return Promise.all([
    ensureProviders(),
    ensureCategories(),
    ensureRegions(),
    ensureReviews(),
    ensureUser(),
    ensureFavorites()
  ]);
}
