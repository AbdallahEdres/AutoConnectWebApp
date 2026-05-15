/**
 * =============================================================================
 * utils.js — Helper functions (no API calls here)
 * =============================================================================
 * Shared math and browser features: distance, GPS, sorting, filtering providers.
 * Used by mock-handlers.js and by page scripts (services, emergency, …).
 * =============================================================================
 */

/** Convert degrees to radians for distance formula */
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Distance between two GPS points in kilometers (Haversine formula).
 * Used to show "1.2 km away" on provider cards.
 */
function getDistanceKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Earth radius in km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Human-readable distance for UI */
function formatDistance(km) {
  if (km < 1) {
    return Math.round(km * 1000) + " m";
  }
  return km.toFixed(1) + " " + t("km_away");
}

/**
 * Ask browser for user's GPS position (requires HTTPS or localhost).
 * Returns Promise with { lat, long }.
 */
function getUserLocation() {
  return new Promise(function (resolve, reject) {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        resolve({
          lat: pos.coords.latitude,
          long: pos.coords.longitude
        });
      },
      function (err) {
        reject(err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/** Fallback when user denies location permission — center of Cairo */
var DEFAULT_LOCATION = { lat: 30.0444, long: 31.2357 };

/** Read last saved GPS from localStorage (set on emergency page) */
function getStoredLocation() {
  var raw = localStorage.getItem("autoconnect_location");
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function saveLocation(loc) {
  localStorage.setItem("autoconnect_location", JSON.stringify(loc));
}

/** Add distance_km property to each provider object */
function addDistanceToProviders(providers, userLat, userLong) {
  return providers.map(function (p) {
    var copy = Object.assign({}, p);
    copy.distance_km = getDistanceKm(userLat, userLong, p.lat, p.long);
    return copy;
  });
}

/** Sort list by nearest first or highest rating */
function sortProviders(list, sortBy) {
  var arr = list.slice();
  if (sortBy === "rating") {
    arr.sort(function (a, b) {
      return b.rating - a.rating;
    });
  } else {
    arr.sort(function (a, b) {
      return (a.distance_km || 999) - (b.distance_km || 999);
    });
  }
  return arr;
}

function getCategoryName(categoryId, categories) {
  var cat = categories.find(function (c) {
    return c.id === categoryId;
  });
  if (!cat) return "";
  return getLocalizedField(cat, "name");
}

/** Prevent XSS when building HTML from user text */
function escapeHtml(text) {
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Filter provider array — same rules mock and PHP should support.
 * filters examples: { category_slug: "towing", city: "القاهرة", lat, long, sort, emergency: true }
 */
function filterProviders(providers, filters) {
  var list = providers.slice();
  filters = filters || {};

  if (filters.category_slug) {
    list = list.filter(function (p) {
      return p.category_slug === filters.category_slug;
    });
  }
  if (filters.category_id) {
    list = list.filter(function (p) {
      return p.category_id === Number(filters.category_id);
    });
  }
  if (filters.city) {
    list = list.filter(function (p) {
      return getLocalizedField(p, "city").indexOf(filters.city) !== -1;
    });
  }
  if (filters.status === "open") {
    list = list.filter(function (p) {
      return p.status === "open";
    });
  } else if (filters.status === "closed") {
    list = list.filter(function (p) {
      return p.status === "closed";
    });
  }
  if (filters.search) {
    var q = filters.search.toLowerCase();
    list = list.filter(function (p) {
      return getLocalizedField(p, "name").toLowerCase().indexOf(q) !== -1;
    });
  }
  // Emergency page: only tow trucks
  if (filters.emergency) {
    list = list.filter(function (p) {
      return p.category_slug === "towing";
    });
  }
  if (filters.lat != null && filters.long != null) {
    list = addDistanceToProviders(list, Number(filters.lat), Number(filters.long));
    list = sortProviders(list, filters.sort === "rating" ? "rating" : "nearest");
  }
  if (filters.favorite_ids && filters.favorite_ids.length) {
    list = list.filter(function (p) {
      return filters.favorite_ids.indexOf(p.id) !== -1;
    });
  }
  return list;
}
