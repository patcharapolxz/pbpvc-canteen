<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

setCorsHeaders();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET latest active news
if ($method === 'GET' && $action === 'get') {
    $result = $db->query("SELECT message FROM news WHERE status = 'Active' ORDER BY created_at DESC LIMIT 1");
    $row    = $result->fetch_assoc();
    sendResponse(true, $row['message'] ?? '');
}

// POST add news (Admin)
if ($method === 'POST' && $action === 'post') {
    $body = getBody();
    $msg  = $body['msg'] ?? '';
    $id   = 'N' . time();
    $stmt = $db->prepare("INSERT INTO news (id, message, status) VALUES (?, ?, 'Active')");
    $stmt->bind_param('ss', $id, $msg);
    $stmt->execute();
    sendResponse(true, 'Posted');
}

// DELETE clear all news
if ($method === 'DELETE' && $action === 'clear') {
    $db->query("UPDATE news SET status = 'Inactive'");
    sendResponse(true, 'Cleared');
}

sendResponse(false, null, 'Invalid action');
