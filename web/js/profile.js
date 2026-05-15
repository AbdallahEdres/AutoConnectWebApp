/**
 * =============================================================================
 * profile.js — pages/profile.html (customer dashboard)
 * =============================================================================
 * Fills profile card from getUser() and shows first 2 favorite providers.
 * =============================================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  getUser().then(function (user) {
    document.getElementById("user-name").textContent =
      getLocalizedField(user, "fname") + " " + getLocalizedField(user, "lname");
    document.getElementById("user-id").textContent = "PA-" + user.id + "#";
    document.getElementById("user-vehicle").textContent = user.vehicle_brand;
    document.getElementById("user-city").textContent = getLocalizedField(user, "city");
    document.getElementById("saved-location").textContent = getLocalizedField(
      user,
      "saved_location"
    );
    document.getElementById("total-visits").textContent = user.total_visits;
    document.getElementById("last-visit").textContent =
      t("days_ago") + " " + user.last_visit_days_ago + " " + t("days");
    document.getElementById("next-maint").textContent = getLocalizedField(
      user,
      "next_maintenance"
    );

    var loc = getStoredLocation() || {
      lat: user.saved_lat,
      long: user.saved_long
    };

    getProviders({
      favorite_ids: user.favorite_provider_ids,
      lat: loc.lat,
      long: loc.long
    }).then(function (list) {
      renderProviderList("profile-favorites", list.slice(0, 2), {
        basePath: getBasePath()
      });
    });
  });
});

function onLanguageChange() {
  getUser().then(function (user) {
    document.getElementById("user-name").textContent =
      getLocalizedField(user, "fname") + " " + getLocalizedField(user, "lname");
    document.getElementById("user-city").textContent = getLocalizedField(user, "city");
    document.getElementById("saved-location").textContent = getLocalizedField(
      user,
      "saved_location"
    );
    document.getElementById("next-maint").textContent = getLocalizedField(
      user,
      "next_maintenance"
    );
  });
}
