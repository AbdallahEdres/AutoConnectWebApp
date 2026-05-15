/**
 * =============================================================================
 * mock-handlers.js — FAKE BACKEND (for development & demo)
 * =============================================================================
 * While API_CONFIG.useMock is true, api.js calls runMockHandler() in this file
 * instead of calling PHP.
 *
 * What it does:
 *   1. Loads JSON from web/data/*.json (only once per file, then caches in MockStore)
 *   2. Waits mockDelayMs to simulate slow network
 *   3. Returns { success, message, data } — same format PHP should use later
 *
 * When backend is ready: set useMock: false in config.js — this file is ignored.
 * =============================================================================
 */

/**
 * In-memory cache so we do not re-fetch providers.json on every click.
 * null = not loaded yet; after load we keep the array/object here.
 */
var MockStore = {
  providers: null,
  categories: null,
  regions: null,
  reviews: null,
  user: null,
  auth: null,
  favorites: null
};

/** Print to console when logMockCalls is true in config.js */
function mockLog(label, payload) {
  if (API_CONFIG.logMockCalls) {
    console.log("[Mock API]", label, payload || "");
  }
}

/** Promise that resolves after a short delay (feels like real API) */
function mockDelay() {
  return new Promise(function (resolve) {
    setTimeout(resolve, API_CONFIG.mockDelayMs);
  });
}

/** Fetch one file from web/data/ folder */
function loadJson(file) {
  return fetch(getDataBasePath() + "data/" + file).then(function (res) {
    if (!res.ok) throw new Error("Mock data missing: " + file);
    return res.json();
  });
}

// --- Each ensure* loads JSON once and saves it in MockStore ---

function ensureProviders() {
  if (MockStore.providers) return Promise.resolve(MockStore.providers);
  return loadJson("providers.json").then(function (data) {
    MockStore.providers = data;
    return data;
  });
}

function ensureCategories() {
  if (MockStore.categories) return Promise.resolve(MockStore.categories);
  return loadJson("categories.json").then(function (data) {
    MockStore.categories = data;
    return data;
  });
}

function ensureRegions() {
  if (MockStore.regions) return Promise.resolve(MockStore.regions);
  return loadJson("regions.json").then(function (data) {
    MockStore.regions = data;
    return data;
  });
}

function ensureReviews() {
  if (MockStore.reviews) return Promise.resolve(MockStore.reviews);
  return loadJson("reviews.json").then(function (data) {
    MockStore.reviews = data;
    return data;
  });
}

function ensureUser() {
  if (MockStore.user) return Promise.resolve(MockStore.user);
  return loadJson("user.json").then(function (data) {
    MockStore.user = data;
    return data;
  });
}

function ensureAuth() {
  if (MockStore.auth) return Promise.resolve(MockStore.auth);
  return loadJson("auth.json").then(function (data) {
    MockStore.auth = data;
    return data;
  });
}

function ensureFavorites() {
  if (MockStore.favorites) return Promise.resolve(MockStore.favorites);
  return loadJson("favorites.json").then(function (data) {
    MockStore.favorites = data;
    return data;
  });
}

/** Successful API response wrapper — PHP should return the same shape */
function mockOk(data, message) {
  return {
    success: true,
    message: message || "OK",
    data: data
  };
}

/** Failed API response wrapper */
function mockFail(message) {
  return {
    success: false,
    message: message || "Error",
    data: null
  };
}

/**
 * Router: api.js passes endpointKey (e.g. "providers") and we call the right handler.
 */
function runMockHandler(endpointKey, options) {
  options = options || {};
  mockLog(endpointKey, options.params || options.body);

  switch (endpointKey) {
    case "providers":
      return mockGetProviders(options.params);
    case "providerById":
      return mockGetProviderById(options.params.id);
    case "categories":
      return mockDelay().then(function () {
        return ensureCategories().then(function (cats) {
          return mockOk(cats);
        });
      });
    case "regions":
      return mockDelay().then(function () {
        return ensureRegions().then(function (regions) {
          return mockOk(regions);
        });
      });
    case "user":
      return mockDelay().then(function () {
        return ensureUser().then(function (user) {
          return mockOk(user);
        });
      });
    case "reviews":
      return mockGetReviews(options.params.provider_id);
    case "favorites":
      return mockGetFavorites();
    case "login":
      return mockLogin(options.body);
    case "register":
      return mockRegister(options.body);
    case "addProvider":
      return mockAddProvider(options.body);
    case "updatePassword":
      return mockUpdatePassword(options.body);
    case "toggleFavorite":
      return mockToggleFavorite(options.body);
    default:
      return Promise.resolve(mockFail("Unknown endpoint: " + endpointKey));
  }
}

/** GET providers list — uses filterProviders() from utils.js */
function mockGetProviders(filters) {
  filters = filters || {};
  return ensureProviders().then(function (providers) {
    return mockDelay().then(function () {
      var list = filterProviders(providers, filters);
      return mockOk(list);
    });
  });
}

