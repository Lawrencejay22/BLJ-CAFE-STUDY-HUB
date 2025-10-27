<?php
/**
 * User Messages API
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
        'message' => 'Please login to access messages'
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
            // Get user's messages
            $query = "SELECT m.*, 
                     sender.username as sender_username, 
                     sender.full_name as sender_name,
                     receiver.username as receiver_username,
                     receiver.full_name as receiver_name
                     FROM messages m 
                     LEFT JOIN users sender ON m.sender_id = sender.id 
                     LEFT JOIN users receiver ON m.receiver_id = receiver.id 
                     WHERE m.receiver_id = :user_id OR m.sender_id = :user_id
                     ORDER BY m.created_at DESC";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            
            $messages = $stmt->fetchAll();
            
            // Get unread count
            $query = "SELECT COUNT(*) as unread FROM messages WHERE receiver_id = :user_id AND is_read = 0";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            $unread_count = $stmt->fetch()['unread'];
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'messages' => $messages,
                    'unread_count' => $unread_count
                ]
            ]);
            break;

        case 'POST':
            // Send message
            $input = json_decode(file_get_contents('php://input'), true);
            
            $receiver_id = $input['receiver_id'] ?? 0;
            $subject = $input['subject'] ?? '';
            $message = $input['message'] ?? '';
            $parent_message_id = $input['parent_message_id'] ?? null;

            if (empty($receiver_id) || empty($message)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Receiver and message are required'
                ]);
                exit;
            }

            $query = "INSERT INTO messages (sender_id, receiver_id, subject, message, parent_message_id) 
                     VALUES (:sender_id, :receiver_id, :subject, :message, :parent_message_id)";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':sender_id', $user_id);
            $stmt->bindParam(':receiver_id', $receiver_id);
            $stmt->bindParam(':subject', $subject);
            $stmt->bindParam(':message', $message);
            $stmt->bindParam(':parent_message_id', $parent_message_id);

            if ($stmt->execute()) {
                // Create notification for receiver
                $notif_query = "INSERT INTO notifications (user_id, type, title, message) 
                               VALUES (:user_id, 'message', 'New Message', :message)";
                $notif_stmt = $conn->prepare($notif_query);
                $notif_stmt->bindParam(':user_id', $receiver_id);
                $notif_message = "You have a new message from " . $user['username'];
                $notif_stmt->bindParam(':message', $notif_message);
                $notif_stmt->execute();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Message sent successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to send message'
                ]);
            }
            break;

        case 'PUT':
            // Mark message as read
            $input = json_decode(file_get_contents('php://input'), true);
            
            $message_id = $input['id'] ?? 0;

            if (empty($message_id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Message ID is required'
                ]);
                exit;
            }

            $query = "UPDATE messages SET is_read = 1, read_at = NOW() 
                     WHERE id = :id AND receiver_id = :user_id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $message_id);
            $stmt->bindParam(':user_id', $user_id);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Message marked as read'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update message'
                ]);
            }
            break;

        case 'DELETE':
            // Delete message
            $input = json_decode(file_get_contents('php://input'), true);
            $message_id = $input['id'] ?? 0;

            if (empty($message_id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Message ID is required'
                ]);
                exit;
            }

            $query = "DELETE FROM messages WHERE id = :id AND (sender_id = :user_id OR receiver_id = :user_id)";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $message_id);
            $stmt->bindParam(':user_id', $user_id);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Message deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete message'
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