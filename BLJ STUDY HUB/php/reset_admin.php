<?php
include 'db_connect.php';

$username = 'admin';
$new_password = password_hash('admin_blj_2026', PASSWORD_DEFAULT);

$stmt = $conn->prepare("UPDATE users SET password = ? WHERE username = ? AND role = 'admin'");
$stmt->bind_param("ss", $new_password, $username);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo "<h1>Admin Password Reset Successful!</h1>";
        echo "<p>User: admin</p>";
        echo "<p>New Pass: admin_blj_2026</p>";
        echo "<a href='../admin-login.html'>Go to Admin Login</a>";
    } else {
        echo "<h1>No Admin Found</h1>";
        echo "<p>Check if the 'admin' user exists in your database.</p>";
    }
} else {
    echo "Error: " . $conn->error;
}
$stmt->close();
$conn->close();
?>
