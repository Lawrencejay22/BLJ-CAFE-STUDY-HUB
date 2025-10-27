# Complete PHP Integration Guide
## BLJ Study Hub & Cafe

This guide explains how all the PHP files connect with your HTML files and how to use the system.

---

## 📁 File Structure Overview

```
blj-study-cafe/
├── 🔧 Configuration Files
│   └── config/database.php          # Database connection settings
│
├── 🗄️ Database Files
│   └── database/schema.sql          # Database structure and sample data
│
├── 🔐 Authentication Files
│   ├── includes/auth.php            # Authentication logic
│   ├── signin.php                   # User login handler
│   ├── admin-login.php              # Admin login handler
│   ├── register.php                 # User registration handler
│   └── logout.php                   # Logout handler
│
├── 🌐 API Files
│   ├── api/admin/
│   │   ├── dashboard.php            # Admin statistics
│   │   ├── users.php                # User management
│   │   ├── orders.php               # Order management
│   │   ├── products.php             # Product management
│   │   └── bookings.php             # Booking management
│   └── api/user/
│       ├── cart.php                 # Shopping cart
│       ├── messages.php             # User messages
│       └── notifications.php        # User notifications
│
├── 🎨 Frontend Files
│   ├── signin.html                  # User login page
│   ├── signin-updated.html          # PHP-connected login page
│   ├── admin-login.html             # Admin login page
│   ├── admin-login-updated.html     # PHP-connected admin login
│   ├── admin-panel.html             # Admin dashboard
│   ├── BLJ Study hub & Cafe.html    # Main application
│   └── homepage.html                # Landing page
│
└── 📚 Documentation
    ├── README.md                    # Full documentation
    ├── SETUP_GUIDE.md               # Quick setup guide
    ├── INTEGRATION_GUIDE.md         # This file
    └── install.php                  # Web-based installer
```

---

## 🔄 How Files Connect

### 1. User Authentication Flow

```
User visits signin.html
    ↓
User enters credentials
    ↓
JavaScript sends POST to signin.php
    ↓
signin.php uses includes/auth.php
    ↓
auth.php checks config/database.php
    ↓
Queries database for user
    ↓
Returns JSON response
    ↓
JavaScript redirects to main app
```

**Code Example:**
```javascript
// In signin-updated.html
fetch('signin.php', {
    method: 'POST',
    body: JSON.stringify({username, password})
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        window.location.href = 'BLJ Study hub & Cafe.html';
    }
});
```

### 2. Admin Authentication Flow

```
Admin visits admin-login.html
    ↓
Admin enters credentials
    ↓
JavaScript sends POST to admin-login.php
    ↓
admin-login.php uses includes/auth.php
    ↓
auth.php validates admin credentials
    ↓
Returns JSON response
    ↓
JavaScript redirects to admin-panel.html
```

### 3. API Request Flow

```
User action in HTML
    ↓
JavaScript makes API call
    ↓
API file checks authentication
    ↓
API queries database
    ↓
Returns JSON data
    ↓
JavaScript updates UI
```

**Code Example:**
```javascript
// Get cart items
fetch('api/user/cart.php')
    .then(response => response.json())
    .then(data => {
        // Update cart UI with data.items
    });
```

---

## 🔌 Integration Points

### A. User Login Integration

**Original File:** `signin.html`  
**Updated File:** `signin-updated.html`  
**Backend:** `signin.php`

**Changes Made:**
1. Added fetch API call to `signin.php`
2. Handles JSON response
3. Stores session data
4. Redirects on success

**To Use:**
- Replace `signin.html` with `signin-updated.html`
- Or update your existing `signin.html` with the JavaScript code

### B. Admin Login Integration

**Original File:** `admin-login.html`  
**Updated File:** `admin-login-updated.html`  
**Backend:** `admin-login.php`

**Changes Made:**
1. Added fetch API call to `admin-login.php`
2. Handles authentication response
3. Stores admin session
4. Redirects to admin panel

**To Use:**
- Replace `admin-login.html` with `admin-login-updated.html`
- Or update your existing `admin-login.html`

### C. Admin Panel Integration

**File:** `admin-panel.html`  
**Backend APIs:**
- `api/admin/dashboard.php` - Statistics
- `api/admin/users.php` - User management
- `api/admin/orders.php` - Order management
- `api/admin/products.php` - Product management
- `api/admin/bookings.php` - Booking management

**Integration Steps:**

1. **Load Dashboard Data:**
```javascript
// Add to admin-panel.html
fetch('api/admin/dashboard.php')
    .then(response => response.json())
    .then(data => {
        // Update dashboard with data.stats
        document.getElementById('totalUsers').textContent = data.stats.total_users;
        document.getElementById('totalOrders').textContent = data.stats.total_orders;
        // ... etc
    });
```

2. **Load Users:**
```javascript
fetch('api/admin/users.php?page=1&limit=20')
    .then(response => response.json())
    .then(data => {
        // Populate user table with data.data
    });
```

3. **Create User:**
```javascript
fetch('api/admin/users.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        username: 'newuser',
        email: 'user@example.com',
        password: 'password123'
    })
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        // Refresh user list
    }
});
```

### D. Main Application Integration

**File:** `BLJ Study hub & Cafe.html`  
**Backend APIs:**
- `api/user/cart.php` - Shopping cart
- `api/user/messages.php` - Messages
- `api/user/notifications.php` - Notifications

**Integration Steps:**

