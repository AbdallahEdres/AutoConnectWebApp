<?php
// ============================================================
// api/reviews.php — GET/POST /autoconnect/api/reviews.php
// Manages provider reviews.
// ============================================================

require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Fetch Reviews for a Provider ───────────────────────
if ($method === 'GET') {
    if (empty($_GET['provider_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Provider ID is required.']);
        exit;
    }
    
    $provider_id = (int)$_GET['provider_id'];
    
    $sql = "SELECT r.*, u.fname, u.lname 
            FROM reviews r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.provider_id = ? 
            ORDER BY r.created_at DESC";
            
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "i", $provider_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    
    $reviews = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $row['user_name'] = $row['fname'] . ' ' . $row['lname'];
        unset($row['fname'], $row['lname']);
        $row['rate'] = (int)$row['rate'];
        $reviews[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $reviews
    ]);
    mysqli_stmt_close($stmt);
    exit;
}

// ── POST: Add a New Review ──────────────────────────────────
if ($method === 'POST') {
    // 1. Auth check
    $headers = getallheaders();
    $token   = str_replace('Bearer ', '', isset($headers['Authorization']) ? $headers['Authorization'] : '');
    $payload = verifyToken($token);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Login required to post a review.']);
        exit;
    }
    $user_id = (int)$payload['id'];

    // 2. Validate inputs
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

    // 3. Duplicate review check
    $dup_stmt = mysqli_prepare($conn, "SELECT id FROM reviews WHERE provider_id = ? AND user_id = ? LIMIT 1");
    mysqli_stmt_bind_param($dup_stmt, "ii", $provider_id, $user_id);
    mysqli_stmt_execute($dup_stmt);
    mysqli_stmt_store_result($dup_stmt);
    $already_reviewed = mysqli_stmt_num_rows($dup_stmt) > 0;
    mysqli_stmt_close($dup_stmt);

    if ($already_reviewed) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'You have already reviewed this provider.']);
        exit;
    }

    $comment = isset($data['comment']) ? trim($data['comment']) : null;

    $sql = "INSERT INTO reviews (provider_id, user_id, rate, comment) VALUES (?, ?, ?, ?)";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "iiis", $provider_id, $user_id, $rate, $comment);

    if (mysqli_stmt_execute($stmt)) {
        echo json_encode([
            'success' => true, 
            'message' => 'Review posted successfully',
            'data' => ['id' => mysqli_insert_id($conn)]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to post review.']);
    }
    mysqli_stmt_close($stmt);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
?>
