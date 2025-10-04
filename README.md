# Backend puhelinluettelo sovellukselle

-- Luo tietokanta
CREATE DATABASE IF NOT EXISTS phonebook
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE phonebook;

-- Luo taulu: contacts
CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  city VARCHAR(100)
);

-- Dummy data contacts
INSERT INTO contacts (name, phone, city) VALUES
('Seppo Taalasmaa', '0401234567', 'Joensuu'),
('Kalle Laitela', '0509876543', 'Tampere'),
('Ulla Taalasmaa', '0441112223', 'Turku');

-- Luo taulu: companies
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(50),
  city VARCHAR(100)
);

-- Dummy data companies
INSERT INTO companies (name, phone, city) VALUES
('Kentauri', '010123456', 'Joensuu'),
('Taalasmaa Putki Oy', '020987654', 'Kuopio'),
('Ismo´s Bar', '030555444', 'Tampere');

-- Luo taulu: yellow_pages
CREATE TABLE IF NOT EXISTS yellow_pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  city VARCHAR(100),
  phone VARCHAR(50)
);

-- Dummy data yellow_pages
INSERT INTO yellow_pages (item_name, description, price, city, phone) VALUES
('Polkupyörä', 'Hyväkuntoinen käytetty polkupyörä.', 120.00, 'Joensuu', '0405551111'),
('Sohva', 'Kolmen istuttava harmaa sohva.', 250.00, 'Helsinki', '0456667777'),
('Kitara', 'Akustinen kitara.', 90.00, 'Turku', '0468889999');
