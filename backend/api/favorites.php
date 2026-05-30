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

$headers = getallheaders();
$token   = str_replace('Bearer ', '', isset($headers['Authorization']) ? $headers['Authorization'] : '');
$payload = verifyToken($token);
if (!$payload) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Login to see favorites.']);
    exit;
}
$user_id = (int)$payload['id'];

$result = mysqli_query($conn, "SELECT
        p.id, p.name_en, p.name_ar, p.phone, p.city_en, p.city_ar, p.lat, p.lng,
        c.name_en AS category_name_en, c.name_ar AS category_name_ar,
        (SELECT photo_url FROM provider_photos WHERE provider_id = p.id ORDER BY sort_order ASC LIMIT 1) AS photo_url,
        ROUND(COALESCE((SELECT AVG(rate) FROM reviews WHERE provider_id = p.id), 0), 1) AS avg_rating
    FROM saves s
    JOIN providers p ON s.provider_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE s.user_id = $user_id
    ORDER BY s.id DESC");

$favorites = [];
while ($row = mysqli_fetch_assoc($result)) {
    $row['id']         = (int)$row['id'];
    $row['avg_rating'] = (float)$row['avg_rating'];
    if (empty($row['photo_url'])) {
        $row['photo_url'] = 'assets/images/provider_default.png';
    }
    $favorites[] = $row;
}

echo json_encode(['success' => true, 'data' => $favorites]);
?>
