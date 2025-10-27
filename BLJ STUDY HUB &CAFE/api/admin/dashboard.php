<?php
/**
 * Admin Dashboard API
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

try {
    // Get statistics
    $stats = [];

    // Total users
    $query = "SELECT COUNT(*) as total FROM users WHERE status = 'active'";
    $stmt = $conn->query($query);
    $stats['total_users'] = $stmt->fetch()['total'];

    // Total orders
    $query = "SELECT COUNT(*) as total FROM orders";
    $stmt = $conn->query($query);
    $stats['total_orders'] = $stmt->fetch()['total'];

    // Total revenue
    $query = "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid'";
    $stmt = $conn->query($query);
    $stats['total_revenue'] = $stmt->fetch()['total'];

    // Total bookings
    $query = "SELECT COUNT(*) as total FROM bookings";
    $stmt = $conn->query($query);
    $stats['total_bookings'] = $stmt->fetch()['total'];

    // Pending orders
    $query = "SELECT COUNT(*) as total FROM orders WHERE status = 'pending'";
    $stmt = $conn->query($query);
    $stats['pending_orders'] = $stmt->fetch()['total'];

    // Today's revenue
    $query = "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
             WHERE DATE(created_at) = CURDATE() AND payment_status = 'paid'";
    $stmt = $conn->query($query);
    $stats['today_revenue'] = $stmt->fetch()['total'];

    // Recent orders
    $query = "SELECT o.*, u.username, u.full_name 
             FROM orders o 
             LEFT JOIN users u ON o.user_id = u.id 
             ORDER BY o.created_at DESC 
             LIMIT 10";
    $stmt = $conn->query($query);
    $recent_orders = $stmt->fetchAll();

    // Recent users
    $query = "SELECT id, username, email, full_name, created_at, last_login 
             FROM users 
             ORDER BY created_at DESC 
             LIMIT 10";
    $stmt = $conn->query($query);
    $recent_users = $stmt->fetchAll();

    // Monthly revenue chart data
    $query = "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, 
             SUM(total_amount) as revenue 
             FROM orders 
             WHERE payment_status = 'paid' 
             AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
             GROUP BY month 
             ORDER BY month";
    $stmt = $conn->query($query);
    $monthly_revenue = $stmt->fetchAll();

    // Order status distribution
    $query = "SELECT status, COUNT(*) as count 
             FROM orders 
             GROUP BY status";
    $stmt = $conn->query($query);
    $order_status_distribution = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => [
            'stats' => $stats,
            'recent_orders' => $recent_orders,
            'recent_users' => $recent_users,
            'monthly_revenue' => $monthly_revenue,
            'order_status_distribution' => $order_status_distribution
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while fetching dashboard data'
    ]);
}
?>