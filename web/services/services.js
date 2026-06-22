/**
 * =============================================================================
 * services.js — JavaScript logic for the service listing page (services.html)
 * =============================================================================
 */

var servicesLocationMap = null;
var servicesLocationMarker = null;
var selectedSearchLocation = null;

/**
  * Initialize the services page, binding search buttons, inputs, and filters.
  */
function initServicesPage() {
  var params = new URLSearchParams(window.location.search);

  var applyBtn = document.getElementById("apply-filter");
  if (applyBtn) {
    applyBtn.addEventListener("click", function () { runSearch({ requestLocation: true }); });
  }

  var searchInput = document.getElementById("filter-search");
  if (searchInput) {
    searchInput.addEventListener("keyup", function (e) {
      if (e.key === "Enter") runSearch({ requestLocation: true });
    });
  }

  setupLocationPicker();
  fillServicesDropdowns(params);
}

/**
  * Fetch categories and regions to populate dropdown filters.
  * @param {URLSearchParams} params — Query parameters from URL to pre-select options.
  */
function fillServicesDropdowns(params) {
  params = params || new URLSearchParams();

  Promise.all([getCategories(), getRegions()]).then(function (res) {
    var cats = res[0];
    var regions = res[1];

    var typeSel = document.getElementById("filter-type");
    if (typeSel) {
      typeSel.innerHTML = '<option value="">' + t("type") + "</option>";
      cats.forEach(function (c) {
        var opt = document.createElement("option");
        opt.value = c.slug;
        opt.textContent = getLocalizedField(c, "name");
        if (c.slug === params.get("category_slug")) {
          opt.selected = true;
        }
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
        if (r.name_en === params.get("city")) {
          opt.selected = true;
        }
        regionSel.appendChild(opt);
      });
    }

    runSearch({ requestLocation: hasSearchParams(params) });
  }).catch(function () {
    runSearch({ requestLocation: hasSearchParams(params) });
  });
}

function hasSearchParams(params) {
  return !!(
    params.get("category_slug") ||
    params.get("city") ||
    params.get("q") ||
    params.get("search") ||
    params.get("from_search")
  );
}

/**
  * Perform the provider search based on the current filters, calculate distance, and render the results.
  */
function runSearch(options) {
  options = options || {};

  ensureSearchLocation(options).then(function (loc) {
    runProviderSearch(loc);
  }).catch(function () {
    showLocationPicker();
  });
}

function ensureSearchLocation(options) {
  var stored = getStoredLocation();
  if (stored && stored.lat != null && getLocationLng(stored) != null) {
    return Promise.resolve(stored);
  }

  if (!options.requestLocation) {
    return Promise.resolve(DEFAULT_LOCATION);
  }

  return getUserLocation().then(function (loc) {
    saveLocation(loc);
    return loc;
  });
}

function getCurrentFilters() {
  return {
    category_slug: document.getElementById("filter-type").value,
    city: document.getElementById("filter-region").value,
    q: document.getElementById("filter-search").value,
    sort: document.getElementById("filter-sort").value
  };
}

function runProviderSearch(loc) {
  loc = loc || DEFAULT_LOCATION;
  var locLng = getLocationLng(loc);
  var filters = {
    category_slug: getCurrentFilters().category_slug,
    city: getCurrentFilters().city,
    q: getCurrentFilters().q,
    sort: getCurrentFilters().sort,
    lat: loc.lat,
    lng: locLng
  };

  getProviders(filters).then(function (list) {
    list = addDistanceToProviders(list, loc.lat, locLng);
    if (filters.sort === "nearest") {
      list.sort(function (a, b) {
        if (a.distance_km == null) return 1;
        if (b.distance_km == null) return -1;
        return a.distance_km - b.distance_km;
      });
    }
    var countEl = document.getElementById("results-count");
    if (countEl) {
      countEl.textContent = t("showing_results") + " " + list.length + " " + t("results");
    }
    renderProviderList("providers-grid", list, { basePath: getBasePath() });
  });
}

function setupLocationPicker() {
  var closeBtn = document.getElementById("location-picker-close");
  var confirmBtn = document.getElementById("location-map-confirm");
  var defaultBtn = document.getElementById("location-map-default");

  setLocationPickerText();

  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      hideLocationPicker();
      runProviderSearch(DEFAULT_LOCATION);
    });
  }

  if (defaultBtn) {
    defaultBtn.addEventListener("click", function () {
      selectedSearchLocation = DEFAULT_LOCATION;
      updateLocationMarker(DEFAULT_LOCATION);
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener("click", function () {
      var loc = selectedSearchLocation || DEFAULT_LOCATION;
      saveLocation(loc);
      hideLocationPicker();
      runProviderSearch(loc);
    });
  }
}

function setLocationPickerText() {
  var title = document.getElementById("location-picker-title");
  var subtitle = document.getElementById("location-picker-subtitle");
  var closeBtn = document.getElementById("location-picker-close");
  var confirmBtn = document.getElementById("location-map-confirm");
  var defaultBtn = document.getElementById("location-map-default");

  if (title) title.textContent = t("location_picker_title");
  if (subtitle) subtitle.textContent = t("location_picker_sub");
  if (closeBtn) closeBtn.textContent = t("skip");
  if (confirmBtn) confirmBtn.textContent = t("use_selected_location");
  if (defaultBtn) defaultBtn.textContent = t("use_cairo_center");
}

function showLocationPicker() {
  var picker = document.getElementById("location-picker");
  if (!picker) {
    runProviderSearch(DEFAULT_LOCATION);
    return;
  }

  selectedSearchLocation = getStoredLocation() || DEFAULT_LOCATION;
  picker.hidden = false;
  picker.scrollIntoView({ behavior: "smooth", block: "center" });
  setLocationPickerText();
  setTimeout(initSearchLocationMap, 50);
}

function hideLocationPicker() {
  var picker = document.getElementById("location-picker");
  if (picker) picker.hidden = true;
}

function initSearchLocationMap() {
  var mapEl = document.getElementById("search-location-map");
  if (!mapEl || typeof L === "undefined") return;

  var loc = selectedSearchLocation || DEFAULT_LOCATION;
  var lng = getLocationLng(loc);

  if (!servicesLocationMap) {
    servicesLocationMap = L.map("search-location-map", { zoomControl: true }).setView([loc.lat, lng], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(servicesLocationMap);

    servicesLocationMap.on("click", function (e) {
      selectedSearchLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
      updateLocationMarker(selectedSearchLocation);
    });
  } else {
    servicesLocationMap.setView([loc.lat, lng], 12);
  }

  updateLocationMarker(loc);
  servicesLocationMap.invalidateSize();
}

function updateLocationMarker(loc) {
  if (!servicesLocationMap || !loc) return;
  var lng = getLocationLng(loc);
  selectedSearchLocation = { lat: loc.lat, lng: lng };
  if (!servicesLocationMarker) {
    servicesLocationMarker = L.marker([loc.lat, lng], { draggable: true }).addTo(servicesLocationMap);
    servicesLocationMarker.on("dragend", function (e) {
      var ll = e.target.getLatLng();
      selectedSearchLocation = { lat: ll.lat, lng: ll.lng };
    });
  } else {
    servicesLocationMarker.setLatLng([loc.lat, lng]);
  }
}

/**
  * Hook triggered when the app language changes to update localized values.
  * @param {string} lang — current language ('ar' or 'en').
  */
function onLanguageChange(lang) {
  setLocationPickerText();
  fillServicesDropdowns(new URLSearchParams(window.location.search));
}

// Run initialization on page load
document.addEventListener("DOMContentLoaded", initServicesPage);
