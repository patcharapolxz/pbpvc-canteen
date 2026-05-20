<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

setCorsHeaders();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET /api/shops.php?action=list
if ($method === 'GET' && $action === 'list') {
    // 1. ดึงคะแนนรีวิวเฉลี่ย
    $ratingsResult = $db->query("
        SELECT shop_name, AVG(rating) as avg_rating, COUNT(*) as review_count
        FROM reviews GROUP BY shop_name
    ");
    $ratings = [];
    while ($r = $ratingsResult->fetch_assoc()) {
        $ratings[$r['shop_name']] = ['avg' => round($r['avg_rating'], 1), 'count' => $r['review_count']];
    }

    // 2. ดึงหมวดหมู่จากเมนู
    $menuResult = $db->query("
        SELECT shop_name, GROUP_CONCAT(DISTINCT category SEPARATOR ', ') as cats,
               GROUP_CONCAT(name SEPARATOR ' ') as menu_search
        FROM menu WHERE status != 'Hidden'
        GROUP BY shop_name
    ");
    $shopMeta = [];
    while ($r = $menuResult->fetch_assoc()) {
        $shopMeta[$r['shop_name']] = [
            'tags'        => $r['cats'] ?: 'ทั่วไป',
            'menuSearch'  => $r['menu_search'] ?: '',
        ];
    }

    // 3. ดึงข้อมูลร้านค้า
    date_default_timezone_set('Asia/Bangkok');
    $now     = date('H:i:s');
    $shops   = [];
    $result  = $db->query("SELECT * FROM users WHERE role = 'Merchant' AND shop_name != '' AND shop_name IS NOT NULL");

    while ($r = $result->fetch_assoc()) {
        $shopName   = $r['shop_name'];
        $manualStat = $r['shop_status'] ?: 'Open';

        // คำนวณเวลาเปิด-ปิด
        $isTimeOpen = true;
        if ($r['open_time'] && $r['close_time']) {
            $isTimeOpen = ($now >= $r['open_time'] && $now < $r['close_time']);
        }
        $isOpen = ($manualStat === 'Open' && $isTimeOpen);

        $rv = $ratings[$shopName] ?? ['avg' => '0.0', 'count' => 0];
        $mt = $shopMeta[$shopName] ?? ['tags' => 'ทั่วไป', 'menuSearch' => ''];

        $shops[] = [
            'name'       => $shopName,
            'img'        => $r['shop_image'] ?: '',
            'rating'     => $rv['avg'],
            'reviews'    => (int)$rv['count'],
            'tags'       => $mt['tags'],
            'menuSearch' => $mt['menuSearch'],
            'isOpen'     => $isOpen,
        ];
    }
    sendResponse(true, $shops);
}

// GET /api/shops.php?action=profile&uid=xxx
if ($method === 'GET' && $action === 'profile') {
    $uid  = trim($_GET['uid'] ?? '');
    $stmt = $db->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
    $stmt->bind_param('s', $uid);
    $stmt->execute();
    $r = $stmt->get_result()->fetch_assoc();
    if (!$r) sendResponse(false, null, 'ไม่พบข้อมูล');

    sendResponse(true, [
        'pwd'      => $r['password'],
        'name'     => $r['name'],
        'nick'     => $r['nickname'],
        'email'    => $r['email'],
        'shopName' => $r['shop_name'],
        'img'      => $r['shop_image'] ?: '',
        'open'     => $r['open_time'],
        'close'    => $r['close_time'],
        'status'   => $r['shop_status'],
    ]);
}

// PUT /api/shops.php?action=toggle-status
if ($method === 'PUT' && $action === 'toggle-status') {
    $body   = getBody();
    $uid    = trim($body['uid'] ?? '');
    $isOpen = $body['isOpen'] ?? true;
    $status = $isOpen ? 'Open' : 'Closed';

    $stmt = $db->prepare("UPDATE users SET shop_status = ? WHERE id = ?");
    $stmt->bind_param('ss', $status, $uid);
    $stmt->execute();
    sendResponse(true, $status);
}

// PUT /api/shops.php?action=save-config
if ($method === 'PUT' && $action === 'save-config') {
    $body      = getBody();
    $uid       = trim($body['uid'] ?? '');
    $openTime  = $body['open'] ?? null;
    $closeTime = $body['close'] ?? null;

    $stmt = $db->prepare("UPDATE users SET open_time = ?, close_time = ? WHERE id = ?");
    $stmt->bind_param('sss', $openTime, $closeTime, $uid);
    $stmt->execute();
    sendResponse(true, 'ตั้งเวลาเรียบร้อย');
}

// PUT /api/shops.php?action=save-profile
if ($method === 'PUT' && $action === 'save-profile') {
    $body = getBody();
    $uid  = trim($body['uid'] ?? '');

    $stmt = $db->prepare("UPDATE users SET password=?, name=?, nickname=?, email=?, shop_name=?, open_time=?, close_time=?, shop_status=? WHERE id=?");
    $stmt->bind_param(
        'sssssssss',
        $body['pwd'], $body['name'], $body['nick'], $body['email'],
        $body['shopName'], $body['open'], $body['close'], $body['status'], $uid
    );
    $stmt->execute();
    sendResponse(true, 'บันทึกข้อมูลเรียบร้อย');
}

sendResponse(false, null, 'Invalid action');
