<?php
/**
 * Installation Script for BLJ Study Hub & Cafe
 * Run this file once to set up the database
 */

// Configuration
$db_host = "localhost";
$db_user = "root";
$db_pass = "";
$db_name = "blj_study_cafe";

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Installation - BLJ Study Hub & Cafe</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 3rem;
            max-width: 800px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        h1 {
            color: #333;
            margin-bottom: 1rem;
            text-align: center;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 2rem;
        }
        .step {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border-radius: 8px;
        }
        .step h3 {
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        .step p {
            color: #666;
            line-height: 1.6;
        }
        .form-group {
            margin-bottom: 1.5rem;
        }
        .form-group label {
            display: block;
            color: #333;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        .form-group input {
            width: 100%;
            padding: 0.8rem;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
        }
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .success {
            background: #d4edda;
            color: #155724;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            border-left: 4px solid #28a745;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            border-left: 4px solid #dc3545;
        }
        .info {
            background: #d1ecf1;
            color: #0c5460;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            border-left: 4px solid #17a2b8;
        }
        code {
            background: #f4f4f4;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
        }
        .credentials {
            background: #fff3cd;
            border: 2px solid #ffc107;
            padding: 1.5rem;
            border-radius: 8px;
            margin-top: 1.5rem;
        }
        .credentials h3 {
            color: #856404;
            margin-bottom: 1rem;
        }
        .credentials p {
            color: #856404;
            margin-bottom: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 BLJ Study Hub & Cafe Installation</h1>
        <p class="subtitle">Set up your database in a few simple steps</p>

        <?php
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $db_host = $_POST['db_host'];
            $db_user = $_POST['db_user'];
            $db_pass = $_POST['db_pass'];
            $db_name = $_POST['db_name'];

            try {
                // Connect to MySQL
                $conn = new PDO("mysql:host=$db_host", $db_user, $db_pass);
                $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

                // Create database
                $conn->exec("CREATE DATABASE IF NOT EXISTS $db_name");
                $conn->exec("USE $db_name");

                // Read and execute schema
                $schema = file_get_contents('database/schema.sql');
                
                // Split by semicolon and execute each statement
                $statements = array_filter(array_map('trim', explode(';', $schema)));
                
                foreach ($statements as $statement) {
                    if (!empty($statement)) {
                        $conn->exec($statement);
                    }
                }

                // Update config file
                $config_content = "<?php
/**
 * Database Configuration
 * BLJ Study Hub & Cafe
 */

class Database {
    private \$host = &quot;$db_host&quot;;
    private \$db_name = &quot;$db_name&quot;;
    private \$username = &quot;$db_user&quot;;
    private \$password = &quot;$db_pass&quot;;
    private \$conn;

    /**
     * Get database connection
     */
    public function getConnection() {
        \$this->conn = null;

        try {
            \$this->conn = new PDO(
                &quot;mysql:host=&quot; . \$this->host . &quot;;dbname=&quot; . \$this->db_name,
                \$this->username,
                \$this->password
            );
            \$this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            \$this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException \$e) {
            echo &quot;Connection Error: &quot; . \$e->getMessage();
        }

        return \$this->conn;
    }
}
?>";
                file_put_contents('config/database.php', $config_content);

                echo '<div class="success">
                    <h3>✅ Installation Successful!</h3>
                    <p>Database and tables have been created successfully.</p>
                </div>';

                echo '<div class="credentials">
                    <h3>🔐 Default Admin Credentials</h3>
                    <p><strong>Username:</strong> admin</p>
                    <p><strong>Password:</strong> admin123</p>
                    <p style="margin-top: 1rem; color: #dc3545;"><strong>⚠️ Important:</strong> Please change the default password after first login!</p>
                </div>';

                echo '<div class="info">
                    <h3>📝 Next Steps:</h3>
                    <p>1. Delete or rename this <code>install.php</code> file for security</p>
                    <p>2. Visit <a href="admin-login.html">admin-login.html</a> to login</p>
                    <p>3. Visit <a href="homepage.html">homepage.html</a> to see the site</p>
                    <p>4. Change the default admin password</p>
                </div>';

            } catch (PDOException $e) {
                echo '<div class="error">
                    <h3>❌ Installation Failed</h3>
                    <p>Error: ' . $e->getMessage() . '</p>
                    <p>Please check your database credentials and try again.</p>
                </div>';
            }
        } else {
        ?>

        <div class="step">
            <h3>Step 1: Database Information</h3>
            <p>Enter your MySQL database credentials below. Make sure MySQL is running.</p>
        </div>

        <form method="POST">
            <div class="form-group">
                <label>Database Host</label>
                <input type="text" name="db_host" value="localhost" required>
            </div>

            <div class="form-group">
                <label>Database Username</label>
                <input type="text" name="db_user" value="root" required>
            </div>

            <div class="form-group">
                <label>Database Password</label>
                <input type="password" name="db_pass" placeholder="Leave empty if no password">
            </div>

            <div class="form-group">
                <label>Database Name</label>
                <input type="text" name="db_name" value="blj_study_cafe" required>
            </div>

            <button type="submit" class="btn">Install Database</button>
        </form>

        <div class="info" style="margin-top: 2rem;">
            <h3>ℹ️ Before You Start</h3>
            <p>• Make sure MySQL/MariaDB is running</p>
            <p>• Ensure you have proper database permissions</p>
            <p>• The database will be created automatically</p>
            <p>• Sample data will be inserted</p>
        </div>

        <?php } ?>
    </div>
</body>
</html>