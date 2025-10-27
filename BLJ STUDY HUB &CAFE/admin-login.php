<?php
/**
 * Admin Login Handler
 * BLJ Study Hub & Cafe
 */

require_once __DIR__ . '/includes/auth.php';

header('Content-Type: application/json');

// Check if already logged in
$auth = new Auth();
if ($auth->isAdminLoggedIn()) {
    echo json_encode([
        'success' => true,
        'message' => 'Already logged in',
        'redirect' => 'admin-panel.html'
    ]);
    exit;
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // If not JSON, try form data
    if (!$input) {
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';
        $remember = isset($_POST['remember-me']);
    } else {
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        $remember = isset($input['remember']) && $input['remember'] === true;
    }

    // Validate input
    if (empty($username) || empty($password)) {
        echo json_encode([
            'success' => false,
            'message' => 'Please provide username and password'
        ]);
        exit;
    }

    // Attempt admin login
    $result = $auth->adminLogin($username, $password, $remember);
    
    if ($result['success']) {
        $result['redirect'] = 'admin-panel.html';
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