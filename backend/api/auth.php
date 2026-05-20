<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

setCorsHeaders();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// POST /api/auth.php?action=login
if ($method === 'POST' && $action === 'login') {
    $body = getBody();
    $id   = trim($body['id'] ?? '');
    $pwd  = trim($body['pwd'] ?? '');

    if (!$id || !$pwd) sendResponse(false, null, 'กรุณากรอก ID และรหัสผ่าน');

    $stmt = $db->prepare("SELECT * FROM users WHERE id = ? AND password = ? LIMIT 1");
    $stmt->bind_param('ss', $id, $pwd);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();

    if ($result) {
        sendResponse(true, [
            'id'    => $result['id'],
            'name'  => $result['name'],
            'nick'  => $result['nickname'],
            'phone' => $result['phone'],
            'role'  => $result['role'],
            'shop'  => $result['shop_name'],
            'email' => $result['email'],
        ]);
    }
    sendResponse(false, null, 'ID หรือรหัสผ่านไม่ถูกต้อง');
}

// POST /api/auth.php?action=register
if ($method === 'POST' && $action === 'register') {
    $body = getBody();
    $id   = trim($body['id'] ?? '');
    $pwd  = trim($body['pwd'] ?? '');
    $name = trim($body['name'] ?? '');
    $nick = trim($body['nick'] ?? '');
    $phone = trim($body['phone'] ?? '');
    $email = trim($body['email'] ?? '');

    if (!$id || !$pwd || !$name) sendResponse(false, null, 'กรุณากรอกข้อมูลให้ครบ');

    // Check duplicate
    $check = $db->prepare("SELECT id FROM users WHERE id = ? LIMIT 1");
    $check->bind_param('s', $id);
    $check->execute();
    if ($check->get_result()->num_rows > 0) sendResponse(false, null, 'ID นี้ถูกใช้แล้ว');

    $stmt = $db->prepare("INSERT INTO users (id, password, name, nickname, phone, role, email) VALUES (?, ?, ?, ?, ?, 'Student', ?)");
    $stmt->bind_param('ssssss', $id, $pwd, $name, $nick, $phone, $email);
    if ($stmt->execute()) sendResponse(true, null, 'สมัครสมาชิกสำเร็จ');
    sendResponse(false, null, 'เกิดข้อผิดพลาด');
}

// POST /api/auth.php?action=forgot-password
if ($method === 'POST' && $action === 'forgot-password') {
    $body  = getBody();
    $id    = trim($body['id'] ?? '');
    $phone = trim($body['phone'] ?? '');

    $stmt = $db->prepare("SELECT password FROM users WHERE id = ? AND phone = ? LIMIT 1");
    $stmt->bind_param('ss', $id, $phone);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if ($row) sendResponse(true, ['pwd' => $row['password']]);
    sendResponse(false, null, 'ไม่พบข้อมูล หรือเบอร์โทรไม่ถูกต้อง');
}

sendResponse(false, null, 'Invalid action');
