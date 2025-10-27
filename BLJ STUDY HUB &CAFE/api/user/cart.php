<?php
/**
 * User Cart API
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
        'message' => 'Please login to access cart'
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
            // Get user's cart
            $query = "SELECT c.*, p.name, p.description, p.price, p.image_url, p.status 
                     FROM cart c 
                     LEFT JOIN products p ON c.product_id = p.id 
                     WHERE c.user_id = :user_id 
                     ORDER BY c.created_at DESC";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            
            $cart_items = $stmt->fetchAll();
            
            // Calculate totals
            $subtotal = 0;
            foreach ($cart_items as $item) {
                $subtotal += $item['price'] * $item['quantity'];
            }
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'items' => $cart_items,
                    'subtotal' => $subtotal,
                    'count' => count($cart_items)
                ]
            ]);
            break;

        case 'POST':
            // Add item to cart
            $input = json_decode(file_get_contents('php://input'), true);
            
            $product_id = $input['product_id'] ?? 0;
            $quantity = $input['quantity'] ?? 1;

            if (empty($product_id) || $quantity < 1) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid product or quantity'
                ]);
                exit;
            }

            // Check if product exists and is available
            $query = "SELECT id, stock_quantity, status FROM products WHERE id = :product_id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':product_id', $product_id);
            $stmt->execute();
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Product not found'
                ]);
                exit;
            }
            
            $product = $stmt->fetch();
            if ($product['status'] !== 'available') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Product is not available'
                ]);
                exit;
            }

            // Check if item already in cart
            $query = "SELECT id, quantity FROM cart WHERE user_id = :user_id AND product_id = :product_id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':product_id', $product_id);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                // Update quantity
                $cart_item = $stmt->fetch();
                $new_quantity = $cart_item['quantity'] + $quantity;
                
                $query = "UPDATE cart SET quantity = :quantity WHERE id = :id";
                $stmt = $conn->prepare($query);
                $stmt->bindParam(':quantity', $new_quantity);
                $stmt->bindParam(':id', $cart_item['id']);
                $stmt->execute();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Cart updated successfully'
                ]);
            } else {
                // Insert new item
                $query = "INSERT INTO cart (user_id, product_id, quantity) VALUES (:user_id, :product_id, :quantity)";
                $stmt = $conn->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->bindParam(':product_id', $product_id);
                $stmt->bindParam(':quantity', $quantity);
                
                if ($stmt->execute()) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Item added to cart'
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Failed to add item to cart'
                    ]);
                }
            }
            break;

        case 'PUT':
            // Update cart item quantity
            $input = json_decode(file_get_contents('php://input'), true);
            
            $cart_id = $input['id'] ?? 0;
            $quantity = $input['quantity'] ?? 1;

            if (empty($cart_id) || $quantity < 1) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid cart item or quantity'
                ]);
                exit;
            }

            $query = "UPDATE cart SET quantity = :quantity WHERE id = :id AND user_id = :user_id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':quantity', $quantity);
            $stmt->bindParam(':id', $cart_id);
            $stmt->bindParam(':user_id', $user_id);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Cart updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update cart'
                ]);
            }
            break;

        case 'DELETE':
            // Remove item from cart
            $input = json_decode(file_get_contents('php://input'), true);
            $cart_id = $input['id'] ?? 0;

            if (empty($cart_id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Cart item ID is required'
                ]);
                exit;
            }

            $query = "DELETE FROM cart WHERE id = :id AND user_id = :user_id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $cart_id);
            $stmt->bindParam(':user_id', $user_id);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Item removed from cart'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to remove item'
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