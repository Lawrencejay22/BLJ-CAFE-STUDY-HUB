<?php
session_start();
header('Content-Type: application/json');
include 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get raw POST data (JSON)
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data) {
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        exit;
    }

    $customer_name = isset($_SESSION['name']) ? $_SESSION['name'] : 'Guest';
    $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    $address = mysqli_real_escape_string($conn, $data['address']);
    $phone = mysqli_real_escape_string($conn, $data['phone']);
    $total = floatval($data['total']);
    $items = $data['items'];

    // Start transaction
    $conn->begin_transaction();

    try {
        // Verify all items are still available
        foreach ($items as $item) {
            $p_name = mysqli_real_escape_string($conn, $item['name']);
            $check = $conn->query("SELECT is_available FROM products WHERE name = '$p_name'");
            $row = $check->fetch_assoc();
            if (!$row || $row['is_available'] == 0) {
                throw new Exception("The product '" . $item['name'] . "' is currently NOT AVAILABLE. Please remove it from your cart.");
            }
        }

        // Insert into orders
        $stmt = $conn->prepare("INSERT INTO orders (user_id, customer_name, delivery_address, phone_number, total_amount) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("isssd", $user_id, $customer_name, $address, $phone, $total);
        $stmt->execute();
        $order_id = $stmt->insert_id;

        // Insert items
        $item_stmt = $conn->prepare("INSERT INTO order_items (order_id, product_name, price, quantity) VALUES (?, ?, ?, ?)");
        foreach ($items as $item) {
            $name = $item['name'];
            $price = floatval($item['price']);
            $qty = intval($item['quantity']);
            $item_stmt->bind_param("isdi", $order_id, $name, $price, $qty);
            $item_stmt->execute();
        }

        $conn->commit();
        echo json_encode(['success' => true, 'order_id' => $order_id]);

    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

$conn->close();
?>
