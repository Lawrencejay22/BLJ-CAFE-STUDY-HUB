<?php
session_start();
include 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Determine if this is an Admin or User login attempt based on the field names
    $is_admin_attempt = isset($_POST['admin_username']);
    
    $username = $is_admin_attempt ? $_POST['admin_username'] : $_POST['username'];
    $password = $is_admin_attempt ? $_POST['admin_password'] : $_POST['password'];

    // Use prepared statements to prevent SQL Injection
    $stmt = $conn->prepare("SELECT id, name, password, role, username FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        
        // Strict Separation Logic:
        if ($is_admin_attempt && $row['role'] !== 'admin') {
            echo "<script>alert('Denied: This portal is for Admins only.'); window.location.href='../admin-login.html';</script>";
            exit();
        }
        
        if (!$is_admin_attempt && $row['role'] === 'admin') {
            echo "<script>alert('Admins must log in through the secure Admin Portal.'); window.location.href='../Login.html';</script>";
            exit();
        }

        if (password_verify($password, $row['password'])) {
            $_SESSION['user_id'] = $row['id'];
            $_SESSION['name'] = $row['name'];
            $_SESSION['username'] = $row['username'];
            $_SESSION['role'] = $row['role'];

            if ($row['role'] == 'admin') {
                header("Location: ../admin.html");
            } else {
                header("Location: ../index.html");
            }
            exit();
        } else {
            $error_redirect = $is_admin_attempt ? '../admin-login.html' : '../Login.html';
            echo "<script>alert('Invalid Password'); window.location.href='$error_redirect';</script>";
        }
    } else {
        $error_redirect = $is_admin_attempt ? '../admin-login.html' : '../Login.html';
        echo "<script>alert('User not found'); window.location.href='$error_redirect';</script>";
    }
    $stmt->close();
}
$conn->close();
?>
