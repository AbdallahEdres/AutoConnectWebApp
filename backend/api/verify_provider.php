<?php
// api/verify_provider.php — POST: supervisor marks a provider as verified
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

$auth_user = getAuthUser($conn);
if ($auth_user['role'] !== 'supervisor') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Only supervisors can verify providers.']);
    exit;
}
$supervisor_id = (int)$auth_user['id'];

$data = json_decode(file_get_contents('php://input'), true);
if (empty($data['provider_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'provider_id is required.']);
    exit;
}
$provider_id = (int)$data['provider_id'];

$check = mysqli_query($conn, "SELECT id, verified_at FROM providers WHERE id = $provider_id LIMIT 1");
$provider = mysqli_fetch_assoc($check);

if (!$provider) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Provider not found.']);
    exit;
}

$ok = mysqli_query($conn, "UPDATE providers SET status = 'active', verified_at = NOW(), verified_by = $supervisor_id WHERE id = $provider_id");

if ($ok) {
    echo json_encode(['success' => true, 'message' => 'Provider verified successfully.']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to verify provider.']);
}
?>
