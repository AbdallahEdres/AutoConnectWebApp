<?php
// api/add_provider.php — POST: create a new provider with hours, photos, vehicle types
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?? [];

$headers = getallheaders();
$token   = str_replace('Bearer ', '', isset($headers['Authorization']) ? $headers['Authorization'] : '');
$payload = verifyToken($token);
if (empty($data['user_id']) && $payload) {
    $data['user_id'] = (int)$payload['id'];
}

// Validate required fields
$required_fields = ['name_en', 'name_ar', 'phone', 'address_en', 'city_en', 'user_id', 'category_id', 'working_hours'];
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
$user_id     = (int)$data['user_id'];
$category_id = (int)$data['category_id'];
$lat_sql     = !empty($data['lat']) ? (float)$data['lat'] : 'NULL';
$lng_sql     = !empty($data['lng']) ? (float)$data['lng'] : 'NULL';

$working_hours = is_array($data['working_hours']) ? $data['working_hours'] : json_decode($data['working_hours'], true);
$vehicle_types = $data['vehicle_types'] ?? [];
$photos        = $data['photos'] ?? [];

mysqli_begin_transaction($conn);

// A. Insert provider
$ok = mysqli_query($conn, "INSERT INTO providers (name_en, name_ar, phone, address_en, address_ar, bio_en, bio_ar, city_en, city_ar, lat, lng, status, user_id, category_id)
    VALUES ('$name_en', '$name_ar', '$phone', '$address_en', '$address_ar', '$bio_en', '$bio_ar', '$city_en', '$city_ar', $lat_sql, $lng_sql, 'active', $user_id, $category_id)");

if (!$ok) {
    mysqli_rollback($conn);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save provider.']);
    exit;
}
$provider_id = mysqli_insert_id($conn);

// B. Insert working hours
if ($working_hours) {
    foreach ($working_hours as $hour) {
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
    'success' => true,
    'message' => 'Provider added successfully.',
    'data' => ['id' => $provider_id],
    'provider_id' => $provider_id
]);
?>
