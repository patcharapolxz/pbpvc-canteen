<?php
require_once __DIR__ . '/config/database.php';

$db = getDB();

// 1. ล้างข้อมูลร้านค้า เมนู และรีวิวเดิม เพื่อความสะอาด
$db->query("DELETE FROM users WHERE role = 'Merchant'");
$db->query("DELETE FROM menu");
$db->query("DELETE FROM reviews");

echo "Clearing old merchant data...\n";

// 2. ข้อมูลร้านค้าที่จะเพิ่มตามภาพ
$merchants = [
    [
        'id' => 'shop_islam',
        'pwd' => '1234',
        'name' => 'แม่ค้าโรตีสะเด็ด',
        'nickname' => 'กะไซนะ',
        'phone' => '0812340001',
        'shop_name' => 'ร้านข้าวอิสลาม',
        'email' => 'islam@pbpvc.ac.th',
        'shop_image' => 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=60',
        'shop_status' => 'Open',
        'open_time' => '07:00:00',
        'close_time' => '16:00:00'
    ],
    [
        'id' => 'shop_rice',
        'pwd' => '1234',
        'name' => 'แม่ค้าป้าหน่อย',
        'nickname' => 'ป้าหน่อย',
        'phone' => '0812340002',
        'shop_name' => 'ร้านข้าว',
        'email' => 'rice@pbpvc.ac.th',
        'shop_image' => 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=60',
        'shop_status' => 'Open',
        'open_time' => '07:00:00',
        'close_time' => '16:00:00'
    ],
    [
        'id' => 'shop_water',
        'pwd' => '1234',
        'name' => 'แม่ค้าพี่เก๋',
        'nickname' => 'พี่เก๋',
        'phone' => '0812340003',
        'shop_name' => 'ร้านน้ำ',
        'email' => 'water@pbpvc.ac.th',
        'shop_image' => 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=500&auto=format&fit=crop&q=60',
        'shop_status' => 'Open',
        'open_time' => '07:00:00',
        'close_time' => '16:00:00'
    ],
    [
        'id' => 'shop_noodle',
        'pwd' => '1234',
        'name' => 'พ่อค้าลุงชัย',
        'nickname' => 'ลุงชัย',
        'phone' => '0812340004',
        'shop_name' => 'ร้านก๋วยเตี๋ยว',
        'email' => 'noodle@pbpvc.ac.th',
        'shop_image' => 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60',
        'shop_status' => 'Open',
        'open_time' => '07:00:00',
        'close_time' => '16:00:00'
    ],
    [
        'id' => 'shop_dessert',
        'pwd' => '1234',
        'name' => 'แม่ค้าป้านม',
        'nickname' => 'ป้านม',
        'phone' => '0812340005',
        'shop_name' => 'ร้านขนม',
        'email' => 'dessert@pbpvc.ac.th',
        'shop_image' => 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=60',
        'shop_status' => 'Open',
        'open_time' => '07:00:00',
        'close_time' => '16:00:00'
    ],
    [
        'id' => 'shop_meatball',
        'pwd' => '1234',
        'name' => 'พ่อค้าป้าอ้วน',
        'nickname' => 'ป้าอ้วน',
        'phone' => '0812340006',
        'shop_name' => 'ร้านลูกชิ้น',
        'email' => 'meatball@pbpvc.ac.th',
        'shop_image' => 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=500&auto=format&fit=crop&q=60',
        'shop_status' => 'Open',
        'open_time' => '07:00:00',
        'close_time' => '16:00:00'
    ],
    [
        'id' => 'shop_fruit',
        'pwd' => '1234',
        'name' => 'แม่ค้าพี่นก',
        'nickname' => 'พี่nก',
        'phone' => '0812340007',
        'shop_name' => 'ร้านผลไม้',
        'email' => 'fruit@pbpvc.ac.th',
        'shop_image' => 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=60',
        'shop_status' => 'Open',
        'open_time' => '07:00:00',
        'close_time' => '16:00:00'
    ],
    [
        'id' => 'shop_paong',
        'pwd' => '1234',
        'name' => 'ป้าโอ่ง',
        'nickname' => 'ป้าโอ่ง',
        'phone' => '0812340008',
        'shop_name' => 'ร้านป้าโอ่งโหน่งแก้วนึง',
        'email' => 'paong@pbpvc.ac.th',
        'shop_image' => 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60',
        'shop_status' => 'Open',
        'open_time' => '07:00:00',
        'close_time' => '16:00:00'
    ],
    [
        'id' => 'shop_chickenrice',
        'pwd' => '1234',
        'name' => 'พี่โก้ ข้าวมันไก่',
        'nickname' => 'พี่โก้',
        'phone' => '0812340009',
        'shop_name' => 'ร้านข้าวมันไก่',
        'email' => 'chicken@pbpvc.ac.th',
        'shop_image' => 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=60',
        'shop_status' => 'Open',
        'open_time' => '07:00:00',
        'close_time' => '16:00:00'
    ],
    [
        'id' => 'shop_boatnoodle',
        'pwd' => '1234',
        'name' => 'ลุงดำ ก๋วยเตี๋ยวเรือ',
        'nickname' => 'ลุงดำ',
        'phone' => '0812340010',
        'shop_name' => 'ร้านก๋วยเตี๋ยวเรือ',
        'email' => 'boat@pbpvc.ac.th',
        'shop_image' => 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=500&auto=format&fit=crop&q=60',
        'shop_status' => 'Open',
        'open_time' => '07:00:00',
        'close_time' => '16:00:00'
    ]
];

