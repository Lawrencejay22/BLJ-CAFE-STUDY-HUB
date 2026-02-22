<?php
include 'php/db_connect.php';
function printCols($table, $conn) {
    echo "--- $table ---\n";
    $res = $conn->query("SHOW COLUMNS FROM $table");
    while($row = $res->fetch_assoc()) {
        echo $row['Field'] . "\n";
    }
}
printCols('orders', $conn);
printCols('bookings', $conn);
?>
