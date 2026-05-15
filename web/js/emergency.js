/**
 * =============================================================================
 * emergency.js — pages/emergency.html (nearest tow trucks)
 * =============================================================================
 * - "Use my location" → browser GPS → save to localStorage → load towing providers
 * - Manual region dropdown → getRegions() from API
 * - getProviders({ emergency: true }) returns only category_slug === "towing"
 * =============================================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  fillRegions();
  loadEmergencyList(DEFAULT_LOCATION);

  document.getElementById("btn-use-location").addEventListener("click", function () {
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

  document.getElementById("region-select").addEventListener("change", function () {
    var val = this.value;
    if (!val) return;
    var parts = val.split(",");
    loadEmergencyList({ lat: parseFloat(parts[0]), long: parseFloat(parts[1]) });
  });
});

function fillRegions() {
  getRegions().then(function (regions) {
    var sel = document.getElementById("region-select");
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

function onLanguageChange() {
  fillRegions();
  var loc = getStoredLocation() || DEFAULT_LOCATION;
  loadEmergencyList(loc);
}
