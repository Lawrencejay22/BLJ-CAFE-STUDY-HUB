/* ==========================================================================
   DISPLAY CART ITEMS
   ========================================================================== */
const cartItemsContainer = document.getElementById('cartItems');

function displayCart() {
    let cart = JSON.parse(localStorage.getItem('blj_cart')) || [];
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-msg">Your cart is currently empty.</p>';
        updateSummary(0);
        return;
    }

    let subtotal = 0;

    cart.forEach((item, index) => {
        const itemPrice = parseFloat(item.price) || 0;
        subtotal += itemPrice * item.quantity;

        cartItemsContainer.innerHTML += `
            <div class="product-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 10px; border-bottom: 1px solid var(--border-glow);">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="${item.image}" width="50" height="50" style="border-radius: 5px;">
                    <div>
                        <h4 style="margin:0;">${item.name}</h4>
                        <small>₱${itemPrice.toFixed(2)} x ${item.quantity}</small>
                    </div>
                </div>
                <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#ff4d4d; cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });

    updateSummary(subtotal);
}

function updateSummary(subtotal) {
    const tax = subtotal * 0.10;
    const delivery = subtotal > 0 ? 2.00 : 0;
    const total = subtotal + tax + delivery;

    document.getElementById('subtotal').innerText = `₱${subtotal.toFixed(2)}`;
    document.getElementById('tax').innerText = `₱${tax.toFixed(2)}`;
    document.getElementById('delivery').innerText = `₱${delivery.toFixed(2)}`;
    document.getElementById('total').innerText = `₱${total.toFixed(2)}`;
}

function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('blj_cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('blj_cart', JSON.stringify(cart));
    displayCart();
}

/* ==========================================================================
    INITIALIZE
    ========================================================================== */
document.addEventListener('DOMContentLoaded', displayCart);

/* ==========================================================================
   CHECKOUT & MODAL LOGIC
   ========================================================================== */
function proceedToCheckout() {
    let cart = JSON.parse(localStorage.getItem('blj_cart')) || [];
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const modal = document.getElementById('checkoutModal');
    const orderReview = document.getElementById('orderReview');

    let subtotal = 0;
    let reviewHTML = `
        <table style="width:100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--primary-neon);">
                    <th style="text-align:left; padding: 10px 0;">Item</th>
                    <th style="text-align:center; padding: 10px 0;">Qty</th>
                    <th style="text-align:right; padding: 10px 0;">Price</th>
                </tr>
            </thead>
            <tbody>
    `;

    cart.forEach(item => {
        const price = parseFloat(item.price);
        subtotal += price * item.quantity;
        reviewHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 10px 0;">${item.name}</td>
                <td style="text-align:center; padding: 10px 0;">${item.quantity}</td>
                <td style="text-align:right; padding: 10px 0;">₱${(price * item.quantity).toFixed(2)}</td>
            </tr>
        `;
    });

    const tax = subtotal * 0.10;
    const delivery = 2.00;
    const total = subtotal + tax + delivery;

    reviewHTML += `
            </tbody>
        </table>
        <div style="margin-top: 15px; border-top: 2px solid var(--primary-neon); padding-top: 10px;">
            <div style="display:flex; justify-content:space-between; margin-bottom: 5px; opacity: 0.7;">
                <span>Subtotal</span>
                <span>₱${subtotal.toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom: 5px; opacity: 0.7;">
                <span>Tax (10%)</span>
                <span>₱${tax.toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom: 5px; opacity: 0.7;">
                <span>Delivery</span>
                <span>₱${delivery.toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top: 10px; font-size: 1.2rem; color: var(--accent-gold); font-weight: bold;">
                <span>Total Amount</span>
                <span>₱${total.toFixed(2)}</span>
            </div>
        </div>
    `;

    orderReview.innerHTML = reviewHTML;
    modal.style.display = 'flex';
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').style.display = 'none';
}

async function confirmOrder() {
    // Basic check - we can check session via a small PHP script or just rely on the backend.
    // However, to satisfy "user log in" requirement, we check if we have a name in session.
    const loginCheck = await fetch('php/get_session.php');
    const session = await loginCheck.json();

    if (!session.logged_in) {
        alert('Please login first to place an order!');
        window.location.href = 'Login.html';
        return;
    }

    const address = document.getElementById('deliveryAddress').value;
    const phone = document.getElementById('phoneNumber').value;

    if (!address || !phone) {
        alert('Please fill in address and phone number');
        return;
    }

    let cart = JSON.parse(localStorage.getItem('blj_cart')) || [];
    let subtotal = 0;
    cart.forEach(item => subtotal += parseFloat(item.price) * item.quantity);
    const total = subtotal + (subtotal * 0.10) + 2.00;

    const orderData = {
        address: address,
        phone: phone,
        total: total,
        items: cart
    };

    try {
        const response = await fetch('php/place_order.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();
        if (result.success) {
            localStorage.removeItem('blj_cart');
            closeCheckoutModal();
            document.getElementById('orderNumber').innerText = `#ORD-${result.order_id}`;
            document.getElementById('successModal').style.display = 'flex';
        } else {
            // Show the specific error warning (e.g., "Product Not Available")
            alert('⚠️ ORDER WARNING: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Could not place order. Please try again.');
    }
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    window.location.href = 'index.html';
}

function goBack() {
    window.location.href = 'index.html';
}

// Global click to close models
window.onclick = function (event) {
    const checkoutModal = document.getElementById('checkoutModal');
    const successModal = document.getElementById('successModal');
    if (event.target == checkoutModal) closeCheckoutModal();
    if (event.target == successModal) closeSuccessModal();
}
