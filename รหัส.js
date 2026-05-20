const ss = SpreadsheetApp.getActiveSpreadsheet();
const FOLDER_ID_FOOD = "13K6QO73DVftA88qUt5TKBRUv0Vm7oG_b"; 
const FOLDER_ID_SLIP = "1pB-aTY4Eyn0FBMhkEYhPD1sZFtU9o_RT";
const FOLDER_ID_SHOP = "1sgmvWMSWLmY_wR4nj9_6HGoW7usE78pz";

const userSheet = ss.getSheetByName("Users");
const menuSheet = ss.getSheetByName("Menu");
const orderSheet = ss.getSheetByName("Orders");
const newsSheet = ss.getSheetByName("News");
const reviewSheet = ss.getSheetByName("Reviews");

function doGet() {
  return HtmlService.createTemplateFromFile('index').evaluate().setTitle('PBPVC Canteen').addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

function saveImageToDrive(base64String, type) {
  try {
    if (!base64String || !base64String.includes("base64,")) return base64String;
    
    let folderId = FOLDER_ID_SLIP;
    if (type === 'food') folderId = FOLDER_ID_FOOD;
    else if (type === 'shop') folderId = FOLDER_ID_SHOP;

    const folder = DriveApp.getFolderById(folderId);
    
    const parts = base64String.split(",");
    const contentType = parts[0].split(":")[1].split(";")[0]; // หาชนิดไฟล์ (png/jpeg)
    const data = parts[1];
    
    const blob = Utilities.newBlob(Utilities.base64Decode(data), contentType, type + "_" + new Date().getTime());
    const file = folder.createFile(blob);
    
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return "https://lh3.googleusercontent.com/d/" + file.getId(); 

  } catch (e) { 
    return ""; 
  }
}
function apiUpdateShopImage(userId, base64) {
  const data = userSheet.getDataRange().getValues();
  const rowIndex = data.findIndex(r => String(r[0]) === String(userId));
  if (rowIndex > 0) {
    const url = saveImageToDrive(base64, 'shop');
    userSheet.getRange(rowIndex + 1, 9).setValue(url); // บันทึกลง Col 9 (ช่อง I)
    return response(true, url);
  }
  return response(false, "User not found");
}
function response(success, data) { return { success: success, data: data, msg: success ? "OK" : data }; }

function sendEmailNotification(to, subject, body) {
  try {
    if (!to || !to.includes("@")) return; // ถ้าไม่มีอีเมลหรือรูปแบบผิด ก็ข้ามไป
    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: body
    });
  } catch (e) {
    console.log("Email Error: " + e.toString());
  }
}

