<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

setCorsHeaders();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET /api/menu.php?action=get&shop=xxx
if ($method === 'GET' && $action === 'get') {
    $shop = trim($_GET['shop'] ?? '');
    $stmt = $db->prepare("SELECT * FROM menu WHERE shop_name = ? ORDER BY id");
    $stmt->bind_param('s', $shop);
    $stmt->execute();
    $result = $stmt->get_result();
    $items  = [];
    while ($r = $result->fetch_assoc()) {
        $items[] = [
            'id'        => $r['id'],
            'name'      => $r['name'],
            'price'     => (float)$r['price'],
            'cat'       => $r['category'],
            'img'       => $r['image'] ?: '',
            'status'    => $r['status'],
            'options'   => $r['options'] ? json_decode($r['options'], true) : [],
            'recommend' => (bool)$r['is_recommend'],
        ];
    }
    sendResponse(true, $items);
}

// POST /api/menu.php?action=save  (create or update)
if ($method === 'POST' && $action === 'save') {
    $body    = getBody();
    $id      = trim($body['id'] ?? '');
    $options = json_encode($body['options'] ?? []);
    $rec     = $body['recommend'] ? 1 : 0;
    $img     = trim($body['img'] ?? '');

    if ($id) {
        // Update
        $stmt = $db->prepare("UPDATE menu SET name=?, price=?, category=?, image=?, status=?, options=?, is_recommend=? WHERE id=?");
        $stmt->bind_param('sdssssds', $body['name'], $body['price'], $body['cat'], $img, $body['status'], $options, $rec, $id);
    } else {
        // Insert
        $newId = 'M' . time() . rand(100, 999);
        $stmt  = $db->prepare("INSERT INTO menu (id, name, price, category, image, status, shop_name, options, is_recommend) VALUES (?,?,?,?,?,?,?,?,?)");
        $stmt->bind_param('ssdsssssi', $newId, $body['name'], $body['price'], $body['cat'], $img, $body['status'] ?? 'Available', $body['shop'], $options, $rec);
    }
    if ($stmt->execute()) sendResponse(true, 'Saved');
    sendResponse(false, null, $db->error);
}

// DELETE /api/menu.php?action=delete&id=xxx
if ($method === 'DELETE' && $action === 'delete') {
    $id   = trim($_GET['id'] ?? '');
    $stmt = $db->prepare("DELETE FROM menu WHERE id = ?");
    $stmt->bind_param('s', $id);
    $stmt->execute();
    sendResponse(true, 'Deleted');
}

sendResponse(false, null, 'Invalid action');
