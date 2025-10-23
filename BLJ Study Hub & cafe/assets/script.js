// --- Global Data Store (using localStorage for persistence) ---
let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
let sales = JSON.parse(localStorage.getItem('sales')) || [];
let suppliers = JSON.parse(localStorage.getItem('suppliers')) || [];
let lastId = JSON.parse(localStorage.getItem('lastId')) || { item: 0, sale: 0, supplier: 0 };

// --- Utility Functions ---

function generateId(type) {
    lastId[type]++;
    localStorage.setItem('lastId', JSON.stringify(lastId));
    return lastId[type];
}

function saveData() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('sales', JSON.stringify(sales));
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
    updateDashboard();
    renderInventory();
    renderSalesHistory();
    renderSuppliers();
    updateSystemInfo();
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = 0;
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// --- Navigation ---

function switchTab(tabId) {
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Deactivate all navigation buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show the selected tab content
    document.getElementById(tabId).classList.add('active');

    // Activate the corresponding navigation button
    document.querySelector(`.nav-tab[onclick="switchTab('${tabId}')"]`).classList.add('active');

    // Re-render components on tab switch if needed
    if (tabId === 'dashboard') updateDashboard();
    if (tabId === 'inventory') renderInventory();
    if (tabId === 'sales') {
        renderSalesHistory();
        populateSaleItemSelect();
    }
    if (tabId === 'suppliers') renderSuppliers();
    if (tabId === 'reports') {
        updateReportStats();
        // Hide a previous report if any
        document.getElementById('reportDisplay').style.display = 'none';
    }
    if (tabId === 'settings') updateSystemInfo();
}

// --- Dashboard Logic ---

function updateDashboard() {
    let totalItemsCount = 0;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const lowStockItems = [];
    const recentActivity = [];

    inventory.forEach(item => {
        totalItemsCount++;
        totalValue += item.quantity * item.price;
        if (item.quantity <= item.reorderLevel && item.quantity > 0) {
            lowStockCount++;
            lowStockItems.push(item);
        }
        if (item.quantity === 0) {
            outOfStockCount++;
        }
    });

    // Sort sales by date for recent activity (assuming the newest sales are at the end)
    const sortedSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedSales.slice(0, 5).forEach(sale => {
        recentActivity.push({
            type: 'Sale',
            description: `${sale.quantity}x ${sale.itemName} sold for ₹${sale.total.toFixed(2)}`,
            date: sale.date
        });
    });

    // Update the DOM
    document.getElementById('totalItems').textContent = totalItemsCount;
    document.getElementById('totalValue').textContent = `₹${totalValue.toFixed(2)}`;
    document.getElementById('lowStockCount').textContent = lowStockCount;
    document.getElementById('outOfStockCount').textContent = outOfStockCount;
    renderLowStockAlerts(lowStockItems);
    renderRecentActivity(recentActivity);
}

function renderLowStockAlerts(items) {
    const container = document.getElementById('lowStockAlertsContainer');
    container.innerHTML = '';
    if (items.length > 0) {
        const title = document.createElement('h3');
        title.style.color = 'var(--warning-color)';
        title.style.marginTop = '20px';
        title.textContent = '⚠️ Low Stock Alerts';
        container.appendChild(title);

        items.forEach(item => {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-warning';
            alertDiv.innerHTML = `<span>🚨</span><span>**${item.name}** is low: only **${item.quantity} ${item.unit}** left (Reorder at ${item.reorderLevel}). <button class="btn-link" onclick="switchTab('suppliers')">Reorder Now</button></span>`;
            container.appendChild(alertDiv);
        });
    }
}

