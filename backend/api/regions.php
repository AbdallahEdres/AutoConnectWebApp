<?php
// ============================================================
// api/regions.php — GET /autoconnect/api/regions.php
// Returns a unique list of cities where providers are located.
// ============================================================

require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

// Fetch unique cities from providers table to serve as "regions"
$sql = "SELECT DISTINCT city_en, city_ar FROM providers WHERE city_en IS NOT NULL AND city_en != '' ORDER BY city_en ASC";
$result = mysqli_query($conn, $sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database query failed.']);
    exit;
}

$regions = [];
while ($row = mysqli_fetch_assoc($result)) {
    $regions[] = [
        'id'      => $row['city_en'],
        'name_en' => $row['city_en'],
        'name_ar' => $row['city_ar']
    ];
}

echo json_encode([
    'success' => true,
    'data' => $regions
]);
?>
