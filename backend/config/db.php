<?php
// db.php: Database Connection File

$host = "localhost";
$username = "root";       // Default XAMPP/WAMP username
$password = "";           // Default XAMPP/WAMP password is empty
$database = "autoconnect"; // We will create this database soon

// 1. Create a simple mysqli connection
$conn = new mysqli($host, $username, $password, $database);

// 2. Handle connection errors properly
if ($conn->connect_error) {
    // If there is an error, stop execution and show the message
    die("Database Connection Failed: " . $conn->connect_error);
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
