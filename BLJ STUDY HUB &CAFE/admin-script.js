// ===================================
// ADMIN PANEL JAVASCRIPT
// ===================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('admin-login.html')) {
        initLoginPage();
    } else if (currentPage.includes('admin-panel.html')) {
        checkAuth();
        initAdminPanel();
    }
});

// ===================================
// LOGIN PAGE FUNCTIONALITY
// ===================================

function initLoginPage() {
    const loginForm = document.getElementById('admin-login-form');
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('remember-me').checked;

            // Simple authentication (in production, this should be server-side)
            if (username === 'admin' && password === 'admin123') {
                // Store authentication
                const authData = {
                    username: username,
                    loginTime: new Date().toISOString(),
                    rememberMe: rememberMe
                };
                
                if (rememberMe) {
                    localStorage.setItem('adminAuth', JSON.stringify(authData));
                } else {
                    sessionStorage.setItem('adminAuth', JSON.stringify(authData));
                }
                
                // Redirect to admin panel
                window.location.href = 'admin-panel.html';
            } else {
                // Show error message
                errorMessage.textContent = 'Invalid username or password';
                errorMessage.classList.add('show');
                
                // Hide error after 3 seconds
                setTimeout(() => {
                    errorMessage.classList.remove('show');
                }, 3000);
            }
        });
    }
}

// ===================================
// ADMIN PANEL FUNCTIONALITY
// ===================================

function checkAuth() {
    const authData = localStorage.getItem('adminAuth') || sessionStorage.getItem('adminAuth');
    
    if (!authData) {
        window.location.href = 'admin-login.html';
        return false;
    }
    
    try {
        const auth = JSON.parse(authData);
        document.getElementById('admin-username').textContent = auth.username;
        return true;
    } catch (e) {
        window.location.href = 'admin-login.html';
        return false;
    }
}

function initAdminPanel() {
    // Initialize sidebar navigation
    initSidebarNavigation();
    
    // Initialize logout functionality
    initLogout();
    
    // Load orders from localStorage
    loadOrders();
    
    // Initialize dashboard
    updateDashboard();
    
    // Initialize order filters
    initOrderFilters();
    
    // Initialize menu management
    initMenuManagement();
    
    // Initialize settings
    initSettings();
    
    // Initialize modals
    initModals();
    
    // Listen for new orders from the main site
    window.addEventListener('storage', function(e) {
        if (e.key === 'orders') {
            loadOrders();
            updateDashboard();
            showNotification('New order received!', 'info');
        }
    });
    
    // Check for new orders periodically
    setInterval(checkForNewOrders, 5000);
}

// ===================================
// SIDEBAR NAVIGATION
// ===================================

function initSidebarNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.admin-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            
            // Remove active class from all items and sections
            menuItems.forEach(mi => mi.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked item and corresponding section
            this.classList.add('active');
            document.getElementById(sectionId + '-section').classList.add('active');
            
            // Update section-specific data
            if (sectionId === 'orders') {
                loadOrders();
            } else if (sectionId === 'menu-management') {
                loadMenuItems();
            } else if (sectionId === 'customers') {
                loadCustomers();
            } else if (sectionId === 'messages') {
                loadMessages();
            } else if (sectionId === 'analytics') {
                loadAnalytics();
            }
        });
    });
}

// ===================================
// LOGOUT FUNCTIONALITY
// ===================================

function initLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('adminAuth');
                sessionStorage.removeItem('adminAuth');
                window.location.href = 'admin-login.html';
            }
        });
    }
}

// ===================================
// ORDERS MANAGEMENT
// ===================================

