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
        // For bookings, we use totalPrice (price * duration)
        const itemPrice = item.isBooking ? (item.totalPrice) : (parseFloat(item.price) * item.quantity);
        subtotal += itemPrice;

        const priceDisplay = item.isBooking ?
            `₱${item.price}/hr × ${item.details.duration}h` :
            `Qty: ${item.quantity} × ₱${parseFloat(item.price).toFixed(2)}`;

        const dateTimeDisplay = item.isBooking ?
            `<div class="item-meta"><i class="far fa-calendar-alt"></i> ${item.details.date} at ${item.details.time}</div>` : '';

        cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <div class="item-info">
                    <img src="${item.image || 'assets/image/Gemini.png'}" class="item-image" alt="${item.name}">
                    <div class="item-details">
                        <h4>${item.name} ${item.isBooking ? '<span class="item-type-badge">Reservation</span>' : ''}</h4>
                        <div class="item-meta">${priceDisplay}</div>
                        ${dateTimeDisplay}
                        <div class="item-price">₱${itemPrice.toFixed(2)}</div>
                    </div>
                </div>
                <button class="btn-remove" onclick="removeFromCart(${index})" title="Remove Item">
                    <i class="fas fa-trash-alt"></i>
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
        <table style="width:100%; border-collapse: collapse; font-size: 0.85rem;">
            <thead>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--primary-neon);">
                    <th style="text-align:left; padding: 10px 0;">Item Details</th>
                    <th style="text-align:right; padding: 10px 0;">Total</th>
                </tr>
            </thead>
            <tbody>
    `;

    cart.forEach(item => {
        const itemPrice = item.isBooking ? item.totalPrice : (parseFloat(item.price) * item.quantity);
        subtotal += itemPrice;
        reviewHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 10px 0;">
                    <b>${item.name}</b><br>
                    <small style="opacity: 0.7;">
                        ${item.isBooking ?
                `${item.details.duration}h @ ${item.details.date}` :
                `Qty: ${item.quantity} × ₱${parseFloat(item.price).toFixed(2)}`}
                    </small>
                </td>
                <td style="text-align:right; padding: 10px 0;">₱${itemPrice.toFixed(2)}</td>
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
                <span>Service Fee</span>
                <span>₱${delivery.toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top: 10px; font-size: 1.2rem; color: var(--accent-gold); font-weight: bold;">
                <span>Grand Total</span>
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
        alert('Please fill in contact details and preferred hub location/address');
        return;
    }

    let cart = JSON.parse(localStorage.getItem('blj_cart')) || [];
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.isBooking ? item.totalPrice : (parseFloat(item.price) * item.quantity);
    });
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
            alert('⚠️ Oops! ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Order submission failed. Please check your connection and try again.');
    }
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    window.location.href = 'index.html';
}

function goBack() {
    window.location.href = 'index.html';
}

window.onclick = function (event) {
    const checkoutModal = document.getElementById('checkoutModal');
    const successModal = document.getElementById('successModal');
    if (event.target == checkoutModal) closeCheckoutModal();
    if (event.target == successModal) closeSuccessModal();
}
