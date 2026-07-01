# AutoConnect — Graduation Project

P2C platform to find nearby car and motorcycle garages, spare parts shops, and emergency tow services. Built with **HTML, CSS, and vanilla JavaScript** on the frontend and **PHP/MySQL** on the backend (no frameworks, no npm).

## Directory Overview

```
AutoConnectWebApp/
├── design/                         # UI mockups (Figma, PDF, PNG screenshots)
├── backend/                        # PHP API + MySQL schema
│   ├── api/                        # One PHP file per API endpoint
│   │   ├── login.php
│   │   ├── register.php
│   │   ├── user.php
│   │   ├── update_password.php
│   │   ├── providers.php
│   │   ├── provider.php
│   │   ├── add_provider.php
│   │   ├── edit_provider.php
│   │   ├── verify_provider.php
│   │   ├── upload_photos.php
│   │   ├── categories.php
│   │   ├── regions.php
│   │   ├── reviews.php
│   │   ├── favorites.php
│   │   ├── toggle_favorite.php
│   │   └── bookings.php
│   ├── config/
│   │   └── db.php                  # DB connection + token helpers (generateToken, verifyToken, getAuthUser)
│   ├── uploads/
│   │   └── providers/              # Uploaded provider photos (auto-created)
│   └── database.sql                # Full schema + seed data
│
├── web/                            # Frontend (main entry point)
│   ├── index.html                  # Redirects to home/
│   ├── i18n.js                     # Arabic/English translations
│   ├── main.js                     # Shared logic loaded on every page
│   ├── variables.css               # CSS design tokens (colors, spacing, fonts)
│   ├── base.css                    # Global reset and layout defaults
│   ├── components.css              # Reusable UI components (header, buttons, cards, forms)
│   ├── home/                       # Each page has its own folder with index.html + page.css + page.js
│   ├── login/
│   ├── register/                   # Signup: client / agent / supervisor
│   ├── services/
│   ├── service-detail/
│   ├── profile/
│   ├── favorites/                  # No page CSS — reuses components.css
│   ├── history/                    # No page CSS — reuses components.css
│   ├── settings/
│   ├── emergency/
│   ├── provider-register/          # Agent-facing "add workshop" form
│   ├── verify/                     # Supervisor dashboard — approve pending providers (no page CSS)
│   ├── assets/
│   │   └── images/                 # Static images and icons
│   └── data/
│       └── API.md                  # Full endpoint reference (request/response shapes)
│
├── README.md                       # This file
└── RUN-LOCALLY.md                  # Step-by-step local setup guide
```

## Run locally

Requires **XAMPP** (Apache + MySQL). See the full setup guide:

👉 **[RUN-LOCALLY.md](./RUN-LOCALLY.md)**

Short version:
1. Start Apache and MySQL in XAMPP Control Panel.
2. Import `backend/database.sql` in phpMyAdmin.
3. Visit `http://localhost/AutoConnectWebApp/web/home/`

## Pages

| Page | URL | Access |
|------|-----|--------|
| Home | `web/home/index.html` | Public |
| Login | `web/login/index.html` | Public |
| Register (client / agent / supervisor) | `web/register/index.html` | Public |
| Emergency tow | `web/emergency/index.html` | Public |
| Services (filtered list) | `web/services/index.html` | Public |
| Service detail | `web/service-detail/index.html?id=1` | Public |
| Favorites | `web/favorites/index.html` | Client |
| User profile | `web/profile/index.html` | Logged in |
| Service history | `web/history/index.html` | Client |
| Settings / security | `web/settings/index.html` | Logged in |
| Provider registration (add workshop) | `web/provider-register/index.html` | Agent / Supervisor |
| Verify providers | `web/verify/index.html` | Supervisor |

## User roles

Every account has one role, each with a matching subtype table (`clients`, `agents`, `supervisors`) filled in alongside `users` at registration:

| Role | Can do |
|------|--------|
| `client` | Book/call providers, save favorites, view service history, post reviews |
| `agent` | Submit new provider listings (`pending` status) and edit the ones they created |
| `supervisor` | Everything an agent can do, plus approve (`verify_provider.php`) pending providers — their own submissions go `active` immediately |

Providers are **not** users — they're a separate entity (`providers` table) referencing the agent/supervisor who created them (`created_by`) and the supervisor who approved them (`verified_by`).

## Backend Architecture (PHP)

- **Language**: Procedural PHP with `mysqli` (no frameworks, no Composer).
- **Database**: MySQL, charset `utf8mb4` (supports Arabic + emojis).
- **Entry point for every API file**:
  ```php
  require_once '../config/db.php';
  header('Content-Type: application/json');
  header('Access-Control-Allow-Origin: *');
  ```
- **Input safety**: All string inputs run through `mysqli_real_escape_string()`. All numeric IDs are cast with `(int)`.
- **Authentication**: Custom HMAC-SHA256 token (7-day expiry). Token is read from the `Authorization: Bearer <token>` header using `getBearerToken()` and validated with `verifyToken()` — both defined in `db.php`. `getAuthUser($conn)` fetches the full user row (and short-circuits with a 401) for endpoints that require login.
- **Transactions**: Multi-table writes (e.g. add provider + working hours + vehicle types + photos) use `mysqli_begin_transaction()` / `mysqli_commit()` / `mysqli_rollback()`.

### Database tables

