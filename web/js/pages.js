// pages.js — Page-specific logic for each HTML page

var activeCategory = "";

document.addEventListener("DOMContentLoaded", function () {
  var path = window.location.pathname;
  if (path.indexOf("/pages/") === -1 || path.includes("index.html")) initHomePage();
  if (path.includes("services.html"))          initServicesPage();
  if (path.includes("emergency.html"))         initEmergencyPage();
  if (path.includes("favorites.html"))         initFavoritesPage();
  if (path.includes("profile.html"))           initProfilePage();
  if (path.includes("provider-register.html")) initProviderRegisterPage();
  if (path.includes("service-detail.html"))    initServiceDetailPage();
  if (path.includes("settings.html"))          initSettingsPage();
});

// =============================================================================
// Favorites helpers — stored in localStorage, no login required
// =============================================================================

function getFavoriteIds() {
  var raw = localStorage.getItem("autoconnect_favorites");
  return raw ? JSON.parse(raw) : [];
}

function toggleFavoriteLocal(providerId) {
  var ids = getFavoriteIds();
  var idx = ids.indexOf(Number(providerId));
  if (idx === -1) {
    ids.push(Number(providerId));
  } else {
    ids.splice(idx, 1);
  }
  localStorage.setItem("autoconnect_favorites", JSON.stringify(ids));
  return idx === -1; // true = just added
}

// =============================================================================
// Home Page
// =============================================================================

function initHomePage() {
  fillCategorySelect("search-type");
  var form = document.getElementById("hero-search-form");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var type = document.getElementById("search-type").value;
    var loc  = document.getElementById("search-location").value;
    var url  = "pages/services.html?category_slug=" + encodeURIComponent(type);
    if (loc) url += "&city=" + encodeURIComponent(loc);
    window.location.href = url;
  });
}

function fillCategorySelect(selectId) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  getCategories().then(function (cats) {
    var current = sel.value;
    sel.innerHTML = '<option value="">' + t("search_type") + "</option>";
    cats.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c.slug;
      opt.textContent = getLocalizedField(c, "name");
      sel.appendChild(opt);
    });
    if (current) sel.value = current;
  });
}

// =============================================================================
// Services Page
// =============================================================================

function initServicesPage() {
  var params = new URLSearchParams(window.location.search);

  // Attach filter events once
  var applyBtn = document.getElementById("apply-filter");
  if (applyBtn) applyBtn.addEventListener("click", runSearch);

  var searchInput = document.getElementById("filter-search");
  if (searchInput) {
    searchInput.addEventListener("keyup", function (e) {
      if (e.key === "Enter") runSearch();
    });
  }

  // Fill dropdowns then run first search
  fillServicesDropdowns(params);
}

function fillServicesDropdowns(params) {
  params = params || new URLSearchParams();

  Promise.all([getCategories(), getRegions()]).then(function (res) {
    var cats    = res[0];
    var regions = res[1];

    var typeSel = document.getElementById("filter-type");
    if (typeSel) {
      typeSel.innerHTML = '<option value="">' + t("type") + "</option>";
      cats.forEach(function (c) {
        var opt = document.createElement("option");
        opt.value = c.slug;
        opt.textContent = getLocalizedField(c, "name");
        if (c.slug === params.get("category_slug")) opt.selected = true;
        typeSel.appendChild(opt);
      });
    }

    var regionSel = document.getElementById("filter-region");
    if (regionSel) {
      regionSel.innerHTML = '<option value="">' + t("region") + "</option>";
      regions.forEach(function (r) {
        var opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = getLocalizedField(r, "name");
        if (r.id === params.get("city")) opt.selected = true;
        regionSel.appendChild(opt);
      });
    }

    runSearch();
  }).catch(function () {
    runSearch();
  });
}

function runSearch() {
  var loc = getStoredLocation() || DEFAULT_LOCATION;
  var filters = {
    category_slug: document.getElementById("filter-type").value,
    city:          document.getElementById("filter-region").value,
    q:             document.getElementById("filter-search").value,
    sort:          document.getElementById("filter-sort").value
  };

  getProviders(filters).then(function (list) {
    list = addDistanceToProviders(list, loc.lat, loc.long);
    var countEl = document.getElementById("results-count");
    if (countEl) {
      countEl.textContent = t("showing_results") + " " + list.length + " " + t("results");
    }
    renderProviderList("providers-grid", list, { basePath: getBasePath() });
  });
}

