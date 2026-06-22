/**
 * =============================================================================
 * profile.js — JavaScript logic for the user profile page (profile.html)
 * =============================================================================
 */

/**
  * Fetch and render the user's profile details, total stats, vehicle info, and a preview of favorite workshops.
  */
function initProfilePage() {
  getUser().then(function (user) {
    setEl("user-name", (user.fname || "") + " " + (user.lname || ""));
    setEl("user-id", "#" + user.id);
    setEl("total-visits", user.total_visits || 0);

    var vehicleRow = document.getElementById("user-vehicle-row");
    if (user.vehicle_brand) {
      setEl("user-vehicle", user.vehicle_brand);
      if (vehicleRow) vehicleRow.style.display = "";
    } else if (vehicleRow) {
      vehicleRow.style.display = "none";
    }

    var cityRow = document.getElementById("user-city-row");
    if (user.city) {
      setEl("user-city", user.city);
      if (cityRow) cityRow.style.display = "";
    } else if (cityRow) {
      cityRow.style.display = "none";
    }

    var locationCard = document.getElementById("saved-location-card");
    if (user.saved_location) {
      setEl("saved-location", user.saved_location);
      if (locationCard) locationCard.style.display = "";
    } else if (locationCard) {
      locationCard.style.display = "none";
    }

    var loc = getStoredLocation() || DEFAULT_LOCATION;
    getFavorites().then(function (favs) {
      if (favs.length) {
        favs = addDistanceToProviders(favs, loc.lat, getLocationLng(loc));
        renderProviderList("profile-favorites", favs.slice(0, 2), { basePath: getBasePath() });
      } else {
        var favsEl = document.getElementById("profile-favorites");
        if (favsEl) favsEl.innerHTML = '<p class="section-subtitle">' + t("no_results") + '</p>';
      }
    });
  }).catch(function (err) {
    if (err && err.response) {
      window.location.href = "../login/index.html?from=" + encodeURIComponent(window.location.href);
    }
  });
}

/**
  * Hook triggered when the app language changes to update localized values.
  * @param {string} lang — current language ('ar' or 'en').
  */
function onLanguageChange(lang) {
  initProfilePage();
}

// Run initialization on page load
document.addEventListener("DOMContentLoaded", initProfilePage);
