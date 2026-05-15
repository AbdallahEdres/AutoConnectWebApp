/**
 * =============================================================================
 * services.js — pages/services.html (filtered provider list)
 * =============================================================================
 * Loads categories + providers, fills filter dropdowns, runs search on button click.
 * URL params ?category=mechanic&city=... from home page are applied on load.
 * =============================================================================
 */

var allProviders = [];
var categories = [];

document.addEventListener("DOMContentLoaded", function () {
  var params = new URLSearchParams(window.location.search);
  loadPage(params);
});

function onLanguageChange() {
  loadPage(new URLSearchParams(window.location.search));
}

/** Main load: fetch data then show filters and results */
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

/** Pre-select filters if user came from home search */
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

/** Read filter inputs → call getProviders → render cards in #providers-grid */
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

document.addEventListener("DOMContentLoaded", function () {
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
});
