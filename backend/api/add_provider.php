<?php
// ============================================================
// api/add_provider.php — POST /autoconnect/api/add_provider.php
// Creates a new provider and its related records (hours, photos, types).
// ============================================================

require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

// ── 1. Parse JSON body ──────────────────────────────────────
$data = json_decode(file_get_contents('php://input'), true) ?? [];

// ── 2. Validate Required Fields ─────────────────────────────
$required_fields = ['name', 'phone', 'address', 'city', 'user_id', 'category_id', 'working_hours'];
foreach ($required_fields as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit;
    }
}

// ── 3. Sanitize Inputs ──────────────────────────────────────
$name        = trim($data['name']);
$phone       = trim($data['phone']);
$address     = trim($data['address']);
$city        = trim($data['city']);
$user_id     = (int) $data['user_id'];
$category_id = (int) $data['category_id'];
$bio         = $data['bio'] ?? null;
$lat         = !empty($data['lat'])  ? (float)$data['lat']  : null;
$lng         = !empty($data['lng'])  ? (float)$data['lng']  : (!empty($data['long']) ? (float)$data['long'] : null);

// Arrays
$working_hours = $data['working_hours'];         // Expected structured array
$vehicle_types = $data['vehicle_types'] ?? [];   // Optional
$photos        = $data['photos'] ?? [];           // Optional

// ── 3. Start Database Transaction ──────────────────────────
mysqli_begin_transaction($conn);

try {
    // A. Insert into Providers
    $sql = "INSERT INTO providers (name, phone, address, bio, city, lat, lng, user_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "sssssddii", $name, $phone, $address, $bio, $city, $lat, $lng, $user_id, $category_id);
    
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception("Failed to insert provider: " . mysqli_stmt_error($stmt));
    }
    
    $provider_id = mysqli_insert_id($conn);
    mysqli_stmt_close($stmt);

    // B. Insert Working Hours
    if (!is_array($working_hours)) {
        // Fallback if sent as JSON string
        $working_hours = json_decode($working_hours, true);
    }

    if ($working_hours) {
        $wh_sql = "INSERT INTO working_hours (provider_id, day, open_time, close_time, is_close) VALUES (?, ?, ?, ?, ?)";
        $wh_stmt = mysqli_prepare($conn, $wh_sql);
        
        foreach ($working_hours as $hour) {
            $day        = $hour['day'];
            $open_time  = !empty($hour['open_time']) ? $hour['open_time'] : null;
            $close_time = !empty($hour['close_time']) ? $hour['close_time'] : null;
            $is_close   = (int) ($hour['is_close'] ?? 0);
            
            mysqli_stmt_bind_param($wh_stmt, "isssi", $provider_id, $day, $open_time, $close_time, $is_close);
            if (!mysqli_stmt_execute($wh_stmt)) {
                throw new Exception("Failed to insert working hours for $day");
            }
        }
        mysqli_stmt_close($wh_stmt);
    }

    // C. Insert Vehicle Types (Tagged With)
    if (!empty($vehicle_types) && is_array($vehicle_types)) {
        $tw_sql = "INSERT INTO tagged_with (provider_id, vehicle_type_id) VALUES (?, ?)";
        $tw_stmt = mysqli_prepare($conn, $tw_sql);
        
        foreach ($vehicle_types as $vt_id) {
            $vt_id = (int)$vt_id;
            mysqli_stmt_bind_param($tw_stmt, "ii", $provider_id, $vt_id);
            if (!mysqli_stmt_execute($tw_stmt)) {
                throw new Exception("Failed to tag vehicle type ID: $vt_id");
            }
        }
        mysqli_stmt_close($tw_stmt);
    }

    // D. Insert Photos
    if (!empty($photos) && is_array($photos)) {
        $ph_sql = "INSERT INTO provider_photos (provider_id, photo_url, sort_order) VALUES (?, ?, ?)";
        $ph_stmt = mysqli_prepare($conn, $ph_sql);
        
        foreach ($photos as $index => $url) {
            $sort_order = $index + 1;
            mysqli_stmt_bind_param($ph_stmt, "isi", $provider_id, $url, $sort_order);
            if (!mysqli_stmt_execute($ph_stmt)) {
                throw new Exception("Failed to insert photo: $url");
            }
        }
        mysqli_stmt_close($ph_stmt);
    }

    // All successful
    mysqli_commit($conn);
    
    echo json_encode([
        "success" => true,
        "message" => "Provider and all related data added successfully",
        "provider_id" => $provider_id
    ]);

} catch (Exception $e) {
    mysqli_rollback($conn);
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>