1. **Load Cart:**
```javascript
fetch('api/user/cart.php')
    .then(response => response.json())
    .then(data => {
        // Update cart badge
        document.getElementById('cart-badge').textContent = data.data.count;
        // Populate cart items
    });
```

2. **Add to Cart:**
```javascript
fetch('api/user/cart.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        product_id: 1,
        quantity: 2
    })
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        // Update cart UI
    }
});
```

3. **Load Messages:**
```javascript
fetch('api/user/messages.php')
    .then(response => response.json())
    .then(data => {
        // Update message badge
        document.getElementById('mail-badge').textContent = data.data.unread_count;
        // Populate messages
    });
```

4. **Load Notifications:**
```javascript
fetch('api/user/notifications.php')
    .then(response => response.json())
    .then(data => {
        // Update notification badge
        document.getElementById('notification-badge').textContent = data.data.unread_count;
        // Populate notifications
    });
```

---

## 🎯 Complete Integration Checklist

### Phase 1: Setup
- [ ] Install XAMPP/WAMP/MAMP
- [ ] Copy all files to web directory
- [ ] Start Apache and MySQL
- [ ] Run `install.php` or import `database/schema.sql`
- [ ] Verify database connection

### Phase 2: Authentication
- [ ] Replace `signin.html` with `signin-updated.html`
- [ ] Replace `admin-login.html` with `admin-login-updated.html`
- [ ] Test user login
- [ ] Test admin login
- [ ] Test logout functionality

### Phase 3: Admin Panel
- [ ] Add dashboard API call to `admin-panel.html`
- [ ] Add user management API calls
- [ ] Add order management API calls
- [ ] Add product management API calls
- [ ] Add booking management API calls
- [ ] Test all CRUD operations

### Phase 4: Main Application
- [ ] Add cart API calls to main HTML
- [ ] Add message API calls
- [ ] Add notification API calls
- [ ] Test cart functionality
- [ ] Test messaging
- [ ] Test notifications

### Phase 5: Testing
- [ ] Test user registration
- [ ] Test user login/logout
- [ ] Test admin login/logout
- [ ] Test all admin features
- [ ] Test all user features
- [ ] Test on different browsers

### Phase 6: Security
- [ ] Change default admin password
- [ ] Disable error display
- [ ] Enable HTTPS (production)
- [ ] Set secure session cookies
- [ ] Review file permissions
- [ ] Delete `install.php`

---

## 💡 Usage Examples

### Example 1: Complete User Login Flow

```javascript
// In signin-updated.html
document.getElementById('signinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const response = await fetch('signin.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            remember: document.getElementById('rememberMe').checked
        })
    });
    
    const data = await response.json();
    
    if (data.success) {
        // Store session
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('username', data.user.username);
        
        // Redirect
        window.location.href = data.redirect;
    } else {
        // Show error
        alert(data.message);
    }
});
```

### Example 2: Admin Dashboard Integration

```javascript
// In admin-panel.html
async function loadDashboard() {
    try {
        const response = await fetch('api/admin/dashboard.php');
        const data = await response.json();
        
        if (data.success) {
            // Update statistics
            document.getElementById('totalUsers').textContent = data.data.stats.total_users;
            document.getElementById('totalOrders').textContent = data.data.stats.total_orders;
            document.getElementById('totalRevenue').textContent = '$' + data.data.stats.total_revenue;
            
            // Update charts
            updateRevenueChart(data.data.monthly_revenue);
            updateOrderChart(data.data.order_status_distribution);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Call on page load
window.addEventListener('load', loadDashboard);
```

### Example 3: Shopping Cart Integration

```javascript
// In BLJ Study hub & Cafe.html
class ShoppingCart {
    async loadCart() {
        const response = await fetch('api/user/cart.php');
        const data = await response.json();
        
        if (data.success) {
            this.updateCartBadge(data.data.count);
            this.renderCartItems(data.data.items);
            this.updateTotal(data.data.subtotal);
        }
    }
    
    async addToCart(productId, quantity) {
        const response = await fetch('api/user/cart.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({product_id: productId, quantity: quantity})
        });
        
        const data = await response.json();
        
        if (data.success) {
            this.loadCart(); // Refresh cart
            this.showNotification('Item added to cart');
        }
    }
    
    updateCartBadge(count) {
        document.getElementById('cart-badge').textContent = count;
    }
}

const cart = new ShoppingCart();
cart.loadCart();
```

---

## 🔍 Debugging Tips

### 1. Check PHP Errors
```php
// Add to top of PHP files temporarily
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

### 2. Check JavaScript Console
```javascript
// Add console logs
console.log('Response:', data);
```

### 3. Check Network Tab
- Open browser DevTools (F12)
- Go to Network tab
- Check API requests and responses

### 4. Check Database
- Open phpMyAdmin
- Verify tables exist
- Check data is being inserted

### 5. Check Sessions
```php
// Add to PHP files
session_start();
var_dump($_SESSION);
```

---

## 📞 Support & Resources

- **Full Documentation:** See `README.md`
- **Quick Setup:** See `SETUP_GUIDE.md`
- **Database Schema:** See `database/schema.sql`
- **Web Installer:** Run `install.php`

---

## ✅ Final Notes

1. **Always test locally first** before deploying to production
2. **Change default passwords** immediately
3. **Enable HTTPS** in production
4. **Keep backups** of your database
5. **Monitor error logs** regularly
6. **Update dependencies** as needed

---

**Integration Complete! 🎉**

Your BLJ Study Hub & Cafe application is now fully connected with PHP backend and MySQL database.