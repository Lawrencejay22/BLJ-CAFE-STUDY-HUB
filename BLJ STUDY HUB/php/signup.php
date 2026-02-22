<?php
include 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $_POST['newName'];
    $lastname = $_POST['lastname'];
    $username = $_POST['newUsername'];
    $password = password_hash($_POST['newPassword'], PASSWORD_DEFAULT);

    // Use prepared statements
    $stmt = $conn->prepare("INSERT INTO users (name, lastname, username, password) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $name, $lastname, $username, $password);

    if ($stmt->execute()) {
        echo "<script>alert('Registration Successful!'); window.location.href='../Login.html';</script>";
    } else {
        echo "Error: " . $conn->error;
    }
    $stmt->close();
}
$conn->close();
?>