function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const ordersTableBody = document.getElementById('orders-table-body');
    const ordersBadge = document.getElementById('orders-badge');
    
    // Update badge count
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    ordersBadge.textContent = pendingOrders;
    
    if (orders.length === 0) {
        ordersTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fa-solid fa-shopping-cart"></i>
                        <p>No orders yet</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    ordersTableBody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customer || 'Guest'}</td>
            <td>${order.items.length} items</td>
            <td>$${order.total.toFixed(2)}</td>
            <td><span class="status-badge ${order.status}">${order.status}</span></td>
            <td>${new Date(order.date).toLocaleString()}</td>
            <td>
                <button class="action-btn view" onclick="viewOrder('${order.id}')">
                    <i class="fa-solid fa-eye"></i>
                </button>
                ${order.status === 'pending' ? `
                    <button class="action-btn edit" onclick="updateOrderStatus('${order.id}', 'completed')">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    <button class="action-btn delete" onclick="updateOrderStatus('${order.id}', 'cancelled')">
                        <i class="fa-solid fa-times"></i>
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function viewOrder(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    const modal = document.getElementById('order-detail-modal');
    const modalBody = document.getElementById('order-detail-body');
    
    modalBody.innerHTML = `
        <div class="order-detail">
            <div class="order-detail-header">
                <h4>Order #${order.id}</h4>
                <span class="status-badge ${order.status}">${order.status}</span>
            </div>
            <div class="order-detail-info">
                <p><strong>Customer:</strong> ${order.customer || 'Guest'}</p>
                <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
                <p><strong>Email:</strong> ${order.email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
            </div>
            <div class="order-items">
                <h5>Order Items:</h5>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>$${item.price.toFixed(2)}</td>
                                <td>$${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="order-total">
                <h4>Total: $${order.total.toFixed(2)}</h4>
            </div>
            ${order.notes ? `
                <div class="order-notes">
                    <h5>Notes:</h5>
                    <p>${order.notes}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    modal.classList.add('show');
}

function updateOrderStatus(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) return;
    
    orders[orderIndex].status = newStatus;
    localStorage.setItem('orders', JSON.stringify(orders));
    
    loadOrders();
    updateDashboard();
    
    showNotification(`Order #${orderId} ${newStatus}`, 'success');
}

function checkForNewOrders() {
    const lastOrderCount = parseInt(sessionStorage.getItem('lastOrderCount') || '0');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    if (orders.length > lastOrderCount) {
        loadOrders();
        updateDashboard();
        
        // Play notification sound (optional)
        // new Audio('notification.mp3').play();
    }
    
    sessionStorage.setItem('lastOrderCount', orders.length.toString());
}

// ===================================
// DASHBOARD UPDATES
// ===================================

function updateDashboard() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    // Calculate statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    
    // Update stat cards
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('pending-orders').textContent = pendingOrders;
    document.getElementById('total-customers').textContent = new Set(orders.map(o => o.customer)).size;
    
    // Update recent orders
    updateRecentOrders(orders);
    
    // Update popular items
    updatePopularItems(orders);
}

function updateRecentOrders(orders) {
    const recentOrdersList = document.getElementById('recent-orders-list');
    const recentOrders = orders.slice(0, 5);
    
    if (recentOrders.length === 0) {
        recentOrdersList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-inbox"></i>
                <p>No recent orders</p>
            </div>
        `;
        return;
    }
    
    recentOrdersList.innerHTML = recentOrders.map(order => `
        <div class="recent-order-item">
            <div class="order-info">
                <div class="order-id">#${order.id}</div>
                <div class="order-customer">${order.customer || 'Guest'}</div>
            </div>
            <div class="order-price">$${order.total.toFixed(2)}</div>
        </div>
    `).join('');
}

function updatePopularItems(orders) {
    const popularItemsList = document.getElementById('popular-items-list');
    
    // Count item occurrences
    const itemCounts = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        });
    });
    
    // Sort by count
    const sortedItems = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    if (sortedItems.length === 0) {
        popularItemsList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-chart-bar"></i>
                <p>No data available</p>
            </div>
        `;
        return;
    }
    
    popularItemsList.innerHTML = sortedItems.map(([name, count]) => `
        <div class="popular-item">
            <span class="item-name-popular">${name}</span>
            <span class="item-count">${count} sold</span>
        </div>
    `).join('');
}

// ===================================
// ORDER FILTERS
// ===================================

function initOrderFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.id.replace('filter-', '');
            filterOrders(filter);
        });
    });
}

