<?php
// api/favorites.php — GET: return saved providers for the logged-in user
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

$token   = getBearerToken();
$payload = verifyToken($token);
if (!$payload) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Login to see favorites.']);
    exit;
}
$user_id = (int)$payload['id'];

$result = mysqli_query($conn, "SELECT
        p.id, p.name_en, p.name_ar, p.phone, p.address_en, p.address_ar, p.city_en, p.city_ar, p.lat, p.lng,
        c.name_en AS category_name_en, c.name_ar AS category_name_ar, c.slug AS category_slug,
        EXISTS (
            SELECT 1 FROM working_hours wh
            WHERE wh.provider_id = p.id
            AND wh.day = DAYNAME(NOW())
            AND wh.is_close = 0
            AND TIME(NOW()) BETWEEN wh.open_time AND wh.close_time
        ) AS is_open_now,
        (SELECT photo_url FROM provider_photos WHERE provider_id = p.id ORDER BY sort_order ASC LIMIT 1) AS image,
        ROUND(COALESCE((SELECT AVG(rate) FROM reviews WHERE provider_id = p.id), 0), 1) AS rating,
        (SELECT COUNT(*) FROM reviews WHERE provider_id = p.id) AS review_count
    FROM saves s
    JOIN providers p ON s.provider_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE s.user_id = $user_id
    ORDER BY s.id DESC");

$favorites = [];
while ($row = mysqli_fetch_assoc($result)) {
    $row['id']         = (int)$row['id'];
    $row['lat']        = $row['lat'] !== null ? (float)$row['lat'] : null;
    $row['lng']        = $row['lng'] !== null ? (float)$row['lng'] : null;
    $row['rating']     = (float)$row['rating'];
    $row['review_count'] = (int)$row['review_count'];
    $row['is_open_now'] = (bool)$row['is_open_now'];
    $row['status'] = $row['is_open_now'] ? 'open' : 'closed';
    if (empty($row['image'])) {
        $row['image'] = 'assets/images/provider_default.png';
    }
    $favorites[] = $row;
}

echo json_encode(['success' => true, 'data' => $favorites]);
?>
