<?php
// api/login.php — POST: authenticate user and return token
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['email']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
    exit;
}

$email    = mysqli_real_escape_string($conn, trim($data['email']));
$password = $data['password'];

$result = mysqli_query($conn, "SELECT u.id, u.fname, u.lname, u.email, u.password, u.role,
                                      c.vehicle_type, c.vehicle_brand
                               FROM users u
                               LEFT JOIN clients c ON c.user_id = u.id AND u.role = 'client'
                               WHERE u.email = '$email' LIMIT 1");
$user   = mysqli_fetch_assoc($result);

$password_ok = false;
if ($user && password_verify($password, $user['password'])) {
    $password_ok = true;
} elseif ($user && $password === $user['password']) {
    // Plain-text password found — upgrade to hash on first login
    $hash = mysqli_real_escape_string($conn, password_hash($password, PASSWORD_DEFAULT));
    mysqli_query($conn, "UPDATE users SET password = '$hash' WHERE id = {$user['id']}");
    $password_ok = true;
}

if ($password_ok) {
    $token = generateToken($user['id']);
    unset($user['password']);
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'token'   => $token,
        'data'    => $user
    ]);
} else {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
}
?>
