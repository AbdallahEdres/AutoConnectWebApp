/**
 * =============================================================================
 * main.js — Shared logic for AutoConnect (config, i18n, utils, api, ui, layout, auth)
 * =============================================================================
 */

// =============================================================================
// 1. config.js
// =============================================================================

var API_BASE = window.location.pathname.indexOf("/pages/") !== -1
  ? "../../backend/api"
  : "../backend/api";

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

/** Human-readable distance for UI */
function formatDistance(km) {
  if (km < 1) {
    return Math.round(km * 1000) + " m";
  }
  return km.toFixed(1) + " " + t("km_away");
}

/**
 * Ask browser for user's GPS position (requires HTTPS or localhost).
 * Returns Promise with { lat, long }.
 */
function getUserLocation() {
  return new Promise(function (resolve, reject) {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        resolve({
          lat: pos.coords.latitude,
          long: pos.coords.longitude
        });
      },
      function (err) {
        reject(err);
      },
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
  var raw = localStorage.getItem("autoconnect_location");
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function saveLocation(loc) {
  localStorage.setItem("autoconnect_location", JSON.stringify(loc));
}

function setEl(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

/** Add distance_km property to each provider object */
function addDistanceToProviders(providers, userLat, userLong) {
  return providers.map(function (p) {
    var copy = Object.assign({}, p);
    copy.distance_km = getDistanceKm(userLat, userLong, p.lat, p.lng);
    return copy;
  });
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

function getFavorites() {
  return apiRequest("favorites", { method: "GET" }).then(unwrap);
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
  var isOpen = provider.status === "open";
  var statusText = isOpen ? t("open_now") : t("closed");
  var statusClass = isOpen ? "open" : "closed";
  var distText = provider.distance_km != null ? formatDistance(provider.distance_km) : "";
  var img = provider.image ? base + provider.image : "";
  var detailUrl = base + "pages/service-detail.html?id=" + provider.id;
  var phone = provider.phone || "";
  var badge = provider.category_slug || "";
  var isLoggedIn = !!localStorage.getItem("autoconnect_token");
  var loginUrl = base + "pages/login.html";

  var phoneRow   = isLoggedIn && phone ? `<p class="provider-card__meta">📞 ${phone}</p>` : "";
  var callBtn    = isLoggedIn
    ? `<a href="tel:${phone}" class="btn btn-primary btn-sm" onclick="createBooking(${provider.id})">${t("call_now")}</a>`
    : `<a href="${loginUrl}" class="btn btn-primary btn-sm">${t("show_phone")}</a>`;

  return `
    <article class="provider-card">
      <div class="provider-card__image">
        ${img ? `<img src="${img}" alt="${name}">` : ""}
        ${badge ? `<span class="provider-card__badge">${badge}</span>` : ""}
      </div>
      <div class="provider-card__body">
        <p class="provider-card__rating">★ ${provider.rating}</p>
        <h3>${name}</h3>
        <p class="provider-card__meta"><span class="status-dot ${statusClass}"></span> ${statusText}</p>
        ${address ? `<p class="provider-card__meta">📍 ${address}</p>` : ""}
        ${distText ? `<p class="provider-card__meta">↗ ${distText}</p>` : ""}
        ${phoneRow}
        <div class="provider-card__actions">
          <a href="${detailUrl}" class="btn btn-ghost btn-sm">${options.detailsLabel || t("view_details")}</a>
          ${callBtn}
        </div>
      </div>
    </article>`;
}

/** Loop providers and put all cards inside element #containerId */
function renderProviderList(containerId, providers, options) {
  var container = document.getElementById(containerId);
  if (!container) return;

  if (!providers.length) {
    container.innerHTML =
      '<p class="section-subtitle" style="grid-column:1/-1">' +
      t("no_results") +
      "</p>";
    return;
  }

  var html = "";
  providers.forEach(function (p) {
    html += renderProviderCard(p, options);
  });
  container.innerHTML = html;
}

function renderHorizontalProviderCard(provider, options) {
  options = options || {};
  var base = options.basePath || getBasePath();
  var name = getLocalizedField(provider, "name");
  var isOpen = provider.status === "open";
  var statusText = isOpen ? t("open_now") : t("closed");
  var statusClass = isOpen ? "open" : "closed";
  var distText = provider.distance_km != null ? formatDistance(provider.distance_km) : "";
  var img = provider.image ? base + provider.image : "";
  var phone = provider.phone || "";
  var isLoggedIn = !!localStorage.getItem("autoconnect_token");
  var loginUrl = base + "pages/login.html";

  var phoneRow = isLoggedIn && phone ? `<p class="provider-card__meta">📞 ${phone}</p>` : "";
  var callBtn  = isLoggedIn
    ? `<a href="tel:${phone}" class="btn btn-danger btn-sm" onclick="createBooking(${provider.id})">${t("call_now")}</a>`
    : `<a href="${loginUrl}" class="btn btn-danger btn-sm">${t("show_phone")}</a>`;

  return `
    <article class="card" style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center">
      <div style="width:120px;height:90px;border-radius:8px;overflow:hidden;flex-shrink:0;background:#1a2230">
        ${img ? `<img src="${img}" alt="" style="width:100%;height:100%;object-fit:cover">` : ""}
      </div>
      <div style="flex:1;min-width:180px">
        <h3>${name}</h3>
        <p class="provider-card__meta">
          <span class="status-dot ${statusClass}"></span> ${statusText} · ★ ${provider.rating}${distText ? " · " + distText : ""}
        </p>
        ${phoneRow}
      </div>
      <div style="display:flex;gap:0.5rem">
        <button type="button" class="btn btn-outline btn-sm" data-map="${provider.id}">${t("view_map")}</button>
        ${callBtn}
      </div>
    </article>`;
}

// =============================================================================
// 7. layout.js
// =============================================================================

/** Nav links shown in header — pages array = which HTML file is "active" */
var NAV_ITEMS = [
  { href: "index.html", key: "nav_home", pages: ["index.html", ""] },
  { href: "pages/services.html", key: "nav_services", pages: ["services.html"] },
  { href: "pages/emergency.html", key: "nav_emergency", pages: ["emergency.html"], highlight: true }
];

/** "../" when URL contains /pages/, else "./" */
function getBasePath() {
  return window.location.pathname.indexOf("/pages/") !== -1 ? "../" : "";
}

function getPageName() {
  var parts = window.location.pathname.split("/");
  return parts[parts.length - 1] || "index.html";
}

function renderHeader() {
  var el = document.getElementById("site-header");
  if (!el) return;

  var base = getBasePath();
  var page = getPageName();
  var linksHtml = "";

  NAV_ITEMS.forEach(function (item) {
    var href;
    if (base === "../") {
      href = item.href === "index.html" ? "../index.html" : item.href.replace("pages/", "");
    } else {
      href = item.href;
    }
    var isActive = item.pages.indexOf(page) !== -1;
    var cls = isActive ? "active" : "";
    var style = item.highlight ? ' style="color:var(--accent-yellow)"' : "";
    linksHtml += `<a href="${href}" class="${cls}" data-i18n="${item.key}"${style}></a>`;
  });

  el.innerHTML = `
    <header class="site-header">
      <div class="container header-inner">
        <button class="menu-toggle" id="menu-toggle" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
        <a href="${base}index.html" class="logo">Auto<span>Connect</span></a>
        <nav class="nav-links" id="nav-links">${linksHtml}</nav>
        <div class="header-actions">
          <button type="button" class="lang-toggle" id="lang-toggle">EN</button>
          ${(function () {
            var token = localStorage.getItem("autoconnect_token");
            var user  = JSON.parse(localStorage.getItem("autoconnect_user") || "null");
            if (token && user) {
              return `<a href="${base}pages/profile.html" class="btn btn-sm btn-ghost" style="display:flex;align-items:center;gap:0.4rem"><img src="${base}assets/images/Container.png" style="width:24px;height:24px;border-radius:50%;object-fit:cover"> ${user.fname}</a>
                      <a href="#" onclick="logoutUser();return false;" class="btn btn-sm btn-primary" data-i18n="logout"></a>`;
            }
            return `<a href="${base}pages/login.html" class="btn btn-sm btn-ghost" data-i18n="nav_login"></a>
                    <a href="${base}pages/register.html" class="btn btn-sm btn-primary" data-i18n="nav_signup"></a>`;
          })()}
        </div>
      </div>
    </header>`;

  var toggle = document.getElementById("menu-toggle");
  var nav = document.getElementById("nav-links");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }
}

function renderFooter() {
  var el = document.getElementById("site-footer");
  if (!el) return;
  var base = getBasePath();
  el.innerHTML = `
    <footer class="site-footer">
      <div class="container footer-inner">
        <a href="${base}index.html" class="logo">AutoConnect</a>
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
// 8. auth.js
// =============================================================================

/** Which tab is selected on register page: "customer" or "provider" */
var registerRole = "customer";

/** Files staged for upload — populated by the photo picker, cleared on successful submit */
var selectedPhotos = [];

// ---------------------------------------------------------------------------
// Form error helpers — show/clear red border + message under a field
// ---------------------------------------------------------------------------

function showFieldError(inputId, message) {
  var input = document.getElementById(inputId);
  if (input) input.classList.add("is-invalid");
  var errEl = document.getElementById("err-" + inputId);
  if (errEl) errEl.textContent = message;
}

function clearFieldError(inputId) {
  var input = document.getElementById(inputId);
  if (input) input.classList.remove("is-invalid");
  var errEl = document.getElementById("err-" + inputId);
  if (errEl) errEl.textContent = "";
}

function clearAllErrors() {
  document.querySelectorAll("#register-form .form-control.is-invalid").forEach(function (el) {
    el.classList.remove("is-invalid");
  });
  document.querySelectorAll("#register-form .form-error").forEach(function (el) {
    el.textContent = "";
  });
}

function showFormError(message) {
  var el = document.getElementById("form-general-error");
  if (el) el.textContent = message;
}

/**
 * Reads HTML5 validity state of every [required] input and shows
 * an inline message for each invalid one. Returns true when all pass.
 */
function validateRegisterForm() {
  clearAllErrors();
  var form = document.getElementById("register-form");
  var isValid = true;

  form.querySelectorAll("[required]").forEach(function (input) {
    if (!input.checkValidity()) {
      var msg;
      if (input.validity.valueMissing) {
        msg = currentLang === "ar" ? "هذا الحقل مطلوب" : "This field is required";
      } else if (input.validity.typeMismatch) {
        msg = currentLang === "ar" ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email format";
      } else {
        msg = currentLang === "ar" ? "تحقق من القيمة المدخلة" : "Please check this field";
      }
      showFieldError(input.id, msg);
      isValid = false;
    }
  });

  // Password match — checked separately because HTML5 has no rule for it
  var pw  = document.getElementById("reg-password");
  var cpw = document.getElementById("confirm-password");
  if (pw && cpw && pw.value && cpw.value && pw.value !== cpw.value) {
    showFieldError("confirm-password", currentLang === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
    isValid = false;
  }

  return isValid;
}

/** Clear login-specific errors and wire real-time clearing on inputs */
function initLoginPage() {
  var loginForm = document.getElementById("login-form");
  if (!loginForm) return;
  ["email", "password"].forEach(function (id) {
    var input = document.getElementById(id);
    if (!input) return;
    input.addEventListener("input",  function () { clearFieldError(this.id); });
    input.addEventListener("change", function () { clearFieldError(this.id); });
  });
}

/** Send email + password to API; go to profile if success */
function handleLoginSubmit(e) {
  e.preventDefault();

  // Clear previous errors
  clearFieldError("email");
  clearFieldError("password");
  var generalErr = document.getElementById("form-login-error");
  if (generalErr) generalErr.textContent = "";

  var emailInput    = document.getElementById("email");
  var passwordInput = document.getElementById("password");
  var isValid = true;

  if (!emailInput.checkValidity()) {
    var msg = emailInput.validity.valueMissing
      ? (currentLang === "ar" ? "هذا الحقل مطلوب" : "This field is required")
      : (currentLang === "ar" ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email format");
    showFieldError("email", msg);
    isValid = false;
  }

  if (!passwordInput.value) {
    showFieldError("password", currentLang === "ar" ? "هذا الحقل مطلوب" : "This field is required");
    isValid = false;
  }

  if (!isValid) return;

  var submitBtn = document.querySelector("#login-form [type='submit']");
  if (submitBtn) submitBtn.disabled = true;

  loginUser(emailInput.value.trim(), passwordInput.value)
    .then(function (res) {
      if (!res.success) {
        if (generalErr) generalErr.textContent = res.message;
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
      localStorage.setItem("autoconnect_token", res.token);
      localStorage.setItem("autoconnect_user", JSON.stringify(res.data));
      window.location.href = "profile.html";
    })
    .catch(function (err) {
      if (generalErr) generalErr.textContent = err.message || (currentLang === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again");
      if (submitBtn) submitBtn.disabled = false;
    });
}

// ---------------------------------------------------------------------------
// Provider photo picker
// ---------------------------------------------------------------------------

/** Upload staged files to the server; returns Promise → { success, urls } */
function uploadProviderPhotos(files) {
  var formData = new FormData();
  for (var i = 0; i < files.length; i++) {
    formData.append("photos[]", files[i]);
  }
  return fetch(API_BASE + "/upload_photos.php", {
    method: "POST",
    body: formData  // browser sets Content-Type + boundary automatically
  }).then(function (res) { return res.json(); });
}

/** Re-render the thumbnail grid and update the add-button counter */
function renderPhotoPreview() {
  var grid   = document.getElementById("photo-preview-grid");
  var addBtn = document.getElementById("photo-add-btn");
  var label  = document.getElementById("photo-add-label");
  if (!grid) return;

  grid.innerHTML = "";

  selectedPhotos.forEach(function (file, idx) {
    var thumb = document.createElement("div");
    thumb.className = "photo-thumb";

    var img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = file.name;

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "photo-thumb-remove";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", function () {
      URL.revokeObjectURL(img.src);
      selectedPhotos.splice(idx, 1);
      renderPhotoPreview();
    });

    thumb.appendChild(img);
    thumb.appendChild(removeBtn);
    grid.appendChild(thumb);
  });

  // Show count and hide add button when limit reached
  var count = selectedPhotos.length;
  if (label) label.textContent = count > 0
    ? (currentLang === "ar" ? "إضافة المزيد (" + count + "/10)" : "Add more (" + count + "/10)")
    : t("add_photos");
  if (addBtn) addBtn.style.display = count >= 10 ? "none" : "inline-flex";
}

/** Wire the file input and click events for the photo upload area */
function setupPhotoPreview() {
  var input      = document.getElementById("photo-input");
  var addBtn     = document.getElementById("photo-add-btn");
  var uploadArea = document.getElementById("photo-upload-area");
  if (!input || !addBtn) return;

  // Clicking the area or button opens the file browser
  addBtn.addEventListener("click", function () { input.click(); });
  uploadArea.addEventListener("click", function (e) {
    if (e.target === this) input.click();
  });

  input.addEventListener("change", function () {
    var remaining = 10 - selectedPhotos.length;
    Array.from(this.files).slice(0, remaining).forEach(function (file) {
      if (file.type.startsWith("image/")) selectedPhotos.push(file);
    });
    renderPhotoPreview();
    this.value = ""; // reset so the same file can be picked again if removed
  });
}

/** Setup register page on first load */
function initRegisterPage() {
  if (!document.getElementById("register-form")) return;
  loadRegisterCategories();
  loadCitySelect();
  setRegisterRole("customer");
  setupPhotoPreview();

  // Toggle open/close time inputs when a day is marked as day-off
  document.querySelectorAll(".wh-closed").forEach(function (cb) {
    cb.addEventListener("change", function () {
      var row = this.closest(".wh-row");
      row.querySelector(".wh-open").disabled  = this.checked;
      row.querySelector(".wh-close").disabled = this.checked;
    });
  });

  // Clear inline error for a field as soon as the user starts correcting it
  document.getElementById("register-form").querySelectorAll(".form-control").forEach(function (input) {
    input.addEventListener("input",  function () { clearFieldError(this.id); });
    input.addEventListener("change", function () { clearFieldError(this.id); });
  });
}

/** Populate the single city select in the current page language */
function loadCitySelect() {
  var sel = document.getElementById("city-select");
  if (!sel) return;
  var saved = sel.value;
  sel.innerHTML = "";

  var empty = document.createElement("option");
  empty.value = "";
  empty.textContent = currentLang === "ar" ? "— اختر المدينة —" : "— Select city —";
  sel.appendChild(empty);

  EGYPT_CITIES.forEach(function (city) {
    var opt = document.createElement("option");
    opt.value = city.en;
    opt.setAttribute("data-ar", city.ar);
    opt.textContent = currentLang === "ar" ? city.ar : city.en;
    sel.appendChild(opt);
  });

  if (saved !== "") sel.value = saved; // restore selection after language switch
}

/** Re-render city select labels when the page language changes */
function refreshCitySelect() {
  loadCitySelect();
}

// ---------------------------------------------------------------------------
// Map (Leaflet) — provider register form
// ---------------------------------------------------------------------------

var registerMapInitialized = false;
var registerLat = DEFAULT_LOCATION.lat;
var registerLng = DEFAULT_LOCATION.long;

/** Init Leaflet map inside #register-map, detect browser location as default pin */
function initRegisterMap() {
  var mapEl = document.getElementById("register-map");
  if (!mapEl || typeof L === "undefined") return;

  var map = L.map("register-map").setView([registerLat, registerLng], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  var marker = L.marker([registerLat, registerLng], { draggable: true }).addTo(map);

  function updatePin(latlng) {
    registerLat = latlng.lat;
    registerLng = latlng.lng;
  }

  // Drag marker to update coords
  marker.on("dragend", function (e) { updatePin(e.target.getLatLng()); });

  // Click anywhere on map to move pin
  map.on("click", function (e) {
    marker.setLatLng(e.latlng);
    updatePin(e.latlng);
  });

  // Detect browser location and use as default pin
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude;
      var lng = pos.coords.longitude;
      updatePin({ lat: lat, lng: lng });
      map.setView([lat, lng], 15);
      marker.setLatLng([lat, lng]);
    });
  }
}

/** Fill service type dropdown from getCategories() API */
function loadRegisterCategories() {
  var sel = document.getElementById("provider-category");
  if (!sel) return;
  getCategories().then(function (cats) {
    sel.innerHTML = '<option value="">' + (currentLang === "ar" ? "— اختر نوع الخدمة —" : "— Select service type —") + "</option>";
    cats.forEach(function (c) {
      if (c.parent_id) return; // skip sub-categories in dropdown
      var opt = document.createElement("option");
      opt.value = c.id;
      opt.setAttribute("data-slug", c.slug);
      opt.textContent = getLocalizedField(c, "name");
      sel.appendChild(opt);
    });
  });
}

/**
 * Show/hide customer vs provider fields when user clicks role toggle.
 * Also updates card width, subtitle text, and submit button label.
 */
function setRegisterRole(role) {
  registerRole = role;
  var customerFields = document.getElementById("customer-fields");
  var providerFields = document.getElementById("provider-fields");
  var card           = document.getElementById("register-card");
  var subtitle       = document.getElementById("register-subtitle");
  var submitBtn      = document.getElementById("register-submit");

  var isProvider = role === "provider";

  if (customerFields) customerFields.classList.toggle("register-fields-hidden", isProvider);
  if (providerFields) providerFields.classList.toggle("register-fields-hidden", !isProvider);
  if (card) card.classList.toggle("auth-card--provider", isProvider);
  if (subtitle) {
    subtitle.textContent = isProvider ? t("register_provider_sub") : t("register_sub");
    subtitle.classList.toggle("provider-mode", isProvider);
  }
  if (submitBtn) {
    submitBtn.textContent = isProvider ? t("register_workshop") : t("create_account");
  }

  // Required only on the fields that belong to the active role
  var providerRequiredIds = ["name-en", "name-ar", "mobile", "provider-category", "city-select", "address-en"];
  providerRequiredIds.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.required = isProvider;
  });

  // Init map the first time provider tab is selected (needs the container visible)
  if (isProvider && !registerMapInitialized) {
    registerMapInitialized = true;
    setTimeout(initRegisterMap, 50);
  }
}

/** Build JSON body and call registerUser(); if provider, follow up with addProvider() */
function handleRegisterSubmit(e) {
  e.preventDefault();

  if (!validateRegisterForm()) return;

  var isProvider = registerRole === "provider";

  var userData = {
    role:     registerRole,   // PHP converts "customer" → "client"
    email:    document.getElementById("reg-email").value.trim(),
    password: document.getElementById("reg-password").value,
    fname:    document.getElementById("fname").value.trim(),
    lname:    document.getElementById("lname").value.trim(),
    phone:    isProvider
              ? document.getElementById("mobile").value.trim()
              : document.getElementById("phone").value.trim()
  };

  var submitBtn = document.getElementById("register-submit");
  if (submitBtn) submitBtn.disabled = true;

  registerUser(userData).then(function (res) {
    if (!res.success) {
      // Email-specific error goes under the email field; everything else at the bottom
      if (res.message && res.message.toLowerCase().indexOf("email") !== -1) {
        showFieldError("reg-email", res.message);
      } else {
        showFormError(res.message);
      }
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    // Customer: redirect straight to login
    if (!isProvider) {
      window.location.href = "login.html";
      return;
    }

    // Provider — Step 2: call add_provider with the new user_id
    var userId = res.data && res.data.id;

    var wh = [];
    document.querySelectorAll(".wh-row").forEach(function (row) {
      var isClosed = row.querySelector(".wh-closed").checked;
      wh.push({
        day:        row.getAttribute("data-day"),
        open_time:  isClosed ? null : (row.querySelector(".wh-open").value  || null),
        close_time: isClosed ? null : (row.querySelector(".wh-close").value || null),
        is_close:   isClosed ? 1 : 0
      });
    });

    var catSel = document.getElementById("provider-category");

    var citySel = document.getElementById("city-select");
    var cityEn = citySel ? citySel.value : "";
    var cityAr = (citySel && citySel.options[citySel.selectedIndex]) ? citySel.options[citySel.selectedIndex].getAttribute("data-ar") || "" : "";

    // Upload photos first (if any), then save the provider record
    var photoPromise = selectedPhotos.length > 0
      ? uploadProviderPhotos(selectedPhotos)
      : Promise.resolve({ success: true, urls: [] });

    photoPromise.then(function (uploadRes) {
      if (!uploadRes.success) {
        showFormError(uploadRes.message || (currentLang === "ar" ? "فشل في رفع الصور" : "Photo upload failed"));
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      addProvider({
        user_id:       userId,
        name_en:       document.getElementById("name-en").value.trim(),
        name_ar:       document.getElementById("name-ar").value.trim(),
        phone:         document.getElementById("mobile").value.trim(),
        address_en:    document.getElementById("address-en").value.trim(),
        address_ar:    document.getElementById("address-ar").value.trim(),
        city_en:       cityEn,
        city_ar:       cityAr,
        bio_en:        document.getElementById("bio-en").value.trim(),
        bio_ar:        document.getElementById("bio-ar").value.trim(),
        category_id:   catSel ? catSel.value : "",
        working_hours: wh,
        photos:        uploadRes.urls,
        lat:           registerLat,
        lng:           registerLng
      }).then(function (provRes) {
        if (!provRes.success) {
          showFormError(provRes.message);
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
        selectedPhotos = []; // clear staged files
        window.location.href = "login.html";
      }).catch(function (err) {
        showFormError(err.message || (currentLang === "ar" ? "فشل في حفظ بيانات الورشة" : "Provider setup failed"));
        if (submitBtn) submitBtn.disabled = false;
      });
    }).catch(function (err) {
      showFormError(err.message || (currentLang === "ar" ? "فشل في رفع الصور" : "Photo upload failed"));
      if (submitBtn) submitBtn.disabled = false;
    });
  }).catch(function (err) {
    showFormError(err.message || (currentLang === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again"));
    if (submitBtn) submitBtn.disabled = false;
  });
}


/** Wire عميل / مزود خدمة buttons on register (and login role toggle if present) */
function setupRoleToggle() {
  var toggle = document.getElementById("register-role-toggle");
  if (!toggle) {
    document.querySelectorAll(".role-toggle button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".role-toggle button").forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
      });
    });
    return;
  }

  toggle.querySelectorAll("button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      toggle.querySelectorAll("button").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      setRegisterRole(btn.getAttribute("data-role") || "customer");
    });
  });
}

/** Called when language shifts on login/register pages */
function authOnLanguageChange() {
  loadRegisterCategories();
  refreshCitySelect();
  setRegisterRole(registerRole);
}

// =============================================================================
// 9. app.js & Initialization
// =============================================================================

document.addEventListener("DOMContentLoaded", function () {
  renderHeader();
  renderFooter();
  setLanguage(currentLang);

  var langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    langBtn.addEventListener("click", toggleLanguage);
  }

  // Auth pages initialization:
  if (window.location.pathname.includes("login.html") || window.location.pathname.includes("register.html")) {
    setupRoleToggle();
    initLoginPage();
    initRegisterPage();

    var loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", handleLoginSubmit);
    }

    var registerForm = document.getElementById("register-form");
    if (registerForm) {
      registerForm.addEventListener("submit", handleRegisterSubmit);
    }
  }
});

// Global language change dispatcher called by setLanguage()
function onLanguageChange(lang) {
  // If we are on login/register pages, call auth language change
  if (window.location.pathname.includes("login.html") || window.location.pathname.includes("register.html")) {
    if (typeof authOnLanguageChange === "function") {
      authOnLanguageChange(lang);
    }
  }
  // Page-specific handlers defined in pages.js will override/be called by this
  if (typeof pageOnLanguageChange === "function") {
    pageOnLanguageChange(lang);
  }
}
