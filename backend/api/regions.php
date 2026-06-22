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

// Fetch unique cities with averaged lat/lng from providers
$sql = "SELECT city_en, city_ar, AVG(lat) AS lat, AVG(lng) AS lng
        FROM providers
        WHERE city_en IS NOT NULL AND city_en != ''
        GROUP BY city_en, city_ar
        ORDER BY city_en ASC";
$result = mysqli_query($conn, $sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database query failed.']);
    exit;
}

$regions = [];
while ($row = mysqli_fetch_assoc($result)) {
    $lat = $row['lat'] !== null ? (float)$row['lat'] : null;
    $lng = $row['lng'] !== null ? (float)$row['lng'] : null;

    if ($lat === null || $lng === null) {
        $fallback = [
            'Cairo' => [30.0444, 31.2357],
            'Giza' => [30.0131, 31.2089],
            'Alexandria' => [31.2001, 29.9187]
        ];
        if (isset($fallback[$row['city_en']])) {
            $lat = $fallback[$row['city_en']][0];
            $lng = $fallback[$row['city_en']][1];
        }
    }

    $regions[] = [
        'name_en' => $row['city_en'],
        'name_ar' => $row['city_ar'],
        'lat'     => $lat,
        'lng'     => $lng
    ];
}

echo json_encode([
    'success' => true,
    'data' => $regions
]);
?>
