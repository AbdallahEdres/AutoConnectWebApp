/**
 * =============================================================================
 * favorites.js — pages/favorites.html
 * =============================================================================
 * Loads user.favorite_provider_ids from getUser(), then filters providers list.
 * Category pills filter by category_slug (mechanic, towing, tires).
 * =============================================================================
 */

var activeCategory = "";

document.addEventListener("DOMContentLoaded", function () {
  setupTabs();
  loadFavorites();
});

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

function onLanguageChange() {
  loadFavorites();
}
