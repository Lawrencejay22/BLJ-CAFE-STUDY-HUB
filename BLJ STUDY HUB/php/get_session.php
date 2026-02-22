<?php
session_start();
header('Content-Type: application/json');

$response = [
    'logged_in' => isset($_SESSION['user_id']),
    'name' => $_SESSION['name'] ?? null,
    'role' => $_SESSION['role'] ?? null
];

echo json_encode($response);
?>
