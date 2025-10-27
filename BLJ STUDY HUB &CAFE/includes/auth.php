<?php
/**
 * Authentication Handler
 * BLJ Study Hub & Cafe
 */

session_start();

require_once __DIR__ . '/../config/database.php';

class Auth {
    private $conn;
    private $db;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    /**
     * User Login
     */
    public function login($username, $password, $remember = false) {
        try {
            $query = "SELECT id, username, email, password, full_name, role, status 
                     FROM users 
                     WHERE username = :username OR email = :username 
                     LIMIT 1";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch();

                // Check if account is active
                if ($user['status'] !== 'active') {
                    return [
                        'success' => false,
                        'message' => 'Your account is ' . $user['status'] . '. Please contact support.'
                    ];
                }

                // Verify password
                if (password_verify($password, $user['password'])) {
                    // Set session variables
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['email'] = $user['email'];
                    $_SESSION['full_name'] = $user['full_name'];
                    $_SESSION['role'] = $user['role'];
                    $_SESSION['logged_in'] = true;

                    // Update last login
                    $this->updateLastLogin($user['id']);

                    // Create session token if remember me
                    if ($remember) {
                        $this->createRememberToken($user['id']);
                    }

                    // Log activity
                    $this->logActivity($user['id'], 'login', 'User logged in successfully');

                    return [
                        'success' => true,
                        'message' => 'Login successful',
                        'user' => [
                            'id' => $user['id'],
                            'username' => $user['username'],
                            'email' => $user['email'],
                            'full_name' => $user['full_name'],
                            'role' => $user['role']
                        ]
                    ];
                } else {
                    return [
                        'success' => false,
                        'message' => 'Invalid username or password'
                    ];
                }
            } else {
                return [
                    'success' => false,
                    'message' => 'Invalid username or password'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'An error occurred. Please try again.'
            ];
        }
    }

    /**
     * User Registration
     */
    public function register($username, $email, $password, $full_name = '', $phone = '') {
        try {
            // Check if username exists
            $query = "SELECT id FROM users WHERE username = :username LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                return [
                    'success' => false,
                    'message' => 'Username already exists'
                ];
            }