// =============================================================================
// Emergency Page
// =============================================================================

function initEmergencyPage() {
  fillRegions();
  loadEmergencyList(getStoredLocation() || DEFAULT_LOCATION);

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
      if (!this.value) return;
      var parts = this.value.split(",");
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
      opt.value = r.id;
      opt.textContent = getLocalizedField(r, "name");
      sel.appendChild(opt);
    });
  });
}

function loadEmergencyList(loc) {
  var container = document.getElementById("emergency-results");
  if (!container) return;
  container.innerHTML = "<p>" + t("loading") + "</p>";

  getProviders({ status: "open" }).then(function (list) {
    if (!list.length) {
      container.innerHTML = "<p>" + t("no_results") + "</p>";
      return;
    }
    list = addDistanceToProviders(list, loc.lat, loc.long);
    list.sort(function (a, b) { return a.distance_km - b.distance_km; });
    var html = '<div class="grid-2">';
    list.slice(0, 6).forEach(function (p) {
      html += renderHorizontalProviderCard(p, { basePath: getBasePath() });
    });
    html += "</div>";
    container.innerHTML = html;
  });
}

// =============================================================================
// Favorites Page
// =============================================================================

function initFavoritesPage() {
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
  loadFavorites();
}

function loadFavorites() {
  var ids = getFavoriteIds();
  var loc = getStoredLocation() || DEFAULT_LOCATION;

  if (!ids.length) {
    renderProviderList("favorites-grid", []);
    return;
  }

  getProviders({}).then(function (list) {
    var favs = list.filter(function (p) {
      return ids.indexOf(p.id) !== -1;
    });
    if (activeCategory) {
      favs = favs.filter(function (p) {
        return p.category_slug === activeCategory;
      });
    }
    favs = addDistanceToProviders(favs, loc.lat, loc.long);
    renderProviderList("favorites-grid", favs, { basePath: getBasePath() });
  });
}

// =============================================================================
// Profile Page
// =============================================================================

function initProfilePage() {
  getUser().then(function (user) {
    setEl("user-name",      getLocalizedField(user, "fname") + " " + getLocalizedField(user, "lname"));
    setEl("user-id",        "PA-" + user.id + "#");
    setEl("user-vehicle",   user.vehicle_brand || "");
    setEl("user-city",      getLocalizedField(user, "city"));
    setEl("saved-location", getLocalizedField(user, "saved_location"));
    setEl("total-visits",   user.total_visits || 0);
    setEl("last-visit",     t("days_ago") + " " + (user.last_visit_days_ago || "—") + " " + t("days"));
    setEl("next-maint",     getLocalizedField(user, "next_maintenance") || "—");

    var ids = getFavoriteIds();
    var loc = getStoredLocation() || DEFAULT_LOCATION;
    if (ids.length) {
      getProviders({}).then(function (list) {
        var favs = list.filter(function (p) { return ids.indexOf(p.id) !== -1; });
        favs = addDistanceToProviders(favs, loc.lat, loc.long);
        renderProviderList("profile-favorites", favs.slice(0, 2), { basePath: getBasePath() });
      });
    }
  });
}

// =============================================================================
// Provider Register Page
// =============================================================================

function initProviderRegisterPage() {
  getCategories().then(function (cats) {
    var sel = document.getElementById("provider-category");
    if (!sel) return;
    sel.innerHTML = "";
    cats.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c.id;
      opt.setAttribute("data-slug", c.slug);
      opt.textContent = getLocalizedField(c, "name");
      sel.appendChild(opt);
    });
  });

  var form = document.getElementById("provider-form");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var catSel = document.getElementById("provider-category");
    var workshopName = document.getElementById("workshop-name").value;
    var cityValue    = document.getElementById("city-area").value;
    var bioValue     = document.getElementById("service-desc").value;
    addProvider({
      name_en:       workshopName,
      name_ar:       workshopName,
      phone:         document.getElementById("mobile").value,
      city_en:       cityValue,
      city_ar:       cityValue,
      address_en:    cityValue,
      address_ar:    cityValue,
      bio_en:        bioValue,
      bio_ar:        bioValue,
      category_id:   catSel.value,
      working_hours: document.getElementById("working-hours").value,
      lat:           DEFAULT_LOCATION.lat,
      lng:           DEFAULT_LOCATION.long
    }).then(function (res) {
      alert(res.message || t("register_success"));
      window.location.href = "services.html";
    });
  });
}

