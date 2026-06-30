<?php
// db.php: Database Connection File

$database = getenv('AUTOCONNECT_DB_NAME') ?: "autoconnect";

// How this works:
//   - In production: set environment variables on your server (AUTOCONNECT_DB_HOST, etc.).
//     Attempt 1 reads them and connects on the first try.
//   - On XAMPP (no env vars set): attempt 1 falls back to XAMPP defaults
//     (127.0.0.1, root, no password, port 3306) and also succeeds on the first try.
//   - On MAMP (Mac): attempt 1 fails (MAMP uses password "root"), so attempt 2 or 3 runs.
$connection_attempts = [
    // Attempt 1: production env vars, or XAMPP defaults if env vars are not set.
    [
        'host' => getenv('AUTOCONNECT_DB_HOST') ?: '127.0.0.1',
        'user' => getenv('AUTOCONNECT_DB_USER') ?: 'root',
        'pass' => getenv('AUTOCONNECT_DB_PASS') !== false ? getenv('AUTOCONNECT_DB_PASS') : '',
        'port' => (int)(getenv('AUTOCONNECT_DB_PORT') ?: 3306)
    ],
    // Attempt 2: MAMP on port 3306 with password "root".
    ['host' => '127.0.0.1', 'user' => 'root', 'pass' => 'root', 'port' => 3306],
    // Attempt 3: older MAMP versions that use port 8889.
    ['host' => '127.0.0.1', 'user' => 'root', 'pass' => 'root', 'port' => 8889],
];

$conn = null;
$last_error = '';

foreach ($connection_attempts as $attempt) {
    $conn = @new mysqli(
        $attempt['host'],
        $attempt['user'],
        $attempt['pass'],
        $database,
        (int)$attempt['port']
    );

    if (!$conn->connect_error) {
        break;
    }

    $last_error = $conn->connect_error;
    $conn = null;
}

if (!$conn) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed. Check MAMP MySQL is running and the autoconnect database is imported.',
        'error' => $last_error
    ]);
    exit;
}

// Set character set to utf8mb4 for proper character encoding (important for Arabic/emojis)
$conn->set_charset("utf8mb4");

// Note: We do not close the connection here because we need it to remain open
// when we include this file in our API and other pages.

// ── Token helpers ────────────────────────────────────────────
// Change this value to any long random string before deploying.
define('SECRET_KEY', 'autoconnect_change_this_secret_in_production');

function generateToken($user_id) {
    $payload_b64 = base64_encode(json_encode(['id' => (int)$user_id, 'exp' => time() + (7 * 24 * 3600)]));
    $sig = hash_hmac('sha256', $payload_b64, SECRET_KEY);
    return $payload_b64 . '.' . $sig;
}

function getBearerToken() {
    $header = '';

    if (!empty($_GET['auth_token'])) {
        return trim($_GET['auth_token']);
    }

    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                $header = $value;
                break;
            }
        }
    }

    if (!$header && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $header = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (!$header && !empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }

    if (!$header && !empty($_SERVER['Authorization'])) {
        $header = $_SERVER['Authorization'];
    }

    if (stripos($header, 'Bearer ') === 0) {
        return trim(substr($header, 7));
    }

    return trim($header);
}

/**
 * Verifies the HMAC signature and expiry of a Bearer token.
 * Returns the decoded payload array on success, null on failure.
 */
function verifyToken($token) {
    if (empty($token)) return null;
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) return null;
    list($payload_b64, $sig) = $parts;
    $expected = hash_hmac('sha256', $payload_b64, SECRET_KEY);
    if (!hash_equals($expected, $sig)) return null;
    $payload = json_decode(base64_decode($payload_b64), true);
    if (!$payload || empty($payload['id'])) return null;
    if (isset($payload['exp']) && $payload['exp'] < time()) return null;
    return $payload;
}

/**
 * Resolves the Bearer token to a full user row joined with the correct subtype table.
 * Returns the user array (with subtype fields) on success, or sends a 401 and exits.
 *
 * For clients  : includes vehicle_type, vehicle_brand from clients table.
 * For agents   : no extra columns yet (extendable).
 * For supervisors: no extra columns yet (extendable).
 */
function getAuthUser($conn) {
    $token = getBearerToken();
    $payload = verifyToken($token);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }

    $user_id = (int)$payload['id'];

    $sql = "SELECT u.id, u.fname, u.lname, u.email, u.phone, u.role, u.is_active, u.created_at,
                   c.vehicle_type, c.vehicle_brand
            FROM users u
            LEFT JOIN clients c ON c.user_id = u.id AND u.role = 'client'
            WHERE u.id = $user_id AND u.is_active = 1";

    $result = mysqli_query($conn, $sql);
    $user   = $result ? mysqli_fetch_assoc($result) : null;

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not found or inactive']);
        exit;
    }

    return $user;
}
?>