function renderRecentActivity(activity) {
    const container = document.getElementById('recentActivity');
    container.innerHTML = '';

    if (activity.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #95a5a6; padding: 20px;">No recent activity</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'activity-list';

    activity.forEach(act => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="activity-type ${act.type.toLowerCase()}">${act.type}</span>
            <span class="activity-desc">${act.description}</span>
            <span class="activity-date">${new Date(act.date).toLocaleDateString()}</span>
        `;
        ul.appendChild(li);
    });

    container.appendChild(ul);
}


// --- Inventory Logic ---

function saveInventoryItem(event) {
    event.preventDefault();

    const name = document.getElementById('itemName').value.trim();
    const category = document.getElementById('itemCategory').value;
    const quantity = parseInt(document.getElementById('itemQuantity').value);
    const unit = document.getElementById('itemUnit').value;
    const price = parseFloat(document.getElementById('itemPrice').value).toFixed(2);
    const reorderLevel = parseInt(document.getElementById('itemReorderLevel').value);
    const supplier = document.getElementById('itemSupplier').value.trim();
    const location = document.getElementById('itemLocation').value.trim();
    const notes = document.getElementById('itemNotes').value.trim();
    const editId = document.getElementById('editItemId').value;

    if (name === "" || category === "" || isNaN(quantity) || isNaN(price) || isNaN(reorderLevel)) {
        showToast('Please fill in all required fields.', 'danger');
        return;
    }

    if (editId) {
        // Edit existing item
        const index = inventory.findIndex(item => item.id == editId);
        if (index > -1) {
            inventory[index] = {
                ...inventory[index],
                name, category, quantity, unit, price: parseFloat(price),
                reorderLevel, supplier, location, notes
            };
            showToast('Item updated successfully!', 'success');
        } else {
            showToast('Error: Item not found.', 'danger');
        }
    } else {
        // Add new item
        const newItem = {
            id: generateId('item'),
            name, category, quantity, unit, price: parseFloat(price),
            reorderLevel, supplier, location, notes,
            dateAdded: new Date().toISOString()
        };
        inventory.push(newItem);
        showToast('New item added to inventory!', 'success');
    }

    saveData();
    resetInventoryForm();
}

function editInventoryItem(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) {
        showToast('Item not found for editing.', 'danger');
        return;
    }

    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemQuantity').value = item.quantity;
    document.getElementById('itemUnit').value = item.unit;
    document.getElementById('itemPrice').value = item.price.toFixed(2);
    document.getElementById('itemReorderLevel').value = item.reorderLevel;
    document.getElementById('itemSupplier').value = item.supplier;
    document.getElementById('itemLocation').value = item.location;
    document.getElementById('itemNotes').value = item.notes;
    document.getElementById('editItemId').value = item.id;

    document.querySelector('#inventoryForm h2').textContent = 'Edit Item';
    document.querySelector('#inventoryForm .btn-success').textContent = '💾 Update Item';
    
    // Smooth scroll to the form
    document.getElementById('inventory').querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

function deleteInventoryItem(id) {
    if (confirm('Are you sure you want to delete this item from inventory?')) {
        inventory = inventory.filter(item => item.id !== id);
        saveData();
        showToast('Item deleted.', 'info');
    }
}

function resetInventoryForm() {
    document.getElementById('inventoryForm').reset();
    document.getElementById('editItemId').value = '';
    document.querySelector('#inventoryForm h2').textContent = 'Add New Item';
    document.querySelector('#inventoryForm .btn-success').textContent = '💾 Save Item';
}

function getStockStatus(quantity, reorderLevel) {
    if (quantity === 0) return { label: 'Out of Stock', class: 'danger', value: 'out-of-stock' };
    if (quantity <= reorderLevel) return { label: 'Low Stock', class: 'warning', value: 'low-stock' };
    return { label: 'In Stock', class: 'success', value: 'in-stock' };
}

function renderInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = '';
    
    const searchTerm = document.getElementById('inventorySearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const stockFilter = document.getElementById('stockFilter').value;

    const filteredInventory = inventory.filter(item => {
        const status = getStockStatus(item.quantity, item.reorderLevel).value;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                              item.category.toLowerCase().includes(searchTerm) ||
                              item.supplier.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === "" || item.category === categoryFilter;
        const matchesStock = stockFilter === "" || status === stockFilter;

        return matchesSearch && matchesCategory && matchesStock;
    });

    if (filteredInventory.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <h3>No Items Found</h3>
                    <p>Try adjusting your search or filters.</p>
                </td>
            </tr>
        `;
        return;
    }

    filteredInventory.forEach(item => {
        const totalValue = item.quantity * item.price;
        const status = getStockStatus(item.quantity, item.reorderLevel);
        const row = tbody.insertRow();

        row.insertCell().textContent = item.name;
        row.insertCell().textContent = item.category;
        row.insertCell().textContent = `${item.quantity} ${item.unit}`;
        row.insertCell().textContent = `₹${item.price.toFixed(2)}`;
        row.insertCell().textContent = `₹${totalValue.toFixed(2)}`;
        row.insertCell().innerHTML = `<span class="status-badge ${status.class}">${status.label}</span>`;
        row.insertCell().textContent = item.supplier || 'N/A';
        row.insertCell().innerHTML = `
            <button class="btn btn-icon btn-edit" onclick="editInventoryItem(${item.id})">✏️</button>
            <button class="btn btn-icon btn-delete" onclick="deleteInventoryItem(${item.id})">🗑️</button>
        `;
    });
}

function filterInventory() {
    renderInventory();
}

// --- Sales Logic ---

function populateSaleItemSelect() {
    const select = document.getElementById('saleItem');
    select.innerHTML = '<option value="">Choose an item</option>';
    inventory.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.name} (${item.category}) - ₹${item.price.toFixed(2)}/unit`;
        option.dataset.price = item.price.toFixed(2);
        option.dataset.quantity = item.quantity;
        select.appendChild(option);
    });
}

function updateSalePrice() {
    const select = document.getElementById('saleItem');
    const selectedOption = select.options[select.selectedIndex];
    if (selectedOption.value) {
        document.getElementById('salePrice').value = selectedOption.dataset.price;
    } else {
        document.getElementById('salePrice').value = '';
    }
    calculateSaleTotal();
}

function calculateSaleTotal() {
    const quantity = parseInt(document.getElementById('saleQuantity').value) || 0;
    const price = parseFloat(document.getElementById('salePrice').value) || 0;
    const total = quantity * price;
    document.getElementById('saleTotal').value = total.toFixed(2);
}

function recordSale(event) {
    event.preventDefault();

    const itemId = document.getElementById('saleItem').value;
    const quantitySold = parseInt(document.getElementById('saleQuantity').value);
    const price = parseFloat(document.getElementById('salePrice').value);
    const date = document.getElementById('saleDate').value;
    const customer = document.getElementById('saleCustomer').value.trim();
    const notes = document.getElementById('saleNotes').value.trim();
    const total = parseFloat(document.getElementById('saleTotal').value);

    const item = inventory.find(i => i.id == itemId);

    if (!item || isNaN(quantitySold) || quantitySold <= 0 || isNaN(price) || date === "") {
        showToast('Please select an item, enter a valid quantity, and price.', 'danger');
        return;
    }
    
    if (quantitySold > item.quantity) {
        showToast(`Not enough stock! Only ${item.quantity} ${item.unit} of ${item.name} available.`, 'danger');
        return;
    }

    // Deduct from inventory
    item.quantity -= quantitySold;

    // Record the sale
    const newSale = {
        id: generateId('sale'),
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        quantity: quantitySold,
        unitPrice: price,
        total: total,
        date: date,
        customer: customer || 'Walk-in',
        notes: notes,
        timestamp: new Date().toISOString()
    };
    sales.push(newSale);

    showToast(`Sale recorded! ${quantitySold}x ${item.name} sold for ₹${total.toFixed(2)}.`, 'success');
    saveData();
    resetSalesForm();
}

function deleteSale(id) {
    if (confirm('Are you sure you want to delete this sale record? Deleting a sale will NOT automatically restore inventory.')) {
        sales = sales.filter(sale => sale.id !== id);
        saveData();
        showToast('Sale record deleted.', 'info');
    }
}

function resetSalesForm() {
    document.getElementById('salesForm').reset();
    document.getElementById('saleDate').valueAsDate = new Date(); // Set to current date
    document.getElementById('saleTotal').value = '';
    populateSaleItemSelect(); // Re-populate to reflect potential inventory changes
}

function renderSalesHistory() {
    const tbody = document.getElementById('salesTableBody');
    tbody.innerHTML = '';

    const searchTerm = document.getElementById('salesSearch').value.toLowerCase();
    const dateFilter = document.getElementById('salesDateFilter').value;

    const filteredSales = sales.filter(sale => {
        const matchesSearch = sale.itemName.toLowerCase().includes(searchTerm) ||
                              sale.customer.toLowerCase().includes(searchTerm);
        const matchesDate = dateFilter === "" || sale.date === dateFilter;

        return matchesSearch && matchesDate;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by newest first

    if (filteredSales.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="empty-state-icon">💰</div>
                    <h3>No Sales Found</h3>
                    <p>Try adjusting your search or filters.</p>
                </td>
            </tr>
        `;
        return;
    }

    filteredSales.forEach(sale => {
        const row = tbody.insertRow();
        row.insertCell().textContent = new Date(sale.date).toLocaleDateString();
        row.insertCell().textContent = sale.itemName;
        row.insertCell().textContent = sale.quantity;
        row.insertCell().textContent = `₹${sale.unitPrice.toFixed(2)}`;
        row.insertCell().textContent = `₹${sale.total.toFixed(2)}`;
        row.insertCell().textContent = sale.customer;
        row.insertCell().innerHTML = `
            <button class="btn btn-icon btn-delete" onclick="deleteSale(${sale.id})">🗑️</button>
        `;
    });
}

