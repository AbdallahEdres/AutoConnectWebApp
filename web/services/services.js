/**
 * =============================================================================
 * services.js — JavaScript logic for the service listing page (services.html)
 * =============================================================================
 */

/**
  * Initialize the services page, binding search buttons, inputs, and filters.
  */
function initServicesPage() {
  var params = new URLSearchParams(window.location.search);

  var applyBtn = document.getElementById("apply-filter");
  if (applyBtn) {
    applyBtn.addEventListener("click", runSearch);
  }

  var searchInput = document.getElementById("filter-search");
  if (searchInput) {
    searchInput.addEventListener("keyup", function (e) {
      if (e.key === "Enter") runSearch();
    });
  }

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

    runSearch();
  }).catch(function () {
    runSearch();
  });
}

/**
  * Perform the provider search based on the current filters, calculate distance, and render the results.
  */
function runSearch() {
  var loc = getStoredLocation() || DEFAULT_LOCATION;
  var filters = {
    category_slug: document.getElementById("filter-type").value,
    city: document.getElementById("filter-region").value,
    q: document.getElementById("filter-search").value,
    sort: document.getElementById("filter-sort").value
  };

  getProviders(filters).then(function (list) {
    list = addDistanceToProviders(list, loc.lat, loc.long);
    if (filters.sort === "nearest") {
      list.sort(function (a, b) { return a.distance_km - b.distance_km; });
    }
    var countEl = document.getElementById("results-count");
    if (countEl) {
      countEl.textContent = t("showing_results") + " " + list.length + " " + t("results");
    }
    renderProviderList("providers-grid", list, { basePath: getBasePath() });
  });
}

/**
  * Hook triggered when the app language changes to update localized values.
  * @param {string} lang — current language ('ar' or 'en').
  */
function onLanguageChange(lang) {
  fillServicesDropdowns(new URLSearchParams(window.location.search));
}

// Run initialization on page load
document.addEventListener("DOMContentLoaded", initServicesPage);
