<?php
// ============================================================
// api/categories.php — GET /autoconnect/api/categories.php
// Returns a JSON list of all service categories.
// ============================================================

require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

$sql = "SELECT id, name, slug, category_id FROM categories ORDER BY name ASC";
$result = mysqli_query($conn, $sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database query failed.']);
    exit;
}

$categories = [];
while ($row = mysqli_fetch_assoc($result)) {
    $row['id'] = (int)$row['id'];
    $row['category_id'] = $row['category_id'] ? (int)$row['category_id'] : null;
    $categories[] = $row;
}

echo json_encode([
    'success' => true,
    'data' => $categories
]);
?>
