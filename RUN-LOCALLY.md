# How to Run AutoConnect Locally

The project uses a real PHP/MySQL backend. You need **XAMPP** (or another Apache + MySQL stack) to run it.

---

## Option 1: XAMPP (Required for full functionality)

### First-time setup
1. Setup XAMPP for Windows.
2. Place the `AutoConnect` folder inside `C:\xampp\htdocs\` so the path becomes:
   ```
   C:\xampp\htdocs\AutoConnect\
   ```
3. Open the **XAMPP Control Panel** and start **Apache** and **MySQL**.
4. Open your browser and go to **phpMyAdmin**: [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
5. Create a new database named `autoconnect`.
6. Click the **Import** tab and import `C:\xampp\htdocs\AutoConnect\backend\database.sql`.

### Running the app
After the first-time setup, just:
1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Visit: [http://localhost/AutoConnect/web/](http://localhost/AutoConnect/web/)

### Test accounts

These accounts are seeded by `database.sql` (all passwords are `123456`):

| Role | Email | Password | Description |
|---|---|---|---|
| Client (customer) | `client@example.com` | `123456` | End customer booking services |
| Agent | `agent@example.com` | `123456` | Workshop owner, responsible for adding providers |
| Supervisor | `admin@autoconnect.com` | `123456` | Platform admin, responsible for verifying pending providers |

---

## Option 2: VS Code "Live Server" (Frontend only — no backend)

Use this only if you want to preview the HTML/CSS without the PHP backend.

1. Open the **Extensions** view in VS Code (`Ctrl+Shift+X`).
2. Search for and install **"Live Server"** (by Ritwick Dey).
3. Open the `web` folder in VS Code.
4. Right-click `index.html` and select **"Open with Live Server"**.
5. Your browser will open at `http://127.0.0.1:5500`.

> API calls will fail without a running Apache/MySQL server. Use XAMPP (Option 1) for the full experience.

---

## Why XAMPP?

The project calls PHP scripts in `backend/api/` via `fetch()`. Those scripts connect to MySQL to read and write real data. Apache must be running to execute PHP; MySQL must be running for the database queries. Without them, every API call returns an error.
