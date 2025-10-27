<?php
/**
 * Admin Users Management API
 * BLJ Study Hub & Cafe
 */

require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../config/database.php';

header('Content-Type: application/json');

// Check admin authentication
$auth = new Auth();
if (!$auth->isAdminLoggedIn()) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized access'
    ]);
    exit;
}

$db = new Database();
$conn = $db->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get all users or specific user
            if (isset($_GET['id'])) {
                $user_id = $_GET['id'];
                $query = "SELECT id, username, email, full_name, phone, role, status, 
                         created_at, updated_at, last_login 
                         FROM users 
                         WHERE id = :id";
                $stmt = $conn->prepare($query);
                $stmt->bindParam(':id', $user_id);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    echo json_encode([
                        'success' => true,
                        'data' => $stmt->fetch()
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'User not found'
                    ]);
                }
            } else {
                // Get all users with pagination
                $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
                $offset = ($page - 1) * $limit;
                $search = $_GET['search'] ?? '';

                $where = '';
                if (!empty($search)) {
                    $where = "WHERE username LIKE :search OR email LIKE :search OR full_name LIKE :search";
                }

                $query = "SELECT id, username, email, full_name, phone, role, status, 
                         created_at, updated_at, last_login 
                         FROM users 
                         $where
                         ORDER BY created_at DESC 
                         LIMIT :limit OFFSET :offset";
                
                $stmt = $conn->prepare($query);
                if (!empty($search)) {
                    $search_param = "%$search%";
                    $stmt->bindParam(':search', $search_param);
                }
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
                $stmt->execute();
                
                $users = $stmt->fetchAll();

                // Get total count
                $count_query = "SELECT COUNT(*) as total FROM users $where";
                $count_stmt = $conn->prepare($count_query);
                if (!empty($search)) {
                    $count_stmt->bindParam(':search', $search_param);
                }
                $count_stmt->execute();
                $total = $count_stmt->fetch()['total'];

                echo json_encode([
                    'success' => true,
                    'data' => $users,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => $total,
                        'pages' => ceil($total / $limit)
                    ]
                ]);
            }
            break;

        case 'POST':
            // Create new user
            $input = json_decode(file_get_contents('php://input'), true);
            
            $username = $input['username'] ?? '';
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';
            $full_name = $input['full_name'] ?? '';
            $phone = $input['phone'] ?? '';
            $role = $input['role'] ?? 'user';

            if (empty($username) || empty($email) || empty($password)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Username, email, and password are required'
                ]);
                exit;
            }

            // Check if username exists
            $query = "SELECT id FROM users WHERE username = :username";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Username already exists'
                ]);
                exit;
            }

            // Check if email exists
            $query = "SELECT id FROM users WHERE email = :email";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':email', $email);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email already exists'
                ]);
                exit;
            }

            // Hash password
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);

            // Insert user
            $query = "INSERT INTO users (username, email, password, full_name, phone, role) 
                     VALUES (:username, :email, :password, :full_name, :phone, :role)";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':password', $hashed_password);
            $stmt->bindParam(':full_name', $full_name);
            $stmt->bindParam(':phone', $phone);
            $stmt->bindParam(':role', $role);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'User created successfully',
                    'user_id' => $conn->lastInsertId()
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to create user'
                ]);
            }
            break;

        case 'PUT':
            // Update user
            $input = json_decode(file_get_contents('php://input'), true);
            
            $user_id = $input['id'] ?? 0;
            $username = $input['username'] ?? '';
            $email = $input['email'] ?? '';
            $full_name = $input['full_name'] ?? '';
            $phone = $input['phone'] ?? '';
            $role = $input['role'] ?? 'user';
            $status = $input['status'] ?? 'active';

            if (empty($user_id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'User ID is required'
                ]);
                exit;
            }

            $query = "UPDATE users 
                     SET username = :username, 
                         email = :email, 
                         full_name = :full_name, 
                         phone = :phone, 
                         role = :role, 
                         status = :status 
                     WHERE id = :id";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $user_id);
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':full_name', $full_name);
            $stmt->bindParam(':phone', $phone);
            $stmt->bindParam(':role', $role);
            $stmt->bindParam(':status', $status);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'User updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update user'
                ]);
            }
            break;

        case 'DELETE':
            // Delete user
            $input = json_decode(file_get_contents('php://input'), true);
            $user_id = $input['id'] ?? 0;

            if (empty($user_id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'User ID is required'
                ]);
                exit;
            }

            $query = "DELETE FROM users WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $user_id);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'User deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete user'
                ]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred: ' . $e->getMessage()
    ]);
}
?>