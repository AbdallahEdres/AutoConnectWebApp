/**
 * =============================================================================
 * emergency.js — JavaScript logic for the emergency assistance page (emergency.html)
 * =============================================================================
 */

/**
  * Initialize the emergency page, fetch user location if permitted, and bind the location controls.
  */
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
          if (errEl) {
            errEl.textContent = t("location_error");
          }
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

/**
  * Fetch and fill the manual region select element with options.
  */
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

/**
  * Search for providers, calculate distance from specified location, sort by nearest, and render top 6 as horizontal cards.
  * @param {object} loc — {lat, long} coordinate object.
  */
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
    container.innerHTML = html;
  });
}

/**
  * Hook triggered when the app language changes to update localized values.
  * @param {string} lang — current language ('ar' or 'en').
  */
function onLanguageChange(lang) {
  fillRegions();
  loadEmergencyList(getStoredLocation() || DEFAULT_LOCATION);
}

// Run initialization on page load
document.addEventListener("DOMContentLoaded", initEmergencyPage);
