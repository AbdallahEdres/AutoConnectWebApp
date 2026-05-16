<?php
// ============================================================
// api/update_password.php — POST /autoconnect/api/update_password.php
// Updates the logged-in user's password.
// ============================================================

require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

// ── 1. Authentication ───────────────────────────────────────
$headers = getallheaders();
$token   = str_replace('Bearer ', '', isset($headers['Authorization']) ? $headers['Authorization'] : '');
$payload = verifyToken($token);
if (!$payload) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}
$user_id = (int)$payload['id'];

// ── 2. Validation ───────────────────────────────────────────
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

// ── 3. Processing ───────────────────────────────────────────
// Check current password
$sql = "SELECT password FROM users WHERE id = ? LIMIT 1";
$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, "i", $user_id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$user = mysqli_fetch_assoc($result);

$current_ok = $user && (
    password_verify($data['current'], $user['password']) ||
    $data['current'] === $user['password']  // plain-text migration fallback
);
if (!$current_ok) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Incorrect current password.']);
    exit;
}
mysqli_stmt_close($stmt);

$new_hash = password_hash($data['new'], PASSWORD_DEFAULT);
$update_sql = "UPDATE users SET password = ? WHERE id = ?";
$update_stmt = mysqli_prepare($conn, $update_sql);
mysqli_stmt_bind_param($update_stmt, "si", $new_hash, $user_id);

if (mysqli_stmt_execute($update_stmt)) {
    echo json_encode(['success' => true, 'message' => 'Password updated successfully.']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update password.']);
}
mysqli_stmt_close($update_stmt);
?>
