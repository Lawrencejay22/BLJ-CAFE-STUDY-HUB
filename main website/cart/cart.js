// Load cart on page load
window.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadCart();
    calculateTotal();
});

function checkAuthentication() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        window.location.href = 'signin.html';
    }
}

function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItems = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h2>Your cart is empty</h2>
                <p>Add some delicious items to get started!</p>
                <button class="btn-shop" onclick="goBack()">Start Shopping</button>
            </div>
        `;
        return;
    }
    
    cartItems.innerHTML = '';
    cart.forEach(item => {
        const itemHTML = `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h3 class="cart-item-name">${item.name}</h3>
                    <p class="cart-item-description">${item.description}</p>
                    <p class="cart-item-price">$${item.price.toFixed(2)} each</p>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="btn-remove" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `;
        cartItems.innerHTML += itemHTML;
    });
}

function updateQuantity(itemId, change) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart.find(i => i.id === itemId);
    
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(itemId);
            return;
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
        calculateTotal();
    }
}

function removeFromCart(itemId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== itemId);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
    calculateTotal();
    
    // Update badge on main website
    updateCartBadge();
}

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    // This will be updated when user returns to main website
}

function calculateTotal() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.10;
    const delivery = cart.length > 0 ? 2.00 : 0;
    const total = subtotal + tax + delivery;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('delivery').textContent = `$${delivery.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

function proceedToCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Show checkout modal
    const modal = document.getElementById('checkoutModal');
    modal.classList.add('active');
    
    // Load order review
    const orderReview = document.getElementById('orderReview');
    orderReview.innerHTML = '<h3>Order Items:</h3>';
    
    cart.forEach(item => {
        orderReview.innerHTML += `
            <div class="review-item">
                <span>${item.name} x ${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `;
    });
    
    // Add total
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.10;
    const delivery = 2.00;
    const total = subtotal + tax + delivery;
    
    orderReview.innerHTML += `
        <div class="review-item" style="font-weight: bold; margin-top: 15px; padding-top: 15px; border-top: 2px solid #667eea;">
            <span>Total Amount:</span>
            <span style="color: #667eea;">$${total.toFixed(2)}</span>
        </div>
    `;
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('active');
}

function confirmOrder() {
    const deliveryAddress = document.getElementById('deliveryAddress').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const specialInstructions = document.getElementById('specialInstructions').value;
    
    if (!deliveryAddress || !phoneNumber) {
        alert('Please fill in all required fields!');
        return;
    }
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.10;
    const delivery = 2.00;
    const total = subtotal + tax + delivery;
    
    // Create order object
    const order = {
        id: Date.now(),
        orderNumber: 'ORD' + Date.now().toString().slice(-8),
        customer: {
            name: userData.name,
            email: userData.email,
            phone: phoneNumber,
            address: deliveryAddress
        },
        items: cart,
        subtotal: subtotal,
        tax: tax,
        delivery: delivery,
        total: total,
        specialInstructions: specialInstructions,
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    // Save order to pending orders
    const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders')) || [];
    pendingOrders.unshift(order);
    localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));
    
    // Notify admin
    notifyAdmin(order);
    
    // Clear cart
    localStorage.removeItem('cart');
    
    // Close checkout modal
    closeCheckoutModal();
    
    // Show success modal
    document.getElementById('orderNumber').textContent = order.orderNumber;
    document.getElementById('successModal').classList.add('active');
    
    // Add to user activities
    addActivity('Order Placed', `Order ${order.orderNumber} has been placed successfully`);
}

function notifyAdmin(order) {
    // Add notification for admin
    const adminNotifications = JSON.parse(localStorage.getItem('adminNotifications')) || [];
    adminNotifications.unshift({
        id: Date.now(),
        type: 'new_order',
        title: 'New Order Received',
        message: `Order ${order.orderNumber} from ${order.customer.name}`,
        order: order,
        read: false,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('adminNotifications', JSON.stringify(adminNotifications));
}

function addActivity(title, description) {
    const activities = JSON.parse(localStorage.getItem('userActivities')) || [];
    activities.unshift({
        id: Date.now(),
        title: title,
        description: description,
        timestamp: new Date().toISOString(),
        icon: 'fas fa-shopping-bag'
    });
    localStorage.setItem('userActivities', JSON.stringify(activities));
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('active');
    window.location.href = 'main-website.html';
}

function goBack() {
    window.location.href = 'main-website.html';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const checkoutModal = document.getElementById('checkoutModal');
    const successModal = document.getElementById('successModal');
    
    if (event.target === checkoutModal) {
        closeCheckoutModal();
    }
    if (event.target === successModal) {
        closeSuccessModal();
    }
}