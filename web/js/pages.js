// pages.js — Page-specific logic for each HTML page

var activeCategory = "";
var detailMapInstance = null;

var DAY_KEY_MAP = {
  Monday: "day_mon", Tuesday: "day_tue", Wednesday: "day_wed",
  Thursday: "day_thu", Friday: "day_fri", Saturday: "day_sat", Sunday: "day_sun"
};

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
  if (path.includes("history.html"))           initHistoryPage();
});

// =============================================================================
// Favorites helpers — stored in localStorage, no login required
// =============================================================================


// =============================================================================
// Home Page
// =============================================================================

function initHomePage() {
  fillCategorySelect("search-type");
  fillCitySelect("search-location");
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

function fillCitySelect(selectId) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  getRegions().then(function (regions) {
    var current = sel.value;
    sel.innerHTML = '<option value="">' + t("choose_area") + "</option>";
    regions.forEach(function (r) {
      var opt = document.createElement("option");
      opt.value = r.name_en;
      opt.textContent = getLocalizedField(r, "name");
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
        opt.value = r.name_en;
        opt.textContent = getLocalizedField(r, "name");
        if (r.name_en === params.get("city")) opt.selected = true;
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
          var errEl = document.getElementById("location-error");
          if (errEl) errEl.textContent = t("location_error");
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
      opt.value = r.lat + "," + r.lng;
      opt.textContent = getLocalizedField(r, "name");
      sel.appendChild(opt);
    });
  });
}

