<?php
/**
 * Admin Orders Management API
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
            // Get all orders or specific order
            if (isset($_GET['id'])) {
                $order_id = $_GET['id'];
                
                // Get order details
                $query = "SELECT o.*, u.username, u.email, u.full_name 
                         FROM orders o 
                         LEFT JOIN users u ON o.user_id = u.id 
                         WHERE o.id = :id";
                $stmt = $conn->prepare($query);
                $stmt->bindParam(':id', $order_id);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    $order = $stmt->fetch();
                    
                    // Get order items
                    $query = "SELECT oi.*, p.name as product_name 
                             FROM order_items oi 
                             LEFT JOIN products p ON oi.product_id = p.id 
                             WHERE oi.order_id = :order_id";
                    $stmt = $conn->prepare($query);
                    $stmt->bindParam(':order_id', $order_id);
                    $stmt->execute();
                    $order['items'] = $stmt->fetchAll();
                    
                    echo json_encode([
                        'success' => true,
                        'data' => $order
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Order not found'
                    ]);
                }
            } else {
                // Get all orders with pagination
                $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
                $offset = ($page - 1) * $limit;
                $status = $_GET['status'] ?? '';

                $where = '';
                if (!empty($status)) {
                    $where = "WHERE o.status = :status";
                }

                $query = "SELECT o.*, u.username, u.full_name 
                         FROM orders o 
                         LEFT JOIN users u ON o.user_id = u.id 
                         $where
                         ORDER BY o.created_at DESC 
                         LIMIT :limit OFFSET :offset";
                
                $stmt = $conn->prepare($query);
                if (!empty($status)) {
                    $stmt->bindParam(':status', $status);
                }
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
                $stmt->execute();
                
                $orders = $stmt->fetchAll();

                // Get total count
                $count_query = "SELECT COUNT(*) as total FROM orders o $where";
                $count_stmt = $conn->prepare($count_query);
                if (!empty($status)) {
                    $count_stmt->bindParam(':status', $status);
                }
                $count_stmt->execute();
                $total = $count_stmt->fetch()['total'];

                echo json_encode([
                    'success' => true,
                    'data' => $orders,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => $total,
                        'pages' => ceil($total / $limit)
                    ]
                ]);
            }
            break;

        case 'PUT':
            // Update order status
            $input = json_decode(file_get_contents('php://input'), true);
            
            $order_id = $input['id'] ?? 0;
            $status = $input['status'] ?? '';
            $payment_status = $input['payment_status'] ?? '';

            if (empty($order_id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Order ID is required'
                ]);
                exit;
            }

            $updates = [];
            $params = [':id' => $order_id];

            if (!empty($status)) {
                $updates[] = "status = :status";
                $params[':status'] = $status;
            }

            if (!empty($payment_status)) {
                $updates[] = "payment_status = :payment_status";
                $params[':payment_status'] = $payment_status;
            }

            if (empty($updates)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'No updates provided'
                ]);
                exit;
            }

            $query = "UPDATE orders SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $conn->prepare($query);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Order updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update order'
                ]);
            }
            break;

        case 'DELETE':
            // Delete order
            $input = json_decode(file_get_contents('php://input'), true);
            $order_id = $input['id'] ?? 0;

            if (empty($order_id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Order ID is required'
                ]);
                exit;
            }

            $query = "DELETE FROM orders WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $order_id);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Order deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete order'
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