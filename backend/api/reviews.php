<?php
// api/reviews.php — GET: fetch reviews | POST: add a review
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: fetch reviews for a provider ───────────────────────
if ($method === 'GET') {
    if (empty($_GET['provider_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Provider ID is required.']);
        exit;
    }

    $provider_id = (int)$_GET['provider_id'];

    $result = mysqli_query($conn, "SELECT r.*, u.fname, u.lname
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.provider_id = $provider_id
        ORDER BY r.created_at DESC");

    $reviews = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $row['user_name'] = $row['fname'] . ' ' . $row['lname'];
        unset($row['fname'], $row['lname']);
        $row['rate'] = (int)$row['rate'];
        $reviews[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $reviews]);
    exit;
}

// ── POST: add a new review ───────────────────────────────────
if ($method === 'POST') {
    $token   = getBearerToken();
    $payload = verifyToken($token);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Login required to post a review.']);
        exit;
    }
    $user_id = (int)$payload['id'];

    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['provider_id']) || empty($data['rate'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Provider ID and rating are required.']);
        exit;
    }

    $provider_id = (int)$data['provider_id'];
    $rate        = (int)$data['rate'];

    if ($rate < 1 || $rate > 5) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Rating must be between 1 and 5.']);
        exit;
    }

    // Duplicate review check
    $check = mysqli_query($conn, "SELECT id FROM reviews WHERE provider_id = $provider_id AND user_id = $user_id LIMIT 1");
    if (mysqli_num_rows($check) > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'You have already reviewed this provider.']);
        exit;
    }

    // Limit comment to 1000 characters so nobody can send a huge block of text.
    $comment = substr(trim($data['comment'] ?? ''), 0, 1000);
    $comment = mysqli_real_escape_string($conn, $comment);

    $ok = mysqli_query($conn, "INSERT INTO reviews (provider_id, user_id, rate, comment) VALUES ($provider_id, $user_id, $rate, '$comment')");

    if ($ok) {
        echo json_encode(['success' => true, 'message' => 'Review posted successfully', 'data' => ['id' => mysqli_insert_id($conn)]]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to post review.']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
?>
