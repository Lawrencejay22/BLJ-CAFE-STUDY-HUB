<?php
include 'db_connect.php';
$sql = "ALTER TABLE products ADD COLUMN is_available TINYINT(1) DEFAULT 1";
if ($conn->query($sql)) {
    echo "Column 'is_available' added successfully!";
} else {
    echo "Error adding column: " . $conn->error;
}
?>
