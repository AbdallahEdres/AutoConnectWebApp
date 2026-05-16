# AutoConnect API Documentation

This directory contains the backend endpoints for the AutoConnect platform. All responses are returned in JSON format.

---

## 1. Get Providers List
**Endpoint**: `GET /api/providers.php`  
**Purpose**: Fetches a paginated list of active providers with advanced filtering and sorting.

### Query Parameters
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | `int` | `1` | Current page number. |
| `limit` | `int` | `10` | Number of items per page. |
| `user_id` | `int` | `null` | Pass this to get the `is_saved` status for each provider. |
| `q` | `string` | `null` | Keyword search in provider name or address. |
| `city` | `string` | `null` | Filter by city. |
| `category_id` | `int` | `null` | Filter by category ID. |
| `open_now` | `bool` | `false` | Pass `true` to filter only currently open providers. |
| `sort` | `string` | `featured` | `nearest`, `highest_rate`, `most_common`, `featured`. |
| `lat`, `lng` | `float` | `null` | Required if `sort=nearest`. |

---

## 2. Get Provider Details
**Endpoint**: `GET /api/get_provider.php`  
**Purpose**: Fetches full details for a single provider page, including photos and reviews.

### Query Parameters
*   `id` (Required): The ID of the provider.
*   `user_id` (Optional): To check if the provider is saved by this specific user.

### Response Data
Includes `working_hours`, `photos`, `vehicle_types`, `reviews`, `avg_rating`, `is_open_now`, and `similar_providers`.

---

## 3. Toggle Save (Favorite)
**Endpoint**: `POST /api/toggle_save.php`  
**Purpose**: Toggles (Adds/Removes) a provider from the user's favorites list.

### POST Payload
*   `provider_id` (Required): ID of the provider.
*   `user_id` (Required): ID of the logged-in user.

### Responses
*   **Success**: Returns `{ "success": true, "is_saved": true/false }`.
*   **Error (Guest)**: Returns `401 Unauthorized` with a `login_url`.

---

## 4. Add New Provider
**Endpoint**: `POST /api/add_provider.php`  
**Purpose**: Registers a new provider workshop and its associated data.

### POST Payload
*   **Text Fields**: `name`, `phone`, `address`, `bio`, `city`, `category_id`, `user_id`.
*   **Location**: `lat`, `lng` (or `long`).
*   **Arrays**:
    *   `working_hours`: `[{day, open_time, close_time, is_close}]`
    *   `vehicle_types`: `[id1, id2, ...]`
    *   `photos`: `[url1, url2, ...]`

---

## 5. Edit Provider
**Endpoint**: `POST /api/edit_provider.php`  
**Purpose**: Updates existing provider details.

### POST Payload
*   `id` (Required): The ID of the provider to edit.
*   **Optional**: Any other field from the "Add Provider" endpoint. Only provided fields will be updated.
*   **Note**: Sending an array for `working_hours`, `vehicle_types`, or `photos` will replace the existing data entirely.
