<?php
// api/providers.php — GET list of providers with optional filters
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$status_filter = (!empty($_GET['status'])) ? mysqli_real_escape_string($conn, $_GET['status']) : 'active';

$where_clause = "WHERE 1=1";
if (empty($_GET['created_by']) && $status_filter !== 'all') {
    $where_clause .= " AND p.status = '$status_filter'";
} elseif (!empty($_GET['created_by'])) {
    $created_by = (int) $_GET['created_by'];
    $where_clause .= " AND p.created_by = $created_by";
    if ($status_filter !== 'all' && !empty($_GET['status'])) {
        $where_clause .= " AND p.status = '$status_filter'";
    }
}

$sql = "SELECT
            p.id, p.name_en, p.name_ar, p.phone, p.address_en, p.address_ar, p.city_en, p.city_ar,
            p.lat, p.lng, p.status AS provider_status, p.verified_at, p.verified_by, p.created_by,
            c.name_en AS category_name_en, c.name_ar AS category_name_ar, c.slug AS category_slug,
            EXISTS (
                SELECT 1 FROM working_hours wh
                WHERE wh.provider_id = p.id
                AND wh.day = DAYNAME(NOW())
                AND wh.is_close = 0
                AND TIME(NOW()) BETWEEN wh.open_time AND wh.close_time
            ) AS is_open_now,
            ROUND(COALESCE((SELECT AVG(rate) FROM reviews WHERE provider_id = p.id), 0), 1) AS rating,
            (SELECT COUNT(*) FROM reviews WHERE provider_id = p.id) AS review_count,
            (SELECT photo_url FROM provider_photos WHERE provider_id = p.id ORDER BY sort_order ASC LIMIT 1) AS image
        FROM providers p
        INNER JOIN categories c ON p.category_id = c.id
        $where_clause";

// Filter by category slug (e.g. ?category_slug=mechanic)
if (!empty($_GET['category_slug'])) {
    $category_slug = mysqli_real_escape_string($conn, $_GET['category_slug']);
    $sql .= " AND c.slug = '$category_slug'";
}

// Filter by city — checks both English and Arabic city names
if (!empty($_GET['city'])) {
    $city = mysqli_real_escape_string($conn, $_GET['city']);
    $sql .= " AND (p.city_en = '$city' OR p.city_ar = '$city')";
}

// Keyword search (e.g. ?q=toyota)
if (!empty($_GET['q'])) {
    $q = mysqli_real_escape_string($conn, '%' . $_GET['q'] . '%');
    $sql .= " AND (p.name_en LIKE '$q' OR p.name_ar LIKE '$q' OR p.address_en LIKE '$q' OR p.address_ar LIKE '$q')";
}

$sort = $_GET['sort'] ?? 'newest';
if ($sort === 'rating') {
    $sql .= " ORDER BY rating DESC LIMIT 100";
} else {
    $sql .= " ORDER BY p.id DESC LIMIT 100";
}

$result = mysqli_query($conn, $sql);

$providers = [];
while ($row = mysqli_fetch_assoc($result)) {
    $row['id'] = (int) $row['id'];
    $row['lat'] = $row['lat'] !== null ? (float) $row['lat'] : null;
    $row['lng'] = $row['lng'] !== null ? (float) $row['lng'] : null;
    $row['rating'] = (float) $row['rating'];
    $row['review_count'] = (int) $row['review_count'];
    $row['is_open_now'] = (bool) $row['is_open_now'];
    $row['provider_status'] = $row['provider_status'];

    if ($row['provider_status'] === 'pending') {
        $row['status'] = 'pending';
    } else {
        $row['status'] = $row['is_open_now'] ? 'open' : 'closed';
    }

    unset($row['provider_status']);
    unset($row['verified_by']);
    unset($row['created_by']);

    if (empty($row['image'])) {
        $row['image'] = 'assets/images/provider_default.png';
    }
    $providers[] = $row;
}

echo json_encode(['success' => true, 'data' => $providers]);
?>