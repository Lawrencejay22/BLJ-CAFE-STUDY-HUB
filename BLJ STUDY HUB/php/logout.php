<?php
session_start();
$redirect = "../Login.html";
if (isset($_SESSION['role']) && $_SESSION['role'] === 'admin') {
    $redirect = "../admin-login.html";
}

session_unset();
session_destroy();
header("Location: $redirect");
exit();
?>