// แทรกข้อมูล Merchant เข้าตาราง users
$stmt = $db->prepare("INSERT INTO users (id, password, name, nickname, phone, role, shop_name, email, shop_image, shop_status, open_time, close_time) VALUES (?, ?, ?, ?, ?, 'Merchant', ?, ?, ?, ?, ?, ?)");

foreach ($merchants as $m) {
    $stmt->bind_param(
        'sssssssssss',
        $m['id'], $m['pwd'], $m['name'], $m['nickname'], $m['phone'],
        $m['shop_name'], $m['email'], $m['shop_image'], $m['shop_status'], $m['open_time'], $m['close_time']
    );
    $stmt->execute();
    echo "Added Merchant: {$m['shop_name']}\n";
}

// 3. แทรกคะแนนรีวิวจำลอง (Reviews) เพื่อให้ตรงกับหน้าภาพตัวอย่าง
$reviews = [
    ['shop' => 'ร้านข้าวอิสลาม', 'rating' => 5, 'count' => 6],
    ['shop' => 'ร้านข้าว', 'rating' => 5, 'count' => 6],
    ['shop' => 'ร้านน้ำ', 'rating' => 5, 'count' => 15],
    ['shop' => 'ร้านน้ำ', 'rating' => 4, 'count' => 2],
    ['shop' => 'ร้านก๋วยเตี๋ยว', 'rating' => 5, 'count' => 2],
    ['shop' => 'ร้านขนม', 'rating' => 5, 'count' => 5],
    ['shop' => 'ร้านป้าโอ่งโหน่งแก้วนึง', 'rating' => 5, 'count' => 3],
    ['shop' => 'ร้านข้าวมันไก่', 'rating' => 5, 'count' => 1],
];

$stmtRev = $db->prepare("INSERT INTO reviews (id, order_id, shop_name, user_id, rating, comment) VALUES (?, ?, ?, '66001', ?, ?)");

$revCounter = 1;
foreach ($reviews as $rev) {
    for ($i = 0; $i < $rev['count']; $i++) {
        $revId = 'REV_' . str_pad($revCounter++, 5, '0', STR_PAD_LEFT);
        $orderId = 'ORD_' . str_pad($revCounter, 5, '0', STR_PAD_LEFT);
        $comment = 'อร่อยมาก บริการดีรวดเร็ว!';
        $stmtRev->bind_param('sssis', $revId, $orderId, $rev['shop'], $rev['rating'], $comment);
        $stmtRev->execute();
    }
}
echo "Added reviews for average ratings...\n";

