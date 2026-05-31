# AutoConnect Web App - Project Structure

This document provides an overview of the project structure and architectural patterns to help developers and AI agents understand the codebase.

## 📁 Directory Overview

```text
/AutoConnectWebApp
├── /backend            # PHP Backend Logic
│   ├── /api            # API Endpoints (PHP scripts)
│   ├── /config         # Configuration files (Database, etc.)
│   └── database.sql    # Database Schema
├── /web                # Frontend Application (SPA/Dynamic)
│   ├── /assets         # Static assets (images, icons)
│   ├── /css            # Vanilla CSS files
│   ├── /js             # Modular Vanilla JavaScript
│   ├── /pages          # HTML snippets/templates (e.g., login.html, profile.html)
│   └── index.html      # Main Entry Point
├── /design             # UI Mockups (Figma files and Arabic screenshots)
├── README.md           # General Information
└── RUN-LOCALLY.md      # Setup Instructions
```

## ⚙️ Backend Architecture (PHP)
- **Technology**: Procedural PHP with `mysqli`.
- **Database**: MySQL (intended for XAMPP/WAMP environments).
- **Core Files**:
  - `backend/config/db.php`: Initializes the `$conn` variable. Character set is `utf8mb4`.
  - `backend/api/`: Contains standalone PHP scripts that act as REST endpoints.
- **Patterns**:
  - API scripts use `require_once '../config/db.php';`.
  - JSON headers: `Content-Type: application/json` and `Access-Control-Allow-Origin: *`.
  - Input sanitized with `mysqli_real_escape_string()` before queries.
  - Transactions used for multi-table operations (e.g., `add_provider.php`).

## 🌐 Frontend Architecture (Vanilla JS)
- **Technology**: HTML5, CSS3, and Modular Vanilla JavaScript.
- **Entry Point**: `web/index.html`.
- **Load order** (all three on every page):
  1. `web/js/i18n.js`: Translations (`TRANSLATIONS`), `t()`, `setLanguage()`, `getLocalizedField()`.
  2. `web/js/main.js`: Config (`API_BASE`, `API_ENDPOINTS`), utils, API calls, UI rendering, header/footer injection, auth form handlers.
  3. `web/js/pages.js`: Page-specific init functions (one per screen).
- **State Management**: `localStorage` for auth token, language preference, and GPS coordinates.

## 🗃️ Database Patterns
- **Primary Keys**: Usually `id` (INT AUTO_INCREMENT).
- **Relationships**:
  - `providers` table is the core.
  - `working_hours`, `provider_photos`, and `tagged_with` are related via `provider_id`.
- **Status**: Providers use a `status` column (e.g., 'active').

## 🚀 Key Endpoints
- **Providers**:
  - `GET /backend/api/providers.php`: List and filter providers.
  - `GET /backend/api/provider.php`: Full details for a single provider.
  - `POST /backend/api/add_provider.php`: Create new provider profile.
  - `POST /backend/api/edit_provider.php`: Update existing provider data.
  - `POST /backend/api/upload_photos.php`: Upload photos for a provider.
- **Authentication**:
  - `POST /backend/api/login.php`: Authenticates user and returns token.
  - `POST /backend/api/register.php`: New client or provider registration.
  - `POST /backend/api/update_password.php`: Change password for logged-in user.
- **Social & Lookups**:
  - `GET /backend/api/categories.php`: Fetch all service categories.
  - `GET /backend/api/regions.php`: Fetch unique cities for filtering.
  - `GET /backend/api/reviews.php`: List/Post provider reviews.
  - `GET /backend/api/favorites.php`: List of user's saved providers.
  - `POST /backend/api/toggle_favorite.php`: Bookmark/Unbookmark a provider.
  - `GET|POST /backend/api/bookings.php`: List or create bookings (service history).
