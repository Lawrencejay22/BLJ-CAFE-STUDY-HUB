# BLJ Study Hub & Cafe - PHP Backend Integration

Complete PHP backend system for the BLJ Study Hub & Cafe web application with MySQL database integration.

## 📋 Table of Contents
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [File Structure](#file-structure)
- [Usage](#usage)
- [Security Features](#security-features)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### Authentication System
- User registration and login
- Admin authentication
- Session management
- Remember me functionality
- Password hashing with bcrypt
- Activity logging

### Admin Panel
- Dashboard with statistics and analytics
- User management (CRUD operations)
- Order management
- Product/Menu management
- Booking management
- Real-time data updates

### User Features
- Shopping cart functionality
- Message system
- Notification system
- Order tracking
- Booking system

## 🔧 Requirements

- **PHP**: 7.4 or higher
- **MySQL**: 5.7 or higher (or MariaDB 10.2+)
- **Web Server**: Apache or Nginx
- **PHP Extensions**:
  - PDO
  - PDO_MySQL
  - JSON
  - Session

## 📦 Installation

### Step 1: Clone/Copy Files
Copy all files to your web server directory (e.g., `/var/www/html/` or `htdocs/`)

### Step 2: Configure Database Connection
Edit `config/database.php` and update the database credentials:

```php
private $host = "localhost";        // Your database host
private $db_name = "blj_study_cafe"; // Your database name
private $username = "root";          // Your database username
private $password = "";              // Your database password
```

### Step 3: Create Database
Run the SQL schema file to create the database and tables:

```bash
mysql -u root -p < database/schema.sql
```

Or import via phpMyAdmin:
1. Open phpMyAdmin
2. Create a new database named `blj_study_cafe`
3. Import the `database/schema.sql` file

### Step 4: Set Permissions
Ensure proper file permissions:

```bash
chmod 755 config/
chmod 644 config/database.php
chmod 755 api/
chmod 755 includes/
```

### Step 5: Configure Web Server

#### Apache (.htaccess)
Create `.htaccess` file in the root directory:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/$1 [L]

# Enable CORS if needed
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"
```

#### Nginx
Add to your server block:

```nginx
location /api/ {
    try_files $uri $uri/ /api/index.php?$query_string;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```

## 🗄️ Database Setup

### Default Admin Credentials
After running the schema, you can login to the admin panel with:
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change the default admin password immediately after first login!

### Database Tables
The schema creates the following tables:
- `users` - User accounts
- `admin_users` - Admin accounts
- `products` - Menu items/products
- `orders` - Customer orders
- `order_items` - Order line items
- `bookings` - Table reservations
- `messages` - User messaging
- `notifications` - User notifications
- `cart` - Shopping cart items
- `sessions` - User sessions
- `activity_logs` - Activity tracking

### Sample Data
The schema includes sample products. You can add more via the admin panel.

## ⚙️ Configuration

### Session Configuration
Edit `includes/auth.php` to customize session settings:

```php
// Session timeout (default: 30 days for remember me)
$expires = date('Y-m-d H:i:s', strtotime('+30 days'));
```

### Security Settings
Update these in `config/database.php`:

```php
// Enable error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set secure session cookies
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1); // Enable if using HTTPS
```

## 📚 API Documentation

### Authentication Endpoints

#### User Login
```
POST /signin.php
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123",
  "remember": true
}

Response:
{
  "success": true,
  "message": "Login successful",
  "redirect": "BLJ Study hub & Cafe.html",
  "user": {
    "id": 1,
    "username": "user",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user"
  }
}
```

#### Admin Login
```
POST /admin-login.php
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "remember": true
}

Response:
{
  "success": true,
  "message": "Admin login successful",
  "redirect": "admin-panel.html",
  "admin": {
    "id": 1,
    "username": "admin",
    "role": "super_admin"
  }
}
```

#### User Registration
```
POST /register.php
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "confirm_password": "password123",
  "full_name": "New User",
  "phone": "1234567890"
}

Response:
{
  "success": true,
  "message": "Registration successful",
  "user_id": 2,
  "redirect": "signin.html"
}
```

#### Logout
```
GET /logout.php

Response:
{
  "success": true,
  "message": "Logged out successfully",
  "redirect": "homepage.html"
}
```

### Admin API Endpoints

#### Dashboard Statistics
```
GET /api/admin/dashboard.php

