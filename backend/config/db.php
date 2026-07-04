<?php

// Database Connection File

$database = "autoconnect";

$connection_attempts = [
    ['host' => '127.0.0.1', 'user' => 'root', 'pass' => '', 'port' => 3306], // XAMPP
    ['host' => '127.0.0.1', 'user' => 'root', 'pass' => 'root', 'port' => 3306], // XAMPP
    ['host' => '127.0.0.1', 'user' => 'root', 'pass' => 'root', 'port' => 8889], // MAMP
];

$conn = null;
$last_error = '';
foreach ($connection_attempts as $attempt) {
    mysqli_report(MYSQLI_REPORT_OFF);
    $conn = @new mysqli($attempt['host'], $attempt['user'], $attempt['pass'], $database, $attempt['port']);

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
        'message' => 'Database connection failed.',
        'error' => $last_error
    ]);
    exit;
}

$conn->set_charset("utf8mb4");

define('SECRET_KEY', 'J8vQ2xLmN7pRw4KcY1tHs9ZdF5eUa3BgN4sWx7EfY2mLp9KvT6cHr5ZuQa8Dj1Bn');

function generateToken($user_id)
{
    $payload_b64 = base64_encode(json_encode(['id' => (int) $user_id, 'exp' => time() + (7 * 24 * 3600)]));
    $sig = hash_hmac('sha256', $payload_b64, SECRET_KEY);
    return $payload_b64 . '.' . $sig;
}

function getBearerToken()
{
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


function verifyToken($token)
{
    if (empty($token))
        return null;

    $parts = explode('.', $token, 2);
    if (count($parts) !== 2)
        return null;

    list($payload_b64, $sig) = $parts;
    $expected = hash_hmac('sha256', $payload_b64, SECRET_KEY);
    if (!hash_equals($expected, $sig))
        return null;

    $payload = json_decode(base64_decode($payload_b64), true);
    if (!$payload || empty($payload['id']))
        return null;

    if (isset($payload['exp']) && $payload['exp'] < time())
        return null;

    return $payload;
}

function getAuthUser($conn)
{
    $token = getBearerToken();
    $payload = verifyToken($token);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }

    $user_id = (int) $payload['id'];

    $sql = "SELECT u.id, u.fname, u.lname, u.email, u.phone, u.role, u.is_active, u.created_at,
                   c.vehicle_type, c.vehicle_brand
            FROM users u
            LEFT JOIN clients c ON c.user_id = u.id AND u.role = 'client'
            WHERE u.id = $user_id AND u.is_active = 1";

    $result = mysqli_query($conn, $sql);
    $user = $result ? mysqli_fetch_assoc($result) : null;

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not found or inactive']);
        exit;
    }

    return $user;
}
?>