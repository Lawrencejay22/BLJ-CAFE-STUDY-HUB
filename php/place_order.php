<?php
session_start();
header('Content-Type: application/json');
include 'db_connect.php';
// Enable strict error reporting for mysqli
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get raw POST data (JSON)
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data) {
        echo json_encode(['success' => false, 'error' => 'Invalid data format']);
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
            if (isset($item['isBooking']) && $item['isBooking']) continue; 
            $p_name = mysqli_real_escape_string($conn, $item['name']);
            $check = $conn->query("SELECT is_available FROM products WHERE name = '$p_name'");
            $row = $check->fetch_assoc();
            if (!$row || (isset($row['is_available']) && $row['is_available'] == 0)) {
                throw new Exception("The product '" . $item['name'] . "' is currently NOT AVAILABLE.");
            }
        }

        // Insert into orders
        $stmt = $conn->prepare("INSERT INTO orders (user_id, customer_name, delivery_address, phone_number, total_amount) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("isssd", $user_id, $customer_name, $address, $phone, $total);
        $stmt->execute();
        $order_id = $stmt->insert_id;

        // Prepare statements
        $item_stmt = $conn->prepare("INSERT INTO order_items (order_id, product_name, price, quantity) VALUES (?, ?, ?, ?)");
        $booking_stmt = $conn->prepare("INSERT INTO bookings (user_id, order_id, customer_name, room_type, reservation_date, check_in_time, duration, pax, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        foreach ($items as $item) {
            $name = $item['name'];
            $price = floatval($item['price']);
            $qty = intval($item['quantity']);
            
            // Record in order items
            $item_stmt->bind_param("isdi", $order_id, $name, $price, $qty);
            $item_stmt->execute();

            // If it's a booking, also record in bookings table
            if (isset($item['isBooking']) && $item['isBooking']) {
                $b_date = $item['details']['date'];
                $b_time = $item['details']['time'];
                $b_dur = intval($item['details']['duration']);
                $b_pax = intval($item['details']['pax']);
                $b_total = floatval($item['totalPrice']);
                
                // Link to the order_id we just created
                $booking_stmt->bind_param("iissssidd", $user_id, $order_id, $customer_name, $name, $b_date, $b_time, $b_dur, $b_pax, $b_total);
                $booking_stmt->execute();
            }
        }

        $conn->commit();
        echo json_encode(['success' => true, 'order_id' => $order_id]);

    } catch (Exception $e) {
        if ($conn->in_transaction) $conn->rollback();
        echo json_encode(['success' => false, 'error' => "Database Error: " . $e->getMessage()]);
    }
}

$conn->close();
?>
