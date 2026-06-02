<?php
// api/provider.php — GET: return full details for a single provider
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

if (empty($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Provider ID is required.']);
    exit;
}

$provider_id = (int)$_GET['id'];
$user_id     = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

// 1. Main provider data
$result = mysqli_query($conn, "SELECT p.*,
        c.name_en AS category_name_en, c.name_ar AS category_name_ar, c.slug AS category_slug,
        EXISTS (
            SELECT 1 FROM working_hours wh
            WHERE wh.provider_id = p.id
            AND wh.day = DAYNAME(NOW())
            AND wh.is_close = 0
            AND TIME(NOW()) BETWEEN wh.open_time AND wh.close_time
        ) AS is_open_now,
        EXISTS (
            SELECT 1 FROM saves s
            WHERE s.provider_id = p.id AND s.user_id = $user_id
        ) AS is_saved
    FROM providers p
    INNER JOIN categories c ON p.category_id = c.id
    WHERE p.id = $provider_id");

$provider = mysqli_fetch_assoc($result);

if (!$provider) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Provider not found.']);
    exit;
}

// 2. Working hours
$wh_result = mysqli_query($conn, "SELECT day, open_time, close_time, is_close
    FROM working_hours WHERE provider_id = $provider_id
    ORDER BY FIELD(day, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')");
$working_hours = [];
while ($wh = mysqli_fetch_assoc($wh_result)) {
    $wh['is_close'] = (bool)$wh['is_close'];
    $working_hours[] = $wh;
}

// 3. Photos
$ph_result = mysqli_query($conn, "SELECT photo_url, sort_order FROM provider_photos WHERE provider_id = $provider_id ORDER BY sort_order ASC");
$photos = [];
while ($ph = mysqli_fetch_assoc($ph_result)) {
    $photos[] = $ph;
}

// 4. Vehicle types
$vt_result = mysqli_query($conn, "SELECT vt.id, vt.name_en, vt.name_ar
    FROM tagged_with tw
    INNER JOIN vehicle_types vt ON tw.vehicle_type_id = vt.id
    WHERE tw.provider_id = $provider_id");
$vehicle_types = [];
while ($vt = mysqli_fetch_assoc($vt_result)) {
    $vehicle_types[] = $vt;
}

// 5. Reviews
$rev_result = mysqli_query($conn, "SELECT r.rate, r.comment, r.created_at, CONCAT(u.fname, ' ', u.lname) AS reviewer_name
    FROM reviews r
    INNER JOIN users u ON r.user_id = u.id
    WHERE r.provider_id = $provider_id
    ORDER BY r.created_at DESC");
$reviews    = [];
$total_rate = 0;
while ($rev = mysqli_fetch_assoc($rev_result)) {
    $total_rate += $rev['rate'];
    $reviews[] = $rev;
}
$review_count = count($reviews);
$avg_rating   = $review_count > 0 ? round($total_rate / $review_count, 1) : 0;

// 6. Similar providers (same category, exclude current)
$category_id = (int)$provider['category_id'];
$sim_result  = mysqli_query($conn, "SELECT p.id, p.name_en, p.name_ar, p.city_en, p.city_ar,
        (SELECT photo_url FROM provider_photos WHERE provider_id = p.id LIMIT 1) AS photo_url
    FROM providers p
    WHERE p.category_id = $category_id AND p.id != $provider_id AND p.status = 'active'
    LIMIT 3");
$similar_providers = [];
while ($sim = mysqli_fetch_assoc($sim_result)) {
    $similar_providers[] = $sim;
}

// Final formatting
$provider['id']                = (int)$provider['id'];
$provider['category_id']       = (int)$provider['category_id'];
$provider['user_id']           = (int)$provider['user_id'];
$provider['lat']               = (float)$provider['lat'];
$provider['lng']               = (float)$provider['lng'];
$provider['is_open_now']       = (bool)$provider['is_open_now'];
$provider['is_saved']          = (bool)$provider['is_saved'];
$provider['avg_rating']        = $avg_rating;
$provider['review_count']      = $review_count;
$provider['working_hours']     = $working_hours;
$provider['photos']            = $photos;
$provider['vehicle_types']     = $vehicle_types;
$provider['reviews']           = $reviews;
$provider['similar_providers'] = $similar_providers;

echo json_encode(['success' => true, 'data' => $provider], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