function getUserEmail(userId) {
   const data = userSheet.getDataRange().getValues();
   // 🟢 แก้ไข: ตัดเครื่องหมาย ' ออกทั้งคู่ ก่อนเปรียบเทียบ (Robust Match)
   const cleanId = String(userId).replace(/'/g, "");
   
   const user = data.find(r => String(r[0]).replace(/'/g, "") === cleanId);
   
   if (user) {
       // คืนค่า Col 7 (Email) ถ้ามีข้อมูล
       if(user[7] && String(user[7]).includes("@")) return user[7];
   }
   return null;
}

function getMerchantEmail(shopName) {
   const data = userSheet.getDataRange().getValues();
   // 🟢 แก้ไข: ตัดช่องว่าง (trim) และเปรียบเทียบแบบไม่สนตัวพิมพ์เล็กใหญ่
   const merchant = data.find(r => 
     String(r[6]).trim().toLowerCase() === String(shopName).trim().toLowerCase() && 
     String(r[5]) === 'Merchant'
   );
   if(merchant && merchant[7] && String(merchant[7]).includes("@")) return merchant[7];
   return null;
}

// --- AUTH ---
function apiLogin(id, pwd) {
  const data = userSheet.getDataRange().getDisplayValues();
  for (let i = 1; i < data.length; i++) {
    // Col: 0=ID, 1=Pwd, 2=Name, 3=Nick, 4=Phone, 5=Role, 6=Shop, 7=Email
    if (String(data[i][0]) === String(id) && String(data[i][1]) === String(pwd)) {
      
      return response(true, { 
          id: data[i][0], 
          name: data[i][2], 
          nick: data[i][3], 
          phone: String(data[i][4]).replace("'",""), // แถม: ดึงเบอร์โทรมาด้วย
          role: data[i][5], 
          shop: data[i][6],
          email: data[i][7] // 🟢 จุดสำคัญ: เพิ่มบรรทัดนี้เพื่อดึงอีเมล
      });
    }
  }
  return response(false, "Login Failed");
}

function apiRegister(form) {
  const data = userSheet.getDataRange().getDisplayValues();
  if (data.some(r => String(r[0]) === String(form.id))) return response(false, "Duplicate ID");
  
  // บันทึก Email ลงใน Col H (ช่องสุดท้าย)
  userSheet.appendRow([
    "'" + form.id, 
    form.pwd, 
    form.name, 
    form.nick, 
    "'" + form.phone, 
    "Student", 
    "", 
    form.email // <--- เพิ่มตรงนี้
  ]);
  return response(true, "Success");
}

// --- ADMIN FEATURES ---
function apiAdminGetUsers() {
  const data = userSheet.getDataRange().getValues();
  data.shift();
  // เพิ่ม email เข้าไปใน Object
  const users = data.map(r => ({ id: r[0], pwd: r[1], name: r[2], nick: r[3], phone: r[4], role: r[5], shop: r[6], email: r[7] }));
  return response(true, users);
}

function apiAdminSaveUser(u) {
  const data = userSheet.getDataRange().getValues();
  let rowIndex = data.findIndex(r => String(r[0]) === String(u.id));
  
  if(rowIndex > 0) { // Update
    const row = rowIndex + 1;
    userSheet.getRange(row, 2).setValue(u.pwd);
    userSheet.getRange(row, 3).setValue(u.name);
    // userSheet.getRange(row, 4).setValue(u.nick); // ถ้าจะแก้ Nickname ด้วย
    userSheet.getRange(row, 6).setValue(u.role);
    userSheet.getRange(row, 7).setValue(u.shop);
    userSheet.getRange(row, 8).setValue(u.email); // <--- อัปเดต Email
  } else { // Create
    if (data.some(r => String(r[0]) === String(u.id))) return response(false, "ID ซ้ำ");
    userSheet.appendRow(["'" + u.id, u.pwd, u.name, u.nick, "'" + u.phone, u.role, u.shop, u.email]);
  }
  return response(true, "Saved");
}

function apiAdminDeleteUser(id) {
  const data = userSheet.getDataRange().getValues();
  const rowIndex = data.findIndex(r => String(r[0]) === String(id));
  if (rowIndex > 0) {
    userSheet.deleteRow(rowIndex + 1);
    return response(true, "Deleted");
  }
  return response(false, "Not Found");
}

function apiAdminGetStats() {
  const orders = orderSheet.getDataRange().getValues();
  orders.shift();
  
  const shopStats = {};
  let totalSales = 0;
  
  orders.forEach(r => {
    if (r[6] !== 'Cancelled') {
      const shop = r[9] || 'Unknown';
      const amt = parseInt(r[4]) || 0;
      totalSales += amt;
      if (!shopStats[shop]) shopStats[shop] = 0;
      shopStats[shop] += amt;
    }
  });
  
  return response(true, { total: totalSales, shops: shopStats });
}

function apiGetNews() {
  if (!newsSheet) return response(true, "");
  const data = newsSheet.getDataRange().getValues();
  data.shift();
  const activeNews = data.reverse().find(r => r[2] === "Active");
  return response(true, activeNews ? activeNews[1] : "");
}

function apiAdminSaveNews(msg) {
  if (!newsSheet) return response(false, "No News Sheet");
  const time = new Date().toLocaleString('th-TH');
  newsSheet.appendRow(["N"+Date.now(), msg, "Active", time]);
  return response(true, "Posted");
}

function apiAdminClearNews() {
  if (!newsSheet) return;
  const data = newsSheet.getDataRange().getValues();
  for(let i=1; i<data.length; i++) {
    newsSheet.getRange(i+1, 3).setValue("Inactive");
  }
  return response(true, "Cleared");
}

function apiSubmitReview(data) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); 

    if (!reviewSheet) return response(false, "No Review Sheet");

    // 1. เช็คว่าเคยรีวิวไปหรือยัง
    const existingData = reviewSheet.getDataRange().getValues();
    const isDuplicate = existingData.some(row => String(row[1]) === String(data.orderId));

    if (isDuplicate) {
       return response(false, "คุณรีวิวออเดอร์นี้ไปแล้วครับ");
    }

    // 2. เตรียมข้อมูล
    const rid = "REV-" + new Date().getTime();
    const time = new Date().toLocaleString('th-TH');
    
    // แปลงรายการอาหารให้อ่านง่าย (ถ้ามาเป็น JSON ก็แปลง ถ้าเป็นข้อความก็ใช้เลย)
    let itemsReadable = data.items; 
    try {
        if (typeof data.items === 'string' && (data.items.startsWith('[') || data.items.startsWith('{'))) {
            const itemsArr = JSON.parse(data.items);
            if (Array.isArray(itemsArr)) {
                itemsReadable = itemsArr.map(i => `${i.name} (x${i.qty})`).join(', ');
            }
        }
    } catch(e) { /* ถ้าแปลงไม่ได้ ก็ใช้ค่าเดิมที่เป็น String */ }

    // 3. บันทึกข้อมูล (เรียงคอลัมน์ให้ตรงเป๊ะ A-H)
    reviewSheet.appendRow([
      rid,                  // Col A: Review ID
      data.orderId,         // Col B: Order ID
      data.shop,            // Col C: Shop Name
      "'" + data.userId,    // Col D: User ID
      data.rating,          // Col E: Rating
      data.comment,         // Col F: Comment
      time,                 // Col G: Time
      itemsReadable         // Col H: Menu Items (ใส่ตรงนี้!)
    ]);
    
    return response(true, "ขอบคุณสำหรับการรีวิว!");

  } catch (e) {
    return response(false, e.toString());
  } finally {
    lock.releaseLock();
  }
}

