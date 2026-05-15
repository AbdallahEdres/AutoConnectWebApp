# AutoConnect — Graduation Project (Frontend)

P2C platform to find nearby car and motorcycle garages, spare parts shops, and emergency tow services. Built with **HTML, CSS, and vanilla JavaScript only** (no frameworks, no npm).

## Project structure

```
Auto connect copy/
├── design/          # UI mockups (PNG, Figma, PDF)
├── backend/         # ERD + infrastructure reference (PHP/MySQL plan)
└── web/             # Frontend application ← open this folder
    ├── index.html
    ├── pages/       # All screens
    ├── css/
    ├── js/
    └── data/        # Mock JSON (swap for API later)
```

## Run locally

Mock data is loaded with `fetch()`, so open via a local server (not `file://`):

```bash
cd web
python3 -m http.server 8080
```

Then visit: http://localhost:8080

## Pages

| Page | File |
|------|------|
| Home | `index.html` |
| Login | `pages/login.html` |
| Register | `pages/register.html` |
| Emergency | `pages/emergency.html` |
| Services (filtered) | `pages/services.html` |
| Service detail | `pages/service-detail.html?id=1` |
| Favorites | `pages/favorites.html` |
| Customer profile | `pages/profile.html` |
| Settings (security) | `pages/settings.html` |
| Provider registration | `pages/provider-register.html` |

## Language (AR / EN)

Click **EN** or **AR** in the header. Choice is saved in `localStorage` (`autoconnect_lang`). Layout uses `dir="rtl"` / `dir="ltr"` on `<body>`.

## Mock data & API (preview)

| File | Purpose |
|------|---------|
| `data/providers.json` | 12 workshops (mechanic, towing, parts, tires, …) |
| `data/categories.json` | Service categories |
| `data/regions.json` | Cities for area dropdown |
| `data/user.json` | Logged-in client profile + history |
| `data/favorites.json` | Saved provider IDs |
| `data/reviews.json` | Reviews per provider |
| `data/auth.json` | Demo login users |
| `data/API.md` | Contract for your PHP team |

**Demo login:** `demo@autoconnect.com` / `demo1234`

All network access goes through `js/api.js`. Mock logic is in `js/mock-handlers.js` (simulates delay + console logs when `logMockCalls: true`).

### Mock → real backend

Edit `web/js/config.js`:

```javascript
var API_CONFIG = {
  baseUrl: "../api",
  useMock: false   // flip when PHP is ready
};
```

Endpoint map is in `API_ENDPOINTS` (same file). Full request/response shapes: `web/data/API.md`.

## Location

- Emergency page: **Use my location** → `navigator.geolocation`
- Services: sorts by distance using stored or default Cairo coordinates
- Coords saved in `localStorage` as `autoconnect_location`

## Understanding the code

Every JS and CSS file has a comment block at the top explaining what it does. Start here:

- **`web/js/HOW-TO-READ-THE-CODE.md`** — JavaScript load order, data flow, file map
- **`web/css/HOW-TO-READ-THE-CSS.md`** — CSS load order, classes per page, what each style does
- **`web/data/API.md`** — request/response format for PHP team

## Team notes

- Keep changes simple: one JS file per page + shared `api.js`, `i18n.js`, `ui.js`
- Do not commit real passwords or API keys
- Design assets live in `design/` for reference
