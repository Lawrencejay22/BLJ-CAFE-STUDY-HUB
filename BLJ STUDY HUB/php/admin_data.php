<?php
session_start();
header('Content-Type: application/json');
include 'db_connect.php';

// Check if user is admin
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}
$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'add_product':
        $name = mysqli_real_escape_string($conn, $_POST['name']);
        $description = mysqli_real_escape_string($conn, $_POST['description']);
        $price = floatval($_POST['price']);
        $category = mysqli_real_escape_string($conn, $_POST['category']);
        $is_available = intval($_POST['is_available']);

        $stmt = $conn->prepare("INSERT INTO products (name, description, price, category, is_available) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("ssdsi", $name, $description, $price, $category, $is_available);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => $conn->error]);
        }
        break;

    case 'add_user':
        $name = mysqli_real_escape_string($conn, $_POST['name']);
        $lastname = mysqli_real_escape_string($conn, $_POST['lastname']);
        $username = mysqli_real_escape_string($conn, $_POST['username']);
        $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
        $role = mysqli_real_escape_string($conn, $_POST['role']);

        $stmt = $conn->prepare("INSERT INTO users (name, lastname, username, password, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $name, $lastname, $username, $password, $role);

        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => $conn->error]);
        }
        break;

    case 'update_product':
        $id = intval($_POST['id']);
        $name = mysqli_real_escape_string($conn, $_POST['name']);
        $description = mysqli_real_escape_string($conn, $_POST['description']);
        $price = floatval($_POST['price']);
        $category = mysqli_real_escape_string($conn, $_POST['category']);
        $is_available = intval($_POST['is_available']);

        $stmt = $conn->prepare("UPDATE products SET name = ?, description = ?, price = ?, category = ?, is_available = ? WHERE id = ?");
        $stmt->bind_param("ssdsii", $name, $description, $price, $category, $is_available, $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => $conn->error]);
        }
        break;

    case 'update_user':
        $id = intval($_POST['id']);
        $name = mysqli_real_escape_string($conn, $_POST['name']);
        $lastname = mysqli_real_escape_string($conn, $_POST['lastname']);
        $username = mysqli_real_escape_string($conn, $_POST['username']);
        $role = mysqli_real_escape_string($conn, $_POST['role']);

        $sql = "UPDATE users SET name = ?, lastname = ?, username = ?, role = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssi", $name, $lastname, $username, $role, $id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => $conn->error]);
        }
        break;

    case 'get_item':
        $type = $_GET['type'];
        $id = intval($_GET['id']);
        $table = ($type == 'user') ? 'users' : (($type == 'product') ? 'products' : '');
        if ($table) {
            $res = $conn->query("SELECT * FROM $table WHERE id = $id");
            echo json_encode($res->fetch_assoc());
        }
        break;

    case 'get_stats':
        $stats = [];
        
        // Total Users
        $res = $conn->query("SELECT COUNT(*) as count FROM users");
        $stats['total_users'] = $res->fetch_assoc()['count'];
        
        // Total Products
        $res = $conn->query("SELECT COUNT(*) as count FROM products");
        $stats['total_products'] = $res->fetch_assoc()['count'];
        
        // Total Revenue
        $res = $conn->query("SELECT SUM(total_amount) as revenue FROM orders WHERE order_status = 'completed'");
        $stats['total_revenue'] = $res->fetch_assoc()['revenue'] ?? 0;
        
        echo json_encode($stats);
        break;

    case 'get_recent_activity':
        $activity = [];
        // Recent Orders
        $res = $conn->query("SELECT 'order' as type, customer_name, total_amount, order_date as date FROM orders ORDER BY order_date DESC LIMIT 5");
        while($row = $res->fetch_assoc()) $activity[] = $row;
        
        // Recent Users (Excluding Admins)
        $res = $conn->query("SELECT 'user' as type, name, lastname, created_at as date FROM users WHERE role != 'admin' ORDER BY created_at DESC LIMIT 5");
        if ($res) {
             while($row = $res->fetch_assoc()) $activity[] = $row;
        }

        // Sort combined activity by date
        usort($activity, function($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        echo json_encode(array_slice($activity, 0, 5));
        break;
 
    case 'get_users':
        $users = [];
        $result = $conn->query("SELECT id, name, lastname, username, role FROM users");
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        echo json_encode($users);
        break;

    case 'get_bookings':
        $bookings = [];
        $result = $conn->query("SELECT * FROM bookings ORDER BY created_at DESC");
        while ($row = $result->fetch_assoc()) {
            $bookings[] = $row;
        }
        echo json_encode($bookings);
        break;

    case 'get_products':
        $products = [];
        $result = $conn->query("SELECT * FROM products");
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
        echo json_encode($products);
        break;

    case 'get_orders':
        $orders = [];
        $result = $conn->query("SELECT * FROM orders ORDER BY order_date DESC");
        while ($row = $result->fetch_assoc()) {
            $orders[] = $row;
        }
        echo json_encode($orders);
        break;

    case 'toggle_availability':
        $id = intval($_GET['id']);
        $stmt = $conn->prepare("UPDATE products SET is_available = NOT is_available WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => $conn->error]);
        }
        break;

    case 'complete_order':
        $id = intval($_GET['id']);
        $stmt = $conn->prepare("UPDATE orders SET order_status = 'completed' WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => $conn->error]);
        }
        break;

    case 'delete_item':
        $type = $_GET['type'];
        $id = intval($_GET['id']);
        $table = '';
        if ($type == 'user') $table = 'users';
        if ($type == 'product') $table = 'products';
        if ($type == 'order') $table = 'orders';
        
        if ($table) {
            $stmt = $conn->prepare("DELETE FROM $table WHERE id = ?");
            $stmt->bind_param("i", $id);
            if ($stmt->execute()) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['error' => $conn->error]);
            }
        }
        break;

    case 'get_chart_data':
        $labels = [];
        $values = [];
        $res = $conn->query("SELECT DATE(order_date) as date, SUM(total_amount) as total FROM orders WHERE order_status = 'completed' GROUP BY DATE(order_date) ORDER BY date ASC LIMIT 7");
        while ($row = $res->fetch_assoc()) {
            $labels[] = $row['date'];
            $values[] = floatval($row['total']);
        }
        echo json_encode(['labels' => $labels, 'values' => $values]);
        break;

    case 'update_security':
        $new_pass = password_hash($_POST['new_password'], PASSWORD_DEFAULT);
        $user_id = $_SESSION['user_id'];
        
        $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->bind_param("si", $new_pass, $user_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => $conn->error]);
        }
        break;

    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}

$conn->close();
?>
