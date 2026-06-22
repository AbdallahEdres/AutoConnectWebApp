/**
 * =============================================================================
 * home.js — JavaScript logic for the home page (index.html)
 * =============================================================================
 */

/**
  * Initialize Search Form, dropdown filling, and submit listener.
  */
function initHomePage() {
  fillCategorySelect("search-type");
  fillCitySelect("search-location");

  var form = document.getElementById("hero-search-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var type = document.getElementById("search-type").value;
    var loc = document.getElementById("search-location").value;
    var url = "../services/index.html?category_slug=" + encodeURIComponent(type);
    if (loc) {
      url += "&city=" + encodeURIComponent(loc);
    }
    window.location.href = url;
  });
}

/**
  * Populate the service category dropdown with options from the backend.
  * @param {string} selectId — HTML ID of the select element.
  */
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

/**
  * Populate the city/location dropdown with regions from the backend.
  * @param {string} selectId — HTML ID of the select element.
  */
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

/**
  * Hook triggered when the app language changes to update localized values.
  * @param {string} lang — current language ('ar' or 'en').
  */
function onLanguageChange(lang) {
  fillCategorySelect("search-type");
  fillCitySelect("search-location");
}

// Run initialization on page load
document.addEventListener("DOMContentLoaded", initHomePage);