function filterOrders(filter) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    let filteredOrders = orders;
    
    if (filter !== 'all') {
        filteredOrders = orders.filter(o => o.status === filter);
    }
    
    const ordersTableBody = document.getElementById('orders-table-body');
    
    if (filteredOrders.length === 0) {
        ordersTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fa-solid fa-shopping-cart"></i>
                        <p>No ${filter} orders</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    ordersTableBody.innerHTML = filteredOrders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customer || 'Guest'}</td>
            <td>${order.items.length} items</td>
            <td>$${order.total.toFixed(2)}</td>
            <td><span class="status-badge ${order.status}">${order.status}</span></td>
            <td>${new Date(order.date).toLocaleString()}</td>
            <td>
                <button class="action-btn view" onclick="viewOrder('${order.id}')">
                    <i class="fa-solid fa-eye"></i>
                </button>
                ${order.status === 'pending' ? `
                    <button class="action-btn edit" onclick="updateOrderStatus('${order.id}', 'completed')">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    <button class="action-btn delete" onclick="updateOrderStatus('${order.id}', 'cancelled')">
                        <i class="fa-solid fa-times"></i>
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// ===================================
// MENU MANAGEMENT
// ===================================

function initMenuManagement() {
    const addMenuItemBtn = document.getElementById('add-menu-item-btn');
    
    if (addMenuItemBtn) {
        addMenuItemBtn.addEventListener('click', function() {
            openMenuItemModal();
        });
    }
    
    loadMenuItems();
}

function loadMenuItems() {
    const menuItemsGrid = document.getElementById('menu-items-grid');
    
    // Get menu items from the main page (you can also store them in localStorage)
    const sampleMenuItems = [
        { id: 'C001', name: 'Espresso', price: 3.50, category: 'Coffee', image: 'Tazzina_di_caffè_a_Ventimiglia.jpg' },
        { id: 'C002', name: 'Cappuccino', price: 4.00, category: 'Coffee', image: 'Tazzina_di_caffè_a_Ventimiglia.jpg' },
        { id: 'C003', name: 'Americano', price: 3.00, category: 'Coffee', image: 'Tazzina_di_caffè_a_Ventimiglia.jpg' },
        { id: 'F001', name: 'Chocolate Fudge Cake', price: 5.50, category: 'Cake', image: 'Tazzina_di_caffè_a_Ventimiglia.jpg' },
        { id: 'F002', name: 'Croissant', price: 3.50, category: 'Pastries', image: 'Tazzina_di_caffè_a_Ventimiglia.jpg' },
    ];
    
    menuItemsGrid.innerHTML = sampleMenuItems.map(item => `
        <div class="menu-item-card">
            <img src="${item.image}" alt="${item.name}">
            <div class="menu-item-info">
                <h4>${item.name}</h4>
                <p>${item.category}</p>
                <div class="menu-item-price">$${item.price.toFixed(2)}</div>
                <div class="menu-item-actions">
                    <button class="action-btn edit" onclick="editMenuItem('${item.id}')">
                        <i class="fa-solid fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete" onclick="deleteMenuItem('${item.id}')">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function openMenuItemModal(itemId = null) {
    const modal = document.getElementById('menu-item-modal');
    const modalTitle = document.getElementById('menu-modal-title');
    
    if (itemId) {
        modalTitle.textContent = 'Edit Menu Item';
        // Load item data and populate form
    } else {
        modalTitle.textContent = 'Add Menu Item';
        document.getElementById('menu-item-form').reset();
    }
    
    modal.classList.add('show');
}

function editMenuItem(itemId) {
    openMenuItemModal(itemId);
}

function deleteMenuItem(itemId) {
    if (confirm('Are you sure you want to delete this menu item?')) {
        showNotification('Menu item deleted', 'success');
        loadMenuItems();
    }
}

// ===================================
// CUSTOMERS MANAGEMENT
// ===================================

function loadCustomers() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const customersTableBody = document.getElementById('customers-table-body');
    
    // Group orders by customer
    const customerData = {};
    orders.forEach(order => {
        const customer = order.customer || 'Guest';
        if (!customerData[customer]) {
            customerData[customer] = {
                name: customer,
                email: order.email || 'N/A',
                orders: [],
                totalSpent: 0,
                joinDate: order.date
            };
        }
        customerData[customer].orders.push(order);
        customerData[customer].totalSpent += order.total;
    });
    
    const customers = Object.values(customerData);
    
    if (customers.length === 0) {
        customersTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fa-solid fa-users"></i>
                        <p>No customers yet</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    customersTableBody.innerHTML = customers.map((customer, index) => `
        <tr>
            <td>#C${String(index + 1).padStart(3, '0')}</td>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.orders.length}</td>
            <td>$${customer.totalSpent.toFixed(2)}</td>
            <td>${new Date(customer.joinDate).toLocaleDateString()}</td>
            <td>
                <button class="action-btn view">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===================================
// MESSAGES MANAGEMENT
// ===================================

function loadMessages() {
    const messagesList = document.getElementById('admin-messages-list');
    const messagesBadge = document.getElementById('messages-badge');
    
    // Sample messages (in production, load from server/localStorage)
    const messages = JSON.parse(localStorage.getItem('adminMessages') || '[]');
    
    messagesBadge.textContent = messages.filter(m => !m.read).length;
    
    if (messages.length === 0) {
        messagesList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-envelope"></i>
                <p>No messages</p>
            </div>
        `;
        return;
    }
    
    messagesList.innerHTML = messages.map(message => `
        <div class="message-item ${message.read ? '' : 'unread'}">
            <div class="message-header">
                <span class="message-sender">${message.sender}</span>
                <span class="message-time">${new Date(message.date).toLocaleString()}</span>
            </div>
            <div class="message-content">${message.content}</div>
        </div>
    `).join('');
}

// ===================================
// ANALYTICS
// ===================================

function loadAnalytics() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    // Update top items
    updateTopItems(orders);
    
    // Update revenue breakdown
    updateRevenueBreakdown(orders);
}

