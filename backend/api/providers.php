<?php
// ============================================================
// api/providers.php — GET /autoconnect/api/providers.php
// Returns a JSON list of providers with enriched data and filters.
// ============================================================

require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

// ── User Location for "Nearest" Sorting ─────────────────────
$user_lat = isset($_GET['lat'])  ? (float)$_GET['lat']  : null;
$user_lng = isset($_GET['lng'])  ? (float)$_GET['lng']
          : (isset($_GET['long']) ? (float)$_GET['long'] : null); // 'long' alias from frontend

// If not provided via params, we could try IP geolocation, but it's often inaccurate.
// For this implementation, we prioritize explicit lat/lng parameters.

// ── Filters ──────────────────────────────────────────────────
$where_clauses = ["p.status = 'active'"]; // Default: only active
$bind_types    = '';
$bind_values   = [];

// 1. Keyword search — accepts 'q' or 'search' (frontend alias)
$search_term = !empty($_GET['q']) ? $_GET['q'] : (!empty($_GET['search']) ? $_GET['search'] : '');
if ($search_term !== '') {
    $where_clauses[] = '(p.name LIKE ? OR p.address LIKE ?)';
    $bind_types     .= 'ss';
    $keyword         = '%' . trim($search_term) . '%';
    $bind_values[]   = $keyword;
    $bind_values[]   = $keyword;
}

// 2. Category — accepts numeric 'category_id' or slug 'category_slug' (frontend alias)
if (!empty($_GET['category_id'])) {
    $where_clauses[] = 'p.category_id = ?';
    $bind_types     .= 'i';
    $bind_values[]   = (int) $_GET['category_id'];
} elseif (!empty($_GET['category_slug'])) {
    $where_clauses[] = 'p.category_id = (SELECT id FROM categories WHERE slug = ? LIMIT 1)';
    $bind_types     .= 's';
    $bind_values[]   = trim($_GET['category_slug']);
}

// 3. City
if (!empty($_GET['city'])) {
    $where_clauses[] = 'p.city = ?';
    $bind_types     .= 's';
    $bind_values[]   = trim($_GET['city']);
}

// 4. Open Now Filter — accepts 'open_now=true' or 'status=open' (frontend alias)
$wants_open = (isset($_GET['open_now']) && $_GET['open_now'] == 'true')
           || (isset($_GET['status'])   && $_GET['status'] === 'open');
if ($wants_open) {
    // Subquery to check if provider is open at current server time
    $where_clauses[] = "EXISTS (
        SELECT 1 FROM working_hours wh 
        WHERE wh.provider_id = p.id 
        AND wh.day = DAYNAME(NOW()) 
        AND wh.is_close = 0 
        AND TIME(NOW()) BETWEEN wh.open_time AND wh.close_time
    )";
}

$where_sql = 'WHERE ' . implode(' AND ', $where_clauses);

// ── Sorting ──────────────────────────────────────────────────
$sort_by = $_GET['sort'] ?? 'featured';
$order_sql = "p.verified_at DESC"; // Default: featured

switch ($sort_by) {
    case 'nearest':
        if ($user_lat !== null && $user_lng !== null) {
            $order_sql = "distance ASC";
        }
        break;
    case 'highest_rate':
    case 'rating': // frontend alias
        $order_sql = "avg_rating DESC";
        break;
    case 'most_common':
        $order_sql = "review_count DESC";
        break;
    case 'featured':
    default:
        $order_sql = "p.verified_at DESC, p.created_at DESC";
        break;
}

// ── Distance Calculation (Haversine Formula) ────────────────
$distance_select  = "NULL AS distance";
$distance_params  = [];
$distance_types   = '';
if ($user_lat !== null && $user_lng !== null) {
    $distance_select = "(
        6371 * acos(
            cos(radians(?)) * cos(radians(p.lat)) *
            cos(radians(p.lng) - radians(?)) +
            sin(radians(?)) * sin(radians(p.lat))
        )
    ) AS distance";
    // lat, lng, lat — three placeholders in the SELECT clause
    $distance_params = [$user_lat, $user_lng, $user_lat];
    $distance_types  = 'ddd';
}

