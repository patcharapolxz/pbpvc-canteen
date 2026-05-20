<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

setCorsHeaders();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET all users (Admin)
if ($method === 'GET' && $action === 'users') {
    $result = $db->query("SELECT id, password, name, nickname, phone, role, shop_name, email FROM users ORDER BY role, name");
    $users  = [];
    while ($r = $result->fetch_assoc()) {
        $users[] = [
            'id'    => $r['id'],
            'pwd'   => $r['password'],
            'name'  => $r['name'],
            'nick'  => $r['nickname'],
            'phone' => $r['phone'],
            'role'  => $r['role'],
            'shop'  => $r['shop_name'],
            'email' => $r['email'],
        ];
    }
    sendResponse(true, $users);
}

// POST save user (create or update)
if ($method === 'POST' && $action === 'save-user') {
    $body = getBody();
    $id   = trim($body['id'] ?? '');

    // Check exists
    $chk = $db->prepare("SELECT id FROM users WHERE id = ? LIMIT 1");
    $chk->bind_param('s', $id);
    $chk->execute();

    if ($chk->get_result()->num_rows > 0) {
        // Update
        $stmt = $db->prepare("UPDATE users SET password=?, name=?, nickname=?, phone=?, role=?, shop_name=?, email=? WHERE id=?");
        $stmt->bind_param('ssssssss', $body['pwd'], $body['name'], $body['nick'], $body['phone'], $body['role'], $body['shop'], $body['email'], $id);
    } else {
        // Insert
        $stmt = $db->prepare("INSERT INTO users (id, password, name, nickname, phone, role, shop_name, email) VALUES (?,?,?,?,?,?,?,?)");
        $stmt->bind_param('ssssssss', $id, $body['pwd'], $body['name'], $body['nick'], $body['phone'], $body['role'], $body['shop'], $body['email']);
    }
    if ($stmt->execute()) sendResponse(true, 'Saved');
    sendResponse(false, null, $db->error);
}

// DELETE user
if ($method === 'DELETE' && $action === 'delete-user') {
    $id   = $_GET['id'] ?? '';
    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param('s', $id);
    $stmt->execute();
    sendResponse(true, 'Deleted');
}

// GET stats
if ($method === 'GET' && $action === 'stats') {
    $result = $db->query("
        SELECT shop_name, SUM(total) as revenue, COUNT(*) as orders
        FROM orders WHERE status != 'Cancelled'
        GROUP BY shop_name ORDER BY revenue DESC
    ");
    $shops = [];
    $total = 0;
    while ($r = $result->fetch_assoc()) {
        $shops[] = ['shop' => $r['shop_name'], 'revenue' => (float)$r['revenue'], 'orders' => (int)$r['orders']];
        $total  += $r['revenue'];
    }

    $userCount  = $db->query("SELECT COUNT(*) as c FROM users WHERE role='Student'")->fetch_assoc()['c'];
    $orderCount = $db->query("SELECT COUNT(*) as c FROM orders WHERE status != 'Cancelled'")->fetch_assoc()['c'];

    sendResponse(true, ['total' => $total, 'shops' => $shops, 'users' => (int)$userCount, 'orders' => (int)$orderCount]);
}

sendResponse(false, null, 'Invalid action');
