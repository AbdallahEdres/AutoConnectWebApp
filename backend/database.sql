-- 1. Categories Table (Self-joining for subcategories)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    category_id INT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 2. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fname VARCHAR(100) NOT NULL,
    lname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'client',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Vehicle Types Table
CREATE TABLE vehicle_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- 4. Providers Table
CREATE TABLE providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    bio TEXT,
    city VARCHAR(100),
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- 5. Tagged With (Pivot table: Providers <-> Vehicle Types)
CREATE TABLE tagged_with (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    vehicle_type_id INT NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id) ON DELETE CASCADE
);

-- 6. Provider Photos Table
CREATE TABLE provider_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    photo_url VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    provider_id INT NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- 7. Working Hours Table
CREATE TABLE working_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day VARCHAR(20) NOT NULL,
    open_time TIME,
    close_time TIME,
    is_close TINYINT(1) DEFAULT 0,
    provider_id INT NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- 8. Reviews Table
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comment TEXT,
    rate INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    provider_id INT NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Saves Table (Bookmarks)
CREATE TABLE saves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- ==========================================
-- INSERTING DUMMY DATA
-- ==========================================

-- Insert Categories
INSERT INTO categories (id, name, slug, category_id) VALUES
(1, 'Technician', 'technician', NULL),
(2, 'Rescue Winches', 'rescue-winches', NULL),
(3, 'Spare Parts Stores', 'spare-parts', NULL),
(4, 'Mechanics', 'mechanics', 1),   -- Child of Technician
(5, 'Electrician', 'electrician', 1); -- Child of Technician

-- Insert Users (Mock passwords for simplicity)
INSERT INTO users (id, fname, lname, email, password, phone, role) VALUES
(1, 'Ahmed', 'Ali', 'ahmed@example.com', '123456', '01000000000', 'provider'),
(2, 'Mohamed', 'Omar', 'mohamed@example.com', '123456', '01111111111', 'provider'),
(3, 'Sara', 'Kamal', 'sara@example.com', '123456', '01222222222', 'client');

-- Insert Vehicle Types
INSERT INTO vehicle_types (id, name) VALUES
(1, 'Sedan'), 
(2, 'SUV'), 
(3, 'Truck'), 
(4, 'Motorcycle');

-- Insert Providers
INSERT INTO providers (id, name, phone, address, city, user_id, category_id) VALUES
(1, 'Ahmed Auto Repair', '01000000000', '10 Main St', 'Cairo', 1, 4),  -- Mechanic
(2, 'Fast Rescue Winch', '01111111111', 'Ring Road', 'Giza', 2, 2);  -- Rescue Winch

-- Insert tagged_with (Providers supporting specific vehicles)
INSERT INTO tagged_with (provider_id, vehicle_type_id) VALUES
(1, 1), -- Ahmed Auto Repair supports Sedan
(1, 2), -- Ahmed Auto Repair supports SUV
(2, 1), -- Fast Rescue Winch supports Sedan
(2, 3); -- Fast Rescue Winch supports Truck
