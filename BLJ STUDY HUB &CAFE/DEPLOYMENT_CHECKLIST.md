# 🚀 Deployment Checklist
## BLJ Study Hub & Cafe - Production Deployment

Use this checklist to ensure a smooth deployment to production.

---

## 📋 Pre-Deployment Checklist

### 1. Local Testing
- [ ] All features tested locally
- [ ] No PHP errors or warnings
- [ ] All API endpoints working
- [ ] Database queries optimized
- [ ] JavaScript console has no errors
- [ ] Forms submit correctly
- [ ] File uploads work (if applicable)
- [ ] Session management working
- [ ] Logout functionality working

### 2. Security Review
- [ ] Default admin password changed
- [ ] Error display disabled in production
- [ ] Database credentials secured
- [ ] File permissions set correctly
- [ ] SQL injection prevention verified
- [ ] XSS protection implemented
- [ ] CSRF tokens added (if needed)
- [ ] Session security configured
- [ ] HTTPS enabled
- [ ] Sensitive files protected

### 3. Database Preparation
- [ ] Database backup created
- [ ] Production database created
- [ ] Schema imported successfully
- [ ] Sample data removed (if needed)
- [ ] Database user created with limited permissions
- [ ] Database connection tested
- [ ] Indexes verified
- [ ] Foreign keys working

### 4. Code Preparation
- [ ] Debug mode disabled
- [ ] Error logging enabled
- [ ] Production config created
- [ ] API endpoints tested
- [ ] File paths updated for production
- [ ] Remove development files
- [ ] Code commented properly
- [ ] Version control updated

---

## 🔧 Configuration Changes

### 1. Update Database Configuration
Edit `config/database.php`:

```php
<?php
class Database {
    // PRODUCTION SETTINGS
    private $host = "your-production-host";
    private $db_name = "your-production-db";
    private $username = "your-production-user";
    private $password = "your-secure-password";
    
    // ... rest of code
}
?>
```

### 2. Disable Error Display
Add to all PHP files or `.htaccess`:

```php
// Disable error display
error_reporting(0);
ini_set('display_errors', 0);

// Enable error logging
ini_set('log_errors', 1);
ini_set('error_log', '/path/to/error.log');
```

### 3. Enable HTTPS
Update `includes/auth.php`:

```php
// Force HTTPS
if (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') {
    header('Location: https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);
    exit;
}

// Secure session cookies
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Strict');
```

### 4. Update File Paths
Check all file references:
- Image paths
- CSS/JS paths
- API endpoint URLs
- Redirect URLs

---

## 📦 Deployment Steps

### Step 1: Prepare Production Server
```bash
# Update system
sudo apt update && sudo apt upgrade

# Install required packages
sudo apt install apache2 php mysql-server
sudo apt install php-mysql php-json php-mbstring

# Enable Apache modules
sudo a2enmod rewrite
sudo a2enmod ssl
sudo systemctl restart apache2
```

### Step 2: Upload Files
```bash
# Using FTP/SFTP
# Upload all files to /var/www/html/blj-cafe/

# Or using Git
cd /var/www/html/
git clone your-repository.git blj-cafe
```

### Step 3: Set Permissions
```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/html/blj-cafe/

# Set directory permissions
sudo find /var/www/html/blj-cafe/ -type d -exec chmod 755 {} \;

# Set file permissions
sudo find /var/www/html/blj-cafe/ -type f -exec chmod 644 {} \;

# Make config directory secure
sudo chmod 750 /var/www/html/blj-cafe/config/
sudo chmod 640 /var/www/html/blj-cafe/config/database.php
```

### Step 4: Configure Apache
Create virtual host file:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    DocumentRoot /var/www/html/blj-cafe
    
    <Directory /var/www/html/blj-cafe>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/blj-cafe-error.log
    CustomLog ${APACHE_LOG_DIR}/blj-cafe-access.log combined
</VirtualHost>
```

### Step 5: Setup SSL Certificate
```bash
# Using Let's Encrypt
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com
```

### Step 6: Create Production Database
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE blj_study_cafe_prod;

# Create user with limited permissions
CREATE USER 'blj_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON blj_study_cafe_prod.* TO 'blj_user'@'localhost';
FLUSH PRIVILEGES;

# Import schema
USE blj_study_cafe_prod;
SOURCE /var/www/html/blj-cafe/database/schema.sql;
```

### Step 7: Update Configuration
```bash
# Edit database config
nano /var/www/html/blj-cafe/config/database.php

# Update with production credentials
```

### Step 8: Security Hardening
```bash
# Remove install.php
sudo rm /var/www/html/blj-cafe/install.php

# Protect sensitive files
sudo nano /var/www/html/blj-cafe/.htaccess
```

Add to `.htaccess`:
```apache
# Deny access to sensitive files
<FilesMatch "^(config|includes|database)">
    Require all denied
</FilesMatch>

# Deny access to .php files in config
<Files "database.php">
    Require all denied
</Files>

# Enable HTTPS redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### Step 9: Test Production
- [ ] Visit https://yourdomain.com
- [ ] Test user login
- [ ] Test admin login
- [ ] Test all features
- [ ] Check error logs
- [ ] Test on mobile devices
- [ ] Test different browsers

### Step 10: Monitor & Maintain
```bash
# Check error logs
sudo tail -f /var/log/apache2/blj-cafe-error.log