function filterSales() {
    renderSalesHistory();
}


// --- Supplier Logic ---

function saveSupplier(event) {
    event.preventDefault();

    const name = document.getElementById('supplierName').value.trim();
    const contact = document.getElementById('supplierContact').value.trim();
    const phone = document.getElementById('supplierPhone').value.trim();
    const email = document.getElementById('supplierEmail').value.trim();
    const address = document.getElementById('supplierAddress').value.trim();
    const notes = document.getElementById('supplierNotes').value.trim();
    const editId = document.getElementById('editSupplierId').value;

    if (name === "" || phone === "") {
        showToast('Supplier Name and Phone are required.', 'danger');
        return;
    }

    if (editId) {
        // Edit existing supplier
        const index = suppliers.findIndex(s => s.id == editId);
        if (index > -1) {
            suppliers[index] = { ...suppliers[index], name, contact, phone, email, address, notes };
            showToast('Supplier updated successfully!', 'success');
        } else {
            showToast('Error: Supplier not found.', 'danger');
        }
    } else {
        // Add new supplier
        const newSupplier = {
            id: generateId('supplier'),
            name, contact, phone, email, address, notes,
            dateAdded: new Date().toISOString()
        };
        suppliers.push(newSupplier);
        showToast('New supplier added!', 'success');
    }

    saveData();
    resetSupplierForm();
}

