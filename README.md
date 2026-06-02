# AutoConnect — Graduation Project

P2C platform to find nearby car and motorcycle garages, spare parts shops, and emergency tow services. Built with **HTML, CSS, and vanilla JavaScript** on the frontend and **PHP/MySQL** on the backend (no frameworks, no npm).

## Project structure

```
AutoConnectWebApp/
├── design/          # UI mockups (PNG, Figma, PDF)
├── backend/         # PHP API + MySQL schema
│   ├── api/         # PHP endpoint scripts
│   ├── config/      # db.php — database connection
│   └── database.sql # Full schema
└── web/             # Frontend application ← main entry point
    ├── index.html
    ├── pages/       # All screens
    ├── css/         # Four CSS files loaded in order
    ├── js/          # Three JS files loaded in order
    └── data/        # JSON reference files + API contract
```

## Run locally

Requires **XAMPP** (Apache + MySQL). See the full setup guide:

👉 **[RUN-LOCALLY.md](./RUN-LOCALLY.md)**

Short version:
1. Start Apache and MySQL in XAMPP Control Panel.
2. Import `backend/database.sql` in phpMyAdmin.
3. Visit `http://localhost/AutoConnectWebApp/web/`

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
| Service history | `pages/history.html` |
| Settings (security) | `pages/settings.html` |
| Provider registration | `pages/provider-register.html` |

## Language (AR / EN)

Click **EN** or **AR** in the header. Choice is saved in `localStorage` (`autoconnect_lang`). Layout uses `body.rtl` / `body.ltr` classes.

## JavaScript files

Three files are loaded on every page, in this order:

| File | Role |
|------|------|
| `js/i18n.js` | Arabic/English translations, `t()`, `setLanguage()`, `getLocalizedField()` |
| `js/main.js` | Config (`API_BASE`, `API_ENDPOINTS`), utils, API calls, UI rendering, header/footer, auth handlers |
| `js/pages.js` | Page-specific init functions (one per screen) |

All API calls go through `apiRequest()` in `main.js`, which reads `API_BASE` and sends `Authorization: Bearer <token>` when a token is stored. Full endpoint reference: `web/data/API.md`.

## Location

- Emergency page: **Use my location** → `navigator.geolocation`
- Services: sorts by distance using stored or default Cairo coordinates
- Coords saved in `localStorage` as `autoconnect_location`

## Understanding the code

- **`web/js/HOW-TO-READ-THE-CODE.md`** — JS load order, data flow, function map
- **`web/css/HOW-TO-READ-THE-CSS.md`** — CSS load order, classes per page
- **`web/data/API.md`** — request/response shapes for every endpoint
- **`backend/README.md`** — backend endpoint reference

## Team notes

- Do not commit real passwords or API keys
- Design assets live in `design/` for reference
