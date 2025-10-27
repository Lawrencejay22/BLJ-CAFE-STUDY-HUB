<?php
/**
 * Admin Bookings Management API
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
            // Get all bookings or specific booking
            if (isset($_GET['id'])) {
                $booking_id = $_GET['id'];
                $query = "SELECT b.*, u.username, u.email, u.full_name 
                         FROM bookings b 
                         LEFT JOIN users u ON b.user_id = u.id 
                         WHERE b.id = :id";
                $stmt = $conn->prepare($query);
                $stmt->bindParam(':id', $booking_id);
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
                        'message' => 'Booking not found'
                    ]);
                }
            } else {
                // Get all bookings with pagination
                $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
                $offset = ($page - 1) * $limit;
                $status = $_GET['status'] ?? '';

                $where = '';
                if (!empty($status)) {
                    $where = "WHERE b.status = :status";
                }

                $query = "SELECT b.*, u.username, u.full_name 
                         FROM bookings b 
                         LEFT JOIN users u ON b.user_id = u.id 
                         $where
                         ORDER BY b.booking_date DESC, b.booking_time DESC 
                         LIMIT :limit OFFSET :offset";
                
                $stmt = $conn->prepare($query);
                if (!empty($status)) {
                    $stmt->bindParam(':status', $status);
                }
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
                $stmt->execute();
                
                $bookings = $stmt->fetchAll();

                // Get total count
                $count_query = "SELECT COUNT(*) as total FROM bookings b $where";
                $count_stmt = $conn->prepare($count_query);
                if (!empty($status)) {
                    $count_stmt->bindParam(':status', $status);
                }
                $count_stmt->execute();
                $total = $count_stmt->fetch()['total'];

                echo json_encode([
                    'success' => true,
                    'data' => $bookings,
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
            // Update booking status
            $input = json_decode(file_get_contents('php://input'), true);
            
            $booking_id = $input['id'] ?? 0;
            $status = $input['status'] ?? '';
            $table_number = $input['table_number'] ?? '';

            if (empty($booking_id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Booking ID is required'
                ]);
                exit;
            }

            $updates = [];
            $params = [':id' => $booking_id];

            if (!empty($status)) {
                $updates[] = "status = :status";
                $params[':status'] = $status;
            }

            if (!empty($table_number)) {
                $updates[] = "table_number = :table_number";
                $params[':table_number'] = $table_number;
            }

            if (empty($updates)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'No updates provided'
                ]);
                exit;
            }

            $query = "UPDATE bookings SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $conn->prepare($query);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Booking updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update booking'
                ]);
            }
            break;

        case 'DELETE':
            // Delete booking
            $input = json_decode(file_get_contents('php://input'), true);
            $booking_id = $input['id'] ?? 0;

            if (empty($booking_id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Booking ID is required'
                ]);
                exit;
            }

            $query = "DELETE FROM bookings WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $booking_id);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Booking deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete booking'
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