// --- STANDARD FEATURES (Student/Merchant) ---
function apiGetShops() {
  const userSheet = ss.getSheetByName("Users");
  const reviewSheet = ss.getSheetByName("Reviews");
  
  // 🟢 แก้ไข: เปลี่ยนชื่อชีทเป็น "Menu" ตามที่คุณแจ้ง
  const menuSheet = ss.getSheetByName("Menu"); 

  // 1. ดึงข้อมูลรีวิว
  const ratings = {};
  if (reviewSheet) {
    const reviewData = reviewSheet.getDataRange().getValues();
    for (let i = 1; i < reviewData.length; i++) {
      const shop = reviewData[i][2]; 
      const score = parseFloat(reviewData[i][4]); 
      if (shop && !isNaN(score)) {
        if (!ratings[shop]) ratings[shop] = { total: 0, count: 0 };
        ratings[shop].total += score;
        ratings[shop].count++;
      }
    }
  }

  // 2. ดึงข้อมูลเมนู
  const shopCats = {};
  const shopMenus = {}; 
  
  // กำหนดคำแสดงผลประเภทร้าน
  const catMap = { 
      "Food": "ร้านข้าว", "Rice": "ร้านข้าว", "อาหารจานเดียว": "ร้านข้าว",
      "Noodle": "ร้านก๋วยเตี๋ยว", "ก๋วยเตี๋ยว": "ร้านก๋วยเตี๋ยว",
      "Drink": "ร้านน้ำ", "Beverage": "ร้านน้ำ", "เครื่องดื่ม": "ร้านน้ำ", "น้ำ": "ร้านน้ำ",
      "Snack": "ของทานเล่น", "Appetizer": "ของทานเล่น", "ของทอด": "ของทานเล่น", "ลูกชิ้น": "ร้านลูกชิ้น",
      "Dessert": "ขนมหวาน", "Sweet": "ขนมหวาน", "ขนม": "ขนมหวาน", "เบเกอรี่": "ร้านขนม",
      "Fruit": "ร้านผลไม้", "ผลไม้": "ร้านผลไม้"
  };

  if (menuSheet) {
    const menuData = menuSheet.getDataRange().getValues();
    for (let i = 1; i < menuData.length; i++) {
      const name = menuData[i][1];      // ชื่อเมนู
      const catCode = menuData[i][3];   // หมวดหมู่
      const shopName = menuData[i][6];  // ชื่อร้าน
      const status = menuData[i][5];    // สถานะ (Col F = Index 5)

      if (shopName && status !== 'Hidden') {
        // เก็บหมวดหมู่ร้าน
        if (catCode) {
          if (!shopCats[shopName]) shopCats[shopName] = new Set();
          shopCats[shopName].add(catMap[catCode] || catCode);
        }
        // เก็บชื่อเมนูไว้ค้นหา
        if (name) {
          if (!shopMenus[shopName]) shopMenus[shopName] = [];
          shopMenus[shopName].push(name);
        }
      }
    }
  }

  // 3. ดึงข้อมูลร้านค้า และ ตรวจสอบสถานะ
  const userData = userSheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < userData.length; i++) {
    const r = userData[i];
    
    if (r[5] === 'Merchant' && r[6]) {
       const shopName = r[6];
       
       // --- Logic เวลาเปิด-ปิด ---
       const openT = r[9];        // J
       const closeT = r[10];      // K
       const manualStatus = r[11] || "Open"; // L
       
       let isTimeOpen = true; 
       
       if (openT && closeT) {
           const now = new Date();
           const nowVal = now.getHours() * 60 + now.getMinutes(); 
           
           const toMin = (t) => {
               if (t instanceof Date) return t.getHours() * 60 + t.getMinutes();
               const p = String(t).replace("'", "").split(':');
               return parseInt(p[0]) * 60 + parseInt(p[1]); 
           };
           
           const start = toMin(openT);
           const end = toMin(closeT);
           
           if (start < end) {
               if (nowVal < start || nowVal >= end) isTimeOpen = false;
           } else {
               if (nowVal < start && nowVal >= end) isTimeOpen = false;
           }
       }

       const isOpen = (manualStatus === "Open" && isTimeOpen);

       const stats = ratings[shopName] || { total: 0, count: 0 };
       const avgRating = stats.count > 0 ? (stats.total / stats.count).toFixed(1) : "0.0";
       
       // สร้าง Tag ร้าน
       let catText = "ทั่วไป";
       if (shopCats[shopName] && shopCats[shopName].size > 0) {
           catText = Array.from(shopCats[shopName]).join(" • ");
       }

       // รวมชื่อเมนูทั้งหมดส่งไปหน้าบ้าน
       const allMenus = shopMenus[shopName] ? shopMenus[shopName].join(" ") : "";

       result.push({
           name: shopName,
           img: r[8] || "https://cdn-icons-png.flaticon.com/512/869/869636.png",
           rating: avgRating,
           reviews: stats.count,
           tags: catText,        
           menuSearch: allMenus, 
           isOpen: isOpen 
       });
    }
  }

  return response(true, result);
}

function apiGetMenu(shopName) {
  const data = menuSheet.getDataRange().getValues();
  data.shift();
  return response(true, data.filter(r => r[6] === shopName).map(r => ({
    id: r[0], name: r[1], price: r[2], cat: r[3], img: r[4], status: r[5],
    options: r[9] ? JSON.parse(r[9]) : [],
    recommend: r[10] === true || r[10] === "TRUE"
  })));
}

function apiSaveMenu(item) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (e) { return response(false, "System Busy"); }

  try {
    const data = menuSheet.getDataRange().getValues();
    let row = -1;
    if(item.id) row = data.findIndex(r => String(r[0]) === String(item.id)) + 1;
    
    // จัดการรูปภาพ
    const imgUrl = saveImageToDrive(item.img, 'food');
    
    // เตรียมข้อมูล JSON (สำหรับระบบ)
    const optionsJson = JSON.stringify(item.options || []);
    
    // --- สร้างข้อความอ่านง่าย (สำหรับคนดูใน Excel/Sheet) ---
    // Col H: รายละเอียดตัวเลือก
    const optReadable = (item.options || []).map(g => {
       const choices = g.choices.map(c => c.name).join(',');
       return `[${g.group}: ${choices}]`;
    }).join(' ');

    // Col I: เมนูแนะนำ
    const recReadable = item.recommend ? "⭐ แนะนำ" : "-";

    if (row > 0) {
      // อัปเดตข้อมูลเดิม (Col B-G)
      menuSheet.getRange(row, 2).setValue(item.name);
      menuSheet.getRange(row, 3).setValue(item.price);
      menuSheet.getRange(row, 4).setValue(item.cat);
      menuSheet.getRange(row, 5).setValue(imgUrl);
      menuSheet.getRange(row, 6).setValue(item.status);
      
      // 🟢 บันทึกเรียงช่องใหม่ (H, I, J, K)
      menuSheet.getRange(row, 8).setValue(optReadable);  // H: อ่านง่าย
      menuSheet.getRange(row, 9).setValue(recReadable);  // I: อ่านง่าย
      menuSheet.getRange(row, 10).setValue(optionsJson); // J: JSON (ระบบใช้)
      menuSheet.getRange(row, 11).setValue(item.recommend); // K: Bool (ระบบใช้)
      
    } else {
      // สร้างแถวใหม่
      const newId = "M" + new Date().getTime();
      menuSheet.appendRow([
          newId, 
          item.name, 
          item.price, 
          item.cat, 
          imgUrl, 
          "Available", 
          item.shop, 
          optReadable,  // H
          recReadable,  // I
          optionsJson,  // J
          item.recommend // K
      ]);
    }
    return response(true, "Saved");

  } catch (e) {
    return response(false, "Error: " + e.toString());
  } finally {
    lock.releaseLock();
  }
}

function apiDeleteMenu(id) {
  const data = menuSheet.getDataRange().getValues();
  const row = data.findIndex(r => String(r[0]) === String(id));
  if (row > 0) { menuSheet.deleteRow(row + 1); return response(true, "Deleted"); }
  return response(false, "Not Found");
}

// --- ORDER SYSTEM WITH EMAIL ALERTS ---

// --- ฟังก์ชันช่วยดึงข้อมูลลูกค้า (เพิ่มใหม่) ---
function getUserInfo(userId) {
  const data = userSheet.getDataRange().getValues();
  // หาแถวที่ ID ตรงกัน (Col 0)
  const user = data.find(r => String(r[0]) === String(userId) || String(r[0]) === "'" + String(userId));
  if (user) {
    // คืนค่า { ชื่อ, ชื่อเล่น, เบอร์โทร }
    return { name: user[2], nick: user[3], phone: String(user[4]).replace("'","") };
  }
  return { name: "ไม่ระบุ", nick: "-", phone: "-" };
}

