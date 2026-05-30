# How to read the AutoConnect JavaScript

> **CSS:** see [`../css/HOW-TO-READ-THE-CSS.md`](../css/HOW-TO-READ-THE-CSS.md) for colors, classes, and which page uses which styles.

There are only **two JS files**. Read them in this order.

## 1. Script load order (every HTML page)

```
main.js    → shared everything: config, translations, API calls, card HTML, header/footer, auth
pages.js   → page-specific logic (one init function per page)
```

Both files are loaded on every page. `main.js` always comes first.

---

## 2. What lives inside main.js

| Section | What it does |
|---------|-------------|
| **Config** (top of file) | `API_BASE` and `API_ENDPOINTS` — the URLs for every PHP file |
| **i18n** | `TRANSLATIONS` object with every Arabic/English string. `t("key")` gets a string. `setLanguage()` / `toggleLanguage()` switch AR ↔ EN |
| **Utils** | `getDistanceKm()`, `formatDistance()`, `getUserLocation()`, `getStoredLocation()`, `saveLocation()`, `setEl()` |
| **API** | `apiRequest()` → sends fetch to PHP. Helper functions: `getProviders()`, `getProviderById()`, `getCategories()`, `getRegions()`, `getUser()`, `loginUser()`, `registerUser()`, `updatePassword()`, `addProvider()`, `getReviews()`, `toggleFavorite()` |
| **UI** | `renderProviderCard()` and `renderProviderList()` — builds provider card HTML. `renderHorizontalProviderCard()` — wider card for the emergency page |
| **Layout** | `renderHeader()` and `renderFooter()` — writes the shared header/footer into `#site-header` / `#site-footer` |
| **Auth** | `handleLoginSubmit()`, `handleRegisterSubmit()`, `setRegisterRole()`, `initRegisterPage()` — login and register page logic |
| **Init** | `DOMContentLoaded` at the bottom — calls `renderHeader()`, `renderFooter()`, `setLanguage()`, and wires up auth forms |

---

## 3. What lives inside pages.js

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

`pageOnLanguageChange()` at the bottom re-runs the relevant init when the user switches AR ↔ EN.

---

## 4. Data flow example (services page)

1. `pages.js` → `initServicesPage()` runs on page load
2. Calls `fillServicesDropdowns()` → `getCategories()` + `getRegions()` from `main.js`
3. Then calls `runSearch()` → `getProviders(filters)` from `main.js`
4. `getProviders` → `apiRequest("providers")` → fetch to `/backend/api/providers.php`
5. PHP returns `{ success: true, data: [...] }`
6. `unwrap()` in `main.js` pulls out the array
7. `addDistanceToProviders()` adds a `distance_km` field to each item
8. `renderProviderList("providers-grid", list)` writes the card HTML into the page

---

## 5. Useful helper functions to know

| Function | Where | What it does |
|----------|-------|-------------|
| `t("key")` | main.js | Get translated string for current language |
| `getLocalizedField(obj, "name")` | main.js | Returns `obj.name_ar` or `obj.name_en` based on language |
| `setEl("id", value)` | main.js | Shortcut for `document.getElementById("id").textContent = value` |
| `getBasePath()` | main.js | Returns `"../"` when inside `/pages/`, else `""` |
| `getStoredLocation()` | main.js | Reads last GPS position from localStorage |
| `getFavoriteIds()` | pages.js | Returns array of saved provider IDs from localStorage |
