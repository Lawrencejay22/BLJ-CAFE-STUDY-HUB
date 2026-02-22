document.addEventListener('DOMContentLoaded', async () => {
    // --- 0. AUTHENTICATION CHECK ---
    const checkAuth = async () => {
        const res = await fetch('php/get_session.php');
        const session = await res.json();
        if (!session.logged_in || session.role !== 'admin') {
            window.location.href = 'admin-login.html';
        } else {
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
            if (!href.startsWith('#')) return;

            e.preventDefault();
            const targetId = href.substring(1);

            sections.forEach(s => s.classList.remove('active-section'));
            navLinks.forEach(l => l.classList.remove('active'));

            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active-section');
                link.classList.add('active');
                loadSectionData(targetId);
            }
        });
    });

    // --- 2. DARK MODE ---
    const themeBtn = document.querySelector('.dark-mode-toggle');
    if (themeBtn) {
        themeBtn.onclick = () => {
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
            themeBtn.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
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
        try {
            const res = await fetch('php/admin_data.php?action=get_stats');
            const data = await res.json();
            if (data.error) return;

            // Calculate Local Revenue for 'used' bookings
            let localRevenue = 0;
            let localBookings = JSON.parse(localStorage.getItem('blj_bookings')) || [];
            localBookings.forEach(lb => {
                if (lb.status.toLowerCase() === 'used') {
                    localRevenue += parseFloat(lb.totalPrice || 0);
                }
            });

            const totalRev = parseFloat(data.total_revenue) + localRevenue;

            document.querySelector('#totalUsersDisplay').innerText = data.total_users;
            document.querySelector('#productCount').innerText = data.total_products;
            document.querySelector('#totalRevenueDisplay').innerText = `₱${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
            loadChart();
            loadRecentActivity();
        } catch (err) { console.error("Stats load failed", err); }
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

    // --- BOOKINGS LOGIC (MERGED DATABASE + LOCALSTORAGE) ---
    const loadBookings = async () => {
        const tbody = document.getElementById('bookingsTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        let hasData = false;

        // A. Load from Database
        try {
            const res = await fetch('php/admin_data.php?action=get_bookings');
            const dbBookings = await res.json();
            if (dbBookings && dbBookings.length > 0) {
                hasData = true;
                dbBookings.forEach(b => {
                    const isUsed = b.status.toLowerCase() === 'used';
                    tbody.innerHTML += `
                        <tr>
                            <td>${b.customer_name} ${b.order_id ? `<br><small style="color:var(--primary-color)">#ORD-${b.order_id}</small>` : ''}</td>
                            <td>${b.room_type}</td>
                            <td>${new Date(b.reservation_date).toLocaleDateString()} at ${b.check_in_time}</td>
                            <td>${b.duration} Hours</td>
                            <td>${b.pax} People</td>
                            <td class="order-amount">₱${parseFloat(b.total_price || 0).toFixed(2)}</td>
                            <td><span class="role-badge ${isUsed ? 'completed' : 'pending'}">${b.status}</span></td>
                            <td>
                                ${!isUsed ? `<button class="btn-action complete-booking" data-id="${b.id}" title="Confirm Arrival"><i class="fas fa-check"></i></button>` : ''}
                                <button class="btn-action delete" data-id="${b.id}" data-type="booking" title="Delete Booking"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>`;
                });
            }
        } catch (err) { console.warn("Database bookings empty."); }

        // B. Load from LocalStorage
        let localBookings = JSON.parse(localStorage.getItem('blj_bookings')) || [];
        if (localBookings.length > 0) {
            hasData = true;
            localBookings.forEach((lb, index) => {
                const isLocalUsed = lb.status.toLowerCase() === 'used';
                tbody.innerHTML += `
                    <tr>
                        <td>${lb.customer} <small>(Local)</small></td>
                        <td>${lb.roomType}</td>
                        <td>${lb.dateTime}</td>
                        <td>${lb.duration}</td>
                        <td>${lb.pax}</td>
                        <td class="order-amount">₱${parseFloat(lb.totalPrice || 0).toFixed(2)}</td>
                        <td><span class="role-badge ${isLocalUsed ? 'completed' : 'pending'}">${lb.status}</span></td>
                        <td>
                            ${!isLocalUsed ? `<button class="btn-action confirm-local" data-index="${index}" title="Confirm Local Booking"><i class="fas fa-check"></i></button>` : ''}
                            <button class="btn-action delete-local" data-index="${index}" title="Remove Local"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>`;
            });
        }

        if (!hasData) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No reservations found.</td></tr>';
        }
    };

    // --- OTHER LOADERS ---
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
            </tr>`).join('');
    };

    const loadProducts = async () => {
        const res = await fetch('php/admin_data.php?action=get_products');
        const products = await res.json();
        const tbody = document.querySelector('#productTableBody');
        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.name}</td>
                <td class="product-price">₱${parseFloat(p.price).toFixed(2)}</td>
                <td><span class="role-badge ${p.is_available == 1 ? 'completed' : 'cancelled'}">${p.is_available == 1 ? 'Available' : 'Unavailable'}</span></td>
                <td>
                    <button class="btn-action toggle-status" data-id="${p.id}"><i class="fas ${p.is_available == 1 ? 'fa-eye-slash' : 'fa-eye'}"></i></button>
                    <button class="btn-action edit" data-id="${p.id}" data-type="product"><i class="fas fa-edit"></i></button>
                    <button class="btn-action delete" data-id="${p.id}" data-type="product"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`).join('');
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
                    ${o.order_status.toLowerCase().trim() === 'pending' ? `<button class="btn-action complete-order" data-id="${o.id}"><i class="fas fa-check"></i></button>` : ''}
                    <button class="btn-action delete" data-id="${o.id}" data-type="order"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`).join('');
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
    if (document.querySelector('.close-modal')) document.querySelector('.close-modal').onclick = closeModal;
    window.onclick = (e) => { if (e.target == modal) closeModal(); };

    // ADD USER
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
                </div>`;
            modal.style.display = "block";
        };
    }

    // ADD PRODUCT
    const addProductBtn = document.getElementById('addProductBtn');
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
                    <select name="category">
                        <option value="Coffee">Coffee</option>
                        <option value="Snack">Snack</option>
                        <option value="Study Hub">Study Hub</option>
                        <option value="Wifi">Wifi</option>
                        <option value="Printing">Printing</option>
                        <option value="Amenities">Amenities</option>
                        <option value="Lounge">Lounge</option>
                    </select>
                </div>
                <div class="modal-form-group">
                    <label>Availability</label>
                    <select name="is_available">
                        <option value="1">Available</option>
                        <option value="0">Unavailable</option>
                    </select>
                </div>`;
            modal.style.display = "block";
        };
    }

    modalForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(modalForm);
        formData.append('action', currentAction);
        if (currentEditId) formData.append('id', currentEditId);

        try {
            const res = await fetch('php/admin_data.php', { method: 'POST', body: formData });
            const result = await res.json();
            if (result.success) {
                alert('Success!');
                closeModal();
                const activeLink = document.querySelector('.nav-link.active');
                if (activeLink) loadSectionData(activeLink.getAttribute('href').substring(1));
                loadStats();
            } else { alert('Error: ' + result.error); }
        } catch (err) { alert('System Error'); }
    };

    // --- 5. GLOBAL CLICK HANDLER ---
    document.addEventListener('click', async (e) => {
        const delBtn = e.target.closest('.delete');
        const editBtn = e.target.closest('.edit');
        const toggleBtn = e.target.closest('.toggle-status');
        const completeBtn = e.target.closest('.complete-order') || e.target.closest('.complete-booking');

        if (delBtn) {
            const { id, type } = delBtn.dataset;
            if (confirm(`Are you sure you want to delete this ${type}?`)) {
                const res = await fetch(`php/admin_data.php?action=delete_item&type=${type}&id=${id}`);
                const result = await res.json();
                if (result.success) {
                    loadStats();
                    delBtn.closest('tr').remove();
                } else {
                    alert('Delete failed: ' + (result.error || 'System error'));
                }
            }
        }

        if (toggleBtn) {
            const { id } = toggleBtn.dataset;
            const res = await fetch(`php/admin_data.php?action=toggle_availability&id=${id}`);
            const result = await res.json();
            if (result.success) loadProducts();
        }

        if (completeBtn) {
            const { id } = completeBtn.dataset;
            const isBooking = completeBtn.classList.contains('complete-booking');

            if (confirm(`Mark this ${isBooking ? 'reservation' : 'order'} as completed?`)) {
                const action = isBooking ? 'complete_booking' : 'complete_order';
                try {
                    const res = await fetch(`php/admin_data.php?action=${action}&id=${id}`);
                    const result = await res.json();

                    if (result.success) {
                        if (isBooking) loadBookings(); else loadOrders();
                        loadStats();
                    } else {
                        alert('Confirmation failed: ' + (result.error || 'Unknown error'));
                    }
                } catch (err) {
                    alert('System error: Could not reach the server.');
                }
            }
        }

        const confirmLocal = e.target.closest('.confirm-local');
        const deleteLocal = e.target.closest('.delete-local');

        if (confirmLocal) {
            const { index } = confirmLocal.dataset;
            let local = JSON.parse(localStorage.getItem('blj_bookings')) || [];
            if (confirm("Move this Guest Booking to Completed?")) {
                local[index].status = 'used';
                localStorage.setItem('blj_bookings', JSON.stringify(local));
                loadBookings();
                loadStats();
            }
        }

        if (deleteLocal) {
            const { index } = deleteLocal.dataset;
            let local = JSON.parse(localStorage.getItem('blj_bookings')) || [];
            if (confirm("Remove this Guest Booking?")) {
                local.splice(index, 1);
                localStorage.setItem('blj_bookings', JSON.stringify(local));
                loadBookings();
            }
        }

        if (editBtn) {
            const { id, type } = editBtn.dataset;
            currentEditId = id;
            currentAction = (type === 'user') ? 'update_user' : 'update_product';
            const res = await fetch(`php/admin_data.php?action=get_item&type=${type}&id=${id}`);
            const item = await res.json();

            modalTitle.innerText = "Edit " + (type === 'user' ? 'User' : 'Product');
            if (type === 'user') {
                modalBody.innerHTML = `
                    <div class="modal-form-group"><label>First Name</label><input type="text" name="name" value="${item.name}" required></div>
                    <div class="modal-form-group"><label>Last Name</label><input type="text" name="lastname" value="${item.lastname}" required></div>
                    <div class="modal-form-group"><label>Username</label><input type="text" name="username" value="${item.username}" required></div>
                    <div class="modal-form-group">
                        <label>Role</label>
                        <select name="role">
                            <option value="user" ${item.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="admin" ${item.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>`;
            } else {
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
                    </div>`;
            }
            modal.style.display = "block";
        }
    });


    loadStats();
});
