/**
 * =============================================================================
 * service-detail.js — pages/service-detail.html?id=1
 * =============================================================================
 * Reads provider id from URL, shows details, reviews, similar providers, favorite button.
 * =============================================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  var params = new URLSearchParams(window.location.search);
  var id = params.get("id") || "1";
  var loc = getStoredLocation() || DEFAULT_LOCATION;

  getProviderById(id).then(function (provider) {
    var withDist = addDistanceToProviders([provider], loc.lat, loc.long)[0];
    renderDetail(withDist);
    loadSimilar(withDist, loc);
    loadReviews(id);
    setupFavoriteButton(id);
  });
});

function loadReviews(providerId) {
  var listEl = document.getElementById("reviews-list");
  if (!listEl) return;
  getReviews(providerId).then(function (reviews) {
    if (!reviews.length) {
      listEl.innerHTML = "<li>" + t("no_results") + "</li>";
      return;
    }
    listEl.innerHTML = reviews
      .map(function (r) {
        var name = getLocalizedField(r, "user_name");
        var comment = getLocalizedField(r, "comment");
        return (
          "<li style='margin-bottom:0.65rem'><strong>★ " +
          r.rate +
          "</strong> " +
          name +
          " — " +
          comment +
          "</li>"
        );
      })
      .join("");
  });
}

function setupFavoriteButton(providerId) {
  var btn = document.querySelector(".detail-actions .btn-outline");
  if (!btn) return;
  btn.addEventListener("click", function () {
    toggleFavorite(Number(providerId)).then(function (res) {
      if (res.success) {
        btn.textContent = res.data.added ? "♥ " + t("favorite") : "♡";
      }
    });
  });
}

function renderDetail(p) {
  var base = getBasePath();
  document.getElementById("detail-title").textContent = getLocalizedField(p, "name");
  document.getElementById("detail-rating").textContent = "★ " + p.rating;
  document.getElementById("detail-address").textContent = getLocalizedField(p, "address");
  document.getElementById("detail-phone").textContent = p.phone;
  document.getElementById("detail-desc").textContent = getLocalizedField(p, "description");
  document.getElementById("call-btn").href = "tel:" + p.phone;

  var hero = document.getElementById("detail-hero");
  if (p.image) {
    hero.style.backgroundImage =
      "linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5)), url('" + base + p.image + "')";
  }

  var status = p.status === "open";
  document.getElementById("live-status").textContent = status
    ? t("online_now")
    : t("closed");
  document.getElementById("wait-time").textContent =
    "~" + (p.waiting_minutes || 0) + " min";
  document.getElementById("capacity").textContent =
    (p.capacity || 0) + " / " + (p.max_capacity || 0);
}

function loadSimilar(current, loc) {
  getProviders({
    category_slug: current.category_slug,
    lat: loc.lat,
    long: loc.long
  }).then(function (list) {
    var similar = list
      .filter(function (p) {
        return p.id !== current.id;
      })
      .slice(0, 3);
    renderProviderList("similar-grid", similar, { basePath: getBasePath() });
  });
}

function onLanguageChange() {
  var params = new URLSearchParams(window.location.search);
  var id = params.get("id") || "1";
  getProviderById(id).then(function (p) {
    renderDetail(p);
  });
}
