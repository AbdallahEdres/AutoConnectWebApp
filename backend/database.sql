CREATE DATABASE IF NOT EXISTS autoconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE autoconnect;

-- 1. Categories Table (Self-joining for subcategories)
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    category_id INT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS vehicle_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL
);

-- 4. Providers Table
CREATE TABLE IF NOT EXISTS providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_en TEXT,
    address_ar TEXT,
    bio_en TEXT,
    bio_ar TEXT,
    city_en VARCHAR(100),
    city_ar VARCHAR(100),
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
CREATE TABLE IF NOT EXISTS tagged_with (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    vehicle_type_id INT NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id) ON DELETE CASCADE
);

-- 6. Provider Photos Table
CREATE TABLE IF NOT EXISTS provider_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    photo_url VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    provider_id INT NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- 7. Working Hours Table
CREATE TABLE IF NOT EXISTS working_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day VARCHAR(20) NOT NULL,
    open_time TIME,
    close_time TIME,
    is_close TINYINT(1) DEFAULT 0,
    provider_id INT NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- 8. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comment TEXT,
    rate INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    provider_id INT NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- 10. Saves Table (Bookmarks)
CREATE TABLE IF NOT EXISTS saves (
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
INSERT IGNORE INTO categories (id, name_en, name_ar, slug, category_id) VALUES
(1, 'Technician',          'فني',               'technician',   NULL),
(2, 'Rescue Winches',      'ونش إنقاذ',         'rescue-winches', NULL),
(3, 'Spare Parts Stores',  'محلات قطع غيار',    'spare-parts',  NULL),
(4, 'Mechanics',           'ميكانيكي',          'mechanics',    1),
(5, 'Electrician',         'كهربائي',           'electrician',  1);

-- Insert Users (Mock passwords for simplicity)
INSERT IGNORE INTO users (id, fname, lname, email, password, phone, role) VALUES
(1, 'Ahmed',   'Ali',   'ahmed@example.com',   '123456', '01000000000', 'provider'),
(2, 'Mohamed', 'Omar',  'mohamed@example.com', '123456', '01111111111', 'provider'),
(3, 'Sara',    'Kamal', 'sara@example.com',    '123456', '01222222222', 'client'),
(4, 'Mostafa', 'Hassan', 'mostafa.garage@example.com', '123456', '01010001001', 'provider'),
(5, 'Mariam',  'Nabil',  'mariam.motocare@example.com', '123456', '01010001002', 'provider'),
(6, 'Youssef', 'Samir',  'youssef.auto@example.com', '123456', '01010001003', 'provider'),
(7, 'Hany',    'Fawzy',  'hany.electric@example.com', '123456', '01010001004', 'provider'),
(8, 'Karim',   'Adel',   'karim.moto@example.com', '123456', '01010001005', 'provider'),
(9, 'Nour',    'Tarek',  'nour.service@example.com', '123456', '01010001006', 'provider'),
(10, 'Ibrahim', 'Sayed', 'ibrahim.road@example.com', '123456', '01010001007', 'provider'),
(11, 'Omar',   'Maher',  'omar.october@example.com', '123456', '01010001008', 'provider'),
(12, 'Dina',   'Ashraf', 'dina.alex@example.com', '123456', '01010001009', 'provider'),
(13, 'Mahmoud', 'Reda',  'mahmoud.delta@example.com', '123456', '01010001010', 'provider');

-- Insert Vehicle Types
INSERT IGNORE INTO vehicle_types (id, name_en, name_ar) VALUES
(1, 'Sedan',      'سيدان'),
(2, 'SUV',        'دفع رباعي'),
(3, 'Truck',      'شاحنة'),
(4, 'Motorcycle', 'دراجة نارية');

-- Insert Providers
INSERT INTO providers (id, name_en, name_ar, phone, address_en, address_ar, bio_en, bio_ar, city_en, city_ar, lat, lng, status, user_id, category_id) VALUES
(1, 'Ahmed Auto Repair', 'أحمد لإصلاح السيارات', '01000000000', '10 Main St', '١٠ الشارع الرئيسي', 'Routine maintenance, engines, and diagnostics.', 'صيانة دورية ومحركات وفحص كمبيوتر.', 'Cairo', 'القاهرة', 30.04440000, 31.23570000, 'active', 1, 4),
(2, 'Fast Rescue Winch', 'ونش الإنقاذ السريع',   '01111111111', 'Ring Road',  'الطريق الدائري',    'Fast towing and roadside rescue.', 'ونش سريع وخدمة إنقاذ على الطريق.', 'Giza',  'الجيزة',  30.01310000, 31.20890000, 'active', 2, 2),
(3, 'Nasr City Motors', 'ناسـر سيتي موتورز', '01010001001', 'Abbas El Akkad St, Nasr City', 'شارع عباس العقاد، مدينة نصر', 'Car engine repair, brakes, suspension, and computer diagnostics.', 'إصلاح محركات السيارات والفرامل والعفشة وفحص الكمبيوتر.', 'Cairo', 'القاهرة', 30.06260000, 31.34000000, 'active', 4, 4),
(4, 'Maadi Bike & Auto Garage', 'معادي بايك وأوتو جراج', '01010001002', 'Road 9, Maadi', 'شارع ٩، المعادي', 'Mixed car and motorcycle garage for oil changes, tires, and quick maintenance.', 'جراج سيارات وموتوسيكلات لتغيير الزيت والإطارات والصيانة السريعة.', 'Cairo', 'القاهرة', 29.96020000, 31.25690000, 'active', 5, 4),
(5, 'Alex Desert Road Garage', 'جراج طريق إسكندرية الصحراوي', '01010001003', 'Alexandria Desert Road, Al Amreya', 'طريق الإسكندرية الصحراوي، العامرية', 'Roadside-friendly car repair, cooling systems, and transmission checks.', 'إصلاح سيارات قريب من الطريق وأنظمة تبريد وفحص فتيس.', 'Alexandria', 'الإسكندرية', 31.16560000, 29.88020000, 'active', 6, 4),
(6, 'Zagazig Auto Electric', 'زقازيق أوتو كهرباء', '01010001004', 'El Galaa St, Zagazig', 'شارع الجلاء، الزقازيق', 'Auto electrical repairs, batteries, alternators, sensors, and ECU scans.', 'كهرباء سيارات وبطاريات ودينامو وحساسات وفحص كمبيوتر.', 'Zagazig', 'الزقازيق', 30.58770000, 31.50200000, 'active', 7, 5),
(7, 'Mansoura MotoCare', 'المنصورة موتو كير', '01010001005', 'El Gomhoria St, Mansoura', 'شارع الجمهورية، المنصورة', 'Motorcycle specialist for scooters, delivery bikes, chains, brakes, and tuning.', 'متخصص موتوسيكلات وسكوتر ودراجات دليفري وسلاسل وفرامل وضبط.', 'Mansoura', 'المنصورة', 31.04090000, 31.37850000, 'active', 8, 4),
(8, 'Tanta Gear Garage', 'طنطا جير جراج', '01010001006', 'El Bahr St, Tanta', 'شارع البحر، طنطا', 'Manual and automatic gearbox service, clutch repairs, and general mechanics.', 'صيانة فتيس مانيوال وأوتوماتيك ودبرياج وميكانيكا عامة.', 'Tanta', 'طنطا', 30.78650000, 31.00040000, 'active', 9, 4),
(9, 'Hurghada Road Service', 'الغردقة رود سيرفيس', '01010001007', 'El Nasr Road, Hurghada', 'طريق النصر، الغردقة', 'Tourist-area car service, AC repair, tires, and emergency checks.', 'خدمة سيارات في المناطق السياحية وتكييف وإطارات وفحص طوارئ.', 'Hurghada', 'الغردقة', 27.25790000, 33.81160000, 'active', 10, 4),
(10, '6 October Riders Garage', 'جراج رايدرز ٦ أكتوبر', '01010001008', 'Central Axis, 6th of October', 'المحور المركزي، ٦ أكتوبر', 'Motorcycle and car quick service near 6 October and Sheikh Zayed.', 'خدمة سريعة للموتوسيكلات والسيارات قرب ٦ أكتوبر والشيخ زايد.', '6th of October', '٦ أكتوبر', 29.92850000, 30.91880000, 'active', 11, 4),
(11, 'Alex Moto Clinic', 'إسكندرية موتو كلينك', '01010001009', 'Sidi Gaber, Alexandria', 'سيدي جابر، الإسكندرية', 'Motorcycle diagnostics, carburetor cleaning, injection systems, and brakes.', 'تشخيص موتوسيكلات وتنظيف كربراتير وأنظمة حقن وفرامل.', 'Alexandria', 'الإسكندرية', 31.21810000, 29.94200000, 'active', 12, 4),
(12, 'Asyut Auto Works', 'أسيوط أوتو ووركس', '01010001010', 'El Hilaly St, Asyut', 'شارع الهلالي، أسيوط', 'Upper Egypt garage for engine overhaul, suspension, oil, and inspection.', 'جراج في الصعيد لعمرة المحركات والعفشة والزيوت والفحص.', 'Asyut', 'أسيوط', 27.18010000, 31.18370000, 'active', 13, 4)
ON DUPLICATE KEY UPDATE
    name_en = VALUES(name_en),
    name_ar = VALUES(name_ar),
    phone = VALUES(phone),
    address_en = VALUES(address_en),
    address_ar = VALUES(address_ar),
    bio_en = VALUES(bio_en),
    bio_ar = VALUES(bio_ar),
    city_en = VALUES(city_en),
    city_ar = VALUES(city_ar),
    lat = VALUES(lat),
    lng = VALUES(lng),
    status = VALUES(status),
    user_id = VALUES(user_id),
    category_id = VALUES(category_id);

-- Reset seeded child rows so repeated imports do not duplicate photos, hours, tags, saves, or reviews.
DELETE FROM tagged_with WHERE provider_id BETWEEN 1 AND 12;
DELETE FROM provider_photos WHERE provider_id BETWEEN 1 AND 12;
DELETE FROM working_hours WHERE provider_id BETWEEN 1 AND 12;
DELETE FROM reviews WHERE id BETWEEN 1 AND 12;
DELETE FROM saves WHERE user_id = 3 AND provider_id BETWEEN 1 AND 12;

-- Insert tagged_with (Providers supporting specific vehicles)
INSERT IGNORE INTO tagged_with (provider_id, vehicle_type_id) VALUES
(1, 1),
(1, 2),
(2, 1),
(2, 3),
(3, 1),
(3, 2),
(4, 1),
(4, 4),
(5, 1),
(5, 2),
(6, 1),
(7, 4),
(8, 1),
(8, 2),
(9, 1),
(9, 2),
(10, 1),
(10, 4),
(11, 4),
(12, 1),
(12, 2);

-- Insert provider photos
INSERT IGNORE INTO provider_photos (provider_id, photo_url, sort_order) VALUES
(1, 'assets/images/الخدمه.png', 1),
(2, 'assets/images/طوارئ.png', 1),
(3, 'assets/images/الخدمات.png', 1),
(4, 'assets/images/الصفحه الرئيسيه.png', 1),
(5, 'assets/images/الخدمه.png', 1),
(6, 'assets/images/الخدمات.png', 1),
(7, 'assets/images/الصفحه الرئيسيه.png', 1),
(8, 'assets/images/الخدمه.png', 1),
(9, 'assets/images/طوارئ.png', 1),
(10, 'assets/images/المفضله.png', 1),
(11, 'assets/images/الصفحه الرئيسيه.png', 1),
(12, 'assets/images/الخدمات.png', 1);

-- Insert working hours
INSERT IGNORE INTO working_hours (provider_id, day, open_time, close_time, is_close) VALUES
(1, 'Saturday',  '09:00:00', '18:00:00', 0),
(1, 'Sunday',    '09:00:00', '18:00:00', 0),
(1, 'Monday',    '09:00:00', '18:00:00', 0),
(1, 'Tuesday',   '09:00:00', '18:00:00', 0),
(1, 'Wednesday', '09:00:00', '18:00:00', 0),
(1, 'Thursday',  '09:00:00', '18:00:00', 0),
(1, 'Friday',    NULL,       NULL,       1),
(2, 'Saturday',  '00:00:00', '23:59:00', 0),
(2, 'Sunday',    '00:00:00', '23:59:00', 0),
(2, 'Monday',    '00:00:00', '23:59:00', 0),
(2, 'Tuesday',   '00:00:00', '23:59:00', 0),
(2, 'Wednesday', '00:00:00', '23:59:00', 0),
(2, 'Thursday',  '00:00:00', '23:59:00', 0),
(2, 'Friday',    '00:00:00', '23:59:00', 0),
(3, 'Saturday',  '09:00:00', '20:00:00', 0),
(3, 'Sunday',    '09:00:00', '20:00:00', 0),
(3, 'Monday',    '09:00:00', '20:00:00', 0),
(3, 'Tuesday',   '09:00:00', '20:00:00', 0),
(3, 'Wednesday', '09:00:00', '20:00:00', 0),
(3, 'Thursday',  '09:00:00', '20:00:00', 0),
(3, 'Friday',    '13:00:00', '19:00:00', 0),
(4, 'Saturday',  '10:00:00', '22:00:00', 0),
(4, 'Sunday',    '10:00:00', '22:00:00', 0),
(4, 'Monday',    '10:00:00', '22:00:00', 0),
(4, 'Tuesday',   '10:00:00', '22:00:00', 0),
(4, 'Wednesday', '10:00:00', '22:00:00', 0),
(4, 'Thursday',  '10:00:00', '22:00:00', 0),
(4, 'Friday',    NULL,       NULL,       1),
(5, 'Saturday',  '08:30:00', '18:30:00', 0),
(5, 'Sunday',    '08:30:00', '18:30:00', 0),
(5, 'Monday',    '08:30:00', '18:30:00', 0),
(5, 'Tuesday',   '08:30:00', '18:30:00', 0),
(5, 'Wednesday', '08:30:00', '18:30:00', 0),
(5, 'Thursday',  '08:30:00', '18:30:00', 0),
(5, 'Friday',    NULL,       NULL,       1),
(6, 'Saturday',  '09:00:00', '19:00:00', 0),
(6, 'Sunday',    '09:00:00', '19:00:00', 0),
(6, 'Monday',    '09:00:00', '19:00:00', 0),
(6, 'Tuesday',   '09:00:00', '19:00:00', 0),
(6, 'Wednesday', '09:00:00', '19:00:00', 0),
(6, 'Thursday',  '09:00:00', '19:00:00', 0),
(6, 'Friday',    '14:00:00', '18:00:00', 0),
(7, 'Saturday',  '11:00:00', '23:00:00', 0),
(7, 'Sunday',    '11:00:00', '23:00:00', 0),
(7, 'Monday',    '11:00:00', '23:00:00', 0),
(7, 'Tuesday',   '11:00:00', '23:00:00', 0),
(7, 'Wednesday', '11:00:00', '23:00:00', 0),
(7, 'Thursday',  '11:00:00', '23:00:00', 0),
(7, 'Friday',    '15:00:00', '23:00:00', 0),
(8, 'Saturday',  '09:00:00', '18:00:00', 0),
(8, 'Sunday',    '09:00:00', '18:00:00', 0),
(8, 'Monday',    '09:00:00', '18:00:00', 0),
(8, 'Tuesday',   '09:00:00', '18:00:00', 0),
(8, 'Wednesday', '09:00:00', '18:00:00', 0),
(8, 'Thursday',  '09:00:00', '18:00:00', 0),
(8, 'Friday',    NULL,       NULL,       1),
(9, 'Saturday',  '08:00:00', '22:00:00', 0),
(9, 'Sunday',    '08:00:00', '22:00:00', 0),
(9, 'Monday',    '08:00:00', '22:00:00', 0),
(9, 'Tuesday',   '08:00:00', '22:00:00', 0),
(9, 'Wednesday', '08:00:00', '22:00:00', 0),
(9, 'Thursday',  '08:00:00', '22:00:00', 0),
(9, 'Friday',    '10:00:00', '22:00:00', 0),
(10, 'Saturday',  '10:00:00', '21:00:00', 0),
(10, 'Sunday',    '10:00:00', '21:00:00', 0),
(10, 'Monday',    '10:00:00', '21:00:00', 0),
(10, 'Tuesday',   '10:00:00', '21:00:00', 0),
(10, 'Wednesday', '10:00:00', '21:00:00', 0),
(10, 'Thursday',  '10:00:00', '21:00:00', 0),
(10, 'Friday',    '13:00:00', '21:00:00', 0),
(11, 'Saturday',  '10:30:00', '22:30:00', 0),
(11, 'Sunday',    '10:30:00', '22:30:00', 0),
(11, 'Monday',    '10:30:00', '22:30:00', 0),
(11, 'Tuesday',   '10:30:00', '22:30:00', 0),
(11, 'Wednesday', '10:30:00', '22:30:00', 0),
(11, 'Thursday',  '10:30:00', '22:30:00', 0),
(11, 'Friday',    NULL,       NULL,       1),
(12, 'Saturday',  '09:00:00', '19:30:00', 0),
(12, 'Sunday',    '09:00:00', '19:30:00', 0),
(12, 'Monday',    '09:00:00', '19:30:00', 0),
(12, 'Tuesday',   '09:00:00', '19:30:00', 0),
(12, 'Wednesday', '09:00:00', '19:30:00', 0),
(12, 'Thursday',  '09:00:00', '19:30:00', 0),
(12, 'Friday',    '14:00:00', '19:30:00', 0);

-- Insert reviews
INSERT IGNORE INTO reviews (id, provider_id, user_id, rate, comment) VALUES
(1, 1, 3, 5, 'Fast and professional service.'),
(2, 2, 3, 4, 'Arrived quickly and helped on the road.'),
(3, 3, 3, 5, 'Good diagnostics and clear pricing.'),
(4, 4, 3, 5, 'Very useful for my scooter and family car.'),
(5, 5, 3, 4, 'Convenient stop near the desert road.'),
(6, 6, 3, 5, 'Fixed my battery issue quickly.'),
(7, 7, 3, 4, 'Great for motorcycle brake service.'),
(8, 8, 3, 4, 'Helpful gearbox inspection.'),
(9, 9, 3, 5, 'Saved our trip in Hurghada.'),
(10, 10, 3, 5, 'Quick oil change and chain adjustment.'),
(11, 11, 3, 4, 'Good motorcycle diagnostics.'),
(12, 12, 3, 5, 'Professional team in Asyut.');

-- Insert saved providers
INSERT IGNORE INTO saves (user_id, provider_id) VALUES
(3, 1),
(3, 2),
(3, 4),
(3, 7),
(3, 10);
