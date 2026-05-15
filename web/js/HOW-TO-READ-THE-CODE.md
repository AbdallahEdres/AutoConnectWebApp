# How to read the AutoConnect JavaScript

Read files in this order when studying the project.

## 1. Script load order (every HTML page)

```
config.js          → settings (useMock, API URLs)
i18n.js            → Arabic/English strings
utils.js           → distance, GPS, filters (no API)
mock-handlers.js   → fake backend (JSON files)
api.js             → getProviders(), loginUser(), …  ← pages call THIS
ui.js              → HTML for provider cards
layout.js          → header + footer
app.js             → runs on every page (language, nav)
home.js / services.js / …  → one file per page
```

## 2. Data flow example (services page)

1. `services.js` runs on `DOMContentLoaded`
2. Calls `getProviders(filters)` from `api.js`
3. `api.js` → `apiRequest("providers")` → if mock: `runMockHandler` in `mock-handlers.js`
4. Mock loads `data/providers.json`, runs `filterProviders()` from `utils.js`
5. Returns `{ success: true, data: [ ...providers ] }`
6. `unwrap()` gives the array to `services.js`
7. `renderProviderList()` in `ui.js` writes HTML into `#providers-grid`

## 3. File map

| File | Purpose |
|------|---------|
| `config.js` | `useMock`, `API_ENDPOINTS`, demo login |
| `api.js` | All server calls — only file to change for PHP |
| `mock-handlers.js` | Pretend PHP using `/data/*.json` |
| `utils.js` | Distance, geolocation, filter/sort |
| `i18n.js` | `t("key")`, AR/EN toggle |
| `layout.js` | Shared header/footer |
| `app.js` | Init on every page |
| `ui.js` | Provider card HTML |
| `auth.js` | Login + register |
| `home.js` | index.html search |
| `services.js` | Filtered list |
| `emergency.js` | Tow trucks + GPS |
| `service-detail.js` | One provider + reviews |
| `favorites.js` | Saved providers |
| `profile.js` | User dashboard |
| `settings.js` | Password form |
| `provider-register.js` | Workshop signup page |

## 4. Connect real backend

Set `API_CONFIG.useMock = false` in `config.js` and implement PHP files listed in `API_ENDPOINTS`. See `../data/API.md`.
