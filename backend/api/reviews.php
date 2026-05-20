<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

setCorsHeaders();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// POST submit review
if ($method === 'POST' && $action === 'submit') {
    $body    = getBody();
    $orderId = $body['orderId'] ?? '';

    // Check duplicate
    $chk = $db->prepare("SELECT id FROM reviews WHERE order_id = ? LIMIT 1");
    $chk->bind_param('s', $orderId);
    $chk->execute();
    if ($chk->get_result()->num_rows > 0) sendResponse(false, null, 'คุณรีวิวออเดอร์นี้ไปแล้ว');

    $rid    = 'REV-' . time();
    $shop   = $body['shop'] ?? '';
    $userId = $body['userId'] ?? '';
    $rating = (int)($body['rating'] ?? 5);
    $comment = $body['comment'] ?? '';

    $stmt = $db->prepare("INSERT INTO reviews (id, order_id, shop_name, user_id, rating, comment) VALUES (?,?,?,?,?,?)");
    $stmt->bind_param('ssssds', $rid, $orderId, $shop, $userId, $rating, $comment);
    if ($stmt->execute()) sendResponse(true, 'ขอบคุณสำหรับการรีวิว!');
    sendResponse(false, null, $db->error);
}

// GET reviews for a shop
if ($method === 'GET' && $action === 'get') {
    $shop = $_GET['shop'] ?? '';
    $stmt = $db->prepare("SELECT r.*, u.name, u.nickname FROM reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.shop_name = ? ORDER BY r.created_at DESC");
    $stmt->bind_param('s', $shop);
    $stmt->execute();
    $result  = $stmt->get_result();
    $reviews = [];
    while ($r = $result->fetch_assoc()) {
        $reviews[] = [
            'id'      => $r['id'],
            'rating'  => (int)$r['rating'],
            'comment' => $r['comment'],
            'name'    => $r['name'] ?: 'ผู้ใช้งาน',
            'nick'    => $r['nickname'] ?: '-',
            'time'    => $r['created_at'],
        ];
    }
    sendResponse(true, $reviews);
}

sendResponse(false, null, 'Invalid action');
