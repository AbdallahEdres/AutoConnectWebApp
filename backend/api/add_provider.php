<?php

require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?? [];

$token   = getBearerToken();
$payload = $token ? verifyToken($token) : null;
$auth_role = null;
$auth_id   = null;

if ($payload) {
    $uid    = (int)$payload['id'];
    $u_res  = mysqli_query($conn, "SELECT id, role, is_active FROM users WHERE id = $uid AND is_active = 1 LIMIT 1");
    $u_row  = $u_res ? mysqli_fetch_assoc($u_res) : null;
    if ($u_row) {
        $auth_role = $u_row['role'];
        $auth_id   = (int)$u_row['id'];
    }
}

// Validate required fields
$required_fields = ['name_en', 'name_ar', 'phone', 'address_en', 'city_en', 'category_id', 'working_hours'];
foreach ($required_fields as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit;
    }
}

// Sanitize string inputs
$name_en    = mysqli_real_escape_string($conn, trim($data['name_en']));
$name_ar    = mysqli_real_escape_string($conn, trim($data['name_ar']));
$phone      = mysqli_real_escape_string($conn, trim($data['phone']));
$address_en = mysqli_real_escape_string($conn, trim($data['address_en']));
$address_ar = mysqli_real_escape_string($conn, isset($data['address_ar']) ? trim($data['address_ar']) : '');
$city_en    = mysqli_real_escape_string($conn, trim($data['city_en']));
$city_ar    = mysqli_real_escape_string($conn, isset($data['city_ar']) ? trim($data['city_ar']) : '');
$bio_en     = mysqli_real_escape_string($conn, isset($data['bio_en']) ? trim($data['bio_en']) : '');
$bio_ar     = mysqli_real_escape_string($conn, isset($data['bio_ar']) ? trim($data['bio_ar']) : '');
$category_id = (int)$data['category_id'];
$lat_sql     = !empty($data['lat']) ? (float)$data['lat'] : 'NULL';
$lng_sql     = !empty($data['lng']) ? (float)$data['lng'] : 'NULL';

$working_hours = is_array($data['working_hours']) ? $data['working_hours'] : json_decode($data['working_hours'], true);
$vehicle_types = $data['vehicle_types'] ?? [];
$photos        = $data['photos'] ?? [];

// Determine status, created_by, verified_by, verified_at based on who is submitting
if ($auth_role === 'supervisor') {
    $status       = 'active';
    $created_by   = $auth_id;
    $verified_by  = $auth_id;
    $verified_at  = 'NOW()';
} elseif ($auth_role === 'agent') {
    $status       = 'pending';
    $created_by   = $auth_id;
    $verified_by  = 'NULL';
    $verified_at  = 'NULL';
} else {
    // Public (no auth or unknown role)
    $status       = 'pending';
    $created_by   = 'NULL';
    $verified_by  = 'NULL';
    $verified_at  = 'NULL';
}

$created_by_sql  = is_int($created_by) ? $created_by : 'NULL';
$verified_by_sql = is_int($verified_by ?? null) ? $verified_by : 'NULL';

mysqli_begin_transaction($conn);

// A. Insert provider
$ok = mysqli_query($conn, "INSERT INTO providers
    (name_en, name_ar, phone, address_en, address_ar, bio_en, bio_ar, city_en, city_ar, lat, lng, status, category_id, created_by, verified_by, verified_at)
    VALUES
    ('$name_en', '$name_ar', '$phone', '$address_en', '$address_ar', '$bio_en', '$bio_ar', '$city_en', '$city_ar', $lat_sql, $lng_sql, '$status', $category_id, $created_by_sql, $verified_by_sql, $verified_at)");

if (!$ok) {
    mysqli_rollback($conn);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save provider.']);
    exit;
}
$provider_id = mysqli_insert_id($conn);

// B. Insert working hours
if ($working_hours) {
    $valid_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    foreach ($working_hours as $hour) {
        if (!in_array($hour['day'] ?? '', $valid_days, true)) continue;
        $day        = mysqli_real_escape_string($conn, $hour['day']);
        $open_time  = mysqli_real_escape_string($conn, $hour['open_time'] ?? '');
        $close_time = mysqli_real_escape_string($conn, $hour['close_time'] ?? '');
        $is_close   = (int)($hour['is_close'] ?? 0);
        $open_sql   = $open_time  ? "'$open_time'"  : 'NULL';
        $close_sql  = $close_time ? "'$close_time'" : 'NULL';

        $ok = mysqli_query($conn, "INSERT INTO working_hours (provider_id, day, open_time, close_time, is_close)
            VALUES ($provider_id, '$day', $open_sql, $close_sql, $is_close)");

        if (!$ok) {
            mysqli_rollback($conn);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => "Failed to save working hours for $day."]);
            exit;
        }
    }
}

// C. Insert vehicle types
if (!empty($vehicle_types) && is_array($vehicle_types)) {
    foreach ($vehicle_types as $vt_id) {
        $vt_id = (int)$vt_id;
        $ok = mysqli_query($conn, "INSERT INTO tagged_with (provider_id, vehicle_type_id) VALUES ($provider_id, $vt_id)");
        if (!$ok) {
            mysqli_rollback($conn);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => "Failed to save vehicle type $vt_id."]);
            exit;
        }
    }
}

// D. Insert photos
if (!empty($photos) && is_array($photos)) {
    foreach ($photos as $index => $url) {
        $url        = mysqli_real_escape_string($conn, $url);
        $sort_order = $index + 1;
        $ok = mysqli_query($conn, "INSERT INTO provider_photos (provider_id, photo_url, sort_order) VALUES ($provider_id, '$url', $sort_order)");
        if (!$ok) {
            mysqli_rollback($conn);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to save photo.']);
            exit;
        }
    }
}

mysqli_commit($conn);
echo json_encode([
    'success'     => true,
    'message'     => 'Provider added successfully.',
    'data'        => ['id' => $provider_id, 'status' => $status],
    'provider_id' => $provider_id
]);
?>
