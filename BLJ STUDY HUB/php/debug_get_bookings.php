<?php
$_SESSION['role'] = 'admin'; // Mock admin session
include 'php/admin_data.php'; 
include 'php/db_connect.php';
$bookings = [];
$result = $conn->query("SELECT * FROM bookings ORDER BY created_at DESC");
while ($row = $result->fetch_assoc()) {
    $bookings[] = $row;
}
echo json_encode($bookings);
?>
