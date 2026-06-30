/**
 * =============================================================================
 * main.js — Shared logic for AutoConnect (config, i18n, utils, api, ui, layout, auth)
 * =============================================================================
 */

// =============================================================================
// 1. config.js
// =============================================================================

var API_BASE = "../../backend/api";

var API_ENDPOINTS = {
  providers: "/providers.php",
  providerById: "/provider.php",
  categories: "/categories.php",
  regions: "/regions.php",
  user: "/user.php",
  login: "/login.php",
  register: "/register.php",
  addProvider: "/add_provider.php",
  uploadPhotos: "/upload_photos.php",
  updatePassword: "/update_password.php",
  reviews: "/reviews.php",
  bookings: "/bookings.php",
  favorites: "/favorites.php",
  toggleFavorite: "/toggle_favorite.php"
};

// =============================================================================
// 2. i18n — see i18n.js (loaded before this file in every HTML page)
// =============================================================================

// =============================================================================
// 3. utils.js
// =============================================================================

function getDistanceKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  return km < 1 ? Math.round(km * 1000) + " m" : km.toFixed(1) + " " + t("km_away");
}

function getUserLocation() {
  return new Promise(function (resolve, reject) {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        resolve({ lat: pos.coords.latitude, long: pos.coords.longitude });
      },
      function (err) { reject(err); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/** Fallback when user denies location permission — center of Cairo */
var DEFAULT_LOCATION = { lat: 30.0444, long: 31.2357 };

/** All Egyptian governorates — used to populate city selects on the register form */
var EGYPT_CITIES = [
  { ar: "القاهرة",        en: "Cairo" },
  { ar: "الجيزة",         en: "Giza" },
  { ar: "الإسكندرية",     en: "Alexandria" },
  { ar: "الشرقية",        en: "Sharqia" },
  { ar: "الدقهلية",       en: "Dakahlia" },
  { ar: "البحيرة",        en: "Beheira" },
  { ar: "المنوفية",       en: "Monufia" },
  { ar: "الغربية",        en: "Gharbia" },
  { ar: "القليوبية",      en: "Qalyubia" },
  { ar: "كفر الشيخ",      en: "Kafr El-Sheikh" },
  { ar: "دمياط",          en: "Damietta" },
  { ar: "بورسعيد",        en: "Port Said" },
  { ar: "الإسماعيلية",    en: "Ismailia" },
  { ar: "السويس",         en: "Suez" },
  { ar: "شمال سيناء",     en: "North Sinai" },
  { ar: "جنوب سيناء",     en: "South Sinai" },
  { ar: "الفيوم",         en: "Faiyum" },
  { ar: "بني سويف",       en: "Beni Suef" },
  { ar: "المنيا",         en: "Minya" },
  { ar: "أسيوط",          en: "Asyut" },
  { ar: "سوهاج",          en: "Sohag" },
  { ar: "قنا",            en: "Qena" },
  { ar: "الأقصر",         en: "Luxor" },
  { ar: "أسوان",          en: "Aswan" },
  { ar: "البحر الأحمر",   en: "Red Sea" },
  { ar: "الوادي الجديد",  en: "New Valley" },
  { ar: "مطروح",          en: "Matrouh" }
];

/** Read last saved GPS from localStorage (set on emergency page) */
function getStoredLocation() {
  try {
    var raw = localStorage.getItem("autoconnect_location");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveLocation(loc) {
  if (!loc) return;
  var lng = getLocationLng(loc);
  localStorage.setItem("autoconnect_location", JSON.stringify({
    lat: loc.lat,
    lng: lng,
    long: lng
  }));
}

function getLocationLng(loc) {
  if (!loc) return null;
  return loc.lng != null ? loc.lng : loc.long;
}

function setEl(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

// Converts characters like < > & " into their safe HTML equivalents.
// Always use this when putting API data (provider names, addresses, etc.) into HTML.
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Add distance_km property to each provider object */
function addDistanceToProviders(providers, userLat, userLong) {
  return providers.map(function (p) {
    var copy = Object.assign({}, p);
    var providerLng = getLocationLng(p);
    copy.distance_km = (p.lat != null && providerLng != null)
      ? getDistanceKm(userLat, userLong, Number(p.lat), Number(providerLng))
      : null;
    return copy;
  });
}

function normalizeProvider(provider) {
  if (!provider) return provider;
  var p = Object.assign({}, provider);
  if (p.lng == null && p.long != null) p.lng = p.long;
  if (!p.image && p.photo_url) p.image = p.photo_url;
  if (p.rating == null && p.avg_rating != null) p.rating = p.avg_rating;
  if (p.review_count == null) p.review_count = 0;
  if (!p.category_slug && p.slug) p.category_slug = p.slug;
  if (!p.status || p.status === "active") {
    p.status = p.is_open_now === false ? "closed" : "open";
  }
  return p;
}

function normalizeProviderList(list) {
  return (list || []).map(normalizeProvider);
}

// =============================================================================
// 4. api.js
// =============================================================================

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

  var path = API_ENDPOINTS[endpointKey];
  if (!path) {
    return Promise.reject(new Error("Unknown endpoint: " + endpointKey));
  }

  var url = API_BASE + path;
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

// ---------------------------------------------------------------------------
// PROVIDERS (garages, tow trucks, parts shops)
// ---------------------------------------------------------------------------

/** List providers; optional filters — see filterProviders() in utils.js */
function getProviders(filters) {
  return apiRequest("providers", { method: "GET", params: filters || {} })
    .then(unwrap)
    .then(normalizeProviderList);
}

/** One provider by id (service detail page uses ?id=1 in URL) */
function getProviderById(id) {
  return apiRequest("providerById", {
    method: "GET",
    params: { id: id }
  }).then(unwrap).then(normalizeProvider);
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

function getBookings() {
  return apiRequest("bookings", { method: "GET" }).then(unwrap);
}

function createBooking(provider_id) {
  return apiRequest("bookings", { method: "POST", body: { provider_id: provider_id } });
}

function logoutUser() {
  localStorage.removeItem("autoconnect_token");
  localStorage.removeItem("autoconnect_user");
  window.location.reload();
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
// reviews & favorites
// ---------------------------------------------------------------------------

function getReviews(providerId) {
  return apiRequest("reviews", {
    method: "GET",
    params: { provider_id: providerId }
  }).then(unwrap);
}

function postReview(providerId, rate, comment) {
  return apiRequest("reviews", {
    method: "POST",
    body: { provider_id: Number(providerId), rate: rate, comment: comment }
  });
}

function getFavorites() {
  return apiRequest("favorites", { method: "GET" }).then(unwrap).then(normalizeProviderList);
}

function toggleFavorite(providerId) {
  return apiRequest("toggleFavorite", {
    method: "POST",
    body: { provider_id: providerId }
  });
}

// =============================================================================
// 6. ui.js
// =============================================================================

function renderProviderCard(provider, options) {
  options = options || {};
  var base = options.basePath || getBasePath();
  var name = getLocalizedField(provider, "name");
  var address = getLocalizedField(provider, "address");
  var isOpen = provider.status === "open" || provider.is_open_now === true;
  var statusText = isOpen ? t("open_now") : t("closed");
  var statusClass = isOpen ? "open" : "closed";
  var distText = provider.distance_km != null ? formatDistance(provider.distance_km) : "";
  var img = provider.image ? base + provider.image : "";
  var detailUrl = base + "service-detail/index.html?id=" + provider.id;
  var phone = provider.phone || "";
  var badge = provider.category_slug || "";
  var isLoggedIn = !!localStorage.getItem("autoconnect_token");
  var loginUrl = base + "login/index.html?from=" + encodeURIComponent(window.location.href);

  var safePhone = escapeHtml(phone);
  var phoneRow  = isLoggedIn && phone ? `<p class="provider-card__meta">📞 ${safePhone}</p>` : "";
  var callBtn   = isLoggedIn
    ? `<a href="tel:${safePhone}" class="btn btn-primary btn-sm" onclick="createBooking(${provider.id})">${t("call_now")}</a>`
    : `<a href="${loginUrl}" class="btn btn-primary btn-sm">${t("show_phone")}</a>`;

  var ratingHtml = provider.review_count > 0
    ? '★ ' + provider.rating + ' <span class="provider-card__review-count">(' + provider.review_count + ')</span>'
    : '<span class="provider-card__review-count">' + t("no_reviews_yet") + '</span>';

  return `
    <article class="provider-card">
      <div class="provider-card__image">
        ${img ? `<img src="${img}" alt="${escapeHtml(name)}">` : ""}
        ${badge ? `<span class="provider-card__badge">${escapeHtml(badge)}</span>` : ""}
      </div>
      <div class="provider-card__body">
        <p class="provider-card__rating">${ratingHtml}</p>
        <h3>${escapeHtml(name)}</h3>
        <p class="provider-card__meta"><span class="status-dot ${statusClass}"></span> ${statusText}</p>
        ${address ? `<p class="provider-card__meta">📍 ${escapeHtml(address)}</p>` : ""}
        ${distText ? `<p class="provider-card__meta">↗ ${distText}</p>` : ""}
        ${phoneRow}
        <div class="provider-card__actions">
          <a href="${detailUrl}" class="btn btn-ghost btn-sm">${options.detailsLabel || t("view_details")}</a>
          ${provider.lat && provider.lng ? `<a href="https://www.google.com/maps?q=${provider.lat},${provider.lng}" target="_blank" class="btn btn-ghost btn-sm">${t("view_map")}</a>` : ""}
          ${callBtn}
        </div>
      </div>
    </article>`;
}

function renderProviderList(id, list, opts) {
  var el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = !list.length ? '<p class="section-subtitle">' + t("no_results") + "</p>" :
    list.map(function (p) { return renderProviderCard(p, opts); }).join("");
}

function renderHorizontalProviderCard(provider, options) {
  options = options || {};
  var base = options.basePath || getBasePath();
  var name = getLocalizedField(provider, "name");
  var isOpen = provider.status === "open" || provider.is_open_now === true;
  var statusText = isOpen ? t("open_now") : t("closed");
  var statusClass = isOpen ? "open" : "closed";
  var distText = provider.distance_km != null ? formatDistance(provider.distance_km) : "";
  var img = provider.image ? base + provider.image : "";
  var phone = provider.phone || "";
  var isLoggedIn = !!localStorage.getItem("autoconnect_token");
  var loginUrl = base + "login/index.html?from=" + encodeURIComponent(window.location.href);

  var safePhone2 = escapeHtml(phone);
  var phoneRow   = isLoggedIn && phone ? `<p class="provider-card__meta">📞 ${safePhone2}</p>` : "";
  var callBtn    = isLoggedIn
    ? `<a href="tel:${safePhone2}" class="btn btn-danger btn-sm" onclick="createBooking(${provider.id})">${t("call_now")}</a>`
    : `<a href="${loginUrl}" class="btn btn-danger btn-sm">${t("show_phone")}</a>`;

  return `
    <article class="card" style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center">
      <div style="width:120px;height:90px;border-radius:8px;overflow:hidden;flex-shrink:0;background:#1a2230">
        ${img ? `<img src="${img}" alt="" style="width:100%;height:100%;object-fit:cover">` : ""}
      </div>
      <div style="flex:1;min-width:180px">
        <h3>${escapeHtml(name)}</h3>
        <p class="provider-card__meta">
          <span class="status-dot ${statusClass}"></span> ${statusText} · ★ ${provider.rating}${distText ? " · " + distText : ""}
        </p>
        ${phoneRow}
      </div>
      <div style="display:flex;gap:0.5rem">
        ${provider.lat && provider.lng ? `<a href="https://www.google.com/maps?q=${provider.lat},${provider.lng}" target="_blank" class="btn btn-outline btn-sm">${t("view_map")}</a>` : ""}
        ${callBtn}
      </div>
    </article>`;
}

// =============================================================================
// 7. layout.js
// =============================================================================

/** Nav links shown in header — folders array = which page directory is "active" */
var NAV_ITEMS = [
  { href: "../home/index.html", key: "nav_home", folders: ["home"] },
  { href: "../services/index.html", key: "nav_services", folders: ["services"] },
  { href: "../emergency/index.html", key: "nav_emergency", folders: ["emergency"], highlight: true }
];

/** All pages live one folder deep under web/, so shared assets use ../ */
function getBasePath() {
  return "../";
}

function getPageFolder() {
  var parts = window.location.pathname.split("/").filter(Boolean);
  for (var i = parts.length - 1; i >= 0; i--) {
    if (parts[i] === "index.html" && i > 0) {
      return parts[i - 1];
    }
  }
  return "";
}

function renderHeader() {
  var el = document.getElementById("site-header");
  if (!el) return;
  var base = getBasePath();
  var folder = getPageFolder();
  var linksHtml = "";

  NAV_ITEMS.forEach(function (item) {
    var isActive = item.folders.indexOf(folder) !== -1;
    var cls = isActive ? "active" : "";
    var style = item.highlight ? ' style="color:var(--accent-yellow)"' : "";
    linksHtml += `<a href="${item.href}" class="${cls}" data-i18n="${item.key}"${style}></a>`;
  });

  var token = localStorage.getItem("autoconnect_token");
  var user  = JSON.parse(localStorage.getItem("autoconnect_user") || "null");
  var authHtml;
  if (token && user) {
    authHtml =
      '<a href="' + base + 'profile/index.html" class="btn btn-sm btn-ghost" style="display:flex;align-items:center;gap:0.4rem">' +
      '<img src="' + base + 'assets/images/Container.png" style="width:24px;height:24px;border-radius:50%;object-fit:cover"> ' +
      user.fname + '</a> ' +
      '<a href="#" onclick="logoutUser();return false;" class="btn btn-sm btn-primary" data-i18n="logout"></a>';
  } else {
    authHtml =
      '<a href="' + base + 'login/index.html" class="btn btn-sm btn-ghost" data-i18n="nav_login"></a> ' +
      '<a href="' + base + 'register/index.html" class="btn btn-sm btn-primary" data-i18n="nav_signup"></a>';
  }

  el.innerHTML = `
    <header class="site-header">
      <div class="container header-inner">
        <button class="menu-toggle" id="menu-toggle" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
        <a href="${base}home/index.html" class="logo">Auto<span>Connect</span></a>
        <nav class="nav-links" id="nav-links">${linksHtml}</nav>
        <div class="header-actions">
          <button type="button" class="lang-toggle" id="lang-toggle">EN</button>
          ${authHtml}
        </div>
      </div>
    </header>`;

  var toggle = document.getElementById("menu-toggle");
  var nav = document.getElementById("nav-links");
  if (toggle && nav) {
    toggle.addEventListener("click", function () { nav.classList.toggle("open"); });
  }
}

function renderFooter() {
  var el = document.getElementById("site-footer");
  if (!el) return;
  var base = getBasePath();
  el.innerHTML = `
    <footer class="site-footer">
      <div class="container footer-inner">
        <a href="${base}home/index.html" class="logo">AutoConnect</a>
        <div class="footer-links">
          <a href="#" data-i18n="privacy"></a>
          <a href="#" data-i18n="terms"></a>
          <a href="#" data-i18n="contact"></a>
        </div>
        <p class="footer-copy" data-i18n="copyright"></p>
      </div>
    </footer>`;
}

// =============================================================================
// 8. initialization & shared event hooks
// =============================================================================

/** Callback function that pages can override to run custom language update logic */
var onLanguageChange = null;

document.addEventListener("DOMContentLoaded", function () {
  renderHeader();
  renderFooter();
  setLanguage(currentLang);

  var langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    langBtn.addEventListener("click", toggleLanguage);
  }
});
