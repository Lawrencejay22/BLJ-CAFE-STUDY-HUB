# 🎓 BLJ Study Hub & Cafe Management System

<div align="center">
  <img src="assets/image/Gemini.png" alt="BLJ Hub Logo" width="140" style="border-radius: 50%; border: 4px solid #a855f7; box-shadow: 0 0 30px rgba(168, 85, 247, 0.6);">
  <br>
  <h1>✨ Premium Cyber-Luxury Experience ✨</h1>
  <p><i>The intersection of modern coworking and futuristic high-end design.</i></p>

  [![PHP Version](https://img.shields.io/badge/PHP-8.x-777bb4?style=for-the-badge&logo=php)](https://www.php.net/)
  [![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql)](https://www.mysql.com/)
  [![Chart.js](https://img.shields.io/badge/Analytics-Chart.js-FF6384?style=for-the-badge&logo=chartdotjs)](https://www.chartjs.org/)
  [![UI Style](https://img.shields.io/badge/UI-Cyber_Luxury-a855f7?style=for-the-badge)](https://en.wikipedia.org/wiki/Glassmorphism)
</div>

---

## 🌟 Project Vision
**BLJ Study Hub & Cafe** is a sophisticated, full-stack management solution tailored for elite coworking spaces and modern boutique cafes. It features a stunning **Cyber-Luxury UI**—blending vibrant neon accents with deep glassmorphism—and a robust **PHP/MySQL backend** that bridges the gap between digital commerce and physical room management.

---

## 🚀 Key Innovation Pillars

### 🛒 The "Cyber-Luxury" Checkout
*   **Atmospheric Entrance**: A sophisticated UI transition system using blur, scale, and fade animations.
*   **Unified Cart Engine**: Seamlessly bundle physical products (Coffee, Snacks) with temporal services (Room Reservations) in a single high-end transaction.
*   **Deep Pulse Interaction**: Buttons and items respond with glowing "energy core" effects and scanning lights.

### 🔄 Integrated Booking Synchronization
*   **Order-to-Room Link**: Every reservation is structurally linked to a sales transaction (`order_id`).
*   **Auto-Activation**: MARKING AN ORDER AS COMPLETED automatically "uploads" and validates the associated room booking in the Admin panel.
*   **Live Inventory Guard**: Real-time availability checks ensure that "Sold Out" items or "Fully Booked" rooms are greyed out and blocked server-side.

### 🛡️ Admin Command Center
*   **Predictive Analytics**: Integrated **Chart.js** trends for tracking 7-day revenue performance.
*   **Global Actions**: One-click confirmation for orders, reservation arrival tracking, and stock toggling.
*   **Security Architecture**: 100% Prepared Statement implementation for SQL injection immunity and Role-Based Access Control (RBAC).

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | HTML5 / Vanilla CSS3 | Custom "Cyber-Luxury" design system with mesh gradients. |
| **Logic** | JavaScript (ES6+) | Asynchronous state management and Fetch API integrations. |
| **Backend** | PHP 8.1+ | Professional-grade engine with unified JSON responses. |
| **Database** | MySQL (MariaDB) | Self-healing schema with ACID transaction support. |
| **Analytics** | Chart.js | Dynamic SVG-based data visualization. |

---

## 📁 Project Architecture

```bash
BLJ-STUDY-HUB/
├── assets/
│   ├── css/           # Cyber-Luxury & Glassmorphism styles (cart.css, admin.css)
│   ├── js/            # Core logic (admin.js, cart.js, booking.js)
│   └── image/         # Brand assets and futuristic product photography
├── php/               # The Backend Engine
│   ├── db_connect.php # Central DB Hub & Auto-Migration logic
│   ├── admin_data.php # Secure Administrative API (CRUD)
│   ├── place_order.php# The Transactional Synchronization engine
│   └── get_session.php# Authentication state manager
├── index.html         # High-Engagement Landing Page
├── admin.html         # Professional Administrative Dashboard
├── book.html          # Dynamic Service Reservation interface
└── cart.html          # Professional Checkout & Order Summary
```

---

## 🔧 Seamless Installation

1.  **Deploy**: Move the directory to your local server (e.g., `xampp/htdocs/`).
2.  **Zero-Configuration Database**:
    *   No manual SQL imports required.
    *   Simply visit `index.html`. The `db_connect.php` engine will **automatically detect** your environment and build the entire `blj_study_hub` database for you.
3.  **Default Access**:
    *   **Customer**: Register at `signUp.html`.
    *   **Admin**: Login at `admin-login.html` (Password: `admin_blj_2026`).

---

## 🛡️ Troubleshooting & Resolved Issues

### 1. Database Schema Mismatches
*   **Issue**: "Unknown column 'order_id' or 'status' in field list" error when placing orders or completing bookings.
*   **Resolution**: The `db_connect.php` now includes a **Dynamic Patching System**. It automatically detects and adds missing columns (`order_id`, `status`, `total_price`) to existing tables during initialization.

### 2. Admin Action Failures
*   **Issue**: Clicking the checkmark `✓` in the Admin Dashboard wouldn't confirm or would fail silently.
*   **Resolution**: 
    *   Updated `admin.js` to correctly detect both `.complete-order` and `.complete-booking` selectors.
    *   Enabled `mysqli_report` in the backend to provide descriptive error alerts (via browser `alert`) if a database transaction fails.

### 3. Order-to-Booking Synchronization
*   **Issue**: User paid for a room, but the booking status remained "Active" even after the order was "Completed".
*   **Resolution**: Re-engineered the `complete_order` action into a **Database Transaction**. Completing a product order now automatically sweeps the `bookings` table and marks all associated reservations as `used`.

### 4. Portal Access Redirects
*   **Issue**: Admins getting stuck in the user login loop or users accessing the admin panel.
*   **Resolution**: Implemented strict role validation in `login.php` and `admin_data.php`. Admins are now forced through the `admin-login.html` portal with dedicated error messaging for role mismatches.

---

<p align="center">
  <img src="assets/image/Gemini.png" width="40" style="vertical-align: middle;"> 
  <i>Crafted for the future of coworking.</i><br>
  <b>BLJ Study Hub · Version 2.0.0 · 2026</b>
</p>