| Table | Purpose |
|-------|---------|
| `users` | All accounts. `role` is `'client'`, `'agent'`, or `'supervisor'` |
| `clients` | Client subtype data: `vehicle_type`, `vehicle_brand` (1:1 with `users`) |
| `agents` | Agent subtype marker row (1:1 with `users`) |
| `supervisors` | Supervisor subtype marker row (1:1 with `users`) |
| `providers` | Workshop/garage listings. `created_by` → user who submitted it, `verified_by`/`verified_at` → approving supervisor, `status` (`pending`/`active`) |
| `categories` | Service categories (mechanic, spare parts, towing, etc.) |
| `vehicle_types` | Vehicle types a provider supports |
| `tagged_with` | Pivot: links providers to vehicle types |
| `working_hours` | Operating hours per day per provider |
| `provider_photos` | Photo URLs for each provider |
| `reviews` | Customer reviews (rating 1–5 + comment) |
| `bookings` | Service history (user called a provider) |
| `saves` | Favorited providers per user |

### Key API endpoints

| Method | File | Auth | Purpose |
|--------|------|------|---------|
| POST | `login.php` | No | Login, returns token |
| POST | `register.php` | No | Register a client, agent, or supervisor account |
| GET | `user.php` | Yes | Get logged-in user profile |
| POST | `update_password.php` | Yes | Change password |
| GET | `providers.php` | No | List providers with filters |
| GET | `provider.php` | No | Single provider full details |
| POST | `add_provider.php` | Optional | Create a new provider listing (status/ownership depends on caller's role) |
| POST | `edit_provider.php` | Yes (agent, creator only) | Update a provider listing |
| POST | `verify_provider.php` | Yes (supervisor only) | Approve a pending provider |
| POST | `upload_photos.php` | Yes | Upload provider photos |
| GET | `categories.php` | No | All service categories |
| GET | `regions.php` | No | Cities that have providers |
| GET/POST | `reviews.php` | POST only | Read or post reviews |
| GET | `favorites.php` | Yes | User's saved providers |
| POST | `toggle_favorite.php` | Yes | Save or unsave a provider |
| GET/POST | `bookings.php` | Yes | Service history |

Full request/response shapes: **[backend/README.md](backend/README.md)** and **[web/data/API.md](web/data/API.md)**.

## Frontend Architecture (Vanilla JS)

### JS load order — every page loads these in this exact order

1. **`web/i18n.js`** — translations and language switching
   - `TRANSLATIONS` object with all Arabic/English strings
   - `t(key)` — get a translation string
   - `setLanguage(lang)` — switch to `'ar'` or `'en'`, saves to localStorage
   - `getLocalizedField(obj, field)` — returns `obj.field_ar` or `obj.field_en`

2. **`web/main.js`** — everything shared across pages
   - Config: `API_BASE`, `API_ENDPOINTS`
   - Utils: `getDistanceKm()`, `formatDistance()`, `escapeHtml()`, `normalizeProvider()`
   - API: `apiRequest()`, `getProviders()`, `loginUser()`, `registerUser()`, `addProvider()`, `verifyProvider()`, etc.
   - UI: `renderProviderCard()`, `renderProviderList()`, `renderHeader()`, `renderFooter()`, `renderSidebar()` (role-aware nav)

3. **`web/[page]/[page].js`** — page-specific logic
   - Contains one `init[Page]Page()` function that runs on `DOMContentLoaded`

All API calls go through `apiRequest()` in `main.js`, which reads `API_BASE` and sends `Authorization: Bearer <token>` when a token is stored in localStorage.

### CSS load order — every page loads these in this exact order

1. `web/variables.css` — CSS custom properties (`--bg-main`, `--accent-yellow`, etc.)
2. `web/base.css` — global reset, `.container`, `body.rtl`/`body.ltr` direction
3. `web/components.css` — header, footer, buttons, cards, forms, provider cards, grids, sidebar
4. `web/[page]/[page].css` — page-specific styles (`favorites/`, `history/`, and `verify/` have none — they run on components.css alone)

### State in localStorage

| Key | Value |
|-----|-------|
| `autoconnect_token` | Auth token (HMAC-signed, from `login.php`/`register.php`) |
| `autoconnect_user` | JSON `{ id, fname, lname, email, role }` |
| `autoconnect_lang` | `'ar'` or `'en'` |
| `autoconnect_location` | JSON `{ lat, lng }` from the emergency/services location pickers |

### Data flow (step by step)

1. User interacts with the page (clicks a button, submits a form).
2. Page JS calls a function like `getProviders({ city: 'Cairo' })`.
3. That function calls `apiRequest('providers', { method: 'GET', params: ... })`.
4. `apiRequest()` builds the URL, attaches the auth token in the header, and calls `fetch()`.
5. PHP API receives the request, queries MySQL, returns `{ success, data }` JSON.
6. JS receives the response, calls `unwrap()` to extract `data`, then calls `renderProviderList()`.
7. `renderProviderList()` calls `renderProviderCard()` for each provider and sets `innerHTML`.

## Language (AR / EN)

Click **EN** or **AR** in the header. Choice is saved in `localStorage` (`autoconnect_lang`). Layout direction is controlled by `body.rtl` / `body.ltr` classes set by `setLanguage()` in `i18n.js`.

## Location

- Emergency page: **Use my location** button → `navigator.geolocation`
- Services page: sorts by distance using stored or default Cairo coordinates
- Coordinates are saved in `localStorage` as `autoconnect_location`

## Understanding the code

- **[web/HOW-TO-READ-THE-JS-CODE.md](web/HOW-TO-READ-THE-JS-CODE.md)** — JS load order, data flow, function map
- **[web/HOW-TO-READ-THE-CSS.md](web/HOW-TO-READ-THE-CSS.md)** — CSS load order, classes per page
- **[web/data/API.md](web/data/API.md)** — request/response shapes for every endpoint
- **[backend/README.md](backend/README.md)** — full backend endpoint reference

## Team notes

- Do not commit real passwords or API keys
- Change `SECRET_KEY` in `backend/config/db.php` before deploying to production
- Design assets live in `design/` for reference only
