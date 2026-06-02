<?php
// api/providers.php — GET list of providers with optional filters
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Start with a base query — always return all active providers
$sql = "SELECT
            p.id, p.name_en, p.name_ar, p.phone, p.address_en, p.address_ar, p.city_en, p.city_ar,
            p.lat, p.lng, p.status,
            c.name_en AS category_name_en, c.name_ar AS category_name_ar, c.slug AS category_slug,
            ROUND(COALESCE((SELECT AVG(rate) FROM reviews WHERE provider_id = p.id), 0), 1) AS rating,
            (SELECT COUNT(*) FROM reviews WHERE provider_id = p.id) AS review_count,
            (SELECT photo_url FROM provider_photos WHERE provider_id = p.id ORDER BY sort_order ASC LIMIT 1) AS image
        FROM providers p
        INNER JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'active'";

// Filter by category slug (e.g. ?category_slug=mechanic)
if (!empty($_GET['category_slug'])) {
    $category_slug = mysqli_real_escape_string($conn, $_GET['category_slug']);
    $sql .= " AND c.slug = '$category_slug'";
}

// Filter by city — checks both English and Arabic city names
if (!empty($_GET['city'])) {
    $city = mysqli_real_escape_string($conn, $_GET['city']);
    $sql .= " AND (p.city_en = '$city' OR p.city_ar = '$city')";
}

// Keyword search (e.g. ?q=toyota)
if (!empty($_GET['q'])) {
    $q = mysqli_real_escape_string($conn, '%' . $_GET['q'] . '%');
    $sql .= " AND (p.name_en LIKE '$q' OR p.name_ar LIKE '$q' OR p.address_en LIKE '$q' OR p.address_ar LIKE '$q')";
}

$sort = $_GET['sort'] ?? 'newest';
if ($sort === 'rating') {
    $sql .= " ORDER BY rating DESC LIMIT 100";
} else {
    $sql .= " ORDER BY p.id DESC LIMIT 100";
}

$result = mysqli_query($conn, $sql);

$providers = [];
while ($row = mysqli_fetch_assoc($result)) {
    $row['id']     = (int)   $row['id'];
    $row['lat']    = (float) $row['lat'];
    $row['lng']    = (float) $row['lng'];
    $row['rating'] = (float) $row['rating'];
    if (empty($row['image'])) {
        $row['image'] = 'assets/images/provider_default.png';
    }
    $providers[] = $row;
}

echo json_encode(['success' => true, 'data' => $providers]);
?>
