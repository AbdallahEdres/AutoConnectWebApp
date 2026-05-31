# AutoConnect API Documentation

This directory contains the backend endpoints for the AutoConnect platform. All responses are JSON. All protected endpoints require an `Authorization: Bearer <token>` header.

---

## Lookup Endpoints

### Get Categories
**`GET /api/categories.php`**  
Returns all service categories.

**Response:** `{ success, data: [{ id, name, slug, category_id }] }`

---

### Get Regions
**`GET /api/regions.php`**  
Returns unique cities where active providers are located.

**Response:** `{ success, data: [{ id, name }] }` — `id` is the city name string.

---

## Authentication

### Login
**`POST /api/login.php`**

**Body:** `{ email, password }`

**Response:** `{ success, token, data: { id, fname, lname, email, role } }`  
**Errors:** `400` missing fields, `401` invalid credentials.

> Plain-text passwords in the DB are auto-upgraded to bcrypt on first login.

---

### Register
**`POST /api/register.php`**

**Body:** `{ fname, lname, email, password, role, phone? }`  
`role` must be `"client"` or `"provider"` (`"customer"` is accepted as an alias for `"client"`).

**Response:** `{ success, data: { id, email, role } }`  
**Errors:** `400` missing/invalid fields, `409` email already registered.

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
**Errors:** `400` fields missing or `new`/`confirm` mismatch, `401` wrong current password.

---

## Providers

### Get Providers List
**`GET /api/providers.php`**

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | int | `1` | Page number |
| `limit` | int | `10` | Items per page |
| `user_id` | int | — | Adds `is_saved` flag per provider |
| `q` / `search` | string | — | Keyword search on name and address |
| `city` | string | — | Filter by city |
| `category_id` | int | — | Filter by category ID |
| `category_slug` | string | — | Filter by category slug (alias) |
| `open_now` / `status=open` | bool | — | Only currently open providers |
| `sort` | string | `featured` | `featured`, `nearest`, `highest_rate` / `rating`, `most_common` |
| `lat`, `lng` / `long` | float | — | Required when `sort=nearest` (Haversine distance in km) |

**Response:**
```json
{
  "success": true,
  "pagination": { "total", "current_page", "per_page", "last_page" },
  "filters": { "city", "category_id", "sort" },
  "data": [{ "id", "name", "phone", "address", "city", "full_address", "lat", "lng",
             "category_name", "photo_url", "avg_rating", "review_count",
             "is_open_now", "is_saved", "distance" }]
}
```

---

### Get Provider Details
**`GET /api/provider.php?id=<id>`**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | int | *Required.* Provider ID |
| `user_id` | int | Optional. Adds `is_saved` flag |

**Response data** includes `working_hours`, `photos`, `vehicle_types`, `reviews`, `avg_rating`, `review_count`, `is_open_now`, `is_saved`, and `similar_providers` (up to 3 from the same category).

---

### Add Provider
**`POST /api/add_provider.php`**

**Required body fields:** `name`, `phone`, `address`, `city`, `user_id`, `category_id`, `working_hours`

**Optional:** `bio`, `lat`, `lng` / `long`, `vehicle_types` (array of IDs), `photos` (array of URLs)

`working_hours` format: `[{ day, open_time, close_time, is_close }]`

Runs inside a DB transaction — all sub-tables (`working_hours`, `tagged_with`, `provider_photos`) are inserted atomically.

**Response:** `{ success, message, provider_id }`

---

### Edit Provider
**`POST /api/edit_provider.php`** — *Protected + owner only*

**Required body field:** `id` (provider ID)

All other fields are optional. Sending `working_hours`, `vehicle_types`, or `photos` replaces the existing rows for that sub-table entirely. Only the authenticated user who owns the provider profile can edit it (`403` otherwise).

**Response:** `{ success, message }`

---

### Upload Photos
**`POST /api/upload_photos.php`** — *Protected*

Accepts multipart/form-data with `photos[]` (image files) and `provider_id`.

**Response:** `{ success, data: [{ url }] }`

---

## Bookings

### List / Create Bookings
**`GET /api/bookings.php`** — *Protected*

Returns all bookings made by the logged-in user, newest first.

**Response:** `{ success, data: [{ id, provider_id, provider_name, created_at, ... }] }`

---

**`POST /api/bookings.php`** — *Protected*

**Body:** `{ provider_id }`

Creates a booking record (service history entry) for the logged-in user.

**Response:** `{ success, message, data: { id } }`

---

## Favorites

### Get Favorites
**`GET /api/favorites.php`** — *Protected*

Returns all providers saved by the logged-in user with summary fields (`name`, `city`, `category_name`, `photo_url`, `avg_rating`, `lat`, `lng`), newest first.

**Response:** `{ success, data: [...] }`

---

### Toggle Favorite
**`POST /api/toggle_favorite.php`** — *Protected*

**Body:** `{ provider_id }`

Adds or removes the provider from the `saves` table based on current state.

**Response:** `{ success, is_saved: true|false, message }`

---

## Reviews

### Get Reviews
**`GET /api/reviews.php?provider_id=<id>`**

Returns all reviews for a provider with `user_name`, `rate`, `comment`, `created_at`, newest first.

**Response:** `{ success, data: [...] }`

---

### Post Review
**`POST /api/reviews.php`** — *Protected*

**Body:** `{ provider_id, rate, comment? }`  
`rate` must be 1–5. One review per user per provider (`409` if already reviewed).

**Response:** `{ success, message, data: { id } }`
