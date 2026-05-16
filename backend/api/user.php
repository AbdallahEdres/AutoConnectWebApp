<?php
// ============================================================
// api/user.php — GET /autoconnect/api/user.php
// Returns the currently logged in user's profile.
// ============================================================

require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// ── 1. Authentication Check ─────────────────────────────────
$headers = getallheaders();
$token   = str_replace('Bearer ', '', isset($headers['Authorization']) ? $headers['Authorization'] : '');
$payload = verifyToken($token);
if (!$payload) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid or expired token.']);
    exit;
}

$user_id = (int)$payload['id'];

// ── 2. Fetch User Data ──────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT id, fname, lname, email, phone, role, created_at FROM users WHERE id = ? LIMIT 1";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "i", $user_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $user = mysqli_fetch_assoc($result);

    if ($user) {
        echo json_encode([
            'success' => true,
            'data' => $user
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found.']);
    }
    mysqli_stmt_close($stmt);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
}
?>