Response:
{
  "success": true,
  "data": {
    "stats": {
      "total_users": 150,
      "total_orders": 500,
      "total_revenue": 15000.00,
      "total_bookings": 200,
      "pending_orders": 10,
      "today_revenue": 500.00
    },
    "recent_orders": [...],
    "recent_users": [...],
    "monthly_revenue": [...],
    "order_status_distribution": [...]
  }
}
```

#### User Management
```
GET /api/admin/users.php?page=1&limit=20&search=john
POST /api/admin/users.php (Create user)
PUT /api/admin/users.php (Update user)
DELETE /api/admin/users.php (Delete user)
```

#### Order Management
```
GET /api/admin/orders.php?page=1&status=pending
GET /api/admin/orders.php?id=1 (Get specific order)
PUT /api/admin/orders.php (Update order status)
DELETE /api/admin/orders.php (Delete order)
```

#### Product Management
```
GET /api/admin/products.php?page=1&category=coffee
POST /api/admin/products.php (Create product)
PUT /api/admin/products.php (Update product)
DELETE /api/admin/products.php (Delete product)
```

#### Booking Management
```
GET /api/admin/bookings.php?page=1&status=confirmed
PUT /api/admin/bookings.php (Update booking)
DELETE /api/admin/bookings.php (Delete booking)
```

### User API Endpoints

#### Cart Management
```
GET /api/user/cart.php (Get cart items)
POST /api/user/cart.php (Add to cart)
PUT /api/user/cart.php (Update quantity)
DELETE /api/user/cart.php (Remove item)
```

#### Messages
```
GET /api/user/messages.php (Get messages)
POST /api/user/messages.php (Send message)
PUT /api/user/messages.php (Mark as read)
DELETE /api/user/messages.php (Delete message)
```

#### Notifications
```
GET /api/user/notifications.php (Get notifications)
PUT /api/user/notifications.php (Mark as read)
DELETE /api/user/notifications.php (Delete notification)
```

## 📁 File Structure

```
blj-study-cafe/
├── config/
│   └── database.php          # Database configuration
├── database/
│   └── schema.sql            # Database schema
├── includes/
│   └── auth.php              # Authentication handler
├── api/
│   ├── admin/
│   │   ├── dashboard.php     # Admin dashboard API
│   │   ├── users.php         # User management API
│   │   ├── orders.php        # Order management API
│   │   ├── products.php      # Product management API
│   │   └── bookings.php      # Booking management API
│   └── user/
│       ├── cart.php          # Cart API
│       ├── messages.php      # Messages API
│       └── notifications.php # Notifications API
├── signin.php                # User login handler
├── admin-login.php           # Admin login handler
├── register.php              # User registration handler
├── logout.php                # Logout handler
├── signin.html               # User login page
├── admin-login.html          # Admin login page
├── admin-panel.html          # Admin panel
├── BLJ Study hub & Cafe.html # Main application
└── README.md                 # This file
```

## 🚀 Usage

### For Users
1. Visit `homepage.html` or `homepage.html.html`
2. Click "Sign In" to login or create an account
3. After login, you'll be redirected to the main application
4. Browse products, add to cart, place orders, and make bookings

### For Admins
1. Visit `admin-login.html`
2. Login with admin credentials
3. Access the admin panel to manage:
   - Users
   - Orders
   - Products/Menu
   - Bookings
   - View analytics and statistics

## 🔒 Security Features

### Implemented Security Measures
- ✅ Password hashing using bcrypt
- ✅ Prepared statements (SQL injection prevention)
- ✅ Session management
- ✅ Input validation
- ✅ XSS protection
- ✅ CSRF token support (ready to implement)
- ✅ Activity logging
- ✅ Secure session cookies

### Recommended Additional Security
1. **Enable HTTPS**: Always use SSL/TLS in production
2. **Update Passwords**: Change default admin password
3. **Rate Limiting**: Implement login attempt limiting
4. **CSRF Tokens**: Add CSRF protection to forms
5. **Input Sanitization**: Additional validation on frontend
6. **File Upload Security**: If implementing file uploads
7. **Regular Updates**: Keep PHP and MySQL updated

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error
**Error**: "Connection Error: SQLSTATE[HY000] [1045] Access denied"

**Solution**:
- Check database credentials in `config/database.php`
- Ensure MySQL service is running
- Verify user has proper permissions

#### 2. Session Not Working
**Error**: User gets logged out immediately

**Solution**:
- Check PHP session configuration
- Ensure session directory is writable
- Verify session cookies are enabled

#### 3. API Returns 404
**Error**: API endpoints return 404 Not Found

**Solution**:
- Check `.htaccess` configuration
- Verify mod_rewrite is enabled (Apache)
- Check file permissions

#### 4. CORS Errors
**Error**: "Access-Control-Allow-Origin" error

**Solution**:
- Add CORS headers in `.htaccess` or PHP files
- Configure web server to allow cross-origin requests

#### 5. JSON Parse Error
**Error**: "Unexpected token < in JSON"

**Solution**:
- Check for PHP errors before JSON output
- Disable error display in production
- Verify Content-Type headers

### Debug Mode
Enable debug mode by adding to `config/database.php`:

```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

**⚠️ Disable in production!**

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review PHP error logs
3. Check MySQL error logs
4. Verify all requirements are met

## 📄 License

This project is provided as-is for educational and commercial use.

## 🔄 Updates

### Version 1.0.0 (Current)
- Initial PHP backend implementation
- Complete authentication system
- Admin panel APIs
- User APIs
- Database schema
- Documentation

---

**Made with ❤️ for BLJ Study Hub & Cafe**