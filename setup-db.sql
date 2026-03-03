CREATE DATABASE IF NOT EXISTS onlineassistant_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'onlineassistant_user'@'localhost' IDENTIFIED BY 'CHANGE_THIS_STRONG_PASSWORD_123!@#';
GRANT ALL PRIVILEGES ON onlineassistant_db.* TO 'onlineassistant_user'@'localhost';
FLUSH PRIVILEGES;
