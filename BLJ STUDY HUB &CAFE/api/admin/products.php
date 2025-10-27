<?php
/**
 * Admin Products Management API
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
            // Get all products or specific product
            if (isset($_GET['id'])) {
                $product_id = $_GET['id'];
                $query = "SELECT * FROM products WHERE id = :id";
                $stmt = $conn->prepare($query);
                $stmt->bindParam(':id', $product_id);
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
                        'message' => 'Product not found'
                    ]);
                }
            } else {
                // Get all products with pagination
                $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
                $offset = ($page - 1) * $limit;
                $category = $_GET['category'] ?? '';

                $where = '';
                if (!empty($category)) {
                    $where = "WHERE category = :category";
                }

                $query = "SELECT * FROM products 
                         $where
                         ORDER BY created_at DESC 
                         LIMIT :limit OFFSET :offset";
                
                $stmt = $conn->prepare($query);
                if (!empty($category)) {
                    $stmt->bindParam(':category', $category);
                }
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
                $stmt->execute();
                
                $products = $stmt->fetchAll();

                // Get total count
                $count_query = "SELECT COUNT(*) as total FROM products $where";
                $count_stmt = $conn->prepare($count_query);
                if (!empty($category)) {
                    $count_stmt->bindParam(':category', $category);
                }
                $count_stmt->execute();
                $total = $count_stmt->fetch()['total'];

                echo json_encode([
                    'success' => true,
                    'data' => $products,
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
            // Create new product
            $input = json_decode(file_get_contents('php://input'), true);
            
            $name = $input['name'] ?? '';
            $description = $input['description'] ?? '';
            $category = $input['category'] ?? '';
            $price = $input['price'] ?? 0;
            $image_url = $input['image_url'] ?? '';
            $stock_quantity = $input['stock_quantity'] ?? 0;
            $status = $input['status'] ?? 'available';

            if (empty($name) || empty($category) || $price <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Name, category, and valid price are required'
                ]);
                exit;
            }

            $query = "INSERT INTO products (name, description, category, price, image_url, stock_quantity, status) 
                     VALUES (:name, :description, :category, :price, :image_url, :stock_quantity, :status)";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':description', $description);
            $stmt->bindParam(':category', $category);
            $stmt->bindParam(':price', $price);
            $stmt->bindParam(':image_url', $image_url);
            $stmt->bindParam(':stock_quantity', $stock_quantity);
            $stmt->bindParam(':status', $status);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Product created successfully',
                    'product_id' => $conn->lastInsertId()
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to create product'
                ]);
            }
            break;

        case 'PUT':
            // Update product
            $input = json_decode(file_get_contents('php://input'), true);
            
            $product_id = $input['id'] ?? 0;
            $name = $input['name'] ?? '';
            $description = $input['description'] ?? '';
            $category = $input['category'] ?? '';
            $price = $input['price'] ?? 0;
            $image_url = $input['image_url'] ?? '';
            $stock_quantity = $input['stock_quantity'] ?? 0;
            $status = $input['status'] ?? 'available';

            if (empty($product_id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Product ID is required'
                ]);
                exit;
            }

            $query = "UPDATE products 
                     SET name = :name, 
                         description = :description, 
                         category = :category, 
                         price = :price, 
                         image_url = :image_url, 
                         stock_quantity = :stock_quantity, 
                         status = :status 
                     WHERE id = :id";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $product_id);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':description', $description);
            $stmt->bindParam(':category', $category);
            $stmt->bindParam(':price', $price);
            $stmt->bindParam(':image_url', $image_url);
            $stmt->bindParam(':stock_quantity', $stock_quantity);
            $stmt->bindParam(':status', $status);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Product updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update product'
                ]);
            }
            break;

        case 'DELETE':
            // Delete product
            $input = json_decode(file_get_contents('php://input'), true);
            $product_id = $input['id'] ?? 0;

            if (empty($product_id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Product ID is required'
                ]);
                exit;
            }

            $query = "DELETE FROM products WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $product_id);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Product deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete product'
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