// --- ฟังก์ชันสร้างเนื้อหาอีเมลแบบละเอียด (เพิ่มใหม่) ---
// --- ฟังก์ชันสร้างเนื้อหาอีเมลแบบละเอียด (ปรับปรุงใหม่ สวยงาม+ครบถ้วน) ---
function createMerchantEmailBody(data) {
    // สร้างรายการสินค้า (Loop items)
    const itemsHtml = data.items.map((i, index) => {
        // 1. จัดการ Options (ท็อปปิ้ง/ตัวเลือก)
        let optionsHtml = "";
        if (i.options && i.options.length > 0) {
            const optList = i.options.map(o => `• ${o.name}`).join('<br>');
            optionsHtml = `<div style="font-size:12px; color:#666; margin-top:4px; padding-left:10px; border-left:2px solid #ddd;">${optList}</div>`;
        }

        // 2. จัดการหมายเหตุรายเมนู (Item Note)
        let itemNoteHtml = "";
        if (i.note) {
            itemNoteHtml = `<div style="font-size:12px; color:#d63384; margin-top:4px;"><strong>💬 Note:</strong> ${i.note}</div>`;
        }

        // 3. คำนวณราคารวมต่อรายการ
        const itemTotal = (i.price * i.qty).toLocaleString();

        return `
        <tr style="border-bottom:1px solid #f0f0f0;">
            <td style="padding:12px 5px; vertical-align:top;">
                <div style="font-weight:bold; font-size:15px; color:#333;">${index + 1}. ${i.name}</div>
                ${optionsHtml}
                ${itemNoteHtml}
            </td>
            <td style="padding:12px 5px; text-align:center; vertical-align:top;">
                <span style="background:#e8f5e9; color:#006837; padding:2px 8px; border-radius:10px; font-weight:bold; font-size:13px;">x${i.qty}</span>
            </td>
            <td style="padding:12px 5px; text-align:right; vertical-align:top; font-weight:bold; color:#555;">
                ${itemTotal}
            </td>
        </tr>`;
    }).join('');

    // เช็คว่ามีนัดรับเวลาไหม (ดึงจาก Note หลัก)
    let pickupTimeAlert = "";
    if (data.note && data.note.includes("⏰")) {
        pickupTimeAlert = `
        <div style="background-color:#fff3cd; color:#856404; padding:10px; border-radius:8px; text-align:center; margin-bottom:15px; border:1px solid #ffeeba;">
            ${data.note.split(']')[0] + ']'} </div>`;
    }

    return `
    <div style="font-family: 'Sarabun', sans-serif; max-width: 500px; margin: 0 auto; background-color:#ffffff; border:1px solid #e0e0e0; border-radius:12px; overflow:hidden;">
        
        <div style="background-color:#006837; color:white; padding:20px; text-align:center;">
            <h2 style="margin:0; font-size:22px;">🔔 ออเดอร์ใหม่ #${data.orderId.split('-')[1]}</h2>
            <p style="margin:5px 0 0; opacity:0.9; font-size:14px;">${data.time}</p>
        </div>

        <div style="padding:20px;">
            
            ${pickupTimeAlert}

            <div style="display:flex; align-items:center; background-color:#f8f9fa; padding:12px; border-radius:8px; margin-bottom:20px;">
                <div style="font-size:24px; margin-right:15px;">👤</div>
                <div>
                    <div style="font-weight:bold; font-size:16px; color:#333;">${data.customer.name} (${data.customer.nick})</div>
                    <div style="font-size:14px; color:#666;">โทร: <a href="tel:${data.customer.phone}" style="color:#006837; text-decoration:none; font-weight:bold;">${data.customer.phone}</a></div>
                </div>
            </div>

            <h3 style="margin:0 0 10px; font-size:16px; border-bottom:2px solid #006837; display:inline-block; padding-bottom:5px; color:#006837;">รายการอาหาร</h3>
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                <thead>
                    <tr style="background-color:#fafafa; color:#777; font-size:12px; text-transform:uppercase;">
                        <th style="text-align:left; padding:8px 5px;">เมนู</th>
                        <th style="text-align:center; padding:8px 5px; width:50px;">จำนวน</th>
                        <th style="text-align:right; padding:8px 5px; width:70px;">ราคา</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" style="padding:15px 5px; text-align:right; font-weight:bold; font-size:16px;">ยอดรวมสุทธิ</td>
                        <td style="padding:15px 5px; text-align:right; font-weight:bold; font-size:18px; color:#d32f2f;">${data.total.toLocaleString()} ฿</td>
                    </tr>
                </tfoot>
            </table>

            <div style="border-top:1px dashed #ddd; padding-top:15px;">
                <p style="margin:5px 0; font-size:14px;">
                    <strong>💰 การชำระเงิน:</strong> ${data.payMethod}
                </p>
                
                

                ${data.note ? `
                <div style="margin-top:15px; background-color:#fff0f0; color:#c62828; padding:10px; border-radius:6px; font-size:14px;">
                    <strong>📝 หมายเหตุรวม:</strong> ${data.note}
                </div>` : ''}
            </div>

        </div>

        <div style="background-color:#f1f1f1; padding:15px; text-align:center; font-size:12px; color:#888;">
            กรุณาตรวจสอบออเดอร์และกดรับงานในระบบ<br>PBPVC Canteen System
        </div>
    </div>
    `;
}

