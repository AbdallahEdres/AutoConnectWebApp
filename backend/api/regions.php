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
$sql = "SELECT DISTINCT city FROM providers WHERE city IS NOT NULL AND city != '' ORDER BY city ASC";
$result = mysqli_query($conn, $sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database query failed.']);
    exit;
}

$regions = [];
while ($row = mysqli_fetch_assoc($result)) {
    $regions[] = [
        'id' => $row['city'], // Using city name as ID for simplicity
        'name' => $row['city']
    ];
}

echo json_encode([
    'success' => true,
    'data' => $regions
]);
?>