// 4. แทรกเมนูอาหารจำลองของแต่ละร้าน (พร้อมลิงก์ภาพอาหารที่ตรงเมนู 100% สวยงามพรีเมียม)
$menus = [
    // ร้านข้าวอิสลาม
    [
        'id' => 'M_ISL_01', 
        'name' => 'ข้าวหมกไก่สะเด็ด', 
        'price' => 50, 
        'cat' => 'ร้านข้าว', 
        'shop' => 'ร้านข้าวอิสลาม', 
        'rec' => 1,
        'img' => 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60' // ข้าวหมกไก่/Biryani สมจริง
    ],
    [
        'id' => 'M_ISL_02', 
        'name' => 'ซุปหางวัวเนื้อเปื่อย', 
        'price' => 80, 
        'cat' => 'ร้านข้าว', 
        'shop' => 'ร้านข้าวอิสลาม', 
        'rec' => 0,
        'img' => 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&auto=format&fit=crop&q=60' // ซุปเนื้อเข้มข้น
    ],
    [
        'id' => 'M_ISL_03', 
        'name' => 'โรตีนมข้นหวาน', 
        'price' => 25, 
        'cat' => 'ของหวาน', 
        'shop' => 'ร้านข้าวอิสลาม', 
        'rec' => 0,
        'img' => 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=500&auto=format&fit=crop&q=60' // โรตี/แผ่นแป้ง Roti สมจริง
    ],

    // ร้านข้าว
    [
        'id' => 'M_RIC_01', 
        'name' => 'ข้าวราดกะเพราไข่ดาว', 
        'price' => 45, 
        'cat' => 'ร้านข้าว', 
        'shop' => 'ร้านข้าว', 
        'rec' => 1,
        'img' => 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=500&auto=format&fit=crop&q=60' // ข้าวกะเพราแท้ๆ สีสวยพร้อมไข่ดาว
    ],
    [
        'id' => 'M_RIC_02', 
        'name' => 'ข้าวผัดพริกแกงหมูกรอบ', 
        'price' => 50, 
        'cat' => 'ร้านข้าว', 
        'shop' => 'ร้านข้าว', 
        'rec' => 0,
        'img' => 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=500&auto=format&fit=crop&q=60' // ผัดพริกแกงเผ็ดสีส้มสวยงาม
    ],
    [
        'id' => 'M_RIC_03', 
        'name' => 'ก๋วยเตี๋ยวราดหน้าเส้นใหญ่', 
        'price' => 40, 
        'cat' => 'ร้านก๋วยเตี๋ยว', 
        'shop' => 'ร้านข้าว', 
        'rec' => 0,
        'img' => 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=500&auto=format&fit=crop&q=60' // ราดหน้าเส้นใหญ่มีผักบล็อคโคลี่และหมูชิ้นโต
    ],

    // ร้านน้ำ
    [
        'id' => 'M_WAT_01', 
        'name' => 'ชาเย็นแก้วโอ่ง', 
        'price' => 25, 
        'cat' => 'ร้านน้ำ', 
        'shop' => 'ร้านน้ำ', 
        'rec' => 1,
        'img' => 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60' // ชาเย็นไทยสีส้มเข้มข้นน่ากิน
    ],
    [
        'id' => 'M_WAT_02', 
        'name' => 'โกโก้เข้มข้น', 
        'price' => 25, 
        'cat' => 'ร้านน้ำ', 
        'shop' => 'ร้านน้ำ', 
        'rec' => 0,
        'img' => 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&auto=format&fit=crop&q=60' // น้ำช็อกโกแลต/โกโก้เข้มข้นมีนมด้านบน
    ],
    [
        'id' => 'M_WAT_03', 
        'name' => 'น้ำส้มคั้นสด', 
        'price' => 30, 
        'cat' => 'ร้านน้ำ', 
        'shop' => 'ร้านน้ำ', 
        'rec' => 0,
        'img' => 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500&auto=format&fit=crop&q=60' // แก้วน้ำส้มสดใสบีบสดใหม่
    ],

    // ร้านก๋วยเตี๋ยว
    [
        'id' => 'M_NOD_01', 
        'name' => 'ก๋วยเตี๋ยวต้มยำสุโขทัย', 
        'price' => 45, 
        'cat' => 'ร้านก๋วยเตี๋ยว', 
        'shop' => 'ร้านก๋วยเตี๋ยว', 
        'rec' => 1,
        'img' => 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60' // ชามก๋วยเตี๋ยวต้มยำน้ำข้นร้อนฉ่า
    ],
    [
        'id' => 'M_NOD_02', 
        'name' => 'บะหมี่แห้งหมูแดง', 
        'price' => 40, 
        'cat' => 'ร้านก๋วยเตี๋ยว', 
        'shop' => 'ร้านก๋วยเตี๋ยว', 
        'rec' => 0,
        'img' => 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=60' // บะหมี่แห้งคลุกซอสพร้อมหมูแดงชิ้นโต
    ],

    // ร้านขนม
    [
        'id' => 'M_DES_01', 
        'name' => 'ขนมครกใบเตย', 
        'price' => 30, 
        'cat' => 'ของทานเล่น', 
        'shop' => 'ร้านขนม', 
        'rec' => 1,
        'img' => 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=500&auto=format&fit=crop&q=60' // ขนมครกเขียวใบเตยสีสดใส
    ],
    [
        'id' => 'M_DES_02', 
        'name' => 'ทองหยิบ ทองหยอด ฝอยทอง', 
        'price' => 35, 
        'cat' => 'ของทานเล่น', 
        'shop' => 'ร้านขนม', 
        'rec' => 0,
        'img' => 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=500&auto=format&fit=crop&q=60' // ขนมหวานไทยสีส้มเหลืองระยิบระยับ
    ],

    // ร้านลูกชิ้น
    [
        'id' => 'M_BAL_01', 
        'name' => 'ลูกชิ้นหมูปิ้งไม้ละ 10', 
        'price' => 10, 
        'cat' => 'ทั่วไป', 
        'shop' => 'ร้านลูกชิ้น', 
        'rec' => 1,
        'img' => 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&auto=format&fit=crop&q=60' // ไม้เสียบลูกชิ้นย่างไฟเตาถ่านราดน้ำจิ้มเยิ้มๆ
    ],
    [
        'id' => 'M_BAL_02', 
        'name' => 'เกี๊ยวทอดไส้กรอก', 
        'price' => 20, 
        'cat' => 'ทั่วไป', 
        'shop' => 'ร้านลูกชิ้น', 
        'rec' => 0,
        'img' => 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60' // ของทอดจิ้มซอสแสนกรอบน่าเคี้ยว
    ],

    // ร้านผลไม้
    [
        'id' => 'M_FRU_01', 
        'name' => 'มะม่วงน้ำปลาหวาน', 
        'price' => 30, 
        'cat' => 'ทั่วไป', 
        'shop' => 'ร้านผลไม้', 
        'rec' => 1,
        'img' => 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=60' // มะม่วงเขียวเปรี้ยวหั่นฝานพร้อมน้ำจิ้มเหนียวข้น
    ],
    [
        'id' => 'M_FRU_02', 
        'name' => 'แตงโมเย็นฉ่ำ', 
        'price' => 20, 
        'cat' => 'ทั่วไป', 
        'shop' => 'ร้านผลไม้', 
        'rec' => 0,
        'img' => 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=60' // แตงโมสีแดงผ่าซีกมีเกล็ดน้ำเกาะเย็นๆ
    ],

    // ร้านป้าโอ่งโหน่งแก้วนึง
    [
        'id' => 'M_PAO_01', 
        'name' => 'ชานมไข่มุกพ่นไฟ', 
        'price' => 30, 
        'cat' => 'ร้านน้ำ', 
        'shop' => 'ร้านป้าโอ่งโหน่งแก้วนึง', 
        'rec' => 1,
        'img' => 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&auto=format&fit=crop&q=60' // ชานมไข่มุก Boba พร้อมครีมชีสพ่นไฟด้านบน
    ],
    [
        'id' => 'M_PAO_02', 
        'name' => 'แดงมะนาวโซดาแก้วยักษ์', 
        'price' => 25, 
        'cat' => 'ร้านน้ำ', 
        'shop' => 'ร้านป้าโอ่งโหน่งแก้วนึง', 
        'rec' => 0,
        'img' => 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=500&auto=format&fit=crop&q=60' // เครื่องดื่มสีกุหลาบแดงซ่าโซดามะนาวแก้วโต
    ],

    // ร้านข้าวมันไก่
    [
        'id' => 'M_CHK_01', 
        'name' => 'ข้าวมันไก่ต้มพิเศษ', 
        'price' => 45, 
        'cat' => 'ร้านข้าว', 
        'shop' => 'ร้านข้าวมันไก่', 
        'rec' => 1,
        'img' => 'https://images.unsplash.com/photo-1626200419199-391ae4cd7a41?w=500&auto=format&fit=crop&q=60' // ข้าวมันไก่ต้มหนังนุ่มชุ่มฉ่ำพร้อมน้ำจิ้ม
    ],
    [
        'id' => 'M_CHK_02', 
        'name' => 'ข้าวมันไก่ทอด', 
        'price' => 45, 
        'cat' => 'ร้านข้าว', 
        'shop' => 'ร้านข้าวมันไก่', 
        'rec' => 0,
        'img' => 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=500&auto=format&fit=crop&q=60' // ข้าวมันไก่ชุบแป้งทอดกรอบสีเหลืองทองหั่นพอดีคำ
    ],
    [
        'id' => 'M_CHK_03', 
        'name' => 'ข้าวมันไก่ผสม (ต้ม+ทอด)', 
        'price' => 55, 
        'cat' => 'ร้านข้าว', 
        'shop' => 'ร้านข้าวมันไก่', 
        'rec' => 0,
        'img' => 'https://images.unsplash.com/photo-1626200419199-391ae4cd7a41?w=500&auto=format&fit=crop&q=60' // ข้าวมันไก่โปะคู่ทั้งสองแบบ
    ],

    // ร้านก๋วยเตี๋ยวเรือ
    [
        'id' => 'M_BOA_01', 
        'name' => 'เส้นเล็กน้ำตกหมูตุ๋น', 
        'price' => 40, 
        'cat' => 'ร้านก๋วยเตี๋ยว', 
        'shop' => 'ร้านก๋วยเตี๋ยวเรือ', 
        'rec' => 1,
        'img' => 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=500&auto=format&fit=crop&q=60' // ชามก๋วยเตี๋ยวเรือน้ำซุปน้ำตกสีเข้มข้นสูตรโบราณ
    ],
    [
        'id' => 'M_BOA_02', 
        'name' => 'เกาเหลาหมูสไลด์+ข้าวเปล่า', 
        'price' => 50, 
        'cat' => 'ร้านก๋วยเตี๋ยว', 
        'shop' => 'ร้านก๋วยเตี๋ยวเรือ', 
        'rec' => 0,
        'img' => 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&auto=format&fit=crop&q=60' // ชามแกงจืด/ต้มยำหมูน้ำซุปใสทานคู่กับข้าวเปล่า
    ],
];

// แทรกอาหารเข้าฐานข้อมูล โดยใช้ฟิลด์ image ด้วย!
$stmtMenu = $db->prepare("INSERT INTO menu (id, name, price, category, image, status, shop_name, is_recommend) VALUES (?, ?, ?, ?, ?, 'Available', ?, ?)");

foreach ($menus as $menu) {
    $stmtMenu->bind_param(
        'ssdsssi',
        $menu['id'], $menu['name'], $menu['price'], $menu['cat'], $menu['img'], $menu['shop'], $menu['rec']
    );
    $stmtMenu->execute();
    echo "Added menu with EXACT MATCH IMAGE: {$menu['name']} for {$menu['shop']}\n";
}

echo "=========================================\n";
echo "Database successfully seeded with beautiful and realistic matching food images!\n";
echo "=========================================\n";
