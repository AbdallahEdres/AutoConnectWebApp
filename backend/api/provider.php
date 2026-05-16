<?php
// ============================================================
// api/get_provider.php — GET /autoconnect/api/get_provider.php?id=1
// Returns full details for a single provider.
// ============================================================

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

$provider_id = (int) $_GET['id'];
$user_id     = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

// ── 1. Fetch Main Provider Data ─────────────────────────────
$sql = "SELECT 
            p.*, 
            c.name AS category_name,
            -- Calculate Open Status
            EXISTS (
                SELECT 1 FROM working_hours wh 
                WHERE wh.provider_id = p.id 
                AND wh.day = DAYNAME(NOW()) 
                AND wh.is_close = 0 
                AND TIME(NOW()) BETWEEN wh.open_time AND wh.close_time
            ) AS is_open_now,
            -- Check if saved by user
            EXISTS (
                SELECT 1 FROM saves s 
                WHERE s.provider_id = p.id 
                AND s.user_id = ?
            ) AS is_saved
        FROM providers p
        INNER JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?";

$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, "ii", $user_id, $provider_id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$provider = mysqli_fetch_assoc($result);

if (!$provider) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Provider not found.']);
    exit;
}

// ── 2. Fetch Working Hours ──────────────────────────────────
$wh_sql = "SELECT day, open_time, close_time, is_close FROM working_hours WHERE provider_id = ? ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')";
$wh_stmt = mysqli_prepare($conn, $wh_sql);
mysqli_stmt_bind_param($wh_stmt, "i", $provider_id);
mysqli_stmt_execute($wh_stmt);
$wh_result = mysqli_stmt_get_result($wh_stmt);
$working_hours = [];
while ($wh = mysqli_fetch_assoc($wh_result)) {
    $wh['is_close'] = (bool)$wh['is_close'];
    $working_hours[] = $wh;
}

// ── 3. Fetch Photos ─────────────────────────────────────────
$ph_sql = "SELECT photo_url, sort_order FROM provider_photos WHERE provider_id = ? ORDER BY sort_order ASC";
$ph_stmt = mysqli_prepare($conn, $ph_sql);
mysqli_stmt_bind_param($ph_stmt, "i", $provider_id);
mysqli_stmt_execute($ph_stmt);
$ph_result = mysqli_stmt_get_result($ph_stmt);
$photos = [];
while ($ph = mysqli_fetch_assoc($ph_result)) {
    $photos[] = $ph;
}

// ── 4. Fetch Vehicle Types ──────────────────────────────────
$vt_sql = "SELECT vt.id, vt.name FROM tagged_with tw 
           INNER JOIN vehicle_types vt ON tw.vehicle_type_id = vt.id 
           WHERE tw.provider_id = ?";
$vt_stmt = mysqli_prepare($conn, $vt_sql);
mysqli_stmt_bind_param($vt_stmt, "i", $provider_id);
mysqli_stmt_execute($vt_stmt);
$vt_result = mysqli_stmt_get_result($vt_stmt);
$vehicle_types = [];
while ($vt = mysqli_fetch_assoc($vt_result)) {
    $vehicle_types[] = $vt;
}

// ── 5. Fetch Reviews Summary & Latest Reviews ───────────────
$rev_sql = "SELECT r.rate, r.comment, r.created_at, CONCAT(u.fname, ' ', u.lname) AS reviewer_name 
            FROM reviews r 
            INNER JOIN users u ON r.user_id = u.id 
            WHERE r.provider_id = ? 
            ORDER BY r.created_at DESC";
$rev_stmt = mysqli_prepare($conn, $rev_sql);
mysqli_stmt_bind_param($rev_stmt, "i", $provider_id);
mysqli_stmt_execute($rev_stmt);
$rev_result = mysqli_stmt_get_result($rev_stmt);
$reviews = [];
$total_rate = 0;
while ($rev = mysqli_fetch_assoc($rev_result)) {
    $total_rate += $rev['rate'];
    $reviews[] = $rev;
}
$review_count = count($reviews);
$avg_rating = $review_count > 0 ? round($total_rate / $review_count, 1) : 0;

// ── 6. Similar Providers (Bonus for layout) ─────────────────
// Get providers in the same category, excluding current one
$sim_sql = "SELECT p.id, p.name, p.city, (SELECT photo_url FROM provider_photos WHERE provider_id = p.id LIMIT 1) as photo_url 
            FROM providers p 
            WHERE p.category_id = ? AND p.id != ? AND p.status = 'active' 
            LIMIT 3";
$sim_stmt = mysqli_prepare($conn, $sim_sql);
mysqli_stmt_bind_param($sim_stmt, "ii", $provider['category_id'], $provider_id);
mysqli_stmt_execute($sim_stmt);
$sim_result = mysqli_stmt_get_result($sim_stmt);
$similar_providers = [];
while ($sim = mysqli_fetch_assoc($sim_result)) {
    $similar_providers[] = $sim;
}

// ── Final Formatting ────────────────────────────────────────
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

echo json_encode([
    "success" => true,
    "data"    => $provider
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>

