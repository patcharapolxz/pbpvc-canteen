-- ============================================================
-- PBPVC Canteen Database Schema for Supabase (PostgreSQL)
-- ============================================================

-- Create Enums
CREATE TYPE user_role AS ENUM ('Student', 'Merchant', 'Admin');
CREATE TYPE shop_status_enum AS ENUM ('Open', 'Closed');
CREATE TYPE menu_status AS ENUM ('Available', 'Soldout', 'Hidden');
CREATE TYPE order_status AS ENUM ('Waiting', 'Cooking', 'Ready', 'Completed', 'Cancelled');
CREATE TYPE news_status AS ENUM ('Active', 'Inactive');
CREATE TYPE report_status AS ENUM ('Pending', 'Resolved');

-- TABLE: users
CREATE TABLE IF NOT EXISTS users (
  id          VARCHAR(30) PRIMARY KEY,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(100),
  nickname    VARCHAR(50),
  phone       VARCHAR(20),
  role        user_role NOT NULL DEFAULT 'Student',
  shop_name   VARCHAR(100),
  email       VARCHAR(150),
  shop_image  TEXT,
  open_time   TIME,
  close_time  TIME,
  shop_status shop_status_enum DEFAULT 'Open',
  favorites   JSONB,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- TABLE: menu
CREATE TABLE IF NOT EXISTS menu (
  id           VARCHAR(40) PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  price        DECIMAL(10,2) NOT NULL DEFAULT 0,
  category     VARCHAR(60),
  image        TEXT,
  status       menu_status NOT NULL DEFAULT 'Available',
  shop_name    VARCHAR(100) NOT NULL,
  options      JSONB,
  is_recommend BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_menu_shop ON menu(shop_name);

-- TABLE: orders
CREATE TABLE IF NOT EXISTS orders (
  id         VARCHAR(30) PRIMARY KEY,
  user_id    VARCHAR(30) NOT NULL,
  items      JSONB NOT NULL,
  total      DECIMAL(10,2) NOT NULL DEFAULT 0,
  note       TEXT,
  status     order_status NOT NULL DEFAULT 'Waiting',
  slip_url   TEXT,
  shop_name  VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_shop ON orders(shop_name);
CREATE INDEX idx_orders_status ON orders(status);

-- TABLE: reviews
CREATE TABLE IF NOT EXISTS reviews (
  id         VARCHAR(40) PRIMARY KEY,
  order_id   VARCHAR(30) UNIQUE,
  shop_name  VARCHAR(100),
  user_id    VARCHAR(30),
  rating     SMALLINT NOT NULL DEFAULT 5,
  comment    TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reviews_shop ON reviews(shop_name);

-- TABLE: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         VARCHAR(40) PRIMARY KEY,
  user_id    VARCHAR(30) NOT NULL,
  title      VARCHAR(250) NOT NULL,
  message    TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notif_user ON notifications(user_id);

-- TABLE: news
CREATE TABLE IF NOT EXISTS news (
  id         VARCHAR(40) PRIMARY KEY,
  message    TEXT,
  status     news_status NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- TABLE: reports
CREATE TABLE IF NOT EXISTS reports (
  id         VARCHAR(40) PRIMARY KEY,
  user_id    VARCHAR(30),
  name       VARCHAR(100),
  type       VARCHAR(80),
  message    TEXT,
  contact    VARCHAR(150),
  status     report_status NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- SEED DATA
INSERT INTO users (id, password, name, nickname, phone, role, email) 
VALUES ('admin001', 'admin1234', 'ผู้ดูแลระบบ', 'Admin', '0800000000', 'Admin', 'admin@pbpvc.ac.th')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, password, name, nickname, phone, role, shop_name, email, shop_status)
VALUES ('merchant001', '1234', 'แม่ค้าร้านข้าว', 'พี่หน่อย', '0812345678', 'Merchant', 'ร้านข้าวแม่หน่อย', 'merchant@example.com', 'Open')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, password, name, nickname, phone, role, email)
VALUES ('66001', '1234', 'นักเรียนทดสอบ', 'น้องทดสอบ', '0898765432', 'Student', 'student@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu (id, name, price, category, status, shop_name, is_recommend)
VALUES 
  ('M001', 'ข้าวผัดกระเพรา', 40, 'Food', 'Available', 'ร้านข้าวแม่หน่อย', TRUE),
  ('M002', 'ข้าวมันไก่', 45, 'Food', 'Available', 'ร้านข้าวแม่หน่อย', FALSE),
  ('M003', 'ข้าวผัดหมู', 40, 'Food', 'Available', 'ร้านข้าวแม่หน่อย', FALSE)
ON CONFLICT (id) DO NOTHING;
