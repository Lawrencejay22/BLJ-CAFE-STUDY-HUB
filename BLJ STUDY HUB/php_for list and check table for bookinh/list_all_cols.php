<?php
include 'php/db_connect.php';
$res = $conn->query("SHOW COLUMNS FROM orders");
$cols = [];
while($row = $res->fetch_assoc()) $cols[] = $row['Field'];
echo "Orders: " . implode(", ", $cols) . "\n";

$res = $conn->query("SHOW COLUMNS FROM bookings");
$cols = [];
while($row = $res->fetch_assoc()) $cols[] = $row['Field'];
echo "Bookings: " . implode(", ", $cols) . "\n";
?>
