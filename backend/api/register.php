<?php
// api/register.php — POST: register a new user
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$required = ['fname', 'lname', 'email', 'password', 'role'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Field '$field' is required."]);
        exit;
    }
}

$fname    = mysqli_real_escape_string($conn, trim($data['fname']));
$lname    = mysqli_real_escape_string($conn, trim($data['lname']));
$email    = mysqli_real_escape_string($conn, trim($data['email']));
$password = mysqli_real_escape_string($conn, password_hash($data['password'], PASSWORD_DEFAULT));
$phone    = mysqli_real_escape_string($conn, isset($data['phone']) ? trim($data['phone']) : '');
$role     = $data['role'];

if ($role === 'customer') $role = 'client';
if (!in_array($role, ['client', 'provider'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Role must be "client" or "provider".']);
    exit;
}

if ($role === 'provider') {
    $provider_required = ['name_en', 'name_ar', 'phone', 'address_en', 'city_en', 'category_id', 'working_hours'];
    foreach ($provider_required as $field) {
        if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === []) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Provider field '$field' is required."]);
            exit;
        }
    }
}

// Check if email already exists
$check = mysqli_query($conn, "SELECT id FROM users WHERE email = '$email' LIMIT 1");
if (mysqli_num_rows($check) > 0) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Email already registered.']);
    exit;
}

$provider_id = null;
mysqli_begin_transaction($conn);

$ok = mysqli_query($conn, "INSERT INTO users (fname, lname, email, password, phone, role) VALUES ('$fname', '$lname', '$email', '$password', '$phone', '$role')");

if ($ok) {
    $user_id = mysqli_insert_id($conn);

    if ($role === 'provider') {
        $name_en     = mysqli_real_escape_string($conn, trim($data['name_en']));
        $name_ar     = mysqli_real_escape_string($conn, trim($data['name_ar']));
        $provider_phone = mysqli_real_escape_string($conn, trim($data['phone']));
        $address_en  = mysqli_real_escape_string($conn, trim($data['address_en']));
        $address_ar  = mysqli_real_escape_string($conn, isset($data['address_ar']) ? trim($data['address_ar']) : '');
        $city_en     = mysqli_real_escape_string($conn, trim($data['city_en']));
        $city_ar     = mysqli_real_escape_string($conn, isset($data['city_ar']) ? trim($data['city_ar']) : '');
        $bio_en      = mysqli_real_escape_string($conn, isset($data['bio_en']) ? trim($data['bio_en']) : '');
        $bio_ar      = mysqli_real_escape_string($conn, isset($data['bio_ar']) ? trim($data['bio_ar']) : '');
        $category_id = (int)$data['category_id'];
        $lat_sql     = (isset($data['lat']) && $data['lat'] !== '') ? (float)$data['lat'] : 'NULL';
        $lng_sql     = (isset($data['lng']) && $data['lng'] !== '') ? (float)$data['lng'] : 'NULL';

        $ok = mysqli_query($conn, "INSERT INTO providers (name_en, name_ar, phone, address_en, address_ar, bio_en, bio_ar, city_en, city_ar, lat, lng, status, user_id, category_id)
            VALUES ('$name_en', '$name_ar', '$provider_phone', '$address_en', '$address_ar', '$bio_en', '$bio_ar', '$city_en', '$city_ar', $lat_sql, $lng_sql, 'active', $user_id, $category_id)");

        if (!$ok) {
            mysqli_rollback($conn);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to save provider profile.']);
            exit;
        }

        $provider_id = mysqli_insert_id($conn);

        $working_hours = is_array($data['working_hours']) ? $data['working_hours'] : json_decode($data['working_hours'], true);
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

        if (!empty($data['photos']) && is_array($data['photos'])) {
            foreach ($data['photos'] as $index => $url) {
                $url = mysqli_real_escape_string($conn, $url);
                $sort_order = $index + 1;
                $ok = mysqli_query($conn, "INSERT INTO provider_photos (provider_id, photo_url, sort_order) VALUES ($provider_id, '$url', $sort_order)");
                if (!$ok) {
                    mysqli_rollback($conn);
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to save provider photo.']);
                    exit;
                }
            }
        }
    }

    mysqli_commit($conn);

    echo json_encode([
        'success' => true,
        'message' => 'User registered successfully',
        'data'    => ['id' => $user_id, 'email' => $email, 'role' => $role, 'provider_id' => $provider_id]
    ]);
} else {
    mysqli_rollback($conn);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Registration failed.']);
}
?>
