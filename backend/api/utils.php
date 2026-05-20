<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

setCorsHeaders();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// POST upload image
if ($method === 'POST' && $action === 'image') {
    if (!isset($_FILES['image'])) sendResponse(false, null, 'No file uploaded');

    $file     = $_FILES['image'];
    $type     = $_GET['type'] ?? 'misc'; // food | slip | shop
    $allowed  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!in_array($file['type'], $allowed)) sendResponse(false, null, 'ไฟล์ต้องเป็นรูปภาพเท่านั้น');
    if ($file['size'] > 5 * 1024 * 1024) sendResponse(false, null, 'ไฟล์ขนาดใหญ่เกินไป (สูงสุด 5MB)');

    $uploadDir = __DIR__ . "/../uploads/{$type}/";
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = $type . '_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
    $dest     = $uploadDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $dest)) {
        // Return public URL (relative to backend root, served by XAMPP)
        $baseUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
        // Adjust this path to match your XAMPP htdocs structure
        $url = $baseUrl . '/pbpvccanteen/backend/uploads/' . $type . '/' . $filename;
        sendResponse(true, ['url' => $url]);
    }
    sendResponse(false, null, 'อัปโหลดไม่สำเร็จ');
}

// GET favorites
if ($method === 'GET' && $action === 'get-favorites') {
    $uid  = $_GET['uid'] ?? '';
    $stmt = $db->prepare("SELECT favorites FROM users WHERE id = ? LIMIT 1");
    $stmt->bind_param('s', $uid);
    $stmt->execute();
    $row  = $stmt->get_result()->fetch_assoc();
    $favs = $row && $row['favorites'] ? json_decode($row['favorites'], true) : [];
    sendResponse(true, $favs);
}

// PUT save favorites
if ($method === 'PUT' && $action === 'save-favorites') {
    $body = getBody();
    $uid  = $body['uid'] ?? '';
    $favs = json_encode($body['favs'] ?? []);
    $stmt = $db->prepare("UPDATE users SET favorites = ? WHERE id = ?");
    $stmt->bind_param('ss', $favs, $uid);
    $stmt->execute();
    sendResponse(true, 'Saved');
}

// POST save student profile
if ($method === 'POST' && $action === 'save-student-profile') {
    $body = getBody();
    $uid  = $body['uid'] ?? '';

    $stmt = $db->prepare("UPDATE users SET name=?, nickname=?, phone=?, email=? WHERE id=?");
    $stmt->bind_param('sssss', $body['name'], $body['nick'], $body['phone'], $body['email'], $uid);

    if (!empty($body['pwd'])) {
        $stmt2 = $db->prepare("UPDATE users SET password=? WHERE id=?");
        $stmt2->bind_param('ss', $body['pwd'], $uid);
        $stmt2->execute();
    }
    if ($stmt->execute()) sendResponse(true, 'Saved');
    sendResponse(false, null, $db->error);
}

// POST report issue
if ($method === 'POST' && $action === 'report-issue') {
    $body = getBody();
    $rid  = 'RPT-' . time();
    $uid  = $body['uid'] ?? '';
    $name = $body['name'] ?? '';
    $type = $body['type'] ?? '';
    $msg  = $body['msg'] ?? '';
    $contact = $body['contact'] ?? '';

    $stmt = $db->prepare("INSERT INTO reports (id, user_id, name, type, message, contact, status) VALUES (?,?,?,?,?,?,'Pending')");
    $stmt->bind_param('ssssss', $rid, $uid, $name, $type, $msg, $contact);
    if ($stmt->execute()) sendResponse(true, 'ส่งรายงานเรียบร้อย');
    sendResponse(false, null, $db->error);
}

sendResponse(false, null, 'Invalid action');
