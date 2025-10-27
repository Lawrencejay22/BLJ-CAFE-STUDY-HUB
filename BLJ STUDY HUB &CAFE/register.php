<?php
/**
 * User Registration Handler
 * BLJ Study Hub & Cafe
 */

require_once __DIR__ . '/includes/auth.php';

header('Content-Type: application/json');

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Get form data
    $username = $input['username'] ?? '';
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $confirm_password = $input['confirm_password'] ?? '';
    $full_name = $input['full_name'] ?? '';
    $phone = $input['phone'] ?? '';

    // Validate input
    if (empty($username) || empty($email) || empty($password)) {
        echo json_encode([
            'success' => false,
            'message' => 'Please fill in all required fields'
        ]);
        exit;
    }

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email address'
        ]);
        exit;
    }

    // Validate password length
    if (strlen($password) < 6) {
        echo json_encode([
            'success' => false,
            'message' => 'Password must be at least 6 characters long'
        ]);
        exit;
    }

    // Check password confirmation
    if ($password !== $confirm_password) {
        echo json_encode([
            'success' => false,
            'message' => 'Passwords do not match'
        ]);
        exit;
    }

    // Attempt registration
    $auth = new Auth();
    $result = $auth->register($username, $email, $password, $full_name, $phone);
    
    if ($result['success']) {
        $result['redirect'] = 'signin.html';
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