<?php
// api/toggle_favorite.php — POST: add or remove a provider from saves
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
    echo json_encode(['success' => false, 'message' => 'You must be logged in to save providers.']);
    exit;
}
$user_id = (int)$payload['id'];

$data = json_decode(file_get_contents('php://input'), true);
if (empty($data['provider_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'provider_id is required.']);
    exit;
}
$provider_id = (int)$data['provider_id'];

$check = mysqli_query($conn, "SELECT id FROM saves WHERE provider_id = $provider_id AND user_id = $user_id");

if (mysqli_num_rows($check) > 0) {
    // Already saved → remove
    $ok = mysqli_query($conn, "DELETE FROM saves WHERE provider_id = $provider_id AND user_id = $user_id");
    if ($ok) {
        echo json_encode(['success' => true, 'is_saved' => false, 'message' => 'Provider removed from saved list.']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to unsave.']);
    }
} else {
    // Not saved yet → add
    $ok = mysqli_query($conn, "INSERT INTO saves (provider_id, user_id) VALUES ($provider_id, $user_id)");
    if ($ok) {
        echo json_encode(['success' => true, 'is_saved' => true, 'message' => 'Provider added to saved list.']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to save.']);
    }
}
?>
