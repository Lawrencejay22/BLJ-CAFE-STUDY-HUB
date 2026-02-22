<?php
include 'db_connect.php';
$res = $conn->query("DESC products");
while($row = $res->fetch_assoc()) {
    echo $row['Field'] . " - " . $row['Type'] . "\n";
}
?>
