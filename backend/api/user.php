<?php
// api/user.php — GET: return the logged-in user's profile
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$user = getAuthUser($conn);
$user_id = (int)$user['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = mysqli_query($conn, "SELECT u.id, u.fname, u.lname, u.email, u.phone, u.role, u.created_at,
                                          c.vehicle_type, c.vehicle_brand
                                   FROM users u
                                   LEFT JOIN clients c ON c.user_id = u.id AND u.role = 'client'
                                   WHERE u.id = $user_id LIMIT 1");
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