            // Check if email exists
            $query = "SELECT id FROM users WHERE email = :email LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':email', $email);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                return [
                    'success' => false,
                    'message' => 'Email already exists'
                ];
            }

            // Hash password
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);

            // Insert user
            $query = "INSERT INTO users (username, email, password, full_name, phone) 
                     VALUES (:username, :email, :password, :full_name, :phone)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':password', $hashed_password);
            $stmt->bindParam(':full_name', $full_name);
            $stmt->bindParam(':phone', $phone);

            if ($stmt->execute()) {
                $user_id = $this->conn->lastInsertId();
                
                // Log activity
                $this->logActivity($user_id, 'register', 'New user registered');

                return [
                    'success' => true,
                    'message' => 'Registration successful',
                    'user_id' => $user_id
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Registration failed. Please try again.'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'An error occurred. Please try again.'
            ];
        }
    }

    /**
     * Admin Login
     */
    public function adminLogin($username, $password, $remember = false) {
        try {
            $query = "SELECT id, username, password, full_name, email, role, status 
                     FROM admin_users 
                     WHERE username = :username 
                     LIMIT 1";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $admin = $stmt->fetch();

                // Check if account is active
                if ($admin['status'] !== 'active') {
                    return [
                        'success' => false,
                        'message' => 'Your admin account is inactive. Please contact system administrator.'
                    ];
                }

                // Verify password
                if (password_verify($password, $admin['password'])) {
                    // Set session variables
                    $_SESSION['admin_id'] = $admin['id'];
                    $_SESSION['admin_username'] = $admin['username'];
                    $_SESSION['admin_email'] = $admin['email'];
                    $_SESSION['admin_full_name'] = $admin['full_name'];
                    $_SESSION['admin_role'] = $admin['role'];
                    $_SESSION['admin_logged_in'] = true;

                    // Update last login
                    $this->updateAdminLastLogin($admin['id']);

                    // Log activity
                    $this->logActivity($admin['id'], 'admin_login', 'Admin logged in successfully');

                    return [
                        'success' => true,
                        'message' => 'Admin login successful',
                        'admin' => [
                            'id' => $admin['id'],
                            'username' => $admin['username'],
                            'email' => $admin['email'],
                            'full_name' => $admin['full_name'],
                            'role' => $admin['role']
                        ]
                    ];
                } else {
                    return [
                        'success' => false,
                        'message' => 'Invalid username or password'
                    ];
                }
            } else {
                return [
                    'success' => false,
                    'message' => 'Invalid username or password'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'An error occurred. Please try again.'
            ];
        }
    }

    /**
     * Logout
     */
    public function logout() {
        // Log activity before destroying session
        if (isset($_SESSION['user_id'])) {
            $this->logActivity($_SESSION['user_id'], 'logout', 'User logged out');
        }

        // Destroy session
        session_unset();
        session_destroy();

        return [
            'success' => true,
            'message' => 'Logged out successfully'
        ];
    }

    /**
     * Check if user is logged in
     */
    public function isLoggedIn() {
        return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
    }

    /**
     * Check if admin is logged in
     */
    public function isAdminLoggedIn() {
        return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
    }

    /**
     * Get current user
     */
    public function getCurrentUser() {
        if ($this->isLoggedIn()) {
            return [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'email' => $_SESSION['email'],
                'full_name' => $_SESSION['full_name'] ?? '',
                'role' => $_SESSION['role']
            ];
        }
        return null;
    }

    /**
     * Get current admin
     */
    public function getCurrentAdmin() {
        if ($this->isAdminLoggedIn()) {
            return [
                'id' => $_SESSION['admin_id'],
                'username' => $_SESSION['admin_username'],
                'email' => $_SESSION['admin_email'],
                'full_name' => $_SESSION['admin_full_name'] ?? '',
                'role' => $_SESSION['admin_role']
            ];
        }
        return null;
    }

    /**
     * Update last login timestamp
     */
    private function updateLastLogin($user_id) {
        $query = "UPDATE users SET last_login = NOW() WHERE id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
    }

    /**
     * Update admin last login timestamp
     */
    private function updateAdminLastLogin($admin_id) {
        $query = "UPDATE admin_users SET last_login = NOW() WHERE id = :admin_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':admin_id', $admin_id);
        $stmt->execute();
    }

    /**
     * Create remember me token
     */
    private function createRememberToken($user_id) {
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+30 days'));

        $query = "INSERT INTO sessions (user_id, session_token, ip_address, user_agent, expires_at) 
                 VALUES (:user_id, :token, :ip, :user_agent, :expires)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':token', $token);
        $stmt->bindParam(':ip', $_SERVER['REMOTE_ADDR']);
        $stmt->bindParam(':user_agent', $_SERVER['HTTP_USER_AGENT']);
        $stmt->bindParam(':expires', $expires);
        $stmt->execute();

        // Set cookie
        setcookie('remember_token', $token, strtotime('+30 days'), '/', '', false, true);
    }

    /**
     * Log user activity
     */
    private function logActivity($user_id, $action, $description) {
        try {
            $query = "INSERT INTO activity_logs (user_id, action, description, ip_address, user_agent) 
                     VALUES (:user_id, :action, :description, :ip, :user_agent)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':action', $action);
            $stmt->bindParam(':description', $description);
            $stmt->bindParam(':ip', $_SERVER['REMOTE_ADDR']);
            $stmt->bindParam(':user_agent', $_SERVER['HTTP_USER_AGENT']);
            $stmt->execute();
        } catch (Exception $e) {
            // Silent fail for logging
        }
    }

    /**
     * Validate session token
     */
    public function validateRememberToken($token) {
        try {
            $query = "SELECT user_id FROM sessions 
                     WHERE session_token = :token 
                     AND expires_at > NOW() 
                     LIMIT 1";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':token', $token);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $session = $stmt->fetch();
                
                // Get user details
                $query = "SELECT id, username, email, full_name, role 
                         FROM users 
                         WHERE id = :user_id AND status = 'active' 
                         LIMIT 1";
                
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':user_id', $session['user_id']);
                $stmt->execute();

                if ($stmt->rowCount() > 0) {
                    $user = $stmt->fetch();
                    
                    // Set session variables
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['email'] = $user['email'];
                    $_SESSION['full_name'] = $user['full_name'];
                    $_SESSION['role'] = $user['role'];
                    $_SESSION['logged_in'] = true;

                    return true;
                }
            }
            return false;
        } catch (Exception $e) {
            return false;
        }
    }
}
?>