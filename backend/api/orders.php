<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

setCorsHeaders();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ----------------------------------------------------------
// GET orders
// ----------------------------------------------------------
if ($method === 'GET' && $action === 'get') {
    $role   = $_GET['role']   ?? '';
    $userId = $_GET['userId'] ?? '';

    // User map
    $userMap = [];
    $ur = $db->query("SELECT id, name, nickname, phone FROM users");
    while ($u = $ur->fetch_assoc()) {
        $userMap[$u['id']] = ['name' => $u['name'], 'nick' => $u['nickname'], 'phone' => $u['phone']];
    }

    // Review map
    $reviewMap = [];
    $rr = $db->query("SELECT order_id, rating, comment FROM reviews");
    while ($r = $rr->fetch_assoc()) {
        $reviewMap[$r['order_id']] = ['rating' => $r['rating'], 'comment' => $r['comment']];
    }

    // Get shop of merchant
    $myShop = '';
    if ($role === 'Merchant') {
        $s = $db->prepare("SELECT shop_name FROM users WHERE id = ? LIMIT 1");
        $s->bind_param('s', $userId);
        $s->execute();
        $sr = $s->get_result()->fetch_assoc();
        $myShop = $sr['shop_name'] ?? '';
    }

    // Build query
    if ($role === 'Student') {
        $stmt = $db->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->bind_param('s', $userId);
    } elseif ($role === 'Merchant') {
        $stmt = $db->prepare("SELECT * FROM orders WHERE shop_name = ? ORDER BY created_at DESC");
        $stmt->bind_param('s', $myShop);
    } else {
        $stmt = $db->prepare("SELECT * FROM orders ORDER BY created_at DESC");
    }
    $stmt->execute();
    $result = $stmt->get_result();
    $orders = [];

    while ($r = $result->fetch_assoc()) {
        $uid  = $r['user_id'];
        $cust = $userMap[$uid] ?? ['name' => 'Unknown', 'nick' => '-', 'phone' => '-'];
        $orders[] = [
            'id'        => $r['id'],
            'userId'    => $uid,
            'custName'  => $cust['name'],
            'custNick'  => $cust['nick'],
            'custPhone' => $cust['phone'],
            'items'     => $r['items'] ? json_decode($r['items'], true) : [],
            'total'     => (float)$r['total'],
            'note'      => $r['note'],
            'status'    => $r['status'],
            'time'      => $r['created_at'],
            'slip'      => $r['slip_url'],
            'shop'      => $r['shop_name'],
            'review'    => $reviewMap[$r['id']] ?? null,
        ];
    }
    sendResponse(true, $orders);
}

// ----------------------------------------------------------
// POST place order
// ----------------------------------------------------------
if ($method === 'POST' && $action === 'place') {
    $body    = getBody();
    $orderId = 'ORD-' . rand(10000, 99999);
    $userId  = trim($body['userId'] ?? '');
    $items   = json_encode($body['items'] ?? []);
    $total   = $body['total'] ?? 0;
    $note    = $body['note'] ?? '';
    $shop    = $body['shop'] ?? '';
    $slip    = $body['slip'] ?? 'เงินสด';

    $stmt = $db->prepare("INSERT INTO orders (id, user_id, items, total, note, status, slip_url, shop_name) VALUES (?,?,?,?,?,'Waiting',?,?)");
    $stmt->bind_param('sssdss s', $orderId, $userId, $items, $total, $note, $slip, $shop);
    // fix bind
    $stmt = $db->prepare("INSERT INTO orders (id, user_id, items, total, note, status, slip_url, shop_name) VALUES (?,?,?,?,?,'Waiting',?,?)");
    $stmt->bind_param('sssdsss', $orderId, $userId, $items, $total, $note, $slip, $shop);

    if (!$stmt->execute()) sendResponse(false, null, $db->error);

    // Notification to merchant
    $merchantStmt = $db->prepare("SELECT id FROM users WHERE role='Merchant' AND shop_name=? LIMIT 1");
    $merchantStmt->bind_param('s', $shop);
    $merchantStmt->execute();
    $merchant = $merchantStmt->get_result()->fetch_assoc();

    if ($merchant) {
        $title   = "🔔 ออเดอร์ใหม่ #{$orderId}";
        $message = "มีออเดอร์ใหม่จากลูกค้า ยอด {$total} บาท";
        $nid     = 'NOT-' . time();
        $ns      = $db->prepare("INSERT INTO notifications (id, user_id, title, message) VALUES (?,?,?,?)");
        $ns->bind_param('ssss', $nid, $merchant['id'], $title, $message);
        $ns->execute();
    }

    // Notification to student
    $nid2   = 'NOT-' . (time() + 1);
    $title2 = "✅ สั่งซื้อสำเร็จ";
    $msg2   = "ออเดอร์ของคุณถูกส่งไปยังร้าน {$shop} แล้ว";
    $ns2    = $db->prepare("INSERT INTO notifications (id, user_id, title, message) VALUES (?,?,?,?)");
    $ns2->bind_param('ssss', $nid2, $userId, $title2, $msg2);
    $ns2->execute();

    sendResponse(true, ['orderId' => $orderId]);
}

// ----------------------------------------------------------
// PUT update status
// ----------------------------------------------------------
if ($method === 'PUT' && $action === 'update-status') {
    $body    = getBody();
    $orderId = $body['orderId'] ?? '';
    $status  = $body['status'] ?? '';

    $stmt = $db->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->bind_param('ss', $status, $orderId);
    $stmt->execute();

    // Notify student
    $os = $db->prepare("SELECT user_id, shop_name FROM orders WHERE id = ? LIMIT 1");
    $os->bind_param('s', $orderId);
    $os->execute();
    $order = $os->get_result()->fetch_assoc();

    if ($order) {
        $uid      = $order['user_id'];
        $shopName = $order['shop_name'];
        $titles   = ['Ready' => '✅ อาหารเสร็จแล้ว!', 'Cancelled' => '❌ ออเดอร์ถูกยกเลิก', 'Completed' => '🎉 ออเดอร์สำเร็จ'];
        $msgs     = [
            'Ready'     => "เมนูจากร้าน {$shopName} ทำเสร็จแล้ว กรุณามารับที่ร้าน",
            'Cancelled' => "ออเดอร์จากร้าน {$shopName} ถูกยกเลิก",
            'Completed' => "ขอบคุณที่ใช้บริการร้าน {$shopName}",
        ];
        if (isset($titles[$status])) {
            $nid  = 'NOT-' . time();
            $t    = $titles[$status];
            $m    = $msgs[$status];
            $ns   = $db->prepare("INSERT INTO notifications (id, user_id, title, message) VALUES (?,?,?,?)");
            $ns->bind_param('ssss', $nid, $uid, $t, $m);
            $ns->execute();
        }
    }
    sendResponse(true, 'Updated');
}

// ----------------------------------------------------------
// DELETE cancel order
// ----------------------------------------------------------
if ($method === 'DELETE' && $action === 'cancel') {
    $orderId = $_GET['orderId'] ?? '';
    $stmt    = $db->prepare("UPDATE orders SET status = 'Cancelled' WHERE id = ? AND status NOT IN ('Completed','Cancelled')");
    $stmt->bind_param('s', $orderId);
    $stmt->execute();
    sendResponse(true, 'Cancelled');
}

sendResponse(false, null, 'Invalid action');