function apiPlaceOrder(data) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch (e) { return response(false, "System Busy"); }
  
  try {
    const orderSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
    const orderId = "ORD-" + Math.floor(10000 + Math.random() * 90000);
    const time = new Date().toLocaleString('th-TH');
    
    // --- จัดการรูปสลิป ---
    let slipLink = "";
    let payMethodDisplay = '<span style="color:#f57c00; font-weight:bold;">💵 เงินสด (Cash)</span>';

    if (data.slip) {
      // 1. กรณีเป็นรูปภาพ (Base64 ยาวๆ)
      if (data.slip.toString().includes("base64,")) {
         slipLink = saveImageToDrive(data.slip, 'slip'); // อัปโหลดรูป
         payMethodDisplay = '<span style="color:#2e7d32; font-weight:bold;">📲 โอนเงิน (Transfer)</span>';
      } 
      // 2. กรณีเป็นข้อความสั้นๆ (QR_PAYMENT หรือ เงินสด)
      else {
         slipLink = data.slip; // บันทึกคำนั้นลงไปเลย
         
         if (data.slip === 'QR_PAYMENT') {
            payMethodDisplay = '<span style="color:#006837; font-weight:bold;"> จ่ายผ่าน QR</span>';
         }
      }
    } else {
       // ถ้าไม่ส่งอะไรมาเลย (กันเหนียว)
       slipLink = "เงินสด";
    }

    // --- เตรียมข้อมูล Text ---
    const itemsReadable = data.items.map(i => `${i.name} (x${i.qty})`).join(',\n');
    const optionsReadable = data.items.map(i => {
       const opts = i.options ? i.options.map(o=>o.name).join('+') : '';
       return opts ? `${i.name}: ${opts}` : '';
    }).filter(x=>x).join('\n');

    // --- เตรียมเนื้อหาแจ้งเตือน (HTML ใบเสร็จ) ---
    const customerInfo = getUserInfo(data.userId);
    const payTypeShort = slipLink ? "โอนเงิน" : "เงินสด";
    const subjectMerchant = `🔔 ออเดอร์ใหม่ #${orderId.split('-')[1]} (${payTypeShort})`;
    const subjectStudent = `✅ สั่งซื้อสำเร็จ #${orderId.split('-')[1]}`;
    
    // สร้างใบเสร็จสวยๆ (ใช้ฟังก์ชันเดิมที่มีอยู่)
    const emailBody = createMerchantEmailBody({
        orderId: orderId, time: time, shop: data.shop,
        customer: customerInfo, userId: data.userId, items: data.items,
        total: data.total, note: data.note, payMethod: payMethodDisplay, slipLink: slipLink
    });

    // --------------------------------------------------------
    // 🟢 ส่วนที่ 1: แจ้งเตือนร้านค้า (Merchant)
    // --------------------------------------------------------
    const merchantId = getMerchantUserId(data.shop);
    if(merchantId) {
        // ส่งเข้า App Notification ของแม่ค้า
        sendAppNotification(merchantId, subjectMerchant, emailBody); 
        
        // ส่งอีเมลแม่ค้า (ถ้ามี)
        const merchantEmail = getMerchantEmail(data.shop);
        if(merchantEmail) {
            try {
                sendEmailNotification(merchantEmail, `[PBPVC] ${subjectMerchant}`, emailBody);
            } catch(e) {}
        }
    } else {
        console.log("⚠️ แจ้งเตือนร้านค้าไม่ได้: ไม่พบ Merchant ที่เป็นเจ้าของร้าน " + data.shop);
    }

    // --------------------------------------------------------
    // 🟢 ส่วนที่ 2: แจ้งเตือนนักเรียน (Student) - *เพิ่มส่วนนี้ครับ*
    // --------------------------------------------------------
    const studentMsg = `
        <div style="text-align:center;">
            <h3 style="color:#006837;">ขอบคุณที่ใช้บริการ</h3>
            <p>ออเดอร์ของคุณถูกส่งไปยังร้าน <strong>${data.shop}</strong> แล้ว</p>
            <p style="color:#666; font-size:0.9rem;">โปรดรอสักครู่ ทางร้านกำลังตรวจสอบรายการ</p>
            <hr style="border:0; border-top:1px dashed #ddd; margin:15px 0;">
            ${emailBody} </div>
    `;
    sendAppNotification(data.userId, subjectStudent, studentMsg);


    // --- บันทึกลง Sheet Orders ---
    orderSheet.appendRow([
        orderId, "'" + data.userId, itemsReadable, optionsReadable, data.total, data.note, 
        "Waiting", time, slipLink, data.shop, JSON.stringify(data.items), "Notified"
    ]);
    
    return response(true, { orderId: orderId });

  } catch (e) { 
      return response(false, "Error: " + e.toString()); 
  } finally { 
      lock.releaseLock(); 
  }
}

function apiGetOrders(role, userId) {
  try {
    const sheet = ss.getSheetByName("Orders");
    const userSheet = ss.getSheetByName("Users"); 
    const reviewSheet = ss.getSheetByName("Reviews"); 

    let myShop = "";
    if (role === 'Merchant') {
       const uData = userSheet.getDataRange().getValues();
       const userRow = uData.find(r => String(r[0]) === String(userId));
       if (userRow) myShop = userRow[6];
    }
    
    const userMap = {};
    const userData = userSheet.getDataRange().getValues();
    userData.shift(); 
    userData.forEach(u => userMap[String(u[0]).replace("'","")] = {name: u[2], nick: u[3], phone: String(u[4]).replace("'","")});

    const reviewMap = {};
    if (reviewSheet) {
       const rData = reviewSheet.getDataRange().getValues();
       for(let i=1; i<rData.length; i++) {
          reviewMap[String(rData[i][1])] = { rating: rData[i][4], comment: rData[i][5] };
       }
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return response(true, []);
    data.shift();

    const orders = data.map(r => {
        // 🟢 แก้ตรงนี้: อ่าน Items จาก r[10] (Col K) แทน r[2]
        let items = []; try { items = r[10] ? JSON.parse(r[10]) : []; } catch (e) {}
        
        let uid = String(r[1]).replace("'","");
        let cust = userMap[uid] || {name: "Unknown", nick: "-", phone: "-"};
        
        // ขยับ Index ของข้อมูลอื่นๆ ตามคอลัมน์ใหม่
        return {
          id: r[0], 
          userId: uid, 
          custName: cust.name, custNick: cust.nick, custPhone: cust.phone,
          items: items, 
          total: r[4],      // ขยับเป็น 4 (Col E)
          note: r[5],       // ขยับเป็น 5 (Col F)
          status: r[6],     // ขยับเป็น 6 (Col G)
          time: r[7] ? new Date(r[7]).toLocaleString('th-TH') : '', // 7 (Col H)
          slip: r[8],       // 8 (Col I)
          shop: r[9],       // 9 (Col J)
          review: reviewMap[r[0]] || null
        };
    }).reverse();

    if (role === 'Student') return response(true, orders.filter(o => String(o.userId) === String(userId)));
    else if (role === 'Merchant') return response(true, orders.filter(o => o.shop === myShop));
    else if (role === 'Admin') return response(true, orders); 

  } catch (e) { return response(false, []); }
}

function apiUpdateStatus(orderId, status) {
  const orderSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
  const data = orderSheet.getDataRange().getValues(); 
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(orderId)) {
      if (data[i][6] === status) return response(true, "Status already updated");

      orderSheet.getRange(i + 1, 7).setValue(status);
      
      if (status === 'Ready' || status === 'Completed' || status === 'Cancelled') {
          const userId = String(data[i][1]).replace("'","");
          const shopName = data[i][9];
          
          // เตรียมข้อความ
          let title = `📦 สถานะออเดอร์ ${orderId}`;
          let msgHtml = "";
          let emailSubject = `[PBPVC] ออเดอร์ ${orderId} อัปเดตสถานะ`;

          if(status === 'Ready') {
              title = "✅ อาหารเสร็จแล้ว!";
              msgHtml = `<p>เมนูจากร้าน <strong>${shopName}</strong> ทำเสร็จแล้ว<br>กรุณามารับที่หน้าร้านได้เลยครับ</p>`;
          } else if (status === 'Cancelled') {
              title = "❌ ออเดอร์ถูกยกเลิก";
              msgHtml = `<p>ออเดอร์จากร้าน <strong>${shopName}</strong> ถูกยกเลิก<br>โปรดติดต่อร้านค้าสำหรับรายละเอียด</p>`;
          } else if (status === 'Completed') {
              title = "🎉 ออเดอร์สำเร็จ";
              msgHtml = `<p>ขอบคุณที่ใช้บริการร้าน <strong>${shopName}</strong> ครับ</p>`;
          }
          
          // 1. 🟢 ส่งเข้าแอป
          if(msgHtml) sendAppNotification(userId, title, msgHtml);

          // 2. 🟢 ส่งอีเมล - *เพิ่มกลับมาแล้ว*
          const userEmail = getUserEmail(userId);
          if(userEmail && msgHtml) {
              sendEmailNotification(userEmail, emailSubject, `<h3>${title}</h3>${msgHtml}`);
          }
      }

      return response(true, "Updated");
    }
  }
  return response(false, "Not Found");
}

