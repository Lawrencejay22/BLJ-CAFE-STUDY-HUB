<?php
/**
 * User Sign In Handler
 * BLJ Study Hub & Cafe
 */

require_once __DIR__ . '/includes/auth.php';

header('Content-Type: application/json');

// Check if already logged in
$auth = new Auth();
if ($auth->isLoggedIn()) {
    echo json_encode([
        'success' => true,
        'message' => 'Already logged in',
        'redirect' => 'BLJ Study hub & Cafe.html'
    ]);
    exit;
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Get form data
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $remember = isset($input['remember']) && $input['remember'] === true;

    // Validate input
    if (empty($username) || empty($password)) {
        echo json_encode([
            'success' => false,
            'message' => 'Please provide username and password'
        ]);
        exit;
    }

    // Attempt login
    $result = $auth->login($username, $password, $remember);
    
    if ($result['success']) {
        $result['redirect'] = 'BLJ Study hub & Cafe.html';
    }
    
    echo json_encode($result);
    exit;
}

// Invalid request method
echo json_encode([
    'success' => false,
    'message' => 'Invalid request method'
]);
?>