<?php
// ============================================================
// api/favorites.php — GET /autoconnect/api/favorites.php
// Returns the list of providers saved by the logged-in user.
// ============================================================

require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
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
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Login to see favorites.']);
    exit;
}
$user_id = (int)$payload['id'];

// ── 2. Fetch Favorites ──────────────────────────────────────
$sql = "SELECT 
            p.id, p.name, p.phone, p.address, p.city, p.lat, p.lng,
            c.name AS category_name,
            (SELECT photo_url FROM provider_photos WHERE provider_id = p.id ORDER BY sort_order ASC LIMIT 1) AS photo_url,
            ROUND(COALESCE((SELECT AVG(rate) FROM reviews WHERE provider_id = p.id), 0), 1) AS avg_rating
        FROM saves s
        JOIN providers p ON s.provider_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE s.user_id = ?
        ORDER BY s.id DESC";

$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, "i", $user_id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

$favorites = [];
while ($row = mysqli_fetch_assoc($result)) {
    $row['id'] = (int)$row['id'];
    $row['avg_rating'] = (float)$row['avg_rating'];
    
    // Default photo if none found
    if (empty($row['photo_url'])) {
        $row['photo_url'] = 'public/assist/images/provider_default.png';
    }
    
    $favorites[] = $row;
}

echo json_encode([
    'success' => true,
    'data' => $favorites
]);

mysqli_stmt_close($stmt);
?>
