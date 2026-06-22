<?php
// api/update_password.php — POST: update the logged-in user's password
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

$token   = getBearerToken();
$payload = verifyToken($token);
if (!$payload) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}
$user_id = (int)$payload['id'];

$data = json_decode(file_get_contents('php://input'), true);
if (empty($data['current']) || empty($data['new']) || empty($data['confirm'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Current, new, and confirm passwords are required.']);
    exit;
}

if ($data['new'] !== $data['confirm']) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'New password and confirmation do not match.']);
    exit;
}

$result = mysqli_query($conn, "SELECT password FROM users WHERE id = $user_id LIMIT 1");
$user   = mysqli_fetch_assoc($result);

$current_ok = $user && (
    password_verify($data['current'], $user['password']) ||
    $data['current'] === $user['password']
);
if (!$current_ok) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Incorrect current password.']);
    exit;
}

$new_hash = mysqli_real_escape_string($conn, password_hash($data['new'], PASSWORD_DEFAULT));
$ok = mysqli_query($conn, "UPDATE users SET password = '$new_hash' WHERE id = $user_id");

if ($ok) {
    echo json_encode(['success' => true, 'message' => 'Password updated successfully.']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update password.']);
}
?>
