-- ============================================================
-- PBPVC Canteen Database Schema
-- Engine: MySQL 5.7+ / MariaDB 10.x
-- ============================================================

CREATE DATABASE IF NOT EXISTS pbpvc_canteen 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE pbpvc_canteen;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          VARCHAR(30)  NOT NULL,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(100),
  nickname    VARCHAR(50),
  phone       VARCHAR(20),
  role        ENUM('Student','Merchant','Admin') NOT NULL DEFAULT 'Student',
  shop_name   VARCHAR(100),
  email       VARCHAR(150),
  shop_image  TEXT,
  open_time   TIME,
  close_time  TIME,
  shop_status ENUM('Open','Closed') DEFAULT 'Open',
  favorites   JSON,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: menu
-- ============================================================
CREATE TABLE IF NOT EXISTS menu (
  id           VARCHAR(40)  NOT NULL,
  name         VARCHAR(150) NOT NULL,
  price        DECIMAL(10,2) NOT NULL DEFAULT 0,
  category     VARCHAR(60),
  image        TEXT,
  status       ENUM('Available','Soldout','Hidden') NOT NULL DEFAULT 'Available',
  shop_name    VARCHAR(100) NOT NULL,
  options      JSON,
  is_recommend TINYINT(1) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_shop (shop_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id         VARCHAR(30)  NOT NULL,
  user_id    VARCHAR(30)  NOT NULL,
  items      JSON         NOT NULL,
  total      DECIMAL(10,2) NOT NULL DEFAULT 0,
  note       TEXT,
  status     ENUM('Waiting','Cooking','Ready','Completed','Cancelled') NOT NULL DEFAULT 'Waiting',
  slip_url   TEXT,
  shop_name  VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user (user_id),
  KEY idx_shop (shop_name),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id         VARCHAR(40) NOT NULL,
  order_id   VARCHAR(30),
  shop_name  VARCHAR(100),
  user_id    VARCHAR(30),
  rating     TINYINT NOT NULL DEFAULT 5,
  comment    TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_order (order_id),
  KEY idx_shop (shop_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         VARCHAR(40)  NOT NULL,
  user_id    VARCHAR(30)  NOT NULL,
  title      VARCHAR(250) NOT NULL,
  message    LONGTEXT,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: news
-- ============================================================
CREATE TABLE IF NOT EXISTS news (
  id         VARCHAR(40) NOT NULL,
  message    TEXT,
  status     ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: reports
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id         VARCHAR(40) NOT NULL,
  user_id    VARCHAR(30),
  name       VARCHAR(100),
  type       VARCHAR(80),
  message    TEXT,
  contact    VARCHAR(150),
  status     ENUM('Pending','Resolved') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA: Admin user
-- ============================================================
INSERT IGNORE INTO users (id, password, name, nickname, phone, role, email) 
VALUES ('admin001', 'admin1234', 'ผู้ดูแลระบบ', 'Admin', '0800000000', 'Admin', 'admin@pbpvc.ac.th');

-- Sample merchant
INSERT IGNORE INTO users (id, password, name, nickname, phone, role, shop_name, email, shop_status)
VALUES ('merchant001', '1234', 'แม่ค้าร้านข้าว', 'พี่หน่อย', '0812345678', 'Merchant', 'ร้านข้าวแม่หน่อย', 'merchant@example.com', 'Open');

-- Sample student
INSERT IGNORE INTO users (id, password, name, nickname, phone, role, email)
VALUES ('66001', '1234', 'นักเรียนทดสอบ', 'น้องทดสอบ', '0898765432', 'Student', 'student@example.com');

-- Sample menu
INSERT IGNORE INTO menu (id, name, price, category, status, shop_name, is_recommend)
VALUES 
  ('M001', 'ข้าวผัดกระเพรา', 40, 'Food', 'Available', 'ร้านข้าวแม่หน่อย', 1),
  ('M002', 'ข้าวมันไก่', 45, 'Food', 'Available', 'ร้านข้าวแม่หน่อย', 0),
  ('M003', 'ข้าวผัดหมู', 40, 'Food', 'Available', 'ร้านข้าวแม่หน่อย', 0);
