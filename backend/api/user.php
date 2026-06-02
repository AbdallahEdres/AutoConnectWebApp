<?php
// api/user.php — GET: return the logged-in user's profile
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$headers = getallheaders();
$token   = str_replace('Bearer ', '', isset($headers['Authorization']) ? $headers['Authorization'] : '');
$payload = verifyToken($token);
if (!$payload) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid or expired token.']);
    exit;
}

$user_id = (int)$payload['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = mysqli_query($conn, "SELECT id, fname, lname, email, phone, role, created_at FROM users WHERE id = $user_id LIMIT 1");
    $user   = mysqli_fetch_assoc($result);

    if ($user) {
        $user['total_visits'] = 0;
        $count_result = mysqli_query($conn, "SELECT COUNT(*) AS total FROM bookings WHERE user_id = $user_id");
        if ($count_result) {
            $count_row = mysqli_fetch_assoc($count_result);
            $user['total_visits'] = (int)$count_row['total'];
        }

        echo json_encode(['success' => true, 'data' => $user]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
}
?>
