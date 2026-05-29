

// Global variables for page-specific code (matching original architecture)
var activeCategory = ""; // from favorites.js
var allProviders = [];   // from services.js
var categories = [];     // from services.js

// Page routing and initialization
document.addEventListener("DOMContentLoaded", function () {
  var path = window.location.pathname;

  // 1. Home page (index.html or root path)
  if (path.indexOf("/pages/") === -1 || path.includes("index.html")) {
    initHomePage();
  }

  // 2. Services page (services.html)
  if (path.includes("services.html")) {
    initServicesPage();
  }

  // 3. Emergency page (emergency.html)
  if (path.includes("emergency.html")) {
    initEmergencyPage();
  }

  // 4. Favorites page (favorites.html)
  if (path.includes("favorites.html")) {
    initFavoritesPage();
  }

  // 5. Profile page (profile.html)
  if (path.includes("profile.html")) {
    initProfilePage();
  }

  // 6. Provider Register page (provider-register.html)
  if (path.includes("provider-register.html")) {
    initProviderRegisterPage();
  }

  // 7. Service Detail page (service-detail.html)
  if (path.includes("service-detail.html")) {
    initServiceDetailPage();
  }

  // 8. Settings page (settings.html)
  if (path.includes("settings.html")) {
    initSettingsPage();
  }
});

// =============================================================================
// Home Page Specific Logic (home.js)
// =============================================================================
function initHomePage() {
  var form = document.getElementById("hero-search-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var type = document.getElementById("search-type").value;
      var loc = document.getElementById("search-location").value;
      var url = "pages/services.html?category_slug=" + encodeURIComponent(type);
      if (loc) url += "&city=" + encodeURIComponent(loc);
      window.location.href = url;
    });
  }
  fillCategorySelect("search-type");
}

function fillCategorySelect(selectId) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  getCategories().then(function (cats) {
    var current = sel.value;
    sel.innerHTML = '<option value="">' + t("search_type") + "</option>";
    cats.forEach(function (c) {
      if (c.parent_id) return;
      var opt = document.createElement("option");
      opt.value = c.slug;
      opt.textContent = getLocalizedField(c, "name");
      sel.appendChild(opt);
    });
    if (current) sel.value = current;
  });
}

// =============================================================================
// Services Page Specific Logic (services.js)
// =============================================================================
function initServicesPage() {
  var params = new URLSearchParams(window.location.search);
  loadPage(params);

  var btn = document.getElementById("apply-filter");
  if (btn) {
    btn.addEventListener("click", runSearch);
  }
  var searchInput = document.getElementById("filter-search");
  if (searchInput) {
    searchInput.addEventListener("keyup", function (e) {
      if (e.key === "Enter") runSearch();
    });
  }
}

function loadPage(params) {
  Promise.all([getCategories(), getProviders({})]).then(function (res) {
    categories = res[0];
    allProviders = res[1];
    fillFilterDropdowns();
    applyFiltersFromUrl(params);
    runSearch();
  });
}

function fillFilterDropdowns() {
  var typeSel = document.getElementById("filter-type");
  var regionSel = document.getElementById("filter-region");
  if (typeSel) {
    typeSel.innerHTML = '<option value="">' + t("type") + "</option>";
    categories.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c.slug;
      opt.textContent = getLocalizedField(c, "name");
      typeSel.appendChild(opt);
    });
  }
  if (regionSel) {
    var cities = {};
    allProviders.forEach(function (p) {
      cities[getLocalizedField(p, "city")] = true;
    });
    regionSel.innerHTML = '<option value="">' + t("region") + "</option>";
    Object.keys(cities).forEach(function (city) {
      var opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      regionSel.appendChild(opt);
    });
  }
}

function applyFiltersFromUrl(params) {
  if (params.get("category") && document.getElementById("filter-type")) {
    document.getElementById("filter-type").value = params.get("category");
  }
  if (params.get("city") && document.getElementById("filter-region")) {
    document.getElementById("filter-region").value = params.get("city");
  }
  renderActiveTags(params);
}

function renderActiveTags(params) {
  var wrap = document.getElementById("active-filters");
  if (!wrap) return;
  wrap.innerHTML = "";
  if (params.get("category")) {
    wrap.innerHTML +=
      '<span class="filter-tag">' +
      t("type") +
      ": " +
      params.get("category") +
      "</span>";
  }
  if (params.get("city")) {
    wrap.innerHTML +=
      '<span class="filter-tag">' +
      t("region") +
      ": " +
      params.get("city") +
      "</span>";
  }
}

