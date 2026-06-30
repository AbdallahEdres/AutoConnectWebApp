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

    // Show role badge
    var roleBadge = document.getElementById("user-role-badge");
    if (roleBadge) roleBadge.textContent = user.role || "";

    // Client-only: vehicle info and favorites preview
    var clientSection = document.getElementById("client-section");
    if (user.role === "client") {
      if (clientSection) clientSection.style.display = "";

      var vehicleRow = document.getElementById("user-vehicle-row");
      var vehicleText = [user.vehicle_type, user.vehicle_brand].filter(Boolean).join(" - ");
      if (vehicleText) {
        setEl("user-vehicle", vehicleText);
        if (vehicleRow) vehicleRow.style.display = "";
      } else if (vehicleRow) {
        vehicleRow.style.display = "none";
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
    } else {
      if (clientSection) clientSection.style.display = "none";
    }

    // Agent-only: link to their provider profile
    var agentSection = document.getElementById("agent-section");
    if (user.role === "agent") {
      if (agentSection) agentSection.style.display = "";
    } else {
      if (agentSection) agentSection.style.display = "none";
    }

    // Supervisor-only section
    var supervisorSection = document.getElementById("supervisor-section");
    if (user.role === "supervisor") {
      if (supervisorSection) supervisorSection.style.display = "";
    } else {
      if (supervisorSection) supervisorSection.style.display = "none";
    }
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