function apiCancelOrder(oid) {
  const orderSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
  const data = orderSheet.getDataRange().getValues();
  
  for(let i=1; i<data.length; i++) {
    if(String(data[i][0]).trim() === String(oid).trim()) {
      const currentStatus = data[i][6];
      if(currentStatus === 'Completed' || currentStatus === 'Cancelled') return response(false, "จบไปแล้ว");
      
      orderSheet.getRange(i+1, 7).setValue("Cancelled");
      
      const userId = String(data[i][1]).replace("'","");
      const shopName = data[i][9];
      
      // เตรียมข้อความ
      const title = "❌ ยกเลิกออเดอร์สำเร็จ";
      const msg = `<p>คุณได้ยกเลิกออเดอร์ <strong>${oid}</strong> ของร้าน ${shopName} เรียบร้อยแล้ว</p>`;

      // 1. 🟢 ส่งเข้าแอป
      sendAppNotification(userId, title, msg);

      // 2. 🟢 ส่งอีเมล - *เพิ่มกลับมาแล้ว*
      const userEmail = getUserEmail(userId);
      if(userEmail) {
           sendEmailNotification(userEmail, `[PBPVC] ยืนยันการยกเลิกออเดอร์ ${oid}`, msg);
      }
      
      return response(true, "Cancelled");
    }
  }
  return response(false, "ไม่พบออเดอร์");
}

function createEmailTemplate(title, items, total, note, link) {
  let itemRows = items.map(i => 
    `<tr>
       <td style="padding:8px; border-bottom:1px solid #ddd;">${i.name} (x${i.qty})</td>
       <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">${i.price * i.qty} ฿</td>
     </tr>`
  ).join('');

  return `
    <div style="font-family: 'Sarabun', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #006837; padding: 20px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0;">PBPVC Canteen</h2>
        <p style="margin: 5px 0 0; opacity: 0.9;">${title}</p>
      </div>
      <div style="padding: 20px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left;">รายการ</th>
              <th style="padding: 10px; text-align: right;">ราคา</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr>
              <td style="padding: 15px 10px; font-weight: bold;">ยอดรวมสุทธิ</td>
              <td style="padding: 15px 10px; font-weight: bold; text-align: right; color: #006837; font-size: 18px;">${total} ฿</td>
            </tr>
          </tfoot>
        </table>
        ${note ? `<div style="background:#fff3cd; padding:10px; border-radius:4px; margin-bottom:15px; color:#856404; font-size:14px;"><strong>หมายเหตุ:</strong> ${note}</div>` : ''}
        <div style="text-align: center; margin-top: 30px;">
          <a href="${link}" style="background-color: #006837; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold;">ดูสถานะออเดอร์</a>
        </div>
      </div>
      <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        อีเมลอัตโนมัติจากระบบ PBPVC Canteen<br>ไม่ต้องตอบกลับอีเมลนี้
      </div>
    </div>
  `;
}
function apiToggleShopStatus(uid, isOpen) {
  const sheet = ss.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  const row = data.findIndex(r => String(r[0]) === String(uid));
  
  if(row > 0) {
    // 🟢 แก้เป็นเลข 12 (Column L) ไม่ให้ทับเวลาเปิด
    const status = isOpen ? "Open" : "Closed";
    sheet.getRange(row + 1, 12).setValue(status); 
    return response(true, status);
  }
  return response(false, "User not found");
}

// เพิ่มฟังก์ชันสำหรับดึงสถานะร้านค้าปัจจุบัน (สำหรับหน้า Merchant)
function apiGetMyStatus(uid) {
  const sheet = ss.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  const user = data.find(r => String(r[0]) === String(uid));
  
  // แก้เป็น user[11] คือช่อง L
  if(user) return response(true, user[11] === "Closed" ? false : true); 
  return response(false, false);
}
// บันทึกเวลาเปิด-ปิดร้าน
function apiSaveShopConfig(userId, openTime, closeTime) {
  if(!userId) return response(false, "ไม่พบ ID");
  
  const sheet = ss.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  
  for(let i=1; i<data.length; i++) {
    if(String(data[i][0]) === String(userId)) {
       // J=10 (เวลาเปิด), K=11 (เวลาปิด)
       sheet.getRange(i+1, 10).setValue(openTime ? "'" + openTime : ""); 
       sheet.getRange(i+1, 11).setValue(closeTime ? "'" + closeTime : "");
       return response(true, "ตั้งเวลาเรียบร้อย");
    }
  }
  return response(false, "ไม่พบข้อมูล");
}

