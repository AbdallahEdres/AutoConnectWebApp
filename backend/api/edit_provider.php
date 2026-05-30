<?php
// api/edit_provider.php — POST: update an existing provider
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

// Authentication
$headers = getallheaders();
$token   = str_replace('Bearer ', '', isset($headers['Authorization']) ? $headers['Authorization'] : '');
$payload = verifyToken($token);
if (!$payload) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}
$auth_user_id = (int)$payload['id'];

$data = json_decode(file_get_contents('php://input'), true) ?? [];

if (empty($data['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Provider ID is required.']);
    exit;
}
$provider_id = (int)$data['id'];

// Check provider exists and belongs to this user
$check = mysqli_query($conn, "SELECT id, user_id FROM providers WHERE id = $provider_id");
$check_row = mysqli_fetch_assoc($check);

if (!$check_row) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Provider not found.']);
    exit;
}
if ((int)$check_row['user_id'] !== $auth_user_id) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden. You do not own this provider profile.']);
    exit;
}

mysqli_begin_transaction($conn);

// A. Update provider fields (only the ones sent in the request)
$updates = [];
if (isset($data['name_en']))     $updates[] = "name_en = '"     . mysqli_real_escape_string($conn, trim($data['name_en']))    . "'";
if (isset($data['name_ar']))     $updates[] = "name_ar = '"     . mysqli_real_escape_string($conn, trim($data['name_ar']))    . "'";
if (isset($data['phone']))       $updates[] = "phone = '"       . mysqli_real_escape_string($conn, trim($data['phone']))      . "'";
if (isset($data['address_en']))  $updates[] = "address_en = '"  . mysqli_real_escape_string($conn, trim($data['address_en'])) . "'";
if (isset($data['address_ar']))  $updates[] = "address_ar = '"  . mysqli_real_escape_string($conn, trim($data['address_ar'])) . "'";
if (isset($data['bio_en']))      $updates[] = "bio_en = '"      . mysqli_real_escape_string($conn, trim($data['bio_en']))     . "'";
if (isset($data['bio_ar']))      $updates[] = "bio_ar = '"      . mysqli_real_escape_string($conn, trim($data['bio_ar']))     . "'";
if (isset($data['city_en']))     $updates[] = "city_en = '"     . mysqli_real_escape_string($conn, trim($data['city_en']))    . "'";
if (isset($data['city_ar']))     $updates[] = "city_ar = '"     . mysqli_real_escape_string($conn, trim($data['city_ar']))    . "'";
if (isset($data['status']))      $updates[] = "status = '"      . mysqli_real_escape_string($conn, $data['status'])           . "'";
if (isset($data['category_id'])) $updates[] = "category_id = " . (int)$data['category_id'];
if (isset($data['lat']))         $updates[] = "lat = "          . (float)$data['lat'];
if (isset($data['lng']))         $updates[] = "lng = "          . (float)$data['lng'];

if (!empty($updates)) {
    $ok = mysqli_query($conn, "UPDATE providers SET " . implode(', ', $updates) . " WHERE id = $provider_id");
    if (!$ok) {
        mysqli_rollback($conn);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update provider.']);
        exit;
    }
}

// B. Replace working hours (delete old, insert new)
if (isset($data['working_hours'])) {
    $working_hours = is_array($data['working_hours']) ? $data['working_hours'] : json_decode($data['working_hours'], true);

    mysqli_query($conn, "DELETE FROM working_hours WHERE provider_id = $provider_id");

    if ($working_hours) {
        foreach ($working_hours as $hour) {
            $day        = mysqli_real_escape_string($conn, $hour['day']);
            $open_time  = mysqli_real_escape_string($conn, $hour['open_time'] ?? '');
            $close_time = mysqli_real_escape_string($conn, $hour['close_time'] ?? '');
            $is_close   = (int)($hour['is_close'] ?? 0);
            $open_sql   = $open_time  ? "'$open_time'"  : 'NULL';
            $close_sql  = $close_time ? "'$close_time'" : 'NULL';
            mysqli_query($conn, "INSERT INTO working_hours (provider_id, day, open_time, close_time, is_close)
                VALUES ($provider_id, '$day', $open_sql, $close_sql, $is_close)");
        }
    }
}

// C. Replace vehicle types (delete old, insert new)
if (isset($data['vehicle_types'])) {
    $vehicle_types = is_array($data['vehicle_types']) ? $data['vehicle_types'] : json_decode($data['vehicle_types'], true);

    mysqli_query($conn, "DELETE FROM tagged_with WHERE provider_id = $provider_id");

    if ($vehicle_types) {
        foreach ($vehicle_types as $vt_id) {
            $vt_id = (int)$vt_id;
            mysqli_query($conn, "INSERT INTO tagged_with (provider_id, vehicle_type_id) VALUES ($provider_id, $vt_id)");
        }
    }
}

// D. Replace photos (delete old, insert new)
if (isset($data['photos'])) {
    $photos = is_array($data['photos']) ? $data['photos'] : json_decode($data['photos'], true);

    mysqli_query($conn, "DELETE FROM provider_photos WHERE provider_id = $provider_id");

    if ($photos) {
        foreach ($photos as $index => $url) {
            $url        = mysqli_real_escape_string($conn, $url);
            $sort_order = $index + 1;
            mysqli_query($conn, "INSERT INTO provider_photos (provider_id, photo_url, sort_order) VALUES ($provider_id, '$url', $sort_order)");
        }
    }
}

mysqli_commit($conn);
echo json_encode(['success' => true, 'message' => 'Provider updated successfully.']);
?>
