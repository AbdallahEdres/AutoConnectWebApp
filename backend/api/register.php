<?php
// ============================================================
// api/register.php — POST /autoconnect/api/register.php
// Registers a new user (Client or Provider).
// ============================================================

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

$fname    = trim($data['fname']);
$lname    = trim($data['lname']);
$email    = trim($data['email']);
$password = password_hash($data['password'], PASSWORD_DEFAULT);
$phone    = isset($data['phone']) ? trim($data['phone']) : null;
$role     = $data['role'];
// Normalize frontend's "customer" alias and reject invalid values
if ($role === 'customer') $role = 'client';
if (!in_array($role, ['client', 'provider'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Role must be "client" or "provider".']);
    exit;
}

// Check if email already exists
$check_sql = "SELECT id FROM users WHERE email = ? LIMIT 1";
$check_stmt = mysqli_prepare($conn, $check_sql);
mysqli_stmt_bind_param($check_stmt, "s", $email);
mysqli_stmt_execute($check_stmt);
if (mysqli_num_rows(mysqli_stmt_get_result($check_stmt)) > 0) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Email already registered.']);
    exit;
}
mysqli_stmt_close($check_stmt);

// Insert new user
$sql = "INSERT INTO users (fname, lname, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)";
$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, "ssssss", $fname, $lname, $email, $password, $phone, $role);

if (mysqli_stmt_execute($stmt)) {
    $user_id = mysqli_insert_id($conn);
    echo json_encode([
        'success' => true,
        'message' => 'User registered successfully',
        'data' => [
            'id'    => $user_id,
            'email' => $email,
            'role'  => $role
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Registration failed.']);
}

mysqli_stmt_close($stmt);
?>