# Check PHP errors
sudo tail -f /var/log/php/error.log

# Monitor database
mysql -u root -p
SHOW PROCESSLIST;
```

---

## 🔒 Security Hardening

### 1. File Security
```bash
# Disable directory listing
echo "Options -Indexes" >> .htaccess

# Protect config files
chmod 600 config/database.php

# Secure uploads directory (if exists)
chmod 755 uploads/
```

### 2. Database Security
```sql
-- Use strong passwords
ALTER USER 'blj_user'@'localhost' IDENTIFIED BY 'very_strong_password_here';

-- Limit permissions
REVOKE ALL PRIVILEGES ON *.* FROM 'blj_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON blj_study_cafe_prod.* TO 'blj_user'@'localhost';
```

### 3. PHP Security
Add to `php.ini` or `.htaccess`:
```ini
# Disable dangerous functions
disable_functions = exec,passthru,shell_exec,system,proc_open,popen

# Hide PHP version
expose_php = Off

# Limit file uploads
upload_max_filesize = 2M
post_max_size = 8M

# Session security
session.cookie_httponly = 1
session.cookie_secure = 1
session.use_strict_mode = 1
```

### 4. Apache Security
```apache
# Hide server signature
ServerSignature Off
ServerTokens Prod

# Prevent clickjacking
Header always set X-Frame-Options "SAMEORIGIN"

# XSS protection
Header always set X-XSS-Protection "1; mode=block"

# Content type sniffing
Header always set X-Content-Type-Options "nosniff"

# Referrer policy
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

---

## 📊 Performance Optimization

### 1. Enable Caching
```apache
# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### 2. Enable Compression
```apache
# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
    AddOutputFilterByType DEFLATE application/javascript application/json
</IfModule>
```

### 3. Database Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_order_status ON orders(status);
CREATE INDEX idx_booking_date ON bookings(booking_date);

-- Optimize tables
OPTIMIZE TABLE users, orders, products, bookings;
```

---

## 🔄 Backup Strategy

### 1. Database Backup
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p blj_study_cafe_prod > /backups/db_$DATE.sql
gzip /backups/db_$DATE.sql

# Keep only last 7 days
find /backups -name "db_*.sql.gz" -mtime +7 -delete
```

### 2. File Backup
```bash
# Weekly file backup
tar -czf /backups/files_$(date +%Y%m%d).tar.gz /var/www/html/blj-cafe/
```

### 3. Automated Backups
```bash
# Add to crontab
crontab -e

# Daily database backup at 2 AM
0 2 * * * /path/to/backup-script.sh

# Weekly file backup on Sunday at 3 AM
0 3 * * 0 /path/to/file-backup.sh
```

---

## 📈 Monitoring

### 1. Setup Monitoring
- [ ] Install monitoring tools (e.g., New Relic, Datadog)
- [ ] Configure error alerts
- [ ] Setup uptime monitoring
- [ ] Monitor database performance
- [ ] Track API response times

### 2. Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/blj-cafe

/var/log/apache2/blj-cafe-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 root adm
    sharedscripts
    postrotate
        systemctl reload apache2 > /dev/null
    endscript
}
```

---

## ✅ Post-Deployment Verification

### Functionality Tests
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Admin login works
- [ ] Cart functionality works
- [ ] Order placement works
- [ ] Booking system works
- [ ] Messages work
- [ ] Notifications work
- [ ] Admin panel accessible
- [ ] All CRUD operations work

### Security Tests
- [ ] HTTPS working
- [ ] Redirects to HTTPS
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked
- [ ] Session hijacking prevented
- [ ] File upload restrictions work
- [ ] Error messages don't reveal sensitive info

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] API response time < 1 second
- [ ] Database queries optimized
- [ ] Images compressed
- [ ] Caching working
- [ ] Gzip compression enabled

---

## 🆘 Rollback Plan

If deployment fails:

1. **Restore Database**
```bash
mysql -u root -p blj_study_cafe_prod < /backups/db_backup.sql
```

2. **Restore Files**
```bash
tar -xzf /backups/files_backup.tar.gz -C /var/www/html/
```

3. **Revert Configuration**
```bash
cp /backups/database.php.bak config/database.php
```

4. **Restart Services**
```bash
sudo systemctl restart apache2
sudo systemctl restart mysql
```

---

## 📞 Support Contacts

- **Hosting Provider:** [Contact Info]
- **Domain Registrar:** [Contact Info]
- **SSL Certificate:** [Contact Info]
- **Developer:** [Contact Info]

---

## 🎉 Deployment Complete!

Once all items are checked:
- [ ] All tests passed
- [ ] Security verified
- [ ] Performance optimized
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Documentation updated
- [ ] Team notified

**Your BLJ Study Hub & Cafe is now LIVE! 🚀**

---

*Last Updated: [Date]*  
*Deployed By: [Name]*  
*Version: 1.0.0*