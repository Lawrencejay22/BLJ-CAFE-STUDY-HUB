const ROOM_PRICES = {
    "Quiet Solo Pod": 60,
    "Group Study Room": 250,
    "Conference Room": 500,
    "Premium Fiber Wifi": 50,
    "Printing Service Room": 20,
    "Nap Room Access": 100,
    "Charging Station/Room": 30
};

// 1. Auto-select room type based on URL parameter
const autoSelectRoom = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');

    if (type) {
        console.log("Attempting to auto-select room:", type);
        const select = document.getElementById('roomType');
        if (select) {
            const decodedType = decodeURIComponent(type).toLowerCase().replace(/\s+/g, ' ').trim();
            let foundIndex = -1;

            for (let i = 0; i < select.options.length; i++) {
                const opt = select.options[i];
                const optVal = opt.value.toLowerCase().replace(/\s+/g, ' ').trim();
                const optText = opt.text.toLowerCase().replace(/\s+/g, ' ').trim();

                // 1. Exact Match or text contains type
                if (optVal === decodedType || optText.includes(decodedType)) {
                    foundIndex = i;
                    break;
                }

                // 2. Partial Match
                if (decodedType.includes(optVal) || optVal.includes(decodedType)) {
                    foundIndex = i;
                }
            }

            if (foundIndex !== -1) {
                select.selectedIndex = foundIndex;
                console.log("Success! Selected index:", foundIndex);

                // High Visibility Success feedback
                select.style.border = "2px solid #a855f7";
                select.style.boxShadow = "0 0 25px rgba(168, 85, 247, 1)";
                select.style.color = "white";
                select.style.background = "rgba(168, 85, 247, 0.2)";
            }
        }
    }
};

// Run after a tiny delay to ensure select options are ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(autoSelectRoom, 200);
});

// 2. Handle the Form Submission (Direct to Cart)
document.getElementById('bookingForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const roomType = document.getElementById('roomType').value;
    const resDate = document.getElementById('date').value;
    const checkInTime = document.getElementById('time').value;
    const duration = parseInt(document.getElementById('duration').value);
    const pax = parseInt(document.getElementById('pax').value);

    const basePrice = ROOM_PRICES[roomType] || 0;
    const totalPrice = basePrice * duration;

    const bookingItem = {
        id: "BOOK-" + Date.now(),
        name: roomType,
        price: basePrice,
        totalPrice: totalPrice,
        quantity: 1, // Represents 1 reservation
        isBooking: true,
        details: {
            date: resDate,
            time: checkInTime,
            duration: duration,
            pax: pax
        },
        image: "assets/image/Gemini.png" // Default logo for bookings
    };

    // Add to Cart
    let cart = JSON.parse(localStorage.getItem('blj_cart')) || [];
    cart.push(bookingItem);
    localStorage.setItem('blj_cart', JSON.stringify(cart));

    alert('Reservation added to cart! Proceed to checkout to confirm.');
    window.location.href = 'cart.html';
});