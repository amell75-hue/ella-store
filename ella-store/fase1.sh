#!/bin/bash
set -e
if [ ! -d "backend" ] || [ ! -d "database" ]; then
    echo "ERRO: corre este script a partir da pasta ella-store"
    exit 1
fi
echo "A criar migração da base de dados..."
cat > database/migration_fase1.sql <<'SQL_EOF'
USE ellas_store;
ALTER TABLE products
  ADD COLUMN product_type ENUM('own','affiliate') NOT NULL DEFAULT 'own' AFTER id,
  ADD COLUMN slug VARCHAR(250) NULL,
  ADD COLUMN sku VARCHAR(100) NULL,
  ADD COLUMN stock INT NULL,
  ADD COLUMN merchant_id INT NULL,
  ADD COLUMN affiliate_network_id INT NULL,
  ADD COLUMN affiliate_url TEXT NULL,
  ADD COLUMN external_product_id VARCHAR(150) NULL,
  ADD COLUMN tracking_id VARCHAR(150) NULL,
  ADD COLUMN commission_rate DECIMAL(5,2) NULL,
  ADD COLUMN original_price DECIMAL(10,2) NULL,
  ADD COLUMN discount_percent DECIMAL(5,2) NULL,
  ADD COLUMN category_id INT NULL,
  ADD COLUMN seo_title VARCHAR(160) NULL,
  ADD COLUMN seo_description VARCHAR(300) NULL;
CREATE TABLE IF NOT EXISTS merchants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    logo VARCHAR(300),
    website VARCHAR(300),
    active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS affiliate_networks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(200) UNIQUE,
    parent_id INT NULL,
    active TINYINT DEFAULT 1,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);
CREATE TABLE IF NOT EXISTS click_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NULL,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    ip_hash VARCHAR(64),
    user_agent VARCHAR(300),
    referrer VARCHAR(300),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
ALTER TABLE products
  ADD CONSTRAINT fk_products_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id),
  ADD CONSTRAINT fk_products_network FOREIGN KEY (affiliate_network_id) REFERENCES affiliate_networks(id),
  ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id);
SQL_EOF
mysql -u root < database/migration_fase1.sql
echo "Migração aplicada."
