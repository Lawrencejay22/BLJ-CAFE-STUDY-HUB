<?php
include 'db_connect.php';
header('Content-Type: application/json');

// Create bookings table if it doesn't exist
$booking_table = "CREATE TABLE IF NOT EXISTS bookings (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NULL,
    customer_name VARCHAR(100) NOT NULL,
    room_type VARCHAR(100) NOT NULL,
    reservation_date DATE NOT NULL,
    check_in_time TIME NOT NULL,
    duration INT(11) NOT NULL,
    pax INT(11) NOT NULL,
    status ENUM('active', 'used', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";
$conn->query($booking_table);

session_start();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    $customer_name = isset($_SESSION['name']) ? $_SESSION['name'] : 'Guest';

    $roomType = mysqli_real_escape_string($conn, $_POST['roomType']);
    $date = mysqli_real_escape_string($conn, $_POST['date']);
    $time = mysqli_real_escape_string($conn, $_POST['time']);
    $duration = intval($_POST['duration']);
    $pax = intval($_POST['pax']);

    $stmt = $conn->prepare("INSERT INTO bookings (user_id, customer_name, room_type, reservation_date, check_in_time, duration, pax) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("issssii", $user_id, $customer_name, $roomType, $date, $time, $duration, $pax);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
    $stmt->close();
}
$conn->close();
?>