// ── Pagination Logic ────────────────────────────────────────
$limit   = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$page    = isset($_GET['page'])  ? (int)$_GET['page'] : 1;
$offset  = ($page - 1) * $limit;
$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

// ── 1. Get Total Count (before pagination) ──────────────────
$count_sql = "SELECT COUNT(*) as total FROM providers p $where_sql";
$count_stmt = mysqli_prepare($conn, $count_sql);
if (!empty($bind_values)) {
    $count_stmt->bind_param($bind_types, ...$bind_values);
}
mysqli_stmt_execute($count_stmt);
$total_rows = mysqli_fetch_assoc(mysqli_stmt_get_result($count_stmt))['total'];
mysqli_stmt_close($count_stmt);

// ── 2. Main Query with Pagination ───────────────────────────
$sql = "
    SELECT
        p.id,
        p.name,
        p.phone,
        p.address,
        p.city,
        CONCAT(p.address, ' ', p.city) AS full_address,
        p.lat,
        p.lng,
        p.status,
        p.verified_at,
        c.name AS category_name,
        -- Photo URL (first photo by sort_order)
        (SELECT photo_url FROM provider_photos WHERE provider_id = p.id ORDER BY sort_order ASC LIMIT 1) AS photo_url,
        -- Average Rating
        ROUND(COALESCE((SELECT AVG(rate) FROM reviews WHERE provider_id = p.id), 0), 1) AS avg_rating,
        -- Review Count
        (SELECT COUNT(*) FROM reviews WHERE provider_id = p.id) AS review_count,
        -- Open Now Status
        EXISTS (
            SELECT 1 FROM working_hours wh 
            WHERE wh.provider_id = p.id 
            AND wh.day = DAYNAME(NOW()) 
            AND wh.is_close = 0 
            AND TIME(NOW()) BETWEEN wh.open_time AND wh.close_time
        ) AS is_open_now,
        -- Is Saved by User
        EXISTS (
            SELECT 1 FROM saves s 
            WHERE s.provider_id = p.id 
            AND s.user_id = ?
        ) AS is_saved,
        -- Distance
        $distance_select
    FROM providers p
    INNER JOIN categories c ON p.category_id = c.id
    $where_sql
    ORDER BY $order_sql
    LIMIT ? OFFSET ?
";

$stmt = mysqli_prepare($conn, $sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Query preparation failed: ' . mysqli_error($conn)]);
    exit;
}

// Bind order matches SELECT → WHERE → LIMIT/OFFSET placeholder positions
$final_bind_types  = "i" . $distance_types . $bind_types . "ii";
$final_bind_values = array_merge([$user_id], $distance_params, $bind_values, [$limit, $offset]);

$stmt->bind_param($final_bind_types, ...$final_bind_values);

if (!mysqli_stmt_execute($stmt)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Query execution failed.']);
    exit;
}

$result    = mysqli_stmt_get_result($stmt);
$providers = [];

while ($row = mysqli_fetch_assoc($result)) {
    // ── Enriched formatting ────────────
    $row['id']           = (int)   $row['id'];
    $row['avg_rating']   = (float) $row['avg_rating'];
    $row['review_count'] = (int)   $row['review_count'];
    $row['is_open_now']  = (bool)  $row['is_open_now'];
    $row['is_saved']     = (bool)  $row['is_saved'];
    $row['distance']     = $row['distance'] !== null ? round((float)$row['distance'], 2) : null;
    $row['lat']          = (float) $row['lat'];
    $row['lng']          = (float) $row['lng'];

    // Default photo if none found
    if (empty($row['photo_url'])) {
        $row['photo_url'] = 'public/assist/images/provider_default.png';
    }

    $providers[] = $row;
}

mysqli_stmt_close($stmt);

echo json_encode([
    'success' => true,
    'pagination' => [
        'total'        => (int)$total_rows,
        'current_page' => $page,
        'per_page'     => $limit,
        'last_page'    => ceil($total_rows / $limit)
    ],
    'filters' => [
        'city' => $_GET['city'] ?? null,
        'category_id' => $_GET['category_id'] ?? null,
        'sort' => $sort_by
    ],
    'data'    => $providers
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>


