/**
 * =============================================================================
 * favorites.js — JavaScript logic for the user's favorites page (favorites.html)
 * =============================================================================
 */

var activeCategory = "";

/**
  * Initialize the favorites page, load categories to populate pills, and bind click listeners to pills.
  */
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

/**
  * Fetch current user's favorites from API, filter by active pill category, and render the provider list.
  */
function loadFavorites() {
  var loc = getStoredLocation() || DEFAULT_LOCATION;
  var grid = document.getElementById("favorites-grid");

  if (!localStorage.getItem("autoconnect_token")) {
    if (grid) {
      grid.innerHTML = '<p class="section-subtitle" style="grid-column:1/-1"><a href="../login/index.html">' + t("nav_login") + '</a> ' + (currentLang === "ar" ? "لعرض المفضلة" : "to view your favorites") + '</p>';
    }
    return;
  }

  getFavorites().then(function (favs) {
    if (activeCategory) {
      favs = favs.filter(function (p) { return p.category_slug === activeCategory; });
    }
    favs = addDistanceToProviders(favs, loc.lat, getLocationLng(loc));
    renderProviderList("favorites-grid", favs, { basePath: getBasePath() });
  }).catch(function () {
    renderProviderList("favorites-grid", []);
  });
}

/**
  * Hook triggered when the app language changes to update localized values.
  * @param {string} lang — current language ('ar' or 'en').
  */
function onLanguageChange(lang) {
  loadFavorites();
}

// Run initialization on page load
document.addEventListener("DOMContentLoaded", initFavoritesPage);
