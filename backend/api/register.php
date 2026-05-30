<?php
// api/register.php — POST: register a new user
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$required = ['fname', 'lname', 'email', 'password', 'role'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Field '$field' is required."]);
        exit;
    }
}

$fname    = mysqli_real_escape_string($conn, trim($data['fname']));
$lname    = mysqli_real_escape_string($conn, trim($data['lname']));
$email    = mysqli_real_escape_string($conn, trim($data['email']));
$password = mysqli_real_escape_string($conn, password_hash($data['password'], PASSWORD_DEFAULT));
$phone    = mysqli_real_escape_string($conn, isset($data['phone']) ? trim($data['phone']) : '');
$role     = $data['role'];

if ($role === 'customer') $role = 'client';
if (!in_array($role, ['client', 'provider'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Role must be "client" or "provider".']);
    exit;
}

// Check if email already exists
$check = mysqli_query($conn, "SELECT id FROM users WHERE email = '$email' LIMIT 1");
if (mysqli_num_rows($check) > 0) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Email already registered.']);
    exit;
}

$ok = mysqli_query($conn, "INSERT INTO users (fname, lname, email, password, phone, role) VALUES ('$fname', '$lname', '$email', '$password', '$phone', '$role')");

if ($ok) {
    echo json_encode([
        'success' => true,
        'message' => 'User registered successfully',
        'data'    => ['id' => mysqli_insert_id($conn), 'email' => $email, 'role' => $role]
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Registration failed.']);
}
?>
