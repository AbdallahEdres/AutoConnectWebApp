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

// Minimum password length check.
if (strlen($data['password']) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters long.']);
    exit;
}

$fname    = mysqli_real_escape_string($conn, trim($data['fname']));
$lname    = mysqli_real_escape_string($conn, trim($data['lname']));
$email    = mysqli_real_escape_string($conn, trim($data['email']));
$password = mysqli_real_escape_string($conn, password_hash($data['password'], PASSWORD_DEFAULT));
$phone    = mysqli_real_escape_string($conn, isset($data['phone']) ? trim($data['phone']) : '');
$role     = $data['role'];

if ($role === 'customer') $role = 'client';
if (!in_array($role, ['client', 'agent', 'supervisor'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Role must be "client", "agent", or "supervisor".']);
    exit;
}

// Check if email already exists
$check = mysqli_query($conn, "SELECT id FROM users WHERE email = '$email' LIMIT 1");
if (mysqli_num_rows($check) > 0) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Email already registered.']);
    exit;
}

mysqli_begin_transaction($conn);

$ok = mysqli_query($conn, "INSERT INTO users (fname, lname, email, password, phone, role) VALUES ('$fname', '$lname', '$email', '$password', '$phone', '$role')");

if ($ok) {
    $user_id = mysqli_insert_id($conn);

    // Insert into the matching subtype table
    if ($role === 'client') {
        $vehicle_type  = mysqli_real_escape_string($conn, isset($data['vehicle_type'])  ? trim($data['vehicle_type'])  : '');
        $vehicle_brand = mysqli_real_escape_string($conn, isset($data['vehicle_brand']) ? trim($data['vehicle_brand']) : '');
        $ok = mysqli_query($conn, "INSERT INTO clients (user_id, vehicle_type, vehicle_brand) VALUES ($user_id, '$vehicle_type', '$vehicle_brand')");
        if (!$ok) {
            mysqli_rollback($conn);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create client profile.']);
            exit;
        }
    } elseif ($role === 'agent') {
        $ok = mysqli_query($conn, "INSERT INTO agents (user_id) VALUES ($user_id)");
        if (!$ok) {
            mysqli_rollback($conn);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create agent profile.']);
            exit;
        }
    } elseif ($role === 'supervisor') {
        $ok = mysqli_query($conn, "INSERT INTO supervisors (user_id) VALUES ($user_id)");
        if (!$ok) {
            mysqli_rollback($conn);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create supervisor profile.']);
            exit;
        }
    }

    mysqli_commit($conn);

    echo json_encode([
        'success' => true,
        'message' => 'User registered successfully',
        'data'    => ['id' => $user_id, 'email' => $email, 'role' => $role]
    ]);
} else {
    mysqli_rollback($conn);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Registration failed.']);
}
?>
