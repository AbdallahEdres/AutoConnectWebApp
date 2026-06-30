# AutoConnect — Graduation Project

P2C platform to find nearby car and motorcycle garages, spare parts shops, and emergency tow services. Built with **HTML, CSS, and vanilla JavaScript** on the frontend and **PHP/MySQL** on the backend (no frameworks, no npm).

## Project structure

```
AutoConnectWebApp/
├── design/          # UI mockups (PNG, Figma, PDF)
├── backend/         # PHP API + MySQL schema
│   ├── api/         # PHP endpoint scripts (one file per endpoint)
│   ├── config/      # db.php — database connection + token helpers
│   ├── uploads/     # Uploaded provider photos (auto-created)
│   └── database.sql # Full schema + seed data
└── web/             # Frontend application ← main entry point
    ├── index.html   # Redirects to home/
    ├── main.js      # Shared JS: config, utils, API calls, UI rendering, header/footer
    ├── i18n.js      # Arabic/English translations
    ├── variables.css
    ├── base.css
    ├── components.css
    ├── home/        # Each page has its own folder with index.html + page.css + page.js
    ├── login/
    ├── register/
    ├── services/
    ├── service-detail/
    ├── profile/
    ├── favorites/
    ├── history/
    ├── settings/
    ├── emergency/
    ├── provider-register/
    ├── assets/      # Images and icons
    └── data/        # JSON reference files + API contract (API.md)
```

## Run locally

Requires **XAMPP** (Apache + MySQL). See the full setup guide:

👉 **[RUN-LOCALLY.md](./RUN-LOCALLY.md)**

Short version:
1. Start Apache and MySQL in XAMPP Control Panel.
2. Import `backend/database.sql` in phpMyAdmin.
3. Visit `http://localhost/AutoConnectWebApp/web/home/`

## Pages

| Page | URL |
|------|-----|
| Home | `web/home/index.html` |
| Login | `web/login/index.html` |
| Register (customer or provider) | `web/register/index.html` |
| Emergency tow | `web/emergency/index.html` |
| Services (filtered list) | `web/services/index.html` |
| Service detail | `web/service-detail/index.html?id=1` |
| Favorites | `web/favorites/index.html` |
| User profile | `web/profile/index.html` |
| Service history | `web/history/index.html` |
| Settings / security | `web/settings/index.html` |
| Provider registration | `web/provider-register/index.html` |

## JavaScript files

Every page loads these three files in this order, then its own page script:

| File | Role |
|------|------|
| `web/i18n.js` | Arabic/English translations, `t()`, `setLanguage()`, `getLocalizedField()` |
| `web/main.js` | Config (`API_BASE`, `API_ENDPOINTS`), utils, API calls, UI rendering, header/footer injection, auth |
| `web/[page]/[page].js` | Page-specific logic — one file per screen |

All API calls go through `apiRequest()` in `main.js`, which reads `API_BASE` and sends `Authorization: Bearer <token>` when a token is stored in localStorage. Full endpoint reference: `web/data/API.md`.

## CSS files

Every page loads these three base files in this order, then its own page CSS:

| File | Role |
|------|------|
| `web/variables.css` | CSS custom properties (colors, spacing, fonts) |
| `web/base.css` | Global reset, `.container`, `.rtl`/`.ltr` direction |
| `web/components.css` | Reusable components: header, footer, buttons, cards, forms |
| `web/[page]/[page].css` | Page-specific styles |

## Language (AR / EN)

Click **EN** or **AR** in the header. Choice is saved in `localStorage` (`autoconnect_lang`). Layout direction is controlled by `body.rtl` / `body.ltr` classes set by `setLanguage()` in `i18n.js`.

## Location

- Emergency page: **Use my location** button → `navigator.geolocation`
- Services page: sorts by distance using stored or default Cairo coordinates
- Coordinates are saved in `localStorage` as `autoconnect_location`

## Understanding the code

- **`web/HOW-TO-READ-THE-JS-CODE.md`** — JS load order, data flow, function map
- **`web/HOW-TO-READ-THE-CSS.md`** — CSS load order, classes per page
- **`web/data/API.md`** — request/response shapes for every endpoint
- **`backend/README.md`** — full backend endpoint reference

## Team notes

- Do not commit real passwords or API keys
- Change `SECRET_KEY` in `backend/config/db.php` before deploying to production
- Design assets live in `design/` for reference only