/** GET one provider by id from URL ?id= */
function mockGetProviderById(id) {
  return ensureProviders().then(function (providers) {
    return mockDelay().then(function () {
      var found = providers.find(function (p) {
        return String(p.id) === String(id);
      });
      if (!found) return mockFail("Provider not found");
      return mockOk(found);
    });
  });
}

/** GET reviews for service detail page */
function mockGetReviews(providerId) {
  return ensureReviews().then(function (reviews) {
    return mockDelay().then(function () {
      var list = reviews.filter(function (r) {
        return String(r.provider_id) === String(providerId);
      });
      return mockOk(list);
    });
  });
}

/** GET user's favorite providers (join favorites.json + providers.json) */
function mockGetFavorites() {
  return Promise.all([ensureFavorites(), ensureProviders()]).then(function (res) {
    var fav = res[0];
    var providers = res[1];
    return mockDelay().then(function () {
      var list = providers.filter(function (p) {
        return fav.provider_ids.indexOf(p.id) !== -1;
      });
      return mockOk({ provider_ids: fav.provider_ids, providers: list });
    });
  });
}

/**
 * POST login — checks email/password against data/auth.json
 * On success saves token in localStorage (PHP would return a real JWT later)
 */
function mockLogin(body) {
  body = body || {};
  return ensureAuth().then(function (auth) {
    return mockDelay().then(function () {
      var user = auth.users.find(function (u) {
        return u.email === body.email && u.password === body.password;
      });
      if (!user) {
        return mockFail("Invalid email or password");
      }
      localStorage.setItem("autoconnect_token", "mock-token-" + user.id);
      localStorage.setItem("autoconnect_user_id", String(user.id));
      return mockOk(
        { id: user.id, email: user.email, role: user.role, fname: user.fname, lname: user.lname },
        t("login_success")
      );
    });
  });
}

/**
 * POST register from register.html
 * - role "client" → only saves user info (mock message)
 * - role "provider" → also calls mockAddProvider to add workshop to list
 */
function mockRegister(body) {
  body = body || {};

  if (body.role === "provider") {
    return mockAddProvider({
      name: body.workshop_name || body.name,
      phone: body.mobile || body.phone,
      city: body.city,
      address: body.address || body.city,
      description: body.description,
      category_id: body.category_id,
      category_slug: body.category_slug,
      lat: body.lat,
      long: body.long,
      status: body.status || "open",
      working_hours: body.working_hours,
      owner_email: body.email
    }).then(function (providerRes) {
      if (!providerRes.success) return providerRes;
      return mockOk(
        {
          email: body.email,
          role: "provider",
          provider: providerRes.data
        },
        t("register_success")
      );
    });
  }

  return mockDelay().then(function () {
    return mockOk(
      { email: body.email, name: body.name, role: "client" },
      t("register_success")
    );
  });
}

/** POST new workshop — pushes into MockStore.providers (visible on services page until refresh) */
function mockAddProvider(body) {
  body = body || {};
  return ensureProviders().then(function (providers) {
    return mockDelay().then(function () {
      var newId = providers.length + 1;
      var item = {
        id: newId,
        name: body.name,
        name_en: body.name,
        phone: body.phone,
        address: body.address || body.city || "",
        address_en: body.address || body.city || "",
        city: body.city || "",
        city_en: body.city || "",
        lat: body.lat || DEFAULT_LOCATION.lat,
        long: body.long || DEFAULT_LOCATION.long,
        status: body.status || "open",
        category_id: Number(body.category_id) || 1,
        category_slug: body.category_slug || "mechanic",
        category_name: "ميكانيكي",
        category_name_en: "Mechanic",
        rating: 0,
        review_count: 0,
        price_from: 0,
        description: body.description || "",
        description_en: body.description || "",
        vehicle_types: ["car"],
        image: "assets/images/مزود الخدمه.png",
        waiting_minutes: 0,
        capacity: 0,
        max_capacity: 0,
        working_hours: body.working_hours || "",
        owner_email: body.owner_email || ""
      };
      providers.push(item);
      MockStore.providers = providers;
      return mockOk(item, "Provider added successfully");
    });
  });
}

function mockUpdatePassword(body) {
  return mockDelay().then(function () {
    if (!body || !body.current || !body.new) {
      return mockFail("Missing fields");
    }
    return mockOk(null, t("password_updated"));
  });
}

/** POST add/remove provider id from favorites.json in memory */
function mockToggleFavorite(body) {
  body = body || {};
  var providerId = Number(body.provider_id);
  return ensureFavorites().then(function (fav) {
    return mockDelay().then(function () {
      var idx = fav.provider_ids.indexOf(providerId);
      if (idx === -1) {
        fav.provider_ids.push(providerId);
      } else {
        fav.provider_ids.splice(idx, 1);
      }
      MockStore.favorites = fav;
      if (MockStore.user) {
        MockStore.user.favorite_provider_ids = fav.provider_ids.slice();
      }
      return mockOk({ provider_ids: fav.provider_ids, added: idx === -1 });
    });
  });
}
