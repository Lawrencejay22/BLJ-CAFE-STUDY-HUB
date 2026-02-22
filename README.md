# 🎓 BLJ Study Hub & Cafe Management System

[![PHP Version](https://img.shields.io/badge/PHP-8.x-777bb4?style=flat-square&logo=php)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?style=flat-square&logo=mysql)](https://www.mysql.com/)
[![Chart.js](https://img.shields.io/badge/Analytics-Chart.js-FF6384?style=flat-square&logo=chartdotjs)](https://www.chartjs.org/)
[![UI Style](https://img.shields.io/badge/UI-Glassmorphism-00d2ff?style=flat-square)](https://en.wikipedia.org/wiki/Glassmorphism)

A modern, full-featured management system designed for seamless booking, coffee ordering, and administrative oversight. This project blends a sleek **Glassmorphism UI** with a robust **PHP/MySQL backend**.

---

## 🚀 Key Features

### 🛒 Customer Experience
* **Dynamic Menu:** Real-time product listings fetched directly from the database.
* **Availability Logic:** Items automatically show "(Not Available)" and are greyed out if flagged by an admin.
* **Smart Cart & Booking:** Unified system for snacks, beverages, and services like "Study Hub," "Wifi Area," and "Printing."
* **Order Security:** Server-side validation prevents the checkout of unavailable inventory.

### 🛡️ Admin Command Center
* **Real-Time Dashboard:** * **Revenue Trends:** Visual sales performance tracking via **Chart.js**.
    * **Activity Timeline:** Live updates on new customer orders and signups.
    * **Quick Stats:** At-a-glance view of Total Users, Active Products, and Total Revenue.
* **Inventory Control:** Full CRUD functionality with a one-click **Toggle Availability** feature.
* **User & Order Management:** Securely manage roles and mark orders as "Completed."

### 🔐 Authentication & Security
* **Role-Based Access Control (RBAC):** Dedicated portals for Admins and Customers.
* **Session Protection:** Logout confirmation prompts and intelligent role-aware redirection.
* **Data Integrity:** All database interactions use **Prepared Statements** to prevent SQL injection.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML5, Vanilla CSS3 (Glassmorphism), JavaScript (ES6+) |
| **Backend** | PHP 8.x |
| **Database** | MySQL (MariaDB) |
| **Libraries** | Chart.js (Analytics), FontAwesome (Icons) |

---

## 📁 Project Structure

```text
BLJ-STUDY-HUB/
├── assets/
│   ├── css/          # Glassmorphism & Dashboard layouts
│   ├── js/           # admin.js, cart.js, script.js
│   └── images/       # Branding and product assets
├── php/              # Backend core (Auth, APIs, Order handling)
├── includes/         # Database connection & shared functions
├── index.html        # Customer Landing Page
├── admin.html        # Admin Dashboard
└── README.md         # Project documentation
---

## 🔧 Installation & Database Setup
1. **Host**: Use XAMPP/WAMP (Place project in `htdocs`).
2. **Database**: 
   - Create a database named `blj_study_hub`.
   - Ensure the `products` table includes the `is_available` (TINYINT) column.
   - Run the initial `db_connect.php` to auto-create tables if they don't exist.
3. **Run**: Access via `localhost/BLJ STUDY HUB/index.html`.

---
*Developed for a premium Study Hub & Cafe experience.*
