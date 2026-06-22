<?php
// db.php: Database Connection File

$database = getenv('AUTOCONNECT_DB_NAME') ?: "autoconnect";

$connection_attempts = [
    [
        'host' => getenv('AUTOCONNECT_DB_HOST') ?: '127.0.0.1',
        'user' => getenv('AUTOCONNECT_DB_USER') ?: 'root',
        'pass' => getenv('AUTOCONNECT_DB_PASS') !== false ? getenv('AUTOCONNECT_DB_PASS') : 'root',
        'port' => getenv('AUTOCONNECT_DB_PORT') ?: 8889
    ],
    // XAMPP/WAMP default fallback.
    ['host' => '127.0.0.1', 'user' => 'root', 'pass' => '', 'port' => 3306],
    // Some MAMP installs expose MySQL on 3306 while still using password "root".
    ['host' => '127.0.0.1', 'user' => 'root', 'pass' => 'root', 'port' => 3306]
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
    $payload_b64 = base64_encode(json_encode(['id' => (int)$user_id, 'exp' => time() + 3600]));
    $sig = hash_hmac('sha256', $payload_b64, SECRET_KEY);
    return $payload_b64 . '.' . $sig;
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
?>
