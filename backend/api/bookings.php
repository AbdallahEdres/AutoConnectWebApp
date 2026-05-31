<?php
// api/bookings.php — GET: fetch user's bookings | POST: create a booking
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$method  = $_SERVER['REQUEST_METHOD'];
$headers = getallheaders();
$token   = str_replace('Bearer ', '', isset($headers['Authorization']) ? $headers['Authorization'] : '');
$payload = verifyToken($token);

if (!$payload) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Login required.']);
    exit;
}

$user_id = (int)$payload['id'];

// ── GET: fetch all bookings for the logged-in user ───────────
if ($method === 'GET') {
    $result = mysqli_query($conn, "SELECT b.id, b.created_at, p.id AS provider_id, p.name_ar, p.name_en
        FROM bookings b
        JOIN providers p ON b.provider_id = p.id
        WHERE b.user_id = $user_id
        ORDER BY b.created_at DESC");

    $bookings = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $bookings[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $bookings]);
    exit;
}

// ── POST: create a new booking ───────────────────────────────
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['provider_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Provider ID is required.']);
        exit;
    }

    $provider_id = (int)$data['provider_id'];

    // Make sure the provider exists
    $check = mysqli_query($conn, "SELECT id FROM providers WHERE id = $provider_id LIMIT 1");
    if (mysqli_num_rows($check) === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Provider not found.']);
        exit;
    }

    $ok = mysqli_query($conn, "INSERT INTO bookings (user_id, provider_id) VALUES ($user_id, $provider_id)");

    if ($ok) {
        echo json_encode(['success' => true, 'message' => 'Booking created successfully.', 'data' => ['id' => mysqli_insert_id($conn)]]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create booking.']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
?>
