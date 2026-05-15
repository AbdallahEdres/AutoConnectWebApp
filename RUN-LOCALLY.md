# How to Run AutoConnect Locally

Mock data is loaded with `fetch()`, so the project **must** be opened via a local server. Double-clicking `index.html` in your browser will cause errors because browsers block local file access for security.

## Option 1: Using Python (Recommended)

Python is usually pre-installed on Mac/Linux. Windows users may need to install it.

### Windows Setup Guide
1.  **Download Python:** Go to [python.org/downloads](https://www.python.org/downloads/windows/) and download the latest version for Windows.
2.  **Install:** Run the installer. **IMPORTANT:** Check the box that says **"Add Python to PATH"** at the bottom of the first screen. If you miss this, the commands won't work.
3.  **Verify:** Open Command Prompt (`cmd`) or PowerShell and type:
    ```cmd
    python --version
    ```
    You should see "Python 3.x.x".

### Starting the Server
1.  Open your terminal/command prompt.
2.  Navigate to the project's `web` directory:
    ```cmd
    # Example (adjust path to where you saved the folder)
    cd "C:\Users\Name\Desktop\AutoConnect\web"
    ```
3.  Run the server:
    ```cmd
    # Windows
    python -m http.server 8080

    # Mac/Linux
    python3 -m http.server 8080
    ```
4.  Open your browser and visit: [http://localhost:8080](http://localhost:8080)

---

## Option 2: VS Code "Live Server" (Easiest)

If you use Visual Studio Code, this is the most convenient method:

1.  Open the **Extensions** view in VS Code (`Ctrl+Shift+X`).
2.  Search for and install **"Live Server"** (by Ritwick Dey).
3.  Open the `web` folder in VS Code.
4.  Right-click `index.html` in the file explorer and select **"Open with Live Server"**.
5.  Your browser will open automatically at `http://127.0.0.1:5500`.

---

## Why is a server needed?

Modern browsers have a security feature called **CORS** (Cross-Origin Resource Sharing). When JavaScript tries to `fetch()` data from a JSON file while you are viewing the page via `file://`, the browser blocks it. Running a local server makes the browser treat the files as if they are coming from a real website, allowing the data to load correctly.