function editSupplier(id) {
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) {
        showToast('Supplier not found for editing.', 'danger');
        return;
    }

    document.getElementById('supplierName').value = supplier.name;
    document.getElementById('supplierContact').value = supplier.contact;
    document.getElementById('supplierPhone').value = supplier.phone;
    document.getElementById('supplierEmail').value = supplier.email;
    document.getElementById('supplierAddress').value = supplier.address;
    document.getElementById('supplierNotes').value = supplier.notes;
    document.getElementById('editSupplierId').value = supplier.id;

    document.querySelector('#supplierForm h2').textContent = 'Edit Supplier';
    document.querySelector('#supplierForm .btn-success').textContent = '💾 Update Supplier';

    // Smooth scroll to the form
    document.getElementById('suppliers').querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

function deleteSupplier(id) {
    if (confirm('Are you sure you want to delete this supplier?')) {
        suppliers = suppliers.filter(supplier => supplier.id !== id);
        saveData();
        showToast('Supplier deleted.', 'info');
    }
}

function resetSupplierForm() {
    document.getElementById('supplierForm').reset();
    document.getElementById('editSupplierId').value = '';
    document.querySelector('#supplierForm h2').textContent = 'Add New Supplier';
    document.querySelector('#supplierForm .btn-success').textContent = '💾 Save Supplier';
}