function loadEmergencyList(loc) {
  var container = document.getElementById("emergency-results");
  if (!container) return;
  container.innerHTML = "<p>" + t("loading") + "</p>";

  getProviders({}).then(function (list) {
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
  getCategories().then(function (cats) {
    var pillsEl = document.querySelector(".pills");
    if (pillsEl) {
      cats.forEach(function (c) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pill";
        btn.setAttribute("data-category", c.slug);
        btn.textContent = getLocalizedField(c, "name");
        pillsEl.appendChild(btn);
      });
    }

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
  });

  loadFavorites();
}

function loadFavorites() {
  var loc = getStoredLocation() || DEFAULT_LOCATION;
  var grid = document.getElementById("favorites-grid");

  if (!localStorage.getItem("autoconnect_token")) {
    if (grid) grid.innerHTML = '<p class="section-subtitle" style="grid-column:1/-1"><a href="login.html">' + t("nav_login") + '</a> ' + (currentLang === "ar" ? "لعرض المفضلة" : "to view your favorites") + '</p>';
    return;
  }

  getFavorites().then(function (favs) {
    if (activeCategory) {
      favs = favs.filter(function (p) { return p.category_slug === activeCategory; });
    }
    favs = addDistanceToProviders(favs, loc.lat, loc.long);
    renderProviderList("favorites-grid", favs, { basePath: getBasePath() });
  }).catch(function () {
    renderProviderList("favorites-grid", []);
  });
}

// =============================================================================
// Profile Page
// =============================================================================

function initProfilePage() {
  getUser().then(function (user) {
    setEl("user-name",    (user.fname || "") + " " + (user.lname || ""));
    setEl("user-id",      "#" + user.id);
    setEl("total-visits", user.total_visits || 0);

    if (user.vehicle_brand) {
      setEl("user-vehicle", user.vehicle_brand);
      document.getElementById("user-vehicle-row").style.display = "";
    }

    if (user.city) {
      setEl("user-city", user.city);
      document.getElementById("user-city-row").style.display = "";
    }

    if (user.saved_location) {
      setEl("saved-location", user.saved_location);
      document.getElementById("saved-location-card").style.display = "";
    }

    var loc = getStoredLocation() || DEFAULT_LOCATION;
    getFavorites().then(function (favs) {
      if (favs.length) {
        favs = addDistanceToProviders(favs, loc.lat, loc.long);
        renderProviderList("profile-favorites", favs.slice(0, 2), { basePath: getBasePath() });
      }
    });
  }).catch(function (err) {
    if (err && err.response) {
      window.location.href = "login.html";
    }
  });
}

// =============================================================================
// History Page
// =============================================================================

function initHistoryPage() {
  getBookings().then(function (bookings) {
    var tbody = document.getElementById("history-body");
    if (!tbody) return;

    if (!bookings.length) {
      tbody.innerHTML = "<tr><td colspan='2' style='padding:1rem 0.5rem;color:var(--text-muted)'>" + t("history_empty") + "</td></tr>";
      return;
    }

    tbody.innerHTML = bookings.map(function (b) {
      var name = currentLang === "ar" ? (b.name_ar || b.name_en) : (b.name_en || b.name_ar);
      var date = b.created_at ? b.created_at.split(" ")[0] : "—";
      return "<tr>" +
        "<td style='padding:0.65rem 0.5rem;border-bottom:1px solid var(--border-color)'>" +
          "<a href='service-detail.html?id=" + b.provider_id + "'>" + name + "</a>" +
        "</td>" +
        "<td style='padding:0.65rem 0.5rem;border-bottom:1px solid var(--border-color);color:var(--text-muted)'>" + date + "</td>" +
      "</tr>";
    }).join("");
  }).catch(function () {
    window.location.href = "login.html";
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
  setEl("live-status",    p.is_open_now ? t("online_now") : t("closed"));

  var callBtn = document.getElementById("call-btn");
  if (callBtn) {
    if (localStorage.getItem("autoconnect_token")) {
      callBtn.href = "tel:" + p.phone;
      callBtn.textContent = t("call_now");
      callBtn.addEventListener("click", function () {
        createBooking(p.id);
      });
    } else {
      callBtn.removeAttribute("href");
      callBtn.textContent = t("show_phone");
      document.getElementById("detail-phone").style.display = "none";
      callBtn.addEventListener("click", function () {
        window.location.href = "login.html";
      });
    }
  }

  var heroImg = (p.photos && p.photos.length) ? p.photos[0].photo_url : "assets/images/provider_default.png";
  var hero = document.getElementById("detail-hero");
  if (hero) {
    hero.style.backgroundImage = "linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5)), url('" + base + heroImg + "')";
  }

  renderPhotoGallery(p.photos || [], base);
  renderWorkingHours(p.working_hours || []);

  if (p.lat && p.lng) initDetailMap(p.lat, p.lng, getLocalizedField(p, "name"));
}

function renderPhotoGallery(photos, base) {
  var section = document.getElementById("photos-section");
  if (!section) return;
  if (!photos.length) { section.style.display = "none"; return; }
  section.style.display = "";
  var grid = document.getElementById("photos-grid");
  if (!grid) return;
  grid.innerHTML = photos.map(function (ph) {
    var url = base + ph.photo_url;
    return '<div class="gallery-thumb" style="background-image:url(\'' + url + '\')" onclick="openLightbox(\'' + url + '\')"></div>';
  }).join("");
}

function openLightbox(src) {
  var overlay = document.getElementById("lightbox");
  var img = document.getElementById("lightbox-img");
  if (!overlay || !img) return;
  img.src = src;
  overlay.classList.add("open");
}

function closeLightbox() {
  var overlay = document.getElementById("lightbox");
  if (overlay) overlay.classList.remove("open");
}

function renderWorkingHours(hours) {
  var section = document.getElementById("hours-section");
  if (!section) return;
  if (!hours.length) { section.style.display = "none"; return; }
  section.style.display = "";
  var listEl = document.getElementById("hours-list");
  if (!listEl) return;
  listEl.innerHTML = hours.map(function (wh) {
    var key  = DAY_KEY_MAP[wh.day] || wh.day;
    var time = wh.is_close
      ? '<span class="wh-time wh-closed">' + t("day_off") + '</span>'
      : '<span class="wh-time">' + wh.open_time + ' – ' + wh.close_time + '</span>';
    return '<li class="wh-item"><span class="wh-day">' + t(key) + '</span>' + time + '</li>';
  }).join("");
}

function initDetailMap(lat, lng, title) {
  var mapEl = document.getElementById("detail-map");
  if (!mapEl || typeof L === "undefined") return;
  if (detailMapInstance) { detailMapInstance.remove(); detailMapInstance = null; }
  detailMapInstance = L.map("detail-map", { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], 15);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(detailMapInstance);
  L.marker([lat, lng]).addTo(detailMapInstance).bindPopup(title).openPopup();
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

  btn.textContent = "♡ " + t("favorite");

  if (localStorage.getItem("autoconnect_token")) {
    getFavorites().then(function (favs) {
      var isFav = favs.some(function (f) { return f.id === Number(providerId); });
      btn.textContent = (isFav ? "♥ " : "♡ ") + t("favorite");
    });
  }

  btn.addEventListener("click", function () {
    if (!localStorage.getItem("autoconnect_token")) {
      window.location.href = "login.html";
      return;
    }

    btn.disabled = true;
    toggleFavorite(providerId).then(function (res) {
      if (res.success) {
        btn.textContent = (res.is_saved ? "♥ " : "♡ ") + t("favorite");
      }
    }).finally(function () {
      btn.disabled = false;
    });
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
  if (!localStorage.getItem("autoconnect_token")) {
    window.location.href = "login.html";
    return;
  }

  var form = document.getElementById("password-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var currentVal  = document.getElementById("current-password").value;
    var newVal      = document.getElementById("new-password").value;
    var confirmVal  = document.getElementById("confirm-password").value;
    var msg         = document.getElementById("password-msg");
    var required    = currentLang === "ar" ? "هذا الحقل مطلوب" : "This field is required";
    var mismatch    = currentLang === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match";
    var isValid     = true;

    document.getElementById("err-current").textContent  = "";
    document.getElementById("err-new").textContent      = "";
    document.getElementById("err-confirm").textContent  = "";
    if (msg) msg.textContent = "";

    if (!currentVal) {
      document.getElementById("err-current").textContent = required;
      isValid = false;
    }
    if (!newVal) {
      document.getElementById("err-new").textContent = required;
      isValid = false;
    }
    if (!confirmVal) {
      document.getElementById("err-confirm").textContent = required;
      isValid = false;
    }
    if (newVal && confirmVal && newVal !== confirmVal) {
      document.getElementById("err-confirm").textContent = mismatch;
      isValid = false;
    }
    if (!isValid) return;

    var submitBtn = form.querySelector("[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    updatePassword({ current: currentVal, new: newVal, confirm: confirmVal })
      .then(function (res) {
        if (msg) {
          msg.textContent = res.message;
          msg.style.color = res.success ? "var(--success, green)" : "var(--error, #e74c3c)";
        }
        if (res.success) form.reset();
      })
      .catch(function () {
        if (msg) {
          msg.textContent = currentLang === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again";
          msg.style.color = "var(--error, #e74c3c)";
        }
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
  });
}

// =============================================================================
// Language change — refresh data/labels on the current page
// =============================================================================

function pageOnLanguageChange(lang) {
  var path = window.location.pathname;
  if (path.indexOf("/pages/") === -1 || path.includes("index.html")) {
    fillCategorySelect("search-type");
    fillCitySelect("search-location");
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
