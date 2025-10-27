# 🚀 Quick Reference Guide
## BLJ Study Hub & Cafe - PHP Backend

---

## 📁 Essential Files

### Start Here
```
install.php              → Run this first to setup database
SETUP_GUIDE.md          → 5-minute quick setup
README.md               → Complete documentation
```

### Configuration
```
config/database.php     → Database connection settings
```

### Authentication
```
signin.php              → User login endpoint
admin-login.php         → Admin login endpoint
register.php            → User registration
logout.php              → Logout handler
```

### Admin APIs
```
api/admin/dashboard.php → Statistics & analytics
api/admin/users.php     → User management
api/admin/orders.php    → Order management
api/admin/products.php  → Product management
api/admin/bookings.php  → Booking management
```

### User APIs
```
api/user/cart.php           → Shopping cart
api/user/messages.php       → Messaging
api/user/notifications.php  → Notifications
```

---

## 🔑 Default Login

### Admin
```
URL: admin-login.html
Username: admin
Password: admin123
```

⚠️ **Change password after first login!**

---

## ⚡ Quick Commands

### Install Database
```bash
# Option 1: Web installer
http://localhost/blj-cafe/install.php

# Option 2: Command line
mysql -u root -p < database/schema.sql
```

### Test Installation
```bash
# Homepage
http://localhost/blj-cafe/homepage.html

# Admin login
http://localhost/blj-cafe/admin-login.html

# User login
http://localhost/blj-cafe/signin-updated.html
```

---

## 🔧 Common Tasks

### Change Database Password
Edit `config/database.php`:
```php
private $password = "your_new_password";
```

### Add New Product
```javascript
fetch('api/admin/products.php', {
    method: 'POST',
    body: JSON.stringify({
        name: 'Coffee',
        price: 4.50,
        category: 'coffee'
    })
});
```

### Get Cart Items
```javascript
fetch('api/user/cart.php')
    .then(r => r.json())
    .then(data => console.log(data));
```

---

## 🐛 Troubleshooting

### Connection Error
```
Check: config/database.php
Verify: MySQL is running
Test: phpMyAdmin access
```

### 404 Error
```
Check: File paths are correct
Verify: Apache is running
Test: http://localhost/
```

### Login Fails
```
Check: Database has data
Verify: Correct credentials
Test: Check browser console
```

---

## 📚 Documentation Map

```
SETUP_GUIDE.md          → Quick 5-min setup
README.md               → Complete technical docs
INTEGRATION_GUIDE.md    → Code examples
DEPLOYMENT_CHECKLIST.md → Production deployment
PROJECT_SUMMARY.md      → Project overview
DELIVERABLES.md         → What's included
```

---

## 🎯 Next Steps

1. ✅ Run `install.php`
2. ✅ Test admin login
3. ✅ Read `SETUP_GUIDE.md`
4. ✅ Customize as needed
5. ✅ Deploy to production

---

## 📞 Quick Help

**Can't connect to database?**  
→ Check `config/database.php`

**Login not working?**  
→ Verify database is setup

**API returns error?**  
→ Check browser console

**Need examples?**  
→ See `INTEGRATION_GUIDE.md`

---

**Ready to start? Run `install.php` now! 🚀**