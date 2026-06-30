<?php
// api/upload_photos.php — POST (multipart): upload provider images, return stored URLs
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

$upload_dir = __DIR__ . '/../uploads/providers/';

// Create folder if it doesn't exist yet
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

$allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$max_size      = 5 * 1024 * 1024; // 5 MB per image
$max_files     = 10;

// No files sent — nothing to do
if (empty($_FILES['photos']['name'][0])) {
    echo json_encode(['success' => true, 'urls' => []]);
    exit;
}

$files = $_FILES['photos'];
$count = count($files['name']);

if ($count > $max_files) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => "Maximum $max_files images allowed."]);
    exit;
}

$urls = [];

for ($i = 0; $i < $count; $i++) {
    // Skip files with upload errors
    if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;

    if ($files['size'][$i] > $max_size) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Each image must be under 5 MB.']);
        exit;
    }

    // Validate MIME type from actual file content (not just the extension)
    $finfo    = finfo_open(FILEINFO_MIME_TYPE);
    $mime     = finfo_file($finfo, $files['tmp_name'][$i]);
    finfo_close($finfo);

    if (!in_array($mime, $allowed_types)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Only JPEG, PNG, WebP, or GIF images are allowed.']);
        exit;
    }

    // Derive the extension from the MIME type (not from the user's filename).
    // This prevents someone from uploading a file named "hack.php" that happens to have valid image content.
    $mime_to_ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    $ext      = $mime_to_ext[$mime];
    $filename = uniqid('photo_', true) . '_' . $i . '.' . $ext;
    $dest     = $upload_dir . $filename;

    if (move_uploaded_file($files['tmp_name'][$i], $dest)) {
        // Store path relative to web/ folder (same convention as default image assets/images/...)
        // So base + path resolves correctly from both web/ and web/pages/
        $urls[] = '../backend/uploads/providers/' . $filename;
    }
}

echo json_encode(['success' => true, 'urls' => $urls]);
?>
