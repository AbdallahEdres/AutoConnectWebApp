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
  updatePassword: "/update_password.php",
  reviews: "/reviews.php",
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
        ${phone ? `<p class="provider-card__meta">📞 ${phone}</p>` : ""}
        <div class="provider-card__actions">
          <a href="${detailUrl}" class="btn btn-ghost btn-sm">${options.detailsLabel || t("view_details")}</a>
          <a href="tel:${phone}" class="btn btn-primary btn-sm">${t("call_now")}</a>
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
        <p class="provider-card__meta">📞 ${phone}</p>
      </div>
      <div style="display:flex;gap:0.5rem">
        <button type="button" class="btn btn-outline btn-sm" data-map="${provider.id}">${t("view_map")}</button>
        <a href="tel:${phone}" class="btn btn-danger btn-sm">${t("call_now")}</a>
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
          <a href="${base}pages/login.html" class="btn btn-sm btn-ghost" data-i18n="nav_login"></a>
          <a href="${base}pages/register.html" class="btn btn-sm btn-primary" data-i18n="nav_signup"></a>
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

/** Send email + password to API; go to profile if success */
function handleLoginSubmit(e) {
  e.preventDefault();
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;
  loginUser(email, password)
    .then(function (res) {
      if (!res.success) {
        alert(res.message);
        return;
      }
      alert(res.message);
      window.location.href = "profile.html";
    })
    .catch(function (err) {
      alert(err.message || "Login failed");
    });
}

/** Setup register page on first load */
function initRegisterPage() {
  if (!document.getElementById("register-form")) return;
  loadRegisterCategories();
  setRegisterRole("customer");
}

/** Fill service type dropdown from getCategories() API */
function loadRegisterCategories() {
  var sel = document.getElementById("provider-category");
  if (!sel) return;
  getCategories().then(function (cats) {
    sel.innerHTML = "";
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
  var card = document.getElementById("register-card");
  var subtitle = document.getElementById("register-subtitle");
  var submitBtn = document.getElementById("register-submit");
  var fullName = document.getElementById("full-name");
  var phone = document.getElementById("phone");
  var workshop = document.getElementById("workshop-name");
  var mobile = document.getElementById("mobile");
  var category = document.getElementById("provider-category");
  var cityArea = document.getElementById("city-area");

  var isProvider = role === "provider";

  if (customerFields) {
    customerFields.classList.toggle("register-fields-hidden", isProvider);
  }
  if (providerFields) {
    providerFields.classList.toggle("register-fields-hidden", !isProvider);
  }
  if (card) {
    card.classList.toggle("auth-card--provider", isProvider);
  }
  if (subtitle) {
    subtitle.textContent = isProvider ? t("register_provider_sub") : t("register_sub");
    subtitle.classList.toggle("provider-mode", isProvider);
  }
  if (submitBtn) {
    submitBtn.textContent = isProvider ? t("register_workshop") : t("create_account");
  }

  // HTML5 required attribute on the right fields only
  if (fullName) fullName.required = !isProvider;
  if (phone) phone.required = !isProvider;
  if (workshop) workshop.required = isProvider;
  if (mobile) mobile.required = isProvider;
  if (category) category.required = isProvider;
  if (cityArea) cityArea.required = isProvider;
}

/** Build JSON body and call registerUser() — different fields per role */
function handleRegisterSubmit(e) {
  e.preventDefault();

  var email = document.getElementById("reg-email").value.trim();
  var password = document.getElementById("reg-password").value;
  var confirm = document.getElementById("confirm-password").value;

  if (password !== confirm) {
    alert(currentLang === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
    return;
  }

  var data = {
    role: registerRole,
    email: email,
    password: password
  };

  if (registerRole === "customer") {
    data.name = document.getElementById("full-name").value.trim();
    data.phone = document.getElementById("phone").value.trim();
  } else {
    var catSel = document.getElementById("provider-category");
    var opt = catSel.options[catSel.selectedIndex];
    data.name = document.getElementById("workshop-name").value.trim();
    data.phone = document.getElementById("mobile").value.trim();
    data.workshop_name = data.name;
    data.mobile = data.phone;
    data.category_id = catSel.value;
    data.category_slug = opt ? opt.getAttribute("data-slug") : "mechanic";
    data.availability = document.getElementById("availability").value;
    data.working_hours = document.getElementById("working-hours").value.trim();
    data.city = document.getElementById("city-area").value.trim();
    data.address = data.city;
    data.description = document.getElementById("service-desc").value.trim();
    data.lat = DEFAULT_LOCATION.lat;
    data.long = DEFAULT_LOCATION.long;
    data.status = data.availability === "closed" ? "closed" : "open";
  }

  registerUser(data).then(function (res) {
    if (!res.success) {
      alert(res.message);
      return;
    }
    alert(res.message);
    if (registerRole === "provider") {
      window.location.href = "services.html";
    } else {
      window.location.href = "login.html";
    }
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
