# AutoConnect Web App — Project Structure

This document explains how the project is organized and how the parts connect.

---

## Directory Overview

```
AutoConnectWebApp/
│
├── backend/                        # PHP backend
│   ├── api/                        # One PHP file per API endpoint
│   │   ├── login.php
│   │   ├── register.php
│   │   ├── user.php
│   │   ├── update_password.php
│   │   ├── providers.php
│   │   ├── provider.php
│   │   ├── add_provider.php
│   │   ├── edit_provider.php
│   │   ├── upload_photos.php
│   │   ├── categories.php
│   │   ├── regions.php
│   │   ├── reviews.php
│   │   ├── favorites.php
│   │   ├── toggle_favorite.php
│   │   └── bookings.php
│   ├── config/
│   │   └── db.php                  # DB connection + token helpers (generateToken, verifyToken)
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
│   ├── home/
│   │   ├── index.html
│   │   ├── home.css
│   │   └── home.js
│   ├── login/
│   │   ├── index.html
│   │   ├── login.css
│   │   └── login.js
│   ├── register/
│   │   ├── index.html
│   │   ├── register.css
│   │   └── register.js
│   ├── services/
│   │   ├── index.html
│   │   ├── services.css
│   │   └── services.js
│   ├── service-detail/
│   │   ├── index.html
│   │   ├── service-detail.css
│   │   └── service-detail.js
│   ├── profile/
│   │   ├── index.html
│   │   ├── profile.css
│   │   └── profile.js
│   ├── favorites/
│   │   ├── index.html
│   │   └── favorites.js
│   ├── history/
│   │   ├── index.html
│   │   └── history.js
│   ├── settings/
│   │   ├── index.html
│   │   ├── settings.css
│   │   └── settings.js
│   ├── emergency/
│   │   ├── index.html
│   │   ├── emergency.css
│   │   └── emergency.js
│   ├── provider-register/
│   │   ├── index.html
│   │   ├── provider-register.css
│   │   └── provider-register.js
│   ├── assets/
│   │   └── images/                 # Static images and icons
│   └── data/
│       └── API.md                  # Full endpoint reference (request/response shapes)
│
├── design/                         # UI mockups (Figma, PDF, PNG screenshots)
├── README.md                       # Project overview and setup
├── RUN-LOCALLY.md                  # Step-by-step local setup guide
└── PROJECT_STRUCTURE.md            # This file
```

---

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
- **Authentication**: Custom HMAC-SHA256 token (7-day expiry). Token is read from the `Authorization: Bearer <token>` header using `getBearerToken()` and validated with `verifyToken()` — both defined in `db.php`.
- **Transactions**: Multi-table writes (e.g. register provider + working hours + photos) use `mysqli_begin_transaction()` / `mysqli_commit()` / `mysqli_rollback()`.

---

## Frontend Architecture (Vanilla JS)

### JS load order — every page loads these in this exact order:

1. **`web/i18n.js`** — translations and language switching
   - `TRANSLATIONS` object with all Arabic/English strings
   - `t(key)` — get a translation string
   - `setLanguage(lang)` — switch to 'ar' or 'en', saves to localStorage
   - `getLocalizedField(obj, field)` — returns `obj.field_ar` or `obj.field_en`

2. **`web/main.js`** — everything shared across pages
   - Config: `API_BASE`, `API_ENDPOINTS`
   - Utils: `getDistanceKm()`, `formatDistance()`, `escapeHtml()`, `normalizeProvider()`
   - API: `apiRequest()`, `getProviders()`, `loginUser()`, `registerUser()`, etc.
   - UI: `renderProviderCard()`, `renderProviderList()`, `renderHeader()`, `renderFooter()`

3. **`web/[page]/[page].js`** — page-specific logic
   - Contains one `init[Page]Page()` function that runs on `DOMContentLoaded`

### CSS load order — every page loads these in this exact order:

1. `web/variables.css` — CSS custom properties (`--bg-main`, `--accent-yellow`, etc.)
2. `web/base.css` — global reset, `.container`, RTL/LTR direction classes
3. `web/components.css` — header, footer, buttons, cards, forms, grids
4. `web/[page]/[page].css` — page-specific overrides

### State in localStorage

| Key | Value |
|-----|-------|
| `autoconnect_token` | JWT-like auth token |
| `autoconnect_user` | JSON `{id, fname, lname, email, role}` |
| `autoconnect_lang` | `'ar'` or `'en'` |
| `autoconnect_location` | JSON `{lat, lng}` from emergency page |

### Data flow (step by step)

1. User interacts with the page (clicks a button, submits a form).
2. Page JS calls a function like `getProviders({city: 'Cairo'})`.
3. That function calls `apiRequest('providers', {method: 'GET', params: ...})`.
4. `apiRequest()` builds the URL, attaches the auth token in the header, and calls `fetch()`.
5. PHP API receives the request, queries MySQL, returns `{success, data}` JSON.
6. JS receives the response, calls `unwrap()` to extract `data`, then calls `renderProviderList()`.
7. `renderProviderList()` calls `renderProviderCard()` for each provider and sets `innerHTML`.

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `users` | All accounts (role: `'client'` or `'provider'`) |
| `providers` | Provider profiles (linked to a user via `user_id`) |
| `categories` | Service categories (mechanic, spare parts, towing, etc.) |
| `vehicle_types` | Vehicle types a provider supports |
| `tagged_with` | Pivot: links providers to vehicle types |
| `working_hours` | Operating hours per day per provider |
| `provider_photos` | Photo URLs for each provider |
| `reviews` | Customer reviews (rating 1–5 + comment) |
| `bookings` | Service history (user called a provider) |
| `saves` | Favorited providers per user |

---

## Key API Endpoints

| Method | File | Auth | Purpose |
|--------|------|------|---------|
| POST | `login.php` | No | Login, returns token |
| POST | `register.php` | No | Register customer or provider |
| GET | `user.php` | Yes | Get logged-in user profile |
| POST | `update_password.php` | Yes | Change password |
| GET | `providers.php` | No | List providers with filters |
| GET | `provider.php` | No | Single provider full details |
| POST | `add_provider.php` | Yes | Create a new provider profile |
| POST | `edit_provider.php` | Yes | Update a provider profile |
| POST | `upload_photos.php` | Yes | Upload provider photos |
| GET | `categories.php` | No | All service categories |
| GET | `regions.php` | No | Cities that have providers |
| GET/POST | `reviews.php` | POST only | Read or post reviews |
| GET | `favorites.php` | Yes | User's saved providers |
| POST | `toggle_favorite.php` | Yes | Save or unsave a provider |
| GET/POST | `bookings.php` | Yes | Service history |
