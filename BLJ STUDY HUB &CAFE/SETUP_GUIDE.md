# Quick Setup Guide - BLJ Study Hub & Cafe

## 🚀 Quick Start (5 Minutes)

### Step 1: Install XAMPP/WAMP/MAMP
Download and install one of these:
- **Windows**: [XAMPP](https://www.apachefriends.org/) or [WAMP](https://www.wampserver.com/)
- **Mac**: [MAMP](https://www.mamp.info/)
- **Linux**: Install Apache, PHP, MySQL manually or use XAMPP

### Step 2: Copy Files
1. Copy all project files to:
   - **XAMPP**: `C:\xampp\htdocs\blj-cafe\`
   - **WAMP**: `C:\wamp64\www\blj-cafe\`
   - **MAMP**: `/Applications/MAMP/htdocs/blj-cafe/`

### Step 3: Start Services
1. Open XAMPP/WAMP/MAMP Control Panel
2. Start **Apache** and **MySQL** services

### Step 4: Create Database
1. Open browser and go to: `http://localhost/phpmyadmin`
2. Click "New" to create a database
3. Name it: `blj_study_cafe`
4. Click "Import" tab
5. Choose file: `database/schema.sql`
6. Click "Go" to import

### Step 5: Configure Database Connection
1. Open `config/database.php`
2. Update if needed (default settings work for XAMPP/WAMP/MAMP):
   ```php
   private $host = "localhost";
   private $db_name = "blj_study_cafe";
   private $username = "root";
   private $password = ""; // Leave empty for XAMPP/WAMP
   ```

### Step 6: Test Installation
1. Open browser and go to: `http://localhost/blj-cafe/homepage.html`
2. Click "Sign In"
3. Try admin login:
   - Username: `admin`
   - Password: `admin123`

## ✅ Verification Checklist

- [ ] Apache is running
- [ ] MySQL is running
- [ ] Database `blj_study_cafe` exists
- [ ] All tables are created (check phpMyAdmin)
- [ ] Can access homepage at `http://localhost/blj-cafe/`
- [ ] Can login to admin panel
- [ ] No PHP errors displayed

## 🔧 Common Setup Issues

### Issue 1: "Connection Error"
**Fix**: 
- Check MySQL is running
- Verify database name is correct
- Check username/password in `config/database.php`

### Issue 2: "404 Not Found"
**Fix**:
- Ensure files are in correct directory
- Check Apache is running
- Verify URL is correct

### Issue 3: Blank Page
**Fix**:
- Check PHP error logs
- Enable error display temporarily:
  ```php
  error_reporting(E_ALL);
  ini_set('display_errors', 1);
  ```

### Issue 4: "Access Denied"
**Fix**:
- Check MySQL user permissions
- For XAMPP/WAMP, default is:
  - Username: `root`
  - Password: (empty)

## 📱 Testing the Application

### Test User Login
1. Go to `http://localhost/blj-cafe/signin.html`
2. Register a new account
3. Login with your credentials
4. You should see the main application

### Test Admin Panel
1. Go to `http://localhost/blj-cafe/admin-login.html`
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. You should see the admin dashboard

### Test APIs
Use browser console or Postman to test:
```javascript
// Test user login
fetch('http://localhost/blj-cafe/signin.php', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(console.log);
```

## 🎯 Next Steps

1. **Change Admin Password**: Login and update the default password
2. **Add Products**: Use admin panel to add menu items
3. **Customize**: Update branding, colors, and content
4. **Test Features**: Try all features (cart, orders, bookings)
5. **Deploy**: When ready, deploy to production server

## 📞 Need Help?

Check these resources:
1. `README.md` - Full documentation
2. PHP error logs (in XAMPP/WAMP logs folder)
3. Browser console for JavaScript errors
4. phpMyAdmin to verify database

## 🔐 Security Reminder

Before going live:
- [ ] Change default admin password
- [ ] Disable error display
- [ ] Enable HTTPS
- [ ] Update database credentials
- [ ] Set proper file permissions
- [ ] Enable security headers

---

**Setup Time**: ~5 minutes  
**Difficulty**: Beginner-friendly  
**Support**: Check README.md for detailed documentation