// ดึงเวลาเปิด-ปิด ของฉัน (ใช้ตอนโหลดหน้า Merchant)
function apiGetMyConfig(id) {
   const sheet = ss.getSheetByName("Users");
   const data = sheet.getDataRange().getValues();
   const row = data.find(r => String(r[0]) === String(id));
   
   if(row) {
       // Index 9=J(Open), 10=K(Close), 11=L(Status)
       return response(true, { 
           open: row[9],   // เวลาเปิด
           close: row[10], // เวลาปิด
           status: row[11] // สถานะร้าน
       });
   }
   return response(false, null);
}
// --- ฟังก์ชันกู้คืนรหัสผ่าน (เพิ่มใหม่) ---
function apiForgotPassword(id, phone) {
  const sheet = ss.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  
  // วนลูปหา ID และเบอร์โทรที่ตรงกัน
  for (let i = 1; i < data.length; i++) {
    const uId = String(data[i][0]).replace("'", "");
    const uPhone = String(data[i][4]).replace("'", ""); // เบอร์โทรอยู่ Column E (Index 4)
    
    // เช็คว่า ID และเบอร์โทรตรงกันไหม
    if (uId === String(id) && uPhone === String(phone)) {
       // ถ้าเจอ ส่งรหัสผ่าน (Column B, Index 1) กลับไป
       return response(true, { pwd: data[i][1] }); 
    }
  }
  return response(false, "ไม่พบข้อมูล หรือเบอร์โทรไม่ถูกต้อง");
}
// --- SHOP PROFILE MANAGEMENT ---

// ดึงข้อมูลโปรไฟล์ร้านค้า (รูป, ชื่อ, เวลา)
function apiGetShopProfile(uid) {
  const sheet = ss.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  const row = data.find(r => String(r[0]) === String(uid));
  
  if (row) {
    return response(true, {
      pwd: row[1],             // Col B (Password) - เพิ่มใหม่
      name: row[2],            // Col C (Name) - เพิ่มใหม่
      nick: row[3],            // Col D (Nick) - เพิ่มใหม่
      email: row[7],           // Col H (Email) - เพิ่มใหม่
      shopName: row[6],        // Col G
      img: row[8] || "",       // Col I
      open: row[9],            // Col J
      close: row[10],          // Col K
      status: row[11]          // Col L
    });
  }
  return response(false, "User not found");
}

// บันทึกข้อมูลโปรไฟล์ร้านค้า
function apiSaveShopProfile(form) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (e) { return response(false, "System Busy"); }

  try {
    const sheet = ss.getSheetByName("Users");
    const data = sheet.getDataRange().getValues();
    const rowIndex = data.findIndex(r => String(r[0]) === String(form.uid));

    if (rowIndex > 0) {
      const row = rowIndex + 1;
      
      // 🟢 1. อัปเดตข้อมูลส่วนตัว (เพิ่มใหม่)
      sheet.getRange(row, 2).setValue(form.pwd);   // แก้รหัสผ่าน
      sheet.getRange(row, 3).setValue(form.name);  // แก้ชื่อจริง
      sheet.getRange(row, 4).setValue(form.nick);  // แก้ชื่อเล่น
      sheet.getRange(row, 8).setValue(form.email); // แก้อีเมล

      // 🔵 2. อัปเดตข้อมูลร้าน (ของเดิม)
      sheet.getRange(row, 7).setValue(form.shopName);
      sheet.getRange(row, 10).setValue(form.open ? "'" + form.open : "");
      sheet.getRange(row, 11).setValue(form.close ? "'" + form.close : "");
      
      if (form.status) sheet.getRange(row, 12).setValue(form.status);

      if (form.img && form.img.includes("base64,")) {
        const imgUrl = saveImageToDrive(form.img, 'shop');
        sheet.getRange(row, 9).setValue(imgUrl);
      }

      return response(true, "บันทึกข้อมูลเรียบร้อย");
    }
    return response(false, "ไม่พบร้านค้า");
  } catch (e) {
    return response(false, "Error: " + e.toString());
  } finally {
    lock.releaseLock();
  }
}
// บันทึกข้อมูลนักเรียน (เฉพาะข้อมูลส่วนตัว)
function apiSaveStudentProfile(form) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (e) { return response(false, "System Busy"); }

  try {
    const sheet = ss.getSheetByName("Users");
    const data = sheet.getDataRange().getValues();
    const rowIndex = data.findIndex(r => String(r[0]) === String(form.uid));

    if (rowIndex > 0) {
      const row = rowIndex + 1;
      
      // อัปเดตเฉพาะข้อมูลส่วนตัว (Col C, D, H)
      sheet.getRange(row, 3).setValue(form.name);  // Name
      sheet.getRange(row, 4).setValue(form.nick);  // Nick
      sheet.getRange(row, 8).setValue(form.email); // Email
      sheet.getRange(row, 5).setValue("'" + form.phone);

      // ถ้ามีการเปลี่ยนรหัสผ่าน (ส่งมาไม่ว่างเปล่า) ให้แก้ด้วย
      if (form.pwd && form.pwd.trim() !== "") {
          sheet.getRange(row, 2).setValue(form.pwd); // Pwd (Col B)
      }

      return response(true, "Saved");
    }
    return response(false, "User not found");
  } catch (e) {
    return response(false, "Error: " + e.toString());
  } finally {
    lock.releaseLock();
  }
}
function sendAppNotification(userId, title, message) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Notifications");
    if (!sheet) return; // ถ้าไม่มีชีทก็ข้ามไป
    
    // ทำความสะอาด UserID
    const cleanId = String(userId).replace(/'/g, "").trim();
    const nid = "NOT-" + new Date().getTime();
    const time = new Date().toLocaleString('th-TH');
    
    // บันทึก: ID, UserID, Title, Message, Time, Status
    sheet.appendRow([nid, "'" + cleanId, title, message, time, "Unread"]);
    
  } catch(e) { console.log("Notification Error: " + e); }
}

