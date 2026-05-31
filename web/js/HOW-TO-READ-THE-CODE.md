# How to read the AutoConnect JavaScript

> **CSS:** see [`../css/HOW-TO-READ-THE-CSS.md`](../css/HOW-TO-READ-THE-CSS.md) for colors, classes, and which page uses which styles.

There are **three JS files**. Read them in this order.

## 1. Script load order (every HTML page)

```
i18n.js    → translations only: TRANSLATIONS object, t(), setLanguage(), getLocalizedField()
main.js    → config, utils, API calls, card HTML, header/footer, auth handlers
pages.js   → page-specific logic (one init function per page)
```

All three are loaded on every page. `i18n.js` must come first because `main.js` and `pages.js` call `t()`.

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
| **Config** (top of file) | `API_BASE` (path to `backend/api/`) and `API_ENDPOINTS` — a key-to-filename map for every PHP endpoint |
| **Utils** | `getDistanceKm()`, `formatDistance()`, `getUserLocation()`, `getStoredLocation()`, `saveLocation()`, `setEl()`, `addDistanceToProviders()` |
| **API** | `apiRequest()` → single fetch gate. Helper wrappers: `getProviders()`, `getProviderById()`, `getCategories()`, `getRegions()`, `getUser()`, `getBookings()`, `createBooking()`, `loginUser()`, `registerUser()`, `updatePassword()`, `addProvider()`, `getReviews()`, `toggleFavorite()` |
| **UI** | `renderProviderCard()` / `renderProviderList()` — builds provider card HTML. `renderHorizontalProviderCard()` — wider card for the emergency page |
| **Layout** | `renderHeader()` / `renderFooter()` — writes shared header/footer into `#site-header` / `#site-footer` |
| **Auth** | `handleLoginSubmit()`, `handleRegisterSubmit()`, `setRegisterRole()` — login and register form logic |
| **Init** | `DOMContentLoaded` — calls `renderHeader()`, `renderFooter()`, `setLanguage()`, wires up auth forms |

---

## 4. What lives inside pages.js

Each page has one `init` function that runs on `DOMContentLoaded`:

| Function | Page |
|----------|------|
| `initHomePage()` | `index.html` — search form |
| `initServicesPage()` | `services.html` — filtered provider list |
| `initEmergencyPage()` | `emergency.html` — nearest tow trucks + GPS |
| `initFavoritesPage()` | `favorites.html` — saved providers |
| `initProfilePage()` | `profile.html` — user info + favorite providers |
| `initProviderRegisterPage()` | `provider-register.html` — workshop signup |
| `initServiceDetailPage()` | `service-detail.html` — one provider + reviews |
| `initSettingsPage()` | `settings.html` — change password |
| `initHistoryPage()` | `history.html` — service booking history |

`onLanguageChange()` at the bottom re-runs the relevant init when the user switches AR ↔ EN.

---

## 5. Data flow example (services page)

1. `pages.js` → `initServicesPage()` runs on page load
2. Calls `fillCategorySelect()` + `fillCitySelect()` → `getCategories()` + `getRegions()` from `main.js`
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
