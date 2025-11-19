-- Создание таблицы properties
CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  shortDescription VARCHAR(500) NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  area DECIMAL(10, 2) NOT NULL,
  location VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  type ENUM('Жилые помещения', 'Нежилые помещения', 'Машино-места', 'Гараж-боксы') NOT NULL,
  transactionType ENUM('Продажа', 'Аренда') NOT NULL,
  investmentReturn DECIMAL(5, 2),
  images JSON NOT NULL,
  isFeatured BOOLEAN DEFAULT FALSE,
  layout VARCHAR(500),
  rooms INT,
  bathrooms INT,
  parking BOOLEAN DEFAULT FALSE,
  balcony BOOLEAN DEFAULT FALSE,
  elevator BOOLEAN DEFAULT FALSE,
  furnished BOOLEAN DEFAULT FALSE,
  views INT DEFAULT 0,
  submissions INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_transaction_type (transactionType),
  INDEX idx_price (price),
  INDEX idx_area (area),
  INDEX idx_is_featured (isFeatured),
  INDEX idx_created_at (created_at),
  INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создание таблицы admins
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(255) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  lastLogin TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