function apiGetNotifications(userId) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Notifications");
    
    // 1. ถ้าหาชีทไม่เจอ ให้คืนค่า array ว่าง
    if (!sheet) {
      console.log("Error: ไม่พบชีท Notifications");
      return response(true, []); 
    }
    
    const data = sheet.getDataRange().getValues();
    
    // 2. ถ้ามีแต่หัวตาราง หรือไม่มีข้อมูล
    if (data.length <= 1) return response(true, []);

    data.shift(); // ตัดหัวตารางออก
    
    // ทำความสะอาด ID ที่รับมา
    const targetId = String(userId).replace(/'/g, "").trim();
    console.log("Fetching Notif for: " + targetId);

    const notifs = data.filter(r => String(r[1]).replace(/'/g, "").trim() === targetId)
                       .map(r => ({
                         id: r[0],
                         title: r[2],
                         message: r[3],
                         // 🟢 แก้จุดตาย: แปลงวันที่เป็น String ให้แน่นอน 100% กันค่า Null
                         time: r[4] ? String(r[4]).replace("Fri Jan 26 2026 ", "").split(" GMT")[0] : "", 
                         read: r[5]
                       })).reverse(); 
                       
    console.log("Found " + notifs.length + " notifications");
    
    // 3. ส่งข้อมูลกลับ (ต้องมี return response)
    return response(true, notifs); 

  } catch (e) {
    console.log("Critical Error in apiGetNotifications: " + e.toString());
    // ส่งค่า array ว่างกลับไป เพื่อไม่ให้หน้าเว็บ error เป็น null
    return response(false, []); 
  }
} 
// 3. Helper: หา UserID ของเจ้าของร้าน (เพื่อแจ้งเตือนแม่ค้า)
function getMerchantUserId(shopName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  // หาคนที่เป็น Merchant และชื่อร้านตรงกัน
  const merchant = data.find(r => 
     String(r[6]).trim().toLowerCase() === String(shopName).trim().toLowerCase() && 
     String(r[5]) === 'Merchant'
  );
  return merchant ? String(merchant[0]).replace(/'/g,"") : null;
}
// ---------------------------------------------------
// ❤️ ระบบบันทึกร้านโปรด (Favorites) ลง Google Sheet
// ---------------------------------------------------

// บันทึกรายการโปรด
function apiSaveFavorites(uid, favs) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  
  // Clean ID (ตัดเครื่องหมาย ' ออก เพื่อความชัวร์)
  const targetId = String(uid).replace(/'/g, "").trim();
  const row = data.findIndex(r => String(r[0]).replace(/'/g, "").trim() === targetId);

  if (row > 0) {
    // บันทึกลง Col 13 (Column M) *ถ้าชีทคุณยังไม่มี Col M มันจะสร้างให้อัตโนมัติ*
    sheet.getRange(row + 1, 13).setValue(JSON.stringify(favs));
    return response(true, "Saved");
  }
  return response(false, "User not found");
}

// ดึงรายการโปรด
function apiGetFavorites(uid) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  
  const targetId = String(uid).replace(/'/g, "").trim();
  const row = data.find(r => String(r[0]).replace(/'/g, "").trim() === targetId);

  if (row) {
    // อ่านจาก Col 13 (Index 12)
    const raw = row[12]; 
    try {
        // ถ้ามีข้อมูล ให้แปลง JSON กลับเป็น Array
        return response(true, raw ? JSON.parse(raw) : []);
    } catch(e) {
        return response(true, []);
    }
  }
  return response(false, []);
}
// --- 1. ระบบแจ้งปัญหา (Report Issue) ---
function apiReportIssue(data) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (e) { return response(false, "System Busy"); }

  try {
    // ⚠️ ต้องสร้างชีทชื่อ "Reports" รอไว้ก่อนนะครับ
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Reports");
    if (!sheet) {
      // ถ้าไม่มีให้สร้างใหม่เลย
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Reports");
      sheet.appendRow(["ID", "User ID", "Name", "Type", "Message", "Contact", "Time", "Status"]);
    }

    const rid = "RPT-" + new Date().getTime();
    const time = new Date().toLocaleString('th-TH');

    sheet.appendRow([
      rid, 
      "'" + data.uid, 
      data.name, 
      data.type, // ประเภทปัญหา
      data.msg, 
      data.contact,
      time, 
      "Pending"
    ]);

    // แจ้งเตือนเข้าไลน์ผู้พัฒนา (ถ้ามี Token)
    // notifyDev("มีรายงานปัญหาใหม่: " + data.type + "\nจาก: " + data.name); 

    return response(true, "ส่งรายงานเรียบร้อย");
  } catch (e) {
    return response(false, "Error: " + e.toString());
  } finally {
    lock.releaseLock();
  }
}

// --- 2. ระบบขอประวัติย้อนหลัง (Export History) ---
function apiExportHistory(uid, email) {
  try {
    const orderSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
    const data = orderSheet.getDataRange().getValues();
    
    // กรองเอาเฉพาะของ User นี้
    const myOrders = data.filter(r => String(r[1]).replace("'","") === String(uid));
    
    if (myOrders.length === 0) return response(false, "ไม่พบประวัติการสั่งซื้อ");

    // สร้างเนื้อหา HTML สำหรับอีเมล
    let htmlTable = `
      <h3>สรุปประวัติการสั่งซื้อของคุณ</h3>
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse; width:100%;">
        <tr style="background:#eee;"><th>วันที่</th><th>ร้านค้า</th><th>รายการ</th><th>ยอดเงิน</th></tr>
    `;
    
    myOrders.forEach(r => {
       // Col G=Status, H=Time, E=Total, J=Shop, C=Items(Readable)
       // ปรับ index ตามโครงสร้างจริงของคุณ:
       // r[7]=Time, r[9]=Shop, r[2]=Items, r[4]=Total
       const date = r[7] ? new Date(r[7]).toLocaleDateString('th-TH') : "-";
       htmlTable += `<tr>
         <td>${date}</td>
         <td>${r[9]}</td>
         <td>${r[2]}</td>
         <td align="right">${r[4]}</td>
       </tr>`;
    });
    htmlTable += "</table>";

    MailApp.sendEmail({
      to: email,
      subject: "สรุปประวัติการสั่งซื้อ - PBPVC Canteen",
      htmlBody: htmlTable
    });

    return response(true, "ส่งข้อมูลเข้าอีเมลแล้ว");
  } catch(e) {
    return response(false, "Error: " + e.toString());
  }
}