function renderSuppliers() {
    const tbody = document.getElementById('suppliersTableBody');
    tbody.innerHTML = '';

    if (suppliers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-state-icon">🚚</div>
                    <h3>No Suppliers Added</h3>
                    <p>Add your first supplier to get started</p>
                </td>
            </tr>
        `;
        return;
    }

    suppliers.forEach(supplier => {
        const row = tbody.insertRow();
        row.insertCell().textContent = supplier.name;
        row.insertCell().textContent = supplier.contact || 'N/A';
        row.insertCell().textContent = supplier.phone;
        row.insertCell().textContent = supplier.email || 'N/A';
        row.insertCell().textContent = supplier.address || 'N/A';
        row.insertCell().innerHTML = `
            <button class="btn btn-icon btn-edit" onclick="editSupplier(${supplier.id})">✏️</button>
            <button class="btn btn-icon btn-delete" onclick="deleteSupplier(${supplier.id})">🗑️</button>
        `;
    });
}

// --- Reports Logic ---

function updateReportStats() {
    // Total Sales
    const totalSalesValue = sales.reduce((sum, sale) => sum + sale.total, 0);
    document.getElementById('totalSales').textContent = `₹${totalSalesValue.toFixed(2)}`;

    // Total Transactions
    const totalTransactions = sales.length;
    document.getElementById('totalTransactions').textContent = totalTransactions;

    // Average Sale
    const avgSaleValue = totalTransactions > 0 ? totalSalesValue / totalTransactions : 0;
    document.getElementById('avgSale').textContent = `₹${avgSaleValue.toFixed(2)}`;

    // Top Category
    const categorySales = sales.reduce((acc, sale) => {
        acc[sale.category] = (acc[sale.category] || 0) + sale.total;
        return acc;
    }, {});

    let topCategory = '-';
    let maxSale = 0;
    for (const category in categorySales) {
        if (categorySales[category] > maxSale) {
            maxSale = categorySales[category];
            topCategory = category;
        }
    }
    document.getElementById('topCategory').textContent = topCategory;
}

function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('reportStartDate').value ? new Date(document.getElementById('reportStartDate').value) : null;
    const endDate = document.getElementById('reportEndDate').value ? new Date(document.getElementById('reportEndDate').value) : null;
    
    const reportDisplay = document.getElementById('reportDisplay');
    const reportContent = document.getElementById('reportContent');
    const reportTitle = document.getElementById('reportTitle');
    reportContent.innerHTML = '';
    reportDisplay.style.display = 'block';

    let contentHTML = '';
    reportTitle.textContent = '';
    
    if (reportType === 'inventory') {
        reportTitle.textContent = 'Inventory Summary Report';
        contentHTML = generateInventoryReport(startDate, endDate);
    } else if (reportType === 'sales') {
        reportTitle.textContent = 'Detailed Sales Report';
        contentHTML = generateSalesReport(startDate, endDate);
    } else if (reportType === 'low-stock') {
        reportTitle.textContent = 'Low Stock & Reorder Report';
        contentHTML = generateLowStockReport();
    } else if (reportType === 'supplier') {
        reportTitle.textContent = 'Supplier & Procurement Report (Basic)';
        contentHTML = generateSupplierReport();
    }

    reportContent.innerHTML = contentHTML;
    showToast(`${reportTitle.textContent} generated.`, 'info');
}

function generateInventoryReport(startDate, endDate) {
    let totalItems = 0;
    let totalValue = 0;
    let tableRows = '';

    const filteredInventory = inventory.filter(item => {
        if (!startDate && !endDate) return true;
        const itemDate = new Date(item.dateAdded);
        const startMatch = startDate ? itemDate >= startDate : true;
        const endMatch = endDate ? itemDate <= new Date(endDate.getTime() + 86400000) : true; // Add 1 day to end date
        return startMatch && endMatch;
    });

    filteredInventory.forEach(item => {
        const itemValue = item.quantity * item.price;
        totalItems++;
        totalValue += itemValue;
        const status = getStockStatus(item.quantity, item.reorderLevel);

        tableRows += `
            <tr>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity} ${item.unit}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${itemValue.toFixed(2)}</td>
                <td><span class="status-badge ${status.class}">${status.label}</span></td>
            </tr>
        `;
    });

    const header = `
        <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Period:</strong> ${startDate ? startDate.toLocaleDateString() : 'All Time'} - ${endDate ? endDate.toLocaleDateString() : 'All Time'}</p>
    `;

    const summary = `
        <div class="dashboard-grid" style="margin-top: 20px;">
            <div class="stat-card"><h3>Items Tracked</h3><div class="stat-value">${totalItems}</div></div>
            <div class="stat-card success"><h3>Total Inventory Value</h3><div class="stat-value">₹${totalValue.toFixed(2)}</div></div>
        </div>
    `;

    const table = `
        <div class="table-container" style="margin-top: 20px;">
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total Value</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>
    `;

    return header + summary + table;
}

function generateSalesReport(startDate, endDate) {
    let totalRevenue = 0;
    let totalUnits = 0;
    let tableRows = '';

    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        const startMatch = startDate ? saleDate >= startDate : true;
        const endMatch = endDate ? saleDate <= new Date(endDate.getTime() + 86400000) : true;
        return startMatch && endMatch;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    filteredSales.forEach(sale => {
        totalRevenue += sale.total;
        totalUnits += sale.quantity;

        tableRows += `
            <tr>
                <td>${new Date(sale.date).toLocaleDateString()}</td>
                <td>${sale.itemName}</td>
                <td>${sale.category}</td>
                <td>${sale.quantity}</td>
                <td>₹${sale.unitPrice.toFixed(2)}</td>
                <td><strong>₹${sale.total.toFixed(2)}</strong></td>
                <td>${sale.customer}</td>
            </tr>
        `;
    });

    const header = `
        <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Period:</strong> ${startDate ? startDate.toLocaleDateString() : 'All Time'} - ${endDate ? endDate.toLocaleDateString() : 'All Time'}</p>
    `;

    const summary = `
        <div class="dashboard-grid" style="margin-top: 20px;">
            <div class="stat-card success"><h3>Total Revenue</h3><div class="stat-value">₹${totalRevenue.toFixed(2)}</div></div>
            <div class="stat-card"><h3>Total Units Sold</h3><div class="stat-value">${totalUnits}</div></div>
            <div class="stat-card warning"><h3>Total Transactions</h3><div class="stat-value">${filteredSales.length}</div></div>
        </div>
    `;

    const table = `
        <div class="table-container" style="margin-top: 20px;">
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Item</th>
                        <th>Category</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total Revenue</th>
                        <th>Customer</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>
    `;

    return header + summary + table;
}

function generateLowStockReport() {
    let tableRows = '';
    const lowStockItems = inventory.filter(item => item.quantity <= item.reorderLevel).sort((a, b) => a.quantity - b.quantity);
    
    if (lowStockItems.length === 0) {
        return '<div class="alert alert-success"><span>✅</span><span>All items are currently above their reorder level. Great job!</span></div>';
    }

    lowStockItems.forEach(item => {
        const status = getStockStatus(item.quantity, item.reorderLevel);

        tableRows += `
            <tr>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity} ${item.unit}</td>
                <td><span class="status-badge ${status.class}">${status.label}</span></td>
                <td>${item.reorderLevel}</td>
                <td>${item.supplier || 'N/A'}</td>
            </tr>
        `;
    });

    const header = `<p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>`;

    const summary = `
        <div class="dashboard-grid" style="margin-top: 20px;">
            <div class="stat-card danger"><h3>Items to Reorder</h3><div class="stat-value">${lowStockItems.length}</div></div>
        </div>
        <div class="alert alert-warning" style="margin-top: 15px;"><span>⚠️</span><span>Action Required: Please reorder the items listed below to prevent stockouts.</span></div>
    `;

    const table = `
        <div class="table-container" style="margin-top: 20px;">
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Current Stock</th>
                        <th>Status</th>
                        <th>Reorder Level</th>
                        <th>Primary Supplier</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>
    `;

    return header + summary + table;
}

function generateSupplierReport() {
    let tableRows = '';

    if (suppliers.length === 0) {
        return '<div class="alert alert-info"><span>🚚</span><span>No suppliers added yet.</span></div>';
    }

    suppliers.forEach(supplier => {
        tableRows += `
            <tr>
                <td>${supplier.name}</td>
                <td>${supplier.contact || 'N/A'}</td>
                <td>${supplier.phone}</td>
                <td>${supplier.email || 'N/A'}</td>
                <td>${inventory.filter(i => i.supplier === supplier.name).length}</td>
            </tr>
        `;
    });
    
    const header = `<p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>`;

    const summary = `
        <div class="dashboard-grid" style="margin-top: 20px;">
            <div class="stat-card"><h3>Total Suppliers</h3><div class="stat-value">${suppliers.length}</div></div>
        </div>
    `;

    const table = `
        <div class="table-container" style="margin-top: 20px;">
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Supplier Name</th>
                        <th>Contact Person</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Items Supplied</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>
    `;

    return header + summary + table;
}


function printReport() {
    const reportContent = document.getElementById('reportDisplay').innerHTML;
    if (!reportContent || document.getElementById('reportDisplay').style.display === 'none') {
        showToast('Please generate a report first.', 'warning');
        return;
    }

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>BLJ Study Hub & Cafe Report</title>');
    // Include minimal styles for printing
    printWindow.document.write('<style>body { font-family: Arial, sans-serif; padding: 20px; } .report-table { width: 100%; border-collapse: collapse; margin-top: 20px; } .report-table th, .report-table td { border: 1px solid #ddd; padding: 8px; text-align: left; } .report-table th { background-color: #f2f2f2; } .stat-card { border: 1px solid #ccc; padding: 10px; margin: 10px; display: inline-block; } .stat-value { font-size: 1.5em; font-weight: bold; } .status-badge { padding: 4px 8px; border-radius: 4px; color: white; } .status-badge.danger { background-color: #e74c3c; } .status-badge.warning { background-color: #f39c12; } .status-badge.success { background-color: #2ecc71; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(`<h1>BLJ Study Hub & Cafe - ${document.getElementById('reportTitle').textContent}</h1>`);
    printWindow.document.write(reportContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}


function exportReport() {
    const reportType = document.getElementById('reportType').value;
    let dataToExport = [];
    let headers = [];
    let filename = '';

    if (reportType === 'inventory' || reportType === 'low-stock') {
        dataToExport = inventory.map(item => ({
            'Item Name': item.name,
            'Category': item.category,
            'Quantity': `${item.quantity} ${item.unit}`,
            'Unit Price (₹)': item.price.toFixed(2),
            'Total Value (₹)': (item.quantity * item.price).toFixed(2),
            'Status': getStockStatus(item.quantity, item.reorderLevel).label,
            'Reorder Level': item.reorderLevel,
            'Supplier': item.supplier || 'N/A',
            'Location': item.location || 'N/A'
        }));
        headers = ['Item Name', 'Category', 'Quantity', 'Unit Price (₹)', 'Total Value (₹)', 'Status', 'Reorder Level', 'Supplier', 'Location'];
        filename = 'inventory_report.csv';
    } else if (reportType === 'sales') {
        dataToExport = sales.map(sale => ({
            'Date': new Date(sale.date).toLocaleDateString(),
            'Item Name': sale.itemName,
            'Category': sale.category,
            'Quantity': sale.quantity,
            'Unit Price (₹)': sale.unitPrice.toFixed(2),
            'Total Revenue (₹)': sale.total.toFixed(2),
            'Customer': sale.customer,
            'Notes': sale.notes || 'N/A'
        }));
        headers = ['Date', 'Item Name', 'Category', 'Quantity', 'Unit Price (₹)', 'Total Revenue (₹)', 'Customer', 'Notes'];
        filename = 'sales_report.csv';
    } else if (reportType === 'supplier') {
        dataToExport = suppliers.map(supplier => ({
            'Supplier Name': supplier.name,
            'Contact Person': supplier.contact || 'N/A',
            'Phone': supplier.phone,
            'Email': supplier.email || 'N/A',
            'Address': supplier.address || 'N/A',
            'Notes': supplier.notes || 'N/A'
        }));
        headers = ['Supplier Name', 'Contact Person', 'Phone', 'Email', 'Address', 'Notes'];
        filename = 'supplier_report.csv';
    }
    
    if (dataToExport.length === 0) {
        showToast('No data to export for this report type.', 'warning');
        return;
    }
    
    convertToCSV(dataToExport, headers, filename);
}

// --- Settings and Data Management ---

function convertToCSV(data, headers, filename) {
    let csvContent = headers.join(',') + '\n';

    data.forEach(row => {
        const values = headers.map(header => {
            let value = row[header] === undefined || row[header] === null ? '' : row[header];
            // Handle commas and quotes within data
            value = String(value).replace(/"/g, '""');
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                value = `"${value}"`;
            }
            return value;
        });
        csvContent += values.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Data exported as ${filename}!`, 'success');
}

function exportData() {
    const data = {
        inventory: inventory,
        sales: sales,
        suppliers: suppliers,
        lastId: lastId,
        exportDate: new Date().toISOString()
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BLJ_IMS_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    localStorage.setItem('lastBackupTime', new Date().toISOString());
    updateSystemInfo();
    showToast('All data exported successfully!', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.inventory && importedData.sales && importedData.suppliers && importedData.lastId) {
                // Confirm with user
                if (confirm('Are you sure you want to replace all current data with the imported file? This action cannot be undone.')) {
                    inventory = importedData.inventory;
                    sales = importedData.sales;
                    suppliers = importedData.suppliers;
                    lastId = importedData.lastId;
                    saveData();
                    showToast('Data imported and restored successfully!', 'success');
                }
            } else {
                showToast('Invalid backup file format.', 'danger');
            }
        } catch (error) {
            showToast('Error parsing file. Ensure it is a valid JSON backup.', 'danger');
            console.error(error);
        }
    };
    reader.readAsText(file);
    // Reset file input to allow importing the same file again if needed
    event.target.value = ''; 
}

function clearAllData() {
    if (confirm('⚠️ WARNING: This will permanently delete ALL inventory, sales, and supplier data. Are you absolutely sure you want to continue?')) {
        inventory = [];
        sales = [];
        suppliers = [];
        lastId = { item: 0, sale: 0, supplier: 0 };
        localStorage.clear();
        saveData(); // Save empty arrays and reset IDs
        showToast('All data has been successfully cleared.', 'danger');
    }
}

function updateSystemInfo() {
    // Estimate local storage size (very rough estimate)
    const storageSizeKB = (JSON.stringify(localStorage).length / 1024).toFixed(2);
    document.getElementById('dbSize').textContent = `${storageSizeKB} KB`;

    // Last Backup Time
    const lastBackupTime = localStorage.getItem('lastBackupTime');
    document.getElementById('lastBackup').textContent = lastBackupTime ? 
        new Date(lastBackupTime).toLocaleString() : 'Never';

    // Total Records
    const totalRecords = inventory.length + sales.length + suppliers.length;
    document.getElementById('totalRecords').textContent = totalRecords;
}

function loadSampleData() {
    if (confirm('This will overwrite any existing data with sample data. Continue?')) {
        inventory = [
            { id: 1, name: 'Espresso Beans (Kg)', category: 'Raw Materials', quantity: 5, unit: 'kg', price: 800.00, reorderLevel: 2, supplier: 'Coffee Master Inc.', location: 'Storeroom S1', notes: 'Premium Arabica blend.', dateAdded: '2025-10-20T10:00:00Z' },
            { id: 2, name: 'Bottled Water (500ml)', category: 'Cold Drinks', quantity: 150, unit: 'pcs', price: 20.00, reorderLevel: 50, supplier: 'Aqua Distributors', location: 'Fridge F2', notes: 'Best before 12/2026', dateAdded: '2025-10-21T11:00:00Z' },
            { id: 3, name: 'Chocolate Croissant', category: 'Cakes & Pastries', quantity: 5, unit: 'pcs', price: 80.00, reorderLevel: 10, supplier: 'Local Bakery', location: 'Display C3', notes: 'Freshly baked daily.', dateAdded: '2025-10-22T12:00:00Z' },
            { id: 4, name: 'A4 Notebook (80 pages)', category: 'Stationery', quantity: 12, unit: 'pcs', price: 45.00, reorderLevel: 20, supplier: 'Paper King', location: 'Study Area D4', notes: 'Mixed colors.', dateAdded: '2025-10-23T13:00:00Z' },
            { id: 5, name: 'Milk (1L Tetra)', category: 'Raw Materials', quantity: 0, unit: 'l', price: 65.00, reorderLevel: 5, supplier: 'Dairy Fresh', location: 'Fridge F1', notes: 'Out of Stock - Urgent Reorder!', dateAdded: '2025-10-23T14:00:00Z' }
        ];

        sales = [
            { id: 1, itemId: 2, itemName: 'Bottled Water (500ml)', category: 'Cold Drinks', quantity: 2, unitPrice: 25.00, total: 50.00, date: '2025-10-23', customer: 'Student A', notes: '', timestamp: '2025-10-23T15:00:00Z' },
            { id: 2, itemId: 1, itemName: 'Espresso Beans (Kg)', category: 'Raw Materials', quantity: 1, unitPrice: 300.00, total: 300.00, date: '2025-10-23', customer: 'Walk-in', notes: 'Used for a large batch of lattes', timestamp: '2025-10-23T16:00:00Z' },
            { id: 3, itemId: 3, itemName: 'Chocolate Croissant', category: 'Cakes & Pastries', quantity: 3, unitPrice: 85.00, total: 255.00, date: '2025-10-22', customer: 'Student B', notes: '', timestamp: '2025-10-22T17:00:00Z' }
        ];

        suppliers = [
            { id: 1, name: 'Coffee Master Inc.', contact: 'Ramesh Singh', phone: '9876543210', email: 'ramesh@coffeemaster.com', address: '12/A Industrial Estate', notes: 'Delivers M-W-F.', dateAdded: '2025-10-01T00:00:00Z' },
            { id: 2, name: 'Paper King', contact: 'Priya Sharma', phone: '9000112233', email: 'priya@paperking.in', address: '45 Stationery Mart', notes: 'Bulk discounts available.', dateAdded: '2025-10-05T00:00:00Z' }
        ];
        
        lastId = { item: 5, sale: 3, supplier: 2 };

        saveData();
        showToast('Sample data loaded successfully!', 'success');
        switchTab('dashboard'); // Go to dashboard to see results
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Set default date for sales form
    document.getElementById('saleDate').valueAsDate = new Date();
    
    // Initial data load and render
    saveData(); // Calls all render and update functions
    
    // Ensure the correct tab is active on load
    switchTab('dashboard');
});