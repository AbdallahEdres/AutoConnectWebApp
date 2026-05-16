<?php
// ============================================================
// api/toggle_favorite.php — POST /autoconnect/api/toggle_favorite.php
// Toggles (adds/removes) a provider from a user's saved list.
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
    echo json_encode(['success' => false, 'message' => 'You must be logged in to save providers.']);
    exit;
}
$user_id = (int)$payload['id'];

// ── 2. Validate input ───────────────────────────────────────
$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['provider_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'provider_id is required.']);
    exit;
}
$provider_id = (int)$data['provider_id'];

// ── 3. Check if record exists ───────────────────────────────
$check_sql = "SELECT id FROM saves WHERE provider_id = ? AND user_id = ?";
$stmt = mysqli_prepare($conn, $check_sql);
mysqli_stmt_bind_param($stmt, "ii", $provider_id, $user_id);
mysqli_stmt_execute($stmt);
mysqli_stmt_store_result($stmt);

if (mysqli_stmt_num_rows($stmt) > 0) {
    // ── 4. Already exists -> DELETE (Unsave) ────────────────
    mysqli_stmt_close($stmt);

    $del_stmt = mysqli_prepare($conn, "DELETE FROM saves WHERE provider_id = ? AND user_id = ?");
    mysqli_stmt_bind_param($del_stmt, "ii", $provider_id, $user_id);

    if (mysqli_stmt_execute($del_stmt)) {
        echo json_encode(['success' => true, 'is_saved' => false, 'message' => 'Provider removed from saved list.']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to unsave.']);
    }
    mysqli_stmt_close($del_stmt);

} else {
    // ── 5. Doesn't exist -> INSERT (Save) ───────────────────
    mysqli_stmt_close($stmt);

    $ins_stmt = mysqli_prepare($conn, "INSERT INTO saves (provider_id, user_id) VALUES (?, ?)");
    mysqli_stmt_bind_param($ins_stmt, "ii", $provider_id, $user_id);

    if (mysqli_stmt_execute($ins_stmt)) {
        echo json_encode(['success' => true, 'is_saved' => true, 'message' => 'Provider added to saved list.']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to save.']);
    }
    mysqli_stmt_close($ins_stmt);
}
?>
