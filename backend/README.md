# AutoConnect — Backend API Reference

All endpoints live in `backend/api/`. Every response is JSON with `{ success: true|false, ... }`. Protected endpoints require an `Authorization: Bearer <token>` header (token is returned by `login.php` or `register.php`).

---

## Authentication

### Login
**`POST /api/login.php`**

**Body:** `{ email, password }`

**Response:** `{ success, token, data: { id, fname, lname, email, role } }`

**Errors:** `400` missing fields · `401` wrong credentials

> Passwords stored as plain text in the DB are automatically upgraded to bcrypt on first successful login.

---

### Register
**`POST /api/register.php`**

**Body (customer):** `{ fname, lname, email, password, role: "client", phone? }`

**Body (provider):** same as above plus `{ role: "provider", name_en, name_ar, phone, address_en, address_ar?, city_en, city_ar?, category_id, working_hours, bio_en?, bio_ar?, lat?, lng?, photos? }`

`"customer"` is accepted as an alias for `"client"`.
`password` must be at least 8 characters.
`working_hours` is an array: `[{ day, open_time, close_time, is_close }]` where `day` is one of `Monday`–`Sunday`.
`photos` is an array of URL strings returned by `upload_photos.php`.

**Response:** `{ success, data: { id, email, role, provider_id } }`

**Errors:** `400` missing/invalid fields · `409` email already registered

> Provider registration runs inside a DB transaction — user, provider, working hours, and photos are all inserted atomically.

---

## User

### Get Profile
**`GET /api/user.php`** — *Protected*

**Response:** `{ success, data: { id, fname, lname, email, phone, role, created_at } }`

---

### Update Password
**`POST /api/update_password.php`** — *Protected*

**Body:** `{ current, new, confirm }`

**Response:** `{ success, message }`

**Errors:** `400` missing fields or `new`/`confirm` mismatch · `401` wrong current password

---

## Providers

### List Providers
**`GET /api/providers.php`**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category_slug` | string | Filter by category (e.g. `mechanic`) |
| `city` | string | Filter by city (English or Arabic name) |
| `q` | string | Keyword search on name and address |
| `sort` | string | `newest` (default) or `rating` |

**Response:** `{ success, data: [ { id, name_en, name_ar, phone, address_en, address_ar, city_en, city_ar, lat, lng, image, rating, review_count, is_open_now, status, category_name_en, category_name_ar, category_slug } ] }`

Results are limited to 100 per request.

---

### Get Provider Details
**`GET /api/provider.php?id=<id>`** — auth optional (affects `is_saved` field)

**Response data** includes: all provider fields + `working_hours`, `photos`, `vehicle_types`, `reviews`, `avg_rating`, `review_count`, `is_open_now`, `is_saved`, `similar_providers` (up to 3 from the same category).

If a valid auth token is provided, `is_saved` reflects whether the logged-in user has saved this provider. Without a token `is_saved` is always `false`.

---

### Add Provider
**`POST /api/add_provider.php`** — *Protected*

**Required body fields:** `name_en`, `name_ar`, `phone`, `address_en`, `city_en`, `category_id`, `working_hours`

**Optional:** `address_ar`, `city_ar`, `bio_en`, `bio_ar`, `lat`, `lng`, `vehicle_types` (array of IDs), `photos` (array of URL strings)

Runs inside a DB transaction.

**Response:** `{ success, message, data: { provider_id } }`

---

### Edit Provider
**`POST /api/edit_provider.php`** — *Protected + owner only*

**Required body field:** `id` (provider ID)

All other fields are optional. Sending `working_hours`, `vehicle_types`, or `photos` replaces all existing rows for that sub-table. Only the authenticated user who owns the provider profile can edit it (`403` otherwise).

**Response:** `{ success, message }`

---

### Upload Photos
**`POST /api/upload_photos.php`** — *Protected*

Accepts `multipart/form-data` with field `photos[]` (one or more image files).

- Allowed types: JPEG, PNG, WebP, GIF
- Max size per file: 5 MB
- Max files per request: 10
- File extension is derived from the actual MIME type, not the filename

**Response:** `{ success, urls: [ "string", ... ] }`

Pass the returned URLs as the `photos` field in `register.php` or `add_provider.php`.

---

## Lookups

### Get Categories
**`GET /api/categories.php`**

**Response:** `{ success, data: [ { id, name_en, name_ar, slug, category_id } ] }`

---

### Get Regions
**`GET /api/regions.php`**

Returns unique cities where active providers are located.

**Response:** `{ success, data: [ { city_en, city_ar } ] }`

---

## Reviews

### Get Reviews
**`GET /api/reviews.php?provider_id=<id>`**

**Response:** `{ success, data: [ { id, rate, comment, created_at, user_name } ] }`

---

### Post Review
**`POST /api/reviews.php`** — *Protected*

**Body:** `{ provider_id, rate, comment? }`

`rate` must be 1–5. `comment` is limited to 1000 characters. One review per user per provider.

**Response:** `{ success, message, data: { id } }`

**Errors:** `400` missing/invalid fields · `409` already reviewed this provider

---

## Favorites

### Get Favorites
**`GET /api/favorites.php`** — *Protected*

Returns all providers saved by the logged-in user, newest first.

**Response:** `{ success, data: [ { id, name_en, name_ar, city_en, city_ar, image, rating, lat, lng, category_name_en, category_name_ar } ] }`

---

### Toggle Favorite
**`POST /api/toggle_favorite.php`** — *Protected*

**Body:** `{ provider_id }`

Adds or removes the provider from the `saves` table based on its current state.

**Response:** `{ success, is_saved: true|false, message }`

---

## Bookings (Service History)

### List Bookings
**`GET /api/bookings.php`** — *Protected*

Returns all bookings made by the logged-in user, newest first.

**Response:** `{ success, data: [ { id, provider_id, provider_name_en, provider_name_ar, created_at } ] }`

---

### Create Booking
**`POST /api/bookings.php`** — *Protected*

**Body:** `{ provider_id }`

Creates a booking record (this is how service history is tracked — a booking is created when the user clicks "Call Now").

**Response:** `{ success, message, data: { id } }`
