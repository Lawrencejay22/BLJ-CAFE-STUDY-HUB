<?php
/**
 * User Notifications API
 * BLJ Study Hub & Cafe
 */

require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../config/database.php';

header('Content-Type: application/json');

// Check user authentication
$auth = new Auth();
if (!$auth->isLoggedIn()) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Please login to access notifications'
    ]);
    exit;
}

$user = $auth->getCurrentUser();
$user_id = $user['id'];

$db = new Database();
$conn = $db->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get user's notifications
            $query = "SELECT * FROM notifications 
                     WHERE user_id = :user_id 
                     ORDER BY created_at DESC 
                     LIMIT 50";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            
            $notifications = $stmt->fetchAll();
            
            // Get unread count
            $query = "SELECT COUNT(*) as unread FROM notifications WHERE user_id = :user_id AND is_read = 0";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            $unread_count = $stmt->fetch()['unread'];
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'notifications' => $notifications,
                    'unread_count' => $unread_count
                ]
            ]);
            break;

        case 'PUT':
            // Mark notification as read or mark all as read
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (isset($input['mark_all_read']) && $input['mark_all_read'] === true) {
                // Mark all as read
                $query = "UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = :user_id";
                $stmt = $conn->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                
                if ($stmt->execute()) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'All notifications marked as read'
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Failed to update notifications'
                    ]);
                }
            } else {
                // Mark single notification as read
                $notification_id = $input['id'] ?? 0;

                if (empty($notification_id)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Notification ID is required'
                    ]);
                    exit;
                }

                $query = "UPDATE notifications SET is_read = 1, read_at = NOW() 
                         WHERE id = :id AND user_id = :user_id";
                $stmt = $conn->prepare($query);
                $stmt->bindParam(':id', $notification_id);
                $stmt->bindParam(':user_id', $user_id);

                if ($stmt->execute()) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Notification marked as read'
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Failed to update notification'
                    ]);
                }
            }
            break;

        case 'DELETE':
            // Delete notification or clear all
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (isset($input['clear_all']) && $input['clear_all'] === true) {
                // Clear all notifications
                $query = "DELETE FROM notifications WHERE user_id = :user_id";
                $stmt = $conn->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                
                if ($stmt->execute()) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'All notifications cleared'
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Failed to clear notifications'
                    ]);
                }
            } else {
                // Delete single notification
                $notification_id = $input['id'] ?? 0;

                if (empty($notification_id)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Notification ID is required'
                    ]);
                    exit;
                }

                $query = "DELETE FROM notifications WHERE id = :id AND user_id = :user_id";
                $stmt = $conn->prepare($query);
                $stmt->bindParam(':id', $notification_id);
                $stmt->bindParam(':user_id', $user_id);

                if ($stmt->execute()) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Notification deleted successfully'
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Failed to delete notification'
                    ]);
                }
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