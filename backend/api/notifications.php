<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

setCorsHeaders();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET notifications
if ($method === 'GET' && $action === 'get') {
    $userId = $_GET['userId'] ?? '';
    $stmt   = $db->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
    $stmt->bind_param('s', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $notifs = [];
    while ($r = $result->fetch_assoc()) {
        $notifs[] = [
            'id'      => $r['id'],
            'title'   => $r['title'],
            'message' => $r['message'],
            'time'    => $r['created_at'],
            'read'    => (bool)$r['is_read'],
        ];
    }
    sendResponse(true, $notifs);
}

// PUT mark as read
if ($method === 'PUT' && $action === 'mark-read') {
    $body   = getBody();
    $userId = $body['userId'] ?? '';
    $stmt   = $db->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
    $stmt->bind_param('s', $userId);
    $stmt->execute();
    sendResponse(true, 'Marked');
}

sendResponse(false, null, 'Invalid action');
