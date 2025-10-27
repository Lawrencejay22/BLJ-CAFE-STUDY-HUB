<?php
/**
 * Logout Handler
 * BLJ Study Hub & Cafe
 */

require_once __DIR__ . '/includes/auth.php';

$auth = new Auth();
$result = $auth->logout();

// Clear remember me cookie
if (isset($_COOKIE['remember_token'])) {
    setcookie('remember_token', '', time() - 3600, '/', '', false, true);
}

// Return JSON response
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully',
    'redirect' => 'homepage.html'
]);
?>