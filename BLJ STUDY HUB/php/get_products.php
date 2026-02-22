<?php
header('Content-Type: application/json');
include 'db_connect.php';

$category = $_GET['category'] ?? '';
$sql = "SELECT * FROM products";

if ($category) {
    $category = mysqli_real_escape_string($conn, $category);
    $sql .= " WHERE category = '$category'";
}

$result = $conn->query($sql);
$products = [];

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
}

header('Content-Type: application/json');
echo json_encode($products);

$conn->close();
?>
