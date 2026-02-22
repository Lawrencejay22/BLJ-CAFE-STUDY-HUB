<?php
include 'php/db_connect.php';
$res = $conn->query("SELECT * FROM bookings");
$data = [];
while($row = $res->fetch_assoc()) $data[] = $row;
echo json_encode($data);
?>