// =============================================================================
// Service Detail Page
// =============================================================================

function initServiceDetailPage() {
  var params = new URLSearchParams(window.location.search);
  var id  = params.get("id") || "1";
  var loc = getStoredLocation() || DEFAULT_LOCATION;

  getProviderById(id).then(function (provider) {
    var p = addDistanceToProviders([provider], loc.lat, loc.long)[0];
    renderDetail(p);
    loadReviews(id);
    setupFavoriteButton(id);
    loadSimilar(p, loc);
  });
}

function renderDetail(p) {
  var base = getBasePath();
  setEl("detail-title",   getLocalizedField(p, "name"));
  setEl("detail-rating",  "★ " + p.avg_rating);
  setEl("detail-address", getLocalizedField(p, "address"));
  setEl("detail-phone",   p.phone);
  setEl("detail-desc",    getLocalizedField(p, "bio"));
  setEl("live-status",    p.status === "open" ? t("online_now") : t("closed"));
  setEl("wait-time",      "~" + (p.waiting_minutes || 0) + " min");
  setEl("capacity",       (p.capacity || 0) + " / " + (p.max_capacity || 0));

  var callBtn = document.getElementById("call-btn");
  if (callBtn) callBtn.href = "tel:" + p.phone;

  var hero = document.getElementById("detail-hero");
  if (hero && p.image) {
    hero.style.backgroundImage = "linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5)), url('" + base + p.image + "')";
  }
}

function loadReviews(providerId) {
  var listEl = document.getElementById("reviews-list");
  if (!listEl) return;
  getReviews(providerId).then(function (reviews) {
    if (!reviews.length) {
      listEl.innerHTML = "<li>" + t("no_results") + "</li>";
      return;
    }
    listEl.innerHTML = reviews.map(function (r) {
      return "<li style='margin-bottom:0.65rem'><strong>★ " + r.rate + "</strong> " +
             (r.user_name || "") + " — " + (r.comment || "") + "</li>";
    }).join("");
  });
}

function setupFavoriteButton(providerId) {
  var btn = document.querySelector(".detail-actions .btn-outline");
  if (!btn) return;
  var isFav = getFavoriteIds().indexOf(Number(providerId)) !== -1;
  btn.textContent = (isFav ? "♥ " : "♡ ") + t("favorite");
  btn.addEventListener("click", function () {
    var added = toggleFavoriteLocal(Number(providerId));
    btn.textContent = (added ? "♥ " : "♡ ") + t("favorite");
  });
}

function loadSimilar(current, loc) {
  getProviders({ category_slug: current.category_slug }).then(function (list) {
    var similar = list.filter(function (p) { return p.id !== current.id; }).slice(0, 3);
    similar = addDistanceToProviders(similar, loc.lat, loc.long);
    renderProviderList("similar-grid", similar, { basePath: getBasePath() });
  });
}

// =============================================================================
// Settings Page
// =============================================================================

function initSettingsPage() {
  var form = document.getElementById("password-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      updatePassword({
        current: document.getElementById("current-password").value,
        new:     document.getElementById("new-password").value,
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
        alert("not implemented yet");
      }
    });
  }
}

// =============================================================================
// Language change — refresh data/labels on the current page
// =============================================================================

function pageOnLanguageChange(lang) {
  var path = window.location.pathname;
  if (path.indexOf("/pages/") === -1 || path.includes("index.html")) {
    fillCategorySelect("search-type");
  } else if (path.includes("services.html")) {
    fillServicesDropdowns(new URLSearchParams(window.location.search));
  } else if (path.includes("emergency.html")) {
    fillRegions();
    loadEmergencyList(getStoredLocation() || DEFAULT_LOCATION);
  } else if (path.includes("favorites.html")) {
    loadFavorites();
  } else if (path.includes("profile.html")) {
    initProfilePage();
  } else if (path.includes("provider-register.html")) {
    var sel = document.getElementById("provider-category");
    if (!sel) return;
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
  } else if (path.includes("service-detail.html")) {
    var params = new URLSearchParams(window.location.search);
    getProviderById(params.get("id") || "1").then(renderDetail);
  }
}