function updateTopItems(orders) {
    const topItemsList = document.getElementById('top-items-list');
    
    // Count item occurrences
    const itemCounts = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!itemCounts[item.name]) {
                itemCounts[item.name] = { count: 0, revenue: 0 };
            }
            itemCounts[item.name].count += item.quantity;
            itemCounts[item.name].revenue += item.price * item.quantity;
        });
    });
    
    // Sort by count
    const sortedItems = Object.entries(itemCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);
    
    if (sortedItems.length === 0) {
        topItemsList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-chart-bar"></i>
                <p>No data available</p>
            </div>
        `;
        return;
    }
    
    topItemsList.innerHTML = sortedItems.map(([name, data], index) => `
        <div class="top-item">
            <div class="top-item-rank">${index + 1}</div>
            <div class="top-item-info">
                <div class="top-item-name">${name}</div>
                <div class="top-item-sales">${data.count} sold • $${data.revenue.toFixed(2)}</div>
            </div>
        </div>
    `).join('');
}

function updateRevenueBreakdown(orders) {
    const revenueBreakdown = document.getElementById('revenue-breakdown');
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const completedRevenue = orders.filter(o => o.status === 'completed').reduce((sum, order) => sum + order.total, 0);
    const pendingRevenue = orders.filter(o => o.status === 'pending').reduce((sum, order) => sum + order.total, 0);
    
    revenueBreakdown.innerHTML = `
        <div class="revenue-item">
            <span class="revenue-label">Total Revenue</span>
            <span class="revenue-amount">$${totalRevenue.toFixed(2)}</span>
        </div>
        <div class="revenue-item">
            <span class="revenue-label">Completed Orders</span>
            <span class="revenue-amount">$${completedRevenue.toFixed(2)}</span>
        </div>
        <div class="revenue-item">
            <span class="revenue-label">Pending Orders</span>
            <span class="revenue-amount">$${pendingRevenue.toFixed(2)}</span>
        </div>
    `;
}

// ===================================
// SETTINGS
// ===================================

function initSettings() {
    const storeInfoForm = document.getElementById('store-info-form');
    const changePasswordForm = document.getElementById('change-password-form');
    const exportDataBtn = document.getElementById('export-data-btn');
    const backupDataBtn = document.getElementById('backup-data-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');
    
    if (storeInfoForm) {
        storeInfoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showNotification('Store information updated', 'success');
        });
    }
    
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (newPassword !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            showNotification('Password updated successfully', 'success');
            changePasswordForm.reset();
        });
    }
    
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', function() {
            exportData();
        });
    }
    
    if (backupDataBtn) {
        backupDataBtn.addEventListener('click', function() {
            showNotification('Backup created successfully', 'success');
        });
    }
    
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear all orders? This action cannot be undone.')) {
                localStorage.removeItem('orders');
                loadOrders();
                updateDashboard();
                showNotification('All orders cleared', 'success');
            }
        });
    }
}

function exportData() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const dataStr = JSON.stringify(orders, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully', 'success');
}

// ===================================
// MODALS
// ===================================

function initModals() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.classList.remove('show');
        });
    });
    
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });
    
    // Menu item form
    const menuItemForm = document.getElementById('menu-item-form');
    const cancelMenuItemBtn = document.getElementById('cancel-menu-item');
    
    if (menuItemForm) {
        menuItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showNotification('Menu item saved', 'success');
            document.getElementById('menu-item-modal').classList.remove('show');
            loadMenuItems();
        });
    }
    
    if (cancelMenuItemBtn) {
        cancelMenuItemBtn.addEventListener('click', function() {
            document.getElementById('menu-item-modal').classList.remove('show');
        });
    }
    
    // Close order modal
    const closeOrderModal = document.getElementById('close-order-modal');
    if (closeOrderModal) {
        closeOrderModal.addEventListener('click', function() {
            document.getElementById('order-detail-modal').classList.remove('show');
        });
    }
}

// ===================================
// NOTIFICATIONS
// ===================================

function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span class="toast-message">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function generateOrderId() {
    return 'ORD' + Date.now().toString().slice(-8);
}

// Make functions globally accessible
window.viewOrder = viewOrder;
window.updateOrderStatus = updateOrderStatus;
window.editMenuItem = editMenuItem;
window.deleteMenuItem = deleteMenuItem;