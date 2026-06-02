# AutoConnect API contract (for backend team)

Frontend calls **only** functions in `js/main.js` (`apiRequest()` and its wrappers).  
All fetch calls are gated through a single function that reads `API_BASE` and `API_ENDPOINTS` (both defined at the top of `main.js`).

## Response format (all endpoints)

```json
{
  "success": true,
  "message": "OK",
  "data": { }
}
```

On error: `"success": false` and a `message`.

## Endpoints

| Key | Method | PHP file | `data` shape |
|-----|--------|----------|--------------|
| `providers` | GET | `providers.php` | `Provider[]` — supports query: `category_slug`, `city`, `status`, `search`, `lat`, `long`, `sort`, `emergency` |
| `providerById` | GET | `provider.php?id=` | single `Provider` |
| `categories` | GET | `categories.php` | `Category[]` |
| `regions` | GET | `regions.php` | `{ id, name, name_en, lat, long }[]` |
| `user` | GET | `user.php` | `User` (see `user.json`) |
| `reviews` | GET | `reviews.php?provider_id=` | `Review[]` |
| `favorites` | GET | `favorites.php` | `{ provider_ids, providers }` |
| `login` | POST | `login.php` | `{ id, email, role, fname, lname }` |
| `register` | POST | `register.php` | Customer: `{ role: "client", email, password, name, phone }`. Provider: `{ role: "provider", email, password, workshop_name, mobile, category_id, category_slug, availability, working_hours, city, description, lat, long }` — creates user + provider portfolio |
| `addProvider` | POST | `add_provider.php` | new `Provider` |
| `updatePassword` | POST | `update_password.php` | `null` |
| `toggleFavorite` | POST | `toggle_favorite.php` | `{ provider_ids, added }` |

## Provider object (aligned with ERD)

```json
{
  "id": 1,
  "name": "ورشة المهندس كار",
  "name_en": "Engineer Car Workshop",
  "phone": "01012345678",
  "address": "...",
  "address_en": "...",
  "city": "القاهرة",
  "city_en": "Cairo",
  "lat": 30.01,
  "long": 31.49,
  "status": "open",
  "category_id": 1,
  "category_slug": "mechanic",
  "rating": 4.5,
  "review_count": 128,
  "description": "...",
  "description_en": "...",
  "vehicle_types": ["car", "motorcycle"],
  "image": "url or path",
  "waiting_minutes": 10,
  "capacity": 3,
  "max_capacity": 6
}
```

## Backend base path

`API_BASE` in `js/main.js` resolves automatically:
- From `index.html` (root) → `../backend/api`
- From `pages/*.html` → `../../backend/api`

Do **not** change wrapper function names in `main.js` — only implement or adjust the PHP scripts behind `API_ENDPOINTS`.
