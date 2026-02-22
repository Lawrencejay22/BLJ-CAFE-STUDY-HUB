// Auto-select room type based on URL parameter
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type) {
        const select = document.getElementById('roomType');
        if (select) {
            // Compare the product name with each option
            for (let i = 0; i < select.options.length; i++) {
                const opt = select.options[i];
                // Check if the product name is contained in the option value or text (e.g. "Wifi" matching "Wifi Area")
                if (type.toLowerCase().includes(opt.value.toLowerCase()) ||
                    opt.value.toLowerCase().includes(type.toLowerCase()) ||
                    opt.text.toLowerCase().includes(type.toLowerCase())) {
                    select.selectedIndex = i;
                    break;
                }
            }
        }
    }
});

document.getElementById('bookingForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);

    try {
        const response = await fetch('php/booking.php', {
            method: 'POST',
            body: formData
        });

        // The booking.php currently returns a script tag for redirect. 
        // We should ideally change booking.php to return JSON, but for now we handle it.
        alert('Reservation Sent to Database!');

        // Save to localStorage as backup
        const reservation = Object.fromEntries(formData.entries());
        reservation.resID = 'ROOM-' + Math.floor(Math.random() * 10000);
        let myReservations = JSON.parse(localStorage.getItem('my_reservations')) || [];
        myReservations.push(reservation);
        localStorage.setItem('my_reservations', JSON.stringify(myReservations));

        window.location.href = 'index.html';
    } catch (error) {
        console.error('Booking error:', error);
        alert('There was an error with your reservation.');
    }
});