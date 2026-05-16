<?php
// ============================================================
// api/edit_provider.php — POST /autoconnect/api/edit_provider.php
// Updates an existing provider and its related sub-tables.
// ============================================================

require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

// ── 0. Authentication ────────────────────────────────────────
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

$provider_id = (int) $data['id'];

// ── 1. Check provider exists and is owned by the requester ───
$check_stmt = mysqli_prepare($conn, "SELECT id, user_id FROM providers WHERE id = ?");
mysqli_stmt_bind_param($check_stmt, "i", $provider_id);
mysqli_stmt_execute($check_stmt);
$check_row = mysqli_fetch_assoc(mysqli_stmt_get_result($check_stmt));
mysqli_stmt_close($check_stmt);

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

// ── 2. Collect Dynamic Fields for Providers Table ───────────
$fields_to_update = [];
$bind_types       = '';
$bind_values      = [];

$possible_fields = [
    'name'        => 's',
    'phone'       => 's',
    'address'     => 's',
    'bio'         => 's',
    'city'        => 's',
    'category_id' => 'i',
    'status'      => 's',
    'lat'         => 'd',
    'lng'         => 'd',
    'long'        => 'd' // Alias for lng
];

foreach ($possible_fields as $field => $type) {
    if (isset($data[$field])) {
        $db_field = ($field === 'long') ? 'lng' : $field;
        $fields_to_update[] = "$db_field = ?";
        $bind_types        .= $type;
        $bind_values[]      = ($type === 'i') ? (int)$data[$field] : (($type === 'd') ? (float)$data[$field] : trim($data[$field]));
    }
}

// ── 3. Start Database Transaction ──────────────────────────
mysqli_begin_transaction($conn);

try {
    // A. Update Providers table if fields were sent
    if (!empty($fields_to_update)) {
        $sql = "UPDATE providers SET " . implode(", ", $fields_to_update) . " WHERE id = ?";
        $bind_types .= "i";
        $bind_values[] = $provider_id;
        
        $stmt = mysqli_prepare($conn, $sql);
        $stmt->bind_param($bind_types, ...$bind_values);
        
        if (!mysqli_stmt_execute($stmt)) {
            throw new Exception("Failed to update provider core data.");
        }
        mysqli_stmt_close($stmt);
    }

    // B. Update Working Hours (Replace entire list)
    if (isset($data['working_hours'])) {
        $working_hours = $data['working_hours'];
        if (!is_array($working_hours)) $working_hours = json_decode($working_hours, true);

        $del_wh = mysqli_prepare($conn, "DELETE FROM working_hours WHERE provider_id = ?");
        mysqli_stmt_bind_param($del_wh, "i", $provider_id);
        mysqli_stmt_execute($del_wh);
        mysqli_stmt_close($del_wh);

        if ($working_hours) {
            $wh_sql = "INSERT INTO working_hours (provider_id, day, open_time, close_time, is_close) VALUES (?, ?, ?, ?, ?)";
            $wh_stmt = mysqli_prepare($conn, $wh_sql);
            foreach ($working_hours as $hour) {
                mysqli_stmt_bind_param($wh_stmt, "isssi", $provider_id, $hour['day'], $hour['open_time'], $hour['close_time'], $hour['is_close']);
                mysqli_stmt_execute($wh_stmt);
            }
            mysqli_stmt_close($wh_stmt);
        }
    }

    // C. Update Vehicle Types (Replace entire list)
    if (isset($data['vehicle_types'])) {
        $vehicle_types = $data['vehicle_types'];
        if (!is_array($vehicle_types)) $vehicle_types = json_decode($vehicle_types, true);

        $del_tw = mysqli_prepare($conn, "DELETE FROM tagged_with WHERE provider_id = ?");
        mysqli_stmt_bind_param($del_tw, "i", $provider_id);
        mysqli_stmt_execute($del_tw);
        mysqli_stmt_close($del_tw);

        if ($vehicle_types) {
            $tw_sql = "INSERT INTO tagged_with (provider_id, vehicle_type_id) VALUES (?, ?)";
            $tw_stmt = mysqli_prepare($conn, $tw_sql);
            foreach ($vehicle_types as $vt_id) {
                $vt_id = (int)$vt_id;
                mysqli_stmt_bind_param($tw_stmt, "ii", $provider_id, $vt_id);
                mysqli_stmt_execute($tw_stmt);
            }
            mysqli_stmt_close($tw_stmt);
        }
    }

    // D. Update Photos (Replace entire list)
    if (isset($data['photos'])) {
        $photos = $data['photos'];
        if (!is_array($photos)) $photos = json_decode($photos, true);

        $del_ph = mysqli_prepare($conn, "DELETE FROM provider_photos WHERE provider_id = ?");
        mysqli_stmt_bind_param($del_ph, "i", $provider_id);
        mysqli_stmt_execute($del_ph);
        mysqli_stmt_close($del_ph);

        if ($photos) {
            $ph_sql = "INSERT INTO provider_photos (provider_id, photo_url, sort_order) VALUES (?, ?, ?)";
            $ph_stmt = mysqli_prepare($conn, $ph_sql);
            foreach ($photos as $index => $url) {
                $sort_order = $index + 1;
                mysqli_stmt_bind_param($ph_stmt, "isi", $provider_id, $url, $sort_order);
                mysqli_stmt_execute($ph_stmt);
            }
            mysqli_stmt_close($ph_stmt);
        }
    }

    mysqli_commit($conn);
    echo json_encode(["success" => true, "message" => "Provider updated successfully."]);

} catch (Exception $e) {
    mysqli_rollback($conn);
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>

