/**
 * =============================================================================
 * service-detail.js — JavaScript logic for the provider details page (service-detail.html)
 * =============================================================================
 */

var detailMapInstance = null;

var DAY_KEY_MAP = {
  Monday: "day_mon", Tuesday: "day_tue", Wednesday: "day_wed",
  Thursday: "day_thu", Friday: "day_fri", Saturday: "day_sat", Sunday: "day_sun"
};

/**
  * Initialize the service detail page, loading workshop details from PHP API.
  */
function initServiceDetailPage() {
  var params = new URLSearchParams(window.location.search);
  var id = params.get("id") || "1";
  var loc = getStoredLocation() || DEFAULT_LOCATION;
  var locLng = getLocationLng(loc);

  getProviderById(id).then(function (provider) {
    var p = addDistanceToProviders([provider], loc.lat, locLng)[0];
    renderDetail(p);
    loadReviews(id);
    renderReviewForm(id);
    setupFavoriteButton(id);
    loadSimilar(p, loc);
  });
}

/**
  * Render the workshop details into the page DOM.
  * @param {object} p — The provider details object.
  */
function renderDetail(p) {
  var base = getBasePath();
  setEl("detail-title", getLocalizedField(p, "name"));
  
  var ratingEl = document.getElementById("detail-rating");
  if (ratingEl) {
    if (p.review_count > 0) {
      ratingEl.innerHTML = "★ " + p.avg_rating + " <span style='color:var(--text-secondary);font-size:0.9rem'>(" + p.review_count + ")</span>";
    } else {
      ratingEl.style.color = "var(--text-secondary)";
      ratingEl.textContent = t("no_reviews_yet");
    }
  }

  setEl("detail-address", getLocalizedField(p, "address"));
  setEl("detail-phone", p.phone);
  setEl("detail-desc", getLocalizedField(p, "bio"));
  setEl("live-status", p.is_open_now ? t("online_now") : t("closed"));

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
      callBtn.style.cursor = "pointer";
      callBtn.textContent = t("show_phone");
      var phoneEl = document.getElementById("detail-phone");
      if (phoneEl) phoneEl.style.display = "none";
      callBtn.addEventListener("click", function () {
        window.location.href = "../login/index.html?from=" + encodeURIComponent(window.location.href);
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

  if (p.lat != null && p.lng != null) {
    initDetailMap(Number(p.lat), Number(p.lng), getLocalizedField(p, "name"));
    renderDirectionsLink(p.lat, p.lng);
  } else {
    renderEmptyDetailMap();
  }

  var locationBtn = document.getElementById("location-btn");
  if (locationBtn) {
    locationBtn.addEventListener("click", function () {
      var mapEl = document.getElementById("detail-map");
      if (mapEl) mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
}

/**
  * Render user uploaded photos into the gallery area.
  * @param {Array} photos — List of photo objects.
  * @param {string} base — Relative path prefix.
  */
function renderPhotoGallery(photos, base) {
  var section = document.getElementById("photos-section");
  if (!section) return;
  if (!photos.length) {
    section.style.display = "none";
    return;
  }
  section.style.display = "";
  var grid = document.getElementById("photos-grid");
  if (!grid) return;
  grid.innerHTML = photos.map(function (ph) {
    var url = base + ph.photo_url;
    return '<div class="gallery-thumb" style="background-image:url(\'' + url + '\')" onclick="openLightbox(\'' + url + '\')"></div>';
  }).join("");
}

/**
  * Open Lightbox overlay for full-sized photo.
  * @param {string} src — Image source URL.
  */
function openLightbox(src) {
  var overlay = document.getElementById("lightbox");
  var img = document.getElementById("lightbox-img");
  if (!overlay || !img) return;
  img.src = src;
  overlay.classList.add("open");
}

/**
  * Close Lightbox overlay.
  */
function closeLightbox() {
  var overlay = document.getElementById("lightbox");
  if (overlay) overlay.classList.remove("open");
}

/**
  * Render working hours weekly list.
  * @param {Array} hours — working hours records.
  */
function renderWorkingHours(hours) {
  var section = document.getElementById("hours-section");
  if (!section) return;
  if (!hours.length) {
    section.style.display = "none";
    return;
  }
  section.style.display = "";
  var listEl = document.getElementById("hours-list");
  if (!listEl) return;
  listEl.innerHTML = hours.map(function (wh) {
    var key = DAY_KEY_MAP[wh.day] || wh.day;
    var time = wh.is_close
      ? '<span class="wh-time wh-closed">' + t("day_off") + '</span>'
      : '<span class="wh-time">' + wh.open_time + ' – ' + wh.close_time + '</span>';
    return '<li class="wh-item"><span class="wh-day">' + t(key) + " : " + '</span>' + time + '</li>';
  }).join("");
}

/**
  * Draw the Leaflet map and center marker on coordinates.
  */
function initDetailMap(lat, lng, title) {
  var mapEl = document.getElementById("detail-map");
  if (!mapEl || typeof L === "undefined") return;
  mapEl.classList.remove("detail-map-empty");
  mapEl.textContent = "";
  if (detailMapInstance) {
    detailMapInstance.remove();
    detailMapInstance = null;
  }
  detailMapInstance = L.map("detail-map", { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], 15);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(detailMapInstance);
  L.marker([lat, lng]).addTo(detailMapInstance).bindPopup(title).openPopup();
  setTimeout(function () {
    if (detailMapInstance) detailMapInstance.invalidateSize();
  }, 100);
}

function renderDirectionsLink(lat, lng) {
  var link = document.getElementById("directions-link");
  if (!link) return;
  link.style.display = "inline-flex";
  link.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(lat + "," + lng);
  link.textContent = t("directions");
}

function renderEmptyDetailMap() {
  var mapEl = document.getElementById("detail-map");
  var link = document.getElementById("directions-link");
  if (detailMapInstance) {
    detailMapInstance.remove();
    detailMapInstance = null;
  }
  if (mapEl) {
    mapEl.classList.add("detail-map-empty");
    mapEl.textContent = t("location_unavailable");
  }
  if (link) link.style.display = "none";
}

/**
  * Fetch and render reviews list.
  * @param {string} providerId — ID of the provider.
  */
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

/**
  * Query favorites database to check if saved, and configure favorite toggle action.
  * @param {string} providerId — ID of the provider.
  */
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
      window.location.href = "../login/index.html?from=" + encodeURIComponent(window.location.href);
      return;
    }

    btn.disabled = true;
    toggleFavorite(providerId).then(function (res) {
      if (res.success) {
        btn.textContent = (res.is_saved ? "♥ " : "♡ ") + t("favorite");
      } else if (res.message) {
        alert(res.message);
      }
    }).catch(function (err) {
      alert((err && err.message) || "Could not update favorite.");
    }).finally(function () {
      btn.disabled = false;
    });
  });
}

/**
  * Render the review submission form for authorized users.
  * @param {string} providerId — ID of the provider.
  */
function renderReviewForm(providerId) {
  var section = document.getElementById("reviews-section");
  if (!section) return;

  var wrapper = document.createElement("div");
  wrapper.style.cssText = "margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)";

  if (!localStorage.getItem("autoconnect_token")) {
    wrapper.innerHTML = '<a href="../login/index.html?from=' + encodeURIComponent(window.location.href) + '" class="btn btn-primary btn-sm">' + t("review_login_prompt") + '</a>';
    section.appendChild(wrapper);
    return;
  }

  var selectedRate = 0;

  wrapper.innerHTML =
    '<h4 style="margin-bottom:0.5rem">' + t("review_add_title") + '</h4>' +
    '<div class="review-stars" id="review-stars">' +
      '<span class="star" data-val="1">★</span>' +
      '<span class="star" data-val="2">★</span>' +
      '<span class="star" data-val="3">★</span>' +
      '<span class="star" data-val="4">★</span>' +
      '<span class="star" data-val="5">★</span>' +
    '</div>' +
    '<textarea id="review-comment" class="form-control" rows="3" ' +
      'placeholder="' + t("review_comment_ph") + '" ' +
      'style="margin-bottom:0.75rem;resize:vertical"></textarea>' +
    '<button id="review-submit" class="btn btn-primary btn-sm">' + t("review_submit") + '</button>' +
    '<p id="review-msg" style="margin-top:0.5rem;font-size:0.875rem"></p>';

  section.appendChild(wrapper);

  var stars = wrapper.querySelectorAll(".star");

  function highlight(n) {
    stars.forEach(function (s) {
      s.classList.toggle("active", Number(s.getAttribute("data-val")) <= n);
    });
  }

  stars.forEach(function (s) {
    s.addEventListener("mouseenter", function () { highlight(Number(s.getAttribute("data-val"))); });
    s.addEventListener("mouseleave", function () { highlight(selectedRate); });
    s.addEventListener("click", function () {
      selectedRate = Number(s.getAttribute("data-val"));
      highlight(selectedRate);
    });
  });

  document.getElementById("review-submit").addEventListener("click", function () {
    var msg = document.getElementById("review-msg");
    if (!selectedRate) {
      msg.textContent = t("review_pick_star");
      msg.style.color = "var(--danger, #e53e3e)";
      return;
    }
    var comment = document.getElementById("review-comment").value.trim();
    var btn = document.getElementById("review-submit");
    btn.disabled = true;

    postReview(providerId, selectedRate, comment).then(function (res) {
      if (res && res.success) {
        msg.textContent = t("review_success");
        msg.style.color = "var(--success, #38a169)";
        wrapper.querySelector(".review-stars").style.pointerEvents = "none";
        document.getElementById("review-comment").disabled = true;
        btn.style.display = "none";
        loadReviews(providerId);
      } else {
        var isDuplicate = res && res.message && res.message.toLowerCase().indexOf("already") >= 0;
        msg.textContent = isDuplicate ? t("review_duplicate") : t("review_error");
        msg.style.color = "var(--danger, #e53e3e)";
        btn.disabled = false;
      }
    }).catch(function () {
      var msg2 = document.getElementById("review-msg");
      msg2.textContent = t("review_error");
      msg2.style.color = "var(--danger, #e53e3e)";
      btn.disabled = false;
    });
  });
}

/**
  * Fetch other workshops under same category, filter out current one, and render top 3.
  */
function loadSimilar(current, loc) {
  getProviders({ category_slug: current.category_slug }).then(function (list) {
    var similar = list.filter(function (p) { return p.id !== current.id; }).slice(0, 3);
    similar = addDistanceToProviders(similar, loc.lat, getLocationLng(loc));
    renderProviderList("similar-grid", similar, { basePath: getBasePath() });
  });
}

/**
  * Hook triggered when the app language changes to update localized values.
  * @param {string} lang — current language ('ar' or 'en').
  */
function onLanguageChange(lang) {
  var params = new URLSearchParams(window.location.search);
  getProviderById(params.get("id") || "1").then(renderDetail);
}

// Run initialization on page load
document.addEventListener("DOMContentLoaded", initServiceDetailPage);