function runSearch() {
  var loc = getStoredLocation() || DEFAULT_LOCATION;
  var filters = {
    category_slug: document.getElementById("filter-type").value,
    city: document.getElementById("filter-region").value,
    status:
      document.getElementById("filter-status").value === "open"
        ? "open"
        : document.getElementById("filter-status").value === "closed"
          ? "closed"
          : "",
    search: document.getElementById("filter-search").value,
    lat: loc.lat,
    long: loc.long,
    sort: document.getElementById("filter-sort").value || "nearest"
  };

  getProviders(filters).then(function (list) {
    var countEl = document.getElementById("results-count");
    if (countEl) {
      countEl.textContent = t("showing_results") + " " + list.length + " " + t("results");
    }
    renderProviderList("providers-grid", list, { basePath: getBasePath() });
  });
}

// =============================================================================
// Emergency Page Specific Logic (emergency.js)
// =============================================================================
function initEmergencyPage() {
  fillRegions();
  loadEmergencyList(DEFAULT_LOCATION);

  var useLocBtn = document.getElementById("btn-use-location");
  if (useLocBtn) {
    useLocBtn.addEventListener("click", function () {
      var btn = this;
      btn.disabled = true;
      btn.textContent = t("loading");
      getUserLocation()
        .then(function (loc) {
          saveLocation(loc);
          loadEmergencyList(loc);
        })
        .catch(function () {
          alert(t("location_error"));
          loadEmergencyList(DEFAULT_LOCATION);
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = t("use_location");
        });
    });
  }

  var regionSel = document.getElementById("region-select");
  if (regionSel) {
    regionSel.addEventListener("change", function () {
      var val = this.value;
      if (!val) return;
      var parts = val.split(",");
      loadEmergencyList({ lat: parseFloat(parts[0]), long: parseFloat(parts[1]) });
    });
  }
}

function fillRegions() {
  getRegions().then(function (regions) {
    var sel = document.getElementById("region-select");
    if (!sel) return;
    sel.innerHTML = '<option value="">' + t("choose_area") + "</option>";
    regions.forEach(function (r) {
      var opt = document.createElement("option");
      opt.value = r.lat + "," + r.long;
      opt.textContent = getLocalizedField(r, "name");
      sel.appendChild(opt);
    });
  });
}

function loadEmergencyList(loc) {
  var container = document.getElementById("emergency-results");
  if (!container) return;
  container.innerHTML = "<p>" + t("loading") + "</p>";

  getProviders({
    emergency: true,
    lat: loc.lat,
    long: loc.long,
    status: "open"
  }).then(function (list) {
    if (!list.length) {
      container.innerHTML = "<p>" + t("no_results") + "</p>";
      return;
    }
    var html = '<div class="grid-2">';
    list.slice(0, 6).forEach(function (p) {
      html += renderHorizontalProviderCard(p, { basePath: getBasePath() });
    });
    html += "</div>";
    container.innerHTML = html;
  });
}

// =============================================================================
// Favorites Page Specific Logic (favorites.js)
// =============================================================================
function initFavoritesPage() {
  setupTabs();
  loadFavorites();
}

function setupTabs() {
  document.querySelectorAll(".pill[data-category]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".pill[data-category]").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      activeCategory = btn.getAttribute("data-category") || "";
      loadFavorites();
    });
  });
}

function loadFavorites() {
  var loc = getStoredLocation() || DEFAULT_LOCATION;

  getUser().then(function (user) {
    var filters = {
      favorite_ids: user.favorite_provider_ids,
      lat: loc.lat,
      long: loc.long
    };
    if (activeCategory) {
      filters.category_slug = activeCategory;
    }
    return getProviders(filters);
  }).then(function (list) {
    renderProviderList("favorites-grid", list, { basePath: getBasePath() });
  });
}

