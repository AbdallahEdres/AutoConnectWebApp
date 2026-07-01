# How to read the AutoConnect JavaScript

> **CSS:** see [`HOW-TO-READ-THE-CSS.md`](HOW-TO-READ-THE-CSS.md) for colors, classes, and which page uses which styles.

Each screen is a self-contained folder under `web/` (e.g. `web/home/`, `web/services/`). Shared scripts live at the `web/` root; page logic lives beside each screen's `index.html`.

## 1. Script load order (every HTML page)

```
../i18n.js              → translations only: TRANSLATIONS object, t(), setLanguage(), getLocalizedField()
../main.js              → core utils, api fetch gate, shared components UI, header/footer injection
[page].js               → page-specific interactive logic only (e.g. services/services.js)
```

`i18n.js` must come first because `main.js` and the page scripts call `t()`. `main.js` comes second because the page scripts rely on shared utilities and API fetch helpers.

---

## 2. What lives inside i18n.js

| Item | What it does |
|------|-------------|
| `TRANSLATIONS` | Object with `ar` and `en` keys — every UI string in both languages |
| `t("key")` | Returns the translated string for the current language |
| `setLanguage(lang)` | Sets `currentLang`, updates `body` classes, rewrites all `[data-i18n]` elements |
| `toggleLanguage()` | Flips between `"ar"` and `"en"`, then calls `onLanguageChange()` if defined |
| `getLocalizedField(obj, "name")` | Returns `obj.name_ar` or `obj.name_en` depending on language |

---

## 3. What lives inside main.js

| Section | What it does |
|---------|-------------|
| **Config** | `API_BASE` (hardcoded to `../../backend/api`) and `API_ENDPOINTS` — a key-to-filename map for every PHP endpoint |
| **Utils** | `getDistanceKm()`, `formatDistance()`, `getUserLocation()`, `getStoredLocation()`, `saveLocation()`, `setEl()`, `addDistanceToProviders()` |
| **API** | `apiRequest()` → single fetch gate. Helper wrappers: `getProviders()`, `getProviderById()`, `getCategories()`, `getRegions()`, `getUser()`, `getBookings()`, `createBooking()`, `loginUser()`, `registerUser()`, `updatePassword()`, `addProvider()`, `verifyProvider()`, `getReviews()`, `postReview()`, `getFavorites()`, `toggleFavorite()` |
| **UI** | `renderProviderCard()` / `renderProviderList()` — builds provider card HTML. `renderHorizontalProviderCard()` — wider card for the emergency page |
| **Layout** | `renderHeader()` / `renderFooter()` — writes shared header/footer into `#site-header` / `#site-footer`. `renderSidebar()` — role-aware sidebar nav (client vs. agent vs. supervisor) for `profile`, `favorites`, `history`, `settings`, `provider-register`, `verify` |
| **Init** | `DOMContentLoaded` — calls `renderHeader()`, `renderFooter()`, `setLanguage()`, and wires up language toggler |

---

## 4. Page scripts (one per screen folder)

Each page loads its own script that runs on `DOMContentLoaded`:

| File | Primary Functions | Target Page |
|------|-------------------|-------------|
| **home/home.js** | `initHomePage()`, `fillCategorySelect()`, `fillCitySelect()` | `home/index.html` |
| **services/services.js** | `initServicesPage()`, `fillServicesDropdowns()`, `runSearch()` | `services/index.html` |
| **emergency/emergency.js** | `initEmergencyPage()`, `fillRegions()`, `loadEmergencyList()` | `emergency/index.html` |
| **favorites/favorites.js** | `initFavoritesPage()`, `loadFavorites()` | `favorites/index.html` |
| **profile/profile.js** | `initProfilePage()` | `profile/index.html` |
| **history/history.js** | `initHistoryPage()` | `history/index.html` |
| **provider-register/provider-register.js**| `initProviderRegisterPage()`, `loadProviderCategories()`, `handleProviderSubmit()` | `provider-register/index.html` |
| **service-detail/service-detail.js** | `initServiceDetailPage()`, `renderDetail()`, `renderPhotoGallery()`, `setupFavoriteButton()`, `renderReviewForm()` | `service-detail/index.html` |
| **settings/settings.js** | `initSettingsPage()` (wires password changer form) | `settings/index.html` |
| **login/login.js** | `initLoginPage()`, `handleLoginSubmit()`, `setupRoleToggle()` | `login/index.html` |
| **register/register.js** | `initRegisterPage()`, `validateRegisterForm()`, `setRegisterRole()`, `handleRegisterSubmit()` | `register/index.html` |
| **verify/verify.js** | `initVerifyPage()`, `loadUnverifiedProviders()`, `approveProvider()` | `verify/index.html` (supervisor only) |

Each script can override `onLanguageChange(lang)` to run custom translation refresh actions.

---

## 5. Data flow example (services page)

1. `services/services.js` → `initServicesPage()` runs on page load
2. Calls `fillServicesDropdowns()` → `getCategories()` + `getRegions()` from `main.js`
3. Then calls `runSearch()` → `getProviders(filters)` from `main.js`
4. `getProviders` → `apiRequest("providers")` → fetch to `/backend/api/providers.php`
5. PHP returns `{ success: true, data: [...] }`
6. `unwrap()` in `main.js` pulls out the array
7. `addDistanceToProviders()` adds a `distance_km` field to each item
8. `renderProviderList("providers-grid", list)` writes the card HTML into the page

---

## 6. Useful helper functions to know

| Function | Where | What it does |
|----------|-------|-------------|
| `t("key")` | i18n.js | Get translated string for current language |
| `getLocalizedField(obj, "name")` | i18n.js | Returns `obj.name_ar` or `obj.name_en` based on language |
| `setEl("id", value)` | main.js | Shortcut for `document.getElementById("id").textContent = value` |
| `getStoredLocation()` | main.js | Reads last GPS position from localStorage |
| `apiRequest(key, options)` | main.js | Single fetch gate — all API calls go through this |
