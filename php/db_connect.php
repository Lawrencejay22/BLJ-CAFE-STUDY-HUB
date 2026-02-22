<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "blj_study_hub";

// Create connection
$conn = new mysqli($servername, $username, $password);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create database
$conn->query("CREATE DATABASE IF NOT EXISTS $dbname");
$conn->select_db($dbname);

// Set strict mode for testing
$conn->query("SET sql_mode = 'NO_ENGINE_SUBSTITUTION'");

/** 1. USERS TABLE **/
$conn->query("CREATE TABLE IF NOT EXISTS users (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (username),
    INDEX (role)
)");

/** 2. PRODUCTS TABLE **/
$conn->query("CREATE TABLE IF NOT EXISTS products (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    image_path VARCHAR(255) DEFAULT 'assets/image/image.png',
    is_available TINYINT(1) DEFAULT 1,
    INDEX (category)
)");

/** 3. ORDERS TABLE **/
$conn->query("CREATE TABLE IF NOT EXISTS orders (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NULL,
    customer_name VARCHAR(100) NOT NULL,
    delivery_address TEXT,
    phone_number VARCHAR(20),
    total_amount DECIMAL(10, 2) NOT NULL,
    order_status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (order_status),
    INDEX (order_date)
)");

/** 4. ORDER_ITEMS TABLE **/
$conn->query("CREATE TABLE IF NOT EXISTS order_items (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    order_id INT(11) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT(11) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX (order_id)
)");

/** 5. BOOKINGS TABLE (THE FIXED VERSION) **/
$conn->query("CREATE TABLE IF NOT EXISTS bookings (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NULL,
    order_id INT(11) NULL,
    customer_name VARCHAR(100) NOT NULL,
    room_type VARCHAR(100) NOT NULL,
    reservation_date DATE NOT NULL,
    check_in_time TIME NOT NULL,
    duration INT(11) NOT NULL,
    pax INT(11) NOT NULL,
    total_price DECIMAL(10,2) DEFAULT 0,
    status ENUM('active', 'used', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (reservation_date),
    INDEX (status),
    INDEX (order_id)
)");

// Dynamic Schema Fixes
$conn->query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS order_id INT(11) NULL AFTER user_id");
$conn->query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status ENUM('active', 'used', 'cancelled') DEFAULT 'active' AFTER total_price");

// Dynamic Schema Fixes (Ensure old databases are upgraded)
$conn->query("ALTER TABLE users ADD COLUMN IF NOT EXISTS lastname VARCHAR(100) NOT NULL AFTER name");
$conn->query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id INT(11) NULL AFTER id");
$conn->query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100) NOT NULL AFTER user_id");
$conn->query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) DEFAULT 0 AFTER pax");

/** 6. SEED DATA **/
// Default Admin
$res = $conn->query("SELECT COUNT(*) as count FROM users");
if ($res && $res->fetch_assoc()['count'] == 0) {
    $pass = password_hash('admin_blj_2026', PASSWORD_DEFAULT);
    $conn->query("INSERT INTO users (name, lastname, username, password, role) 
                  VALUES ('Admin', 'Root', 'admin', '$pass', 'admin')");
}

// Default Products
$prodRes = $conn->query("SELECT COUNT(*) as count FROM products");
if ($prodRes && $prodRes->fetch_assoc()['count'] == 0) {
    $conn->query("INSERT INTO products (name, description, price, category, image_path) VALUES 
        ('Iced Americano', 'Pure espresso with chilled water', 95.00, 'Coffee', 'assets/image/image.png'),
        ('Spanish Latte', 'Sweetened creamy espresso', 125.00, 'Coffee', 'assets/image/image.png'),
        ('Caramel Macchiato', 'Rich espresso with caramel drizzle', 135.00, 'Coffee', 'assets/image/image.png'),
        ('Chocolate Chip Cookie', 'Homemade chewy cookie', 45.00, 'Snack', 'assets/image/image.png'),
        ('Ham & Cheese Sandwich', 'Toasted classic sandwich', 85.00, 'Snack', 'assets/image/image.png'),
        ('Quiet Solo Pod', 'Privacy focused workspace for one', 60.00, 'Study Hub', 'assets/image/image.png'),
        ('Group Study Room', 'Large room with whiteboard', 250.00, 'Study Hub', 'assets/image/image.png'),
        ('Premium Fiber Wifi', 'One day high-speed access', 50.00, 'Wifi', 'assets/image/image.png'),
        ('Printing B&W', 'Per page black and white', 5.00, 'Printing', 'assets/image/image.png'),
        ('Printing Color', 'Per page full color', 15.00, 'Printing', 'assets/image/image.png'),
        ('Nap Room Access', '1 hour relaxation access', 100.00, 'Amenities', 'assets/image/image.png'),
        ('Charging Room', '1 hour fast charging access', 30.00, 'Printing', 'assets/image/image.png')");
}
?>
