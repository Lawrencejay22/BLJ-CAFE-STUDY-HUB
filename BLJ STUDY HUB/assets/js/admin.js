document.addEventListener('DOMContentLoaded', async () => {
    // --- 0. AUTHENTICATION CHECK ---
    const checkAuth = async () => {
        const res = await fetch('php/get_session.php');
        const session = await res.json();
        if (!session.logged_in || session.role !== 'admin') {
            window.location.href = 'admin-login.html';
        } else {
            // Fill profile data
            const nameField = document.getElementById('adminProfileName');
            const userField = document.getElementById('adminProfileEmail');
            if (nameField) nameField.value = session.name;
            if (userField) userField.value = session.username || 'admin';
        }
    };
    await checkAuth();

    // --- 1. NAVIGATION & TAB SWITCHING ---
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main > section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href.startsWith('#')) return; // Let logout and other direct links work normally

            e.preventDefault();
            const targetId = href.substring(1);

            sections.forEach(s => s.classList.remove('active-section'));
            navLinks.forEach(l => l.classList.remove('active'));

            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active-section');
                link.classList.add('active');
                // Load data specific to the section
                loadSectionData(targetId);
            }
        });
    });

    // --- 2. DARK MODE TOGGLE & SECURITY ---
    const themeBtn = document.querySelector('.dark-mode-toggle');
    if (themeBtn) {
        themeBtn.onclick = () => {
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
            themeBtn.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        };
    }

    const securityBtn = document.querySelector('.security-btn');
    if (securityBtn) {
        securityBtn.onclick = async () => {
            const newPassword = document.getElementById('adminNewPassword').value;
            if (!newPassword) { alert('Please enter a new password'); return; }

            const formData = new FormData();
            formData.append('action', 'update_security');
            formData.append('new_password', newPassword);

            const res = await fetch('php/admin_data.php', { method: 'POST', body: formData });
            const result = await res.json();
            if (result.success) {
                alert('Password updated successfully!');
                document.getElementById('adminNewPassword').value = '';
            } else {
                alert('Error updating password: ' + result.error);
            }
        };
    }

    // --- 3. DATABASE FETCHING LOGIC ---
    const loadSectionData = (sectionId) => {
        switch (sectionId) {
            case 'admin-overview': loadStats(); break;
            case 'users-section': loadUsers(); break;
            case 'products-section': loadProducts(); break;
            case 'orders-section': loadOrders(); break;
            case 'bookings-section': loadBookings(); break;
        }
    };

    const loadStats = async () => {
        const res = await fetch('php/admin_data.php?action=get_stats');
        const data = await res.json();
        if (data.error) return;

        document.querySelector('#totalUsersDisplay').innerText = data.total_users;
        document.querySelector('#productCount').innerText = data.total_products;
        document.querySelector('#totalRevenueDisplay').innerText = `₱${parseFloat(data.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

        loadChart();
        loadRecentActivity();
    };

    const loadRecentActivity = async () => {
        const res = await fetch('php/admin_data.php?action=get_recent_activity');
        const activity = await res.json();
        const list = document.getElementById('recentActivityList');
        if (!list) return;

        list.innerHTML = activity.map(a => `
            <div class="activity-item">
                <div class="activity-icon ${a.type}">
                    <i class="fas ${a.type === 'order' ? 'fa-shopping-cart' : 'fa-user-plus'}"></i>
                </div>
                <div class="activity-details">
                    <p>${a.type === 'order' ? `New Order from <b>${a.customer_name}</b> (₱${parseFloat(a.total_amount).toFixed(2)})` : `New User: <b>${a.name} ${a.lastname}</b>`}</p>
                    <span>${new Date(a.date).toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    };

    let salesChart = null;
    const loadChart = async () => {
        const res = await fetch('php/admin_data.php?action=get_chart_data');
        const data = await res.json();
        const ctx = document.getElementById('salesChart').getContext('2d');

        if (salesChart) salesChart.destroy();

        salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Daily Revenue (₱)',
                    data: data.values,
                    borderColor: '#a855f7',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#a855f7',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    };

    const loadUsers = async () => {
        const res = await fetch('php/admin_data.php?action=get_users');
        const users = await res.json();
        const tbody = document.querySelector('#users-section tbody');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.name} ${user.lastname}</td>
                <td>${user.username}</td>
                <td><span class="role-badge ${user.role}">${user.role}</span></td>
                <td>
                    <button class="btn-action edit" data-id="${user.id}" data-type="user"><i class="fas fa-edit"></i></button>
                    <button class="btn-action delete" data-id="${user.id}" data-type="user"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    };

    const loadProducts = async () => {
        const res = await fetch('php/admin_data.php?action=get_products');
        const products = await res.json();
        const tbody = document.querySelector('#productTableBody');
        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.name}</td>
                <td class="product-price">₱${parseFloat(p.price).toFixed(2)}</td>
                <td>
                    <span class="role-badge ${p.is_available == 1 ? 'completed' : 'cancelled'}">
                        ${p.is_available == 1 ? 'Available' : 'Unavailable'}
                    </span>
                </td>
                <td>
                    <button class="btn-action toggle-status" data-id="${p.id}" title="Toggle Availability">
                        <i class="fas ${p.is_available == 1 ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    </button>
                    <button class="btn-action edit" data-id="${p.id}" data-type="product"><i class="fas fa-edit"></i></button>
                    <button class="btn-action delete" data-id="${p.id}" data-type="product"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    };

    const loadOrders = async () => {
        const res = await fetch('php/admin_data.php?action=get_orders');
        const orders = await res.json();
        const tbody = document.querySelector('#ordersTableBody');
        tbody.innerHTML = orders.map(o => `
            <tr>
                <td>#ORD-${o.id}</td>
                <td>${o.customer_name}</td>
                <td>${o.delivery_address || 'N/A'}</td>
                <td class="order-amount">₱${parseFloat(o.total_amount).toFixed(2)}</td>
                <td><span class="role-badge ${o.order_status.toLowerCase().trim()}">${o.order_status}</span></td>
                <td>
                    ${o.order_status.toLowerCase().trim() === 'pending' ? `
                        <button class="btn-action complete-order" data-id="${o.id}" title="Confirm Delivery"><i class="fas fa-check"></i></button>
                    ` : ''}
                    <button class="btn-action delete" data-id="${o.id}" data-type="order" title="Delete Order"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    };

    const loadBookings = async () => {
        const res = await fetch('php/admin_data.php?action=get_bookings');
        const bookings = await res.json();
        const tbody = document.getElementById('bookingsTableBody');
        if (!tbody) return;

        tbody.innerHTML = bookings.map(b => `
            <tr>
                <td>${b.customer_name}</td>
                <td>${b.room_type}</td>
                <td>${new Date(b.reservation_date).toLocaleDateString()} at ${b.check_in_time}</td>
                <td>${b.duration} Hours</td>
                <td>${b.pax} People</td>
                <td><span class="role-badge ${b.status.toLowerCase()}">${b.status}</span></td>
            </tr>
        `).join('');
    };

    // --- 4. MODAL & FORM LOGIC ---
    const modal = document.getElementById('adminModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalForm = document.getElementById('modalForm');
    let currentAction = '';
    let currentEditId = null;

    const closeModal = () => {
        modal.style.display = "none";
        currentEditId = null;
    };
    document.querySelector('.close-modal').onclick = closeModal;
    window.onclick = (e) => { if (e.target == modal) closeModal(); };

    // ADD USER FORM
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.onclick = () => {
            currentAction = 'add_user';
            modalTitle.innerText = "Add New User";
            modalBody.innerHTML = `
                <div class="modal-form-group"><label>First Name</label><input type="text" name="name" required></div>
                <div class="modal-form-group"><label>Last Name</label><input type="text" name="lastname" required></div>
                <div class="modal-form-group"><label>Username</label><input type="text" name="username" required></div>
                <div class="modal-form-group"><label>Password</label><input type="password" name="password" required></div>
                <div class="modal-form-group">
                    <label>Role</label>
                    <select name="role">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            `;
            modal.style.display = "block";
        };
    }


    // ADD PRODUCT FORM
    const addProductBtn = document.getElementById('addProductBtn');
    const categoriesOptions = `
        <option value="Coffee">Coffee</option>
        <option value="Snack">Snack</option>
        <option value="Study Hub">Study Hub</option>
        <option value="Wifi">Wifi</option>
        <option value="Printing">Printing</option>
        <option value="Amenities">Amenities</option>
        <option value="Lounge">Lounge</option>
    `;

    if (addProductBtn) {
        addProductBtn.onclick = () => {
            currentAction = 'add_product';
            modalTitle.innerText = "Add New Product";
            modalBody.innerHTML = `
                <div class="modal-form-group"><label>Product Name</label><input type="text" name="name" required></div>
                <div class="modal-form-group"><label>Description</label><textarea name="description"></textarea></div>
                <div class="modal-form-group"><label>Price (₱)</label><input type="number" step="0.01" name="price" required></div>
                <div class="modal-form-group">
                    <label>Category</label>
                    <select name="category">${categoriesOptions}</select>
                </div>
                <div class="modal-form-group">
                    <label>Availability</label>
                    <select name="is_available">
                        <option value="1">Available</option>
                        <option value="0">Unavailable</option>
                    </select>
                </div>
            `;
            modal.style.display = "block";
        };
    }

    // FORM SUBMISSION (Hardened)
    modalForm.onsubmit = async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData(modalForm);
            formData.append('action', currentAction);
            if (currentEditId) {
                formData.append('id', currentEditId);
            }

            console.log("Submitting Action:", currentAction, "ID:", currentEditId);

            const res = await fetch('php/admin_data.php', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

            const text = await res.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (err) {
                console.error("Server returned non-JSON:", text);
                throw new Error("Invalid server response (Check console)");
            }

            if (result.success) {
                alert('Success!');
                closeModal();
                loadStats();
                const activeLink = document.querySelector('.nav-link.active');
                if (activeLink) {
                    const targetId = activeLink.getAttribute('href').substring(1);
                    loadSectionData(targetId);
                }
            } else {
                alert('⚠️ Error: ' + (result.error || 'Unknown server error'));
            }
        } catch (error) {
            console.error("Submission Error:", error);
            alert('❌ System Error: ' + error.message);
        }
    };

    // --- 5. GLOBAL CLICK HANDLER (Hardened) ---
    document.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete');
        const editBtn = e.target.closest('.edit');
        const toggleBtn = e.target.closest('.toggle-status');
        const completeBtn = e.target.closest('.complete-order');

        // DELETE
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            const type = deleteBtn.dataset.type;
            if (confirm(`Are you sure you want to delete this ${type}?`)) {
                try {
                    const res = await fetch(`php/admin_data.php?action=delete_item&type=${type}&id=${id}`);
                    const result = await res.json();
                    if (result.success) {
                        deleteBtn.closest('tr').remove();
                        loadStats();
                    } else {
                        alert('Error deleting item');
                    }
                } catch (err) {
                    alert('Network error during deletion');
                }
            }
            return;
        }

        // TOGGLE STATUS
        if (toggleBtn) {
            const id = toggleBtn.dataset.id;
            try {
                const res = await fetch(`php/admin_data.php?action=toggle_availability&id=${id}`);
                const result = await res.json();
                if (result.success) {
                    loadProducts();
                } else {
                    alert('Error toggling status');
                }
            } catch (err) {
                alert('Network error during toggle');
            }
            return;
        }

        // COMPLETE ORDER
        if (completeBtn) {
            const id = completeBtn.dataset.id;
            if (confirm(`Mark order #ORD-${id} as delivered/completed?`)) {
                try {
                    const res = await fetch(`php/admin_data.php?action=complete_order&id=${id}`);
                    const result = await res.json();
                    if (result.success) {
                        alert('Order marked as completed!');
                        loadOrders();
                        loadStats();
                    } else {
                        alert('Error updating order');
                    }
                } catch (err) {
                    alert('Network error during completion');
                }
            }
            return;
        }

        // EDIT
        if (editBtn) {
            const id = editBtn.dataset.id;
            const type = editBtn.dataset.type;
            currentEditId = id;
            currentAction = (type === 'user') ? 'update_user' : 'update_product';

            try {
                const res = await fetch(`php/admin_data.php?action=get_item&type=${type}&id=${id}`);
                const item = await res.json();

                if (!item) { alert('Item not found'); return; }

                if (type === 'user') {
                    modalTitle.innerText = "Edit User";
                    modalBody.innerHTML = `
                        <div class="modal-form-group"><label>First Name</label><input type="text" name="name" value="${item.name}" required></div>
                        <div class="modal-form-group"><label>Last Name</label><input type="text" name="lastname" value="${item.lastname}" required></div>
                        <div class="modal-form-group"><label>Username</label><input type="text" name="username" value="${item.username}" required></div>
                        <p style="font-size: 0.8rem; color: #94a3b8; margin-top: -10px;">Password cannot be changed here for security.</p>
                        <div class="modal-form-group">
                            <label>Role</label>
                            <select name="role">
                                <option value="user" ${item.role === 'user' ? 'selected' : ''}>User</option>
                                <option value="admin" ${item.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                    `;
                } else {
                    modalTitle.innerText = "Edit Product";
                    modalBody.innerHTML = `
                        <div class="modal-form-group"><label>Product Name</label><input type="text" name="name" value="${item.name}" required></div>
                        <div class="modal-form-group"><label>Description</label><textarea name="description">${item.description}</textarea></div>
                        <div class="modal-form-group"><label>Price (₱)</label><input type="number" step="0.01" name="price" value="${item.price}" required></div>
                        <div class="modal-form-group">
                            <label>Category</label>
                            <select name="category">
                                <option value="Coffee" ${item.category === 'Coffee' ? 'selected' : ''}>Coffee</option>
                                <option value="Snack" ${item.category === 'Snack' ? 'selected' : ''}>Snack</option>
                                <option value="Study Hub" ${item.category === 'Study Hub' ? 'selected' : ''}>Study Hub</option>
                                <option value="Wifi" ${item.category === 'Wifi' ? 'selected' : ''}>Wifi</option>
                                <option value="Printing" ${item.category === 'Printing' ? 'selected' : ''}>Printing</option>
                                <option value="Amenities" ${item.category === 'Amenities' ? 'selected' : ''}>Amenities</option>
                                <option value="Lounge" ${item.category === 'Lounge' ? 'selected' : ''}>Lounge</option>
                            </select>
                        </div>
                        <div class="modal-form-group">
                            <label>Availability</label>
                            <select name="is_available">
                                <option value="1" ${item.is_available == 1 ? 'selected' : ''}>Available</option>
                                <option value="0" ${item.is_available == 0 ? 'selected' : ''}>Unavailable</option>
                            </select>
                        </div>
                    `;
                }
                modal.style.display = "block";
            } catch (err) {
                alert('Error fetching item details');
            }
        }
    });

    // Initial Load
    loadStats();
});