// =============================================================================
// Profile Page Specific Logic (profile.js)
// =============================================================================
function initProfilePage() {
  getUser().then(function (user) {
    var nameEl = document.getElementById("user-name");
    if (nameEl) {
      nameEl.textContent = getLocalizedField(user, "fname") + " " + getLocalizedField(user, "lname");
    }
    var idEl = document.getElementById("user-id");
    if (idEl) {
      idEl.textContent = "PA-" + user.id + "#";
    }
    var brandEl = document.getElementById("user-vehicle");
    if (brandEl) {
      brandEl.textContent = user.vehicle_brand;
    }
    var cityEl = document.getElementById("user-city");
    if (cityEl) {
      cityEl.textContent = getLocalizedField(user, "city");
    }
    var locEl = document.getElementById("saved-location");
    if (locEl) {
      locEl.textContent = getLocalizedField(user, "saved_location");
    }
    var visitsEl = document.getElementById("total-visits");
    if (visitsEl) {
      visitsEl.textContent = user.total_visits;
    }
    var lastVisitEl = document.getElementById("last-visit");
    if (lastVisitEl) {
      lastVisitEl.textContent = t("days_ago") + " " + user.last_visit_days_ago + " " + t("days");
    }
    var nextMaintEl = document.getElementById("next-maint");
    if (nextMaintEl) {
      nextMaintEl.textContent = getLocalizedField(user, "next_maintenance");
    }

    var loc = getStoredLocation() || {
      lat: user.saved_lat,
      long: user.saved_long
    };

    getProviders({
      favorite_ids: user.favorite_provider_ids,
      lat: loc.lat,
      long: loc.long
    }).then(function (list) {
      renderProviderList("profile-favorites", list.slice(0, 2), {
        basePath: getBasePath()
      });
    });
  });
}

// =============================================================================
// Provider Register Page Specific Logic (provider-register.js)
// =============================================================================
function initProviderRegisterPage() {
  getCategories().then(function (cats) {
    var sel = document.getElementById("provider-category");
    if (!sel) return;
    cats.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c.id;
      opt.setAttribute("data-slug", c.slug);
      opt.textContent = getLocalizedField(c, "name");
      sel.appendChild(opt);
    });
  });

  var form = document.getElementById("provider-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var catSel = document.getElementById("provider-category");
      var opt = catSel.options[catSel.selectedIndex];
      var data = {
        name: document.getElementById("workshop-name").value,
        phone: document.getElementById("mobile").value,
        city: document.getElementById("city-area").value,
        address: document.getElementById("city-area").value,
        description: document.getElementById("service-desc").value,
        category_id: catSel.value,
        category_slug: opt ? opt.getAttribute("data-slug") : "mechanic",
        lat: DEFAULT_LOCATION.lat,
        long: DEFAULT_LOCATION.long
      };
      addProvider(data).then(function (res) {
        alert(res.message || "Registered");
        window.location.href = "services.html";
      });
    });
  }
}

// =============================================================================
// Service Detail Page Specific Logic (service-detail.js)
// =============================================================================
function initServiceDetailPage() {
  var params = new URLSearchParams(window.location.search);
  var id = params.get("id") || "1";
  var loc = getStoredLocation() || DEFAULT_LOCATION;

  getProviderById(id).then(function (provider) {
    var withDist = addDistanceToProviders([provider], loc.lat, loc.long)[0];
    renderDetail(withDist);
    loadSimilar(withDist, loc);
    loadReviews(id);
    setupFavoriteButton(id);
  });
}

function loadReviews(providerId) {
  var listEl = document.getElementById("reviews-list");
  if (!listEl) return;
  getReviews(providerId).then(function (reviews) {
    if (!reviews.length) {
      listEl.innerHTML = "<li>" + t("no_results") + "</li>";
      return;
    }
    listEl.innerHTML = reviews
      .map(function (r) {
        var name = getLocalizedField(r, "user_name");
        var comment = getLocalizedField(r, "comment");
        return (
          "<li style='margin-bottom:0.65rem'><strong>★ " +
          r.rate +
          "</strong> " +
          name +
          " — " +
          comment +
          "</li>"
        );
      })
      .join("");
  });
}

function setupFavoriteButton(providerId) {
  var btn = document.querySelector(".detail-actions .btn-outline");
  if (!btn) return;
  btn.addEventListener("click", function () {
    toggleFavorite(Number(providerId)).then(function (res) {
      if (res.success) {
        btn.textContent = res.data.added ? "♥ " + t("favorite") : "♡";
      }
    });
  });
}

function renderDetail(p) {
  var base = getBasePath();
  var titleEl = document.getElementById("detail-title");
  if (titleEl) titleEl.textContent = getLocalizedField(p, "name");
  var ratingEl = document.getElementById("detail-rating");
  if (ratingEl) ratingEl.textContent = "★ " + p.rating;
  var addressEl = document.getElementById("detail-address");
  if (addressEl) addressEl.textContent = getLocalizedField(p, "address");
  var phoneEl = document.getElementById("detail-phone");
  if (phoneEl) phoneEl.textContent = p.phone;
  var descEl = document.getElementById("detail-desc");
  if (descEl) descEl.textContent = getLocalizedField(p, "description");
  var callBtnEl = document.getElementById("call-btn");
  if (callBtnEl) callBtnEl.href = "tel:" + p.phone;

  var hero = document.getElementById("detail-hero");
  if (hero && p.image) {
    hero.style.backgroundImage =
      "linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5)), url('" + base + p.image + "')";
  }

  var status = p.status === "open";
  var statusEl = document.getElementById("live-status");
  if (statusEl) statusEl.textContent = status ? t("online_now") : t("closed");
  var waitEl = document.getElementById("wait-time");
  if (waitEl) waitEl.textContent = "~" + (p.waiting_minutes || 0) + " min";
  var capEl = document.getElementById("capacity");
  if (capEl) capEl.textContent = (p.capacity || 0) + " / " + (p.max_capacity || 0);
}

function loadSimilar(current, loc) {
  getProviders({
    category_slug: current.category_slug,
    lat: loc.lat,
    long: loc.long
  }).then(function (list) {
    var similar = list
      .filter(function (p) {
        return p.id !== current.id;
      })
      .slice(0, 3);
    renderProviderList("similar-grid", similar, { basePath: getBasePath() });
  });
}

// =============================================================================
// Settings Page Specific Logic (settings.js)
// =============================================================================
function initSettingsPage() {
  var form = document.getElementById("password-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      updatePassword({
        current: document.getElementById("current-password").value,
        new: document.getElementById("new-password").value,
        confirm: document.getElementById("confirm-password").value
      }).then(function (res) {
        alert(res.message);
        form.reset();
      });
    });
  }

  var deleteBtn = document.getElementById("delete-account-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", function () {
      if (confirm(t("delete_account") + "?")) {
        alert("Demo: account delete not implemented");
      }
    });
  }
}

// =============================================================================
// Combined Language Change Handler (called by main.js)
// =============================================================================
function pageOnLanguageChange(lang) {
  var path = window.location.pathname;

  if (path.indexOf("/pages/") === -1 || path.includes("index.html")) {
    fillCategorySelect("search-type");
  } else if (path.includes("services.html")) {
    loadPage(new URLSearchParams(window.location.search));
  } else if (path.includes("emergency.html")) {
    fillRegions();
    var loc = getStoredLocation() || DEFAULT_LOCATION;
    loadEmergencyList(loc);
  } else if (path.includes("favorites.html")) {
    loadFavorites();
  } else if (path.includes("profile.html")) {
    getUser().then(function (user) {
      var nameEl = document.getElementById("user-name");
      if (nameEl) {
        nameEl.textContent = getLocalizedField(user, "fname") + " " + getLocalizedField(user, "lname");
      }
      var cityEl = document.getElementById("user-city");
      if (cityEl) {
        cityEl.textContent = getLocalizedField(user, "city");
      }
      var locEl = document.getElementById("saved-location");
      if (locEl) {
        locEl.textContent = getLocalizedField(user, "saved_location");
      }
      var nextMaintEl = document.getElementById("next-maint");
      if (nextMaintEl) {
        nextMaintEl.textContent = getLocalizedField(user, "next_maintenance");
      }
    });
  } else if (path.includes("provider-register.html")) {
    var sel = document.getElementById("provider-category");
    if (sel) {
      var val = sel.value;
      getCategories().then(function (cats) {
        sel.innerHTML = "";
        cats.forEach(function (c) {
          var opt = document.createElement("option");
          opt.value = c.id;
          opt.setAttribute("data-slug", c.slug);
          opt.textContent = getLocalizedField(c, "name");
          sel.appendChild(opt);
        });
        sel.value = val;
      });
    }
  } else if (path.includes("service-detail.html")) {
    var params = new URLSearchParams(window.location.search);
    var id = params.get("id") || "1";
    getProviderById(id).then(function (p) {
      renderDetail(p);
    });
  }
}
