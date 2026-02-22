<?php
include 'php/db_connect.php';
$res = $conn->query("DESCRIBE bookings");
while($row = $res->fetch_assoc()) {
    echo $row['Field'] . " (" . $row['Type'] . ")\n";
}
?>
