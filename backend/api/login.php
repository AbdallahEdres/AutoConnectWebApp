<?php
// ============================================================
// api/login.php — POST /autoconnect/api/login.php
// Authenticates a user and returns a token.
// ============================================================

require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

// Get JSON body
$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['email']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
    exit;
}

$email    = trim($data['email']);
$password = $data['password'];

$sql = "SELECT id, fname, lname, email, password, role FROM users WHERE email = ? LIMIT 1";
$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, "s", $email);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$user = mysqli_fetch_assoc($result);

$password_ok = $user && (
    password_verify($password, $user['password']) ||
    // Migration fallback: plain-text passwords still in DB get upgraded on first login
    ($password === $user['password'] && (function() use ($conn, $password, $user) {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $upd  = mysqli_prepare($conn, "UPDATE users SET password = ? WHERE id = ?");
        mysqli_stmt_bind_param($upd, "si", $hash, $user['id']);
        mysqli_stmt_execute($upd);
        mysqli_stmt_close($upd);
        return true;
    })())
);

if ($password_ok) {
    $token = generateToken($user['id']);
    
    // Remove password from response
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

mysqli_stmt_close($stmt);
?>
