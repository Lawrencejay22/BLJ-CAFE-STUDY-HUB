/**1. TAB TITLE LOGIC*/
const originalTitle = document.title;

window.addEventListener('focus', () => {
    document.title = originalTitle;
});

window.addEventListener('blur', () => {
    document.title = 'Come Back to BLJ STUDY HUB!';
});

/**2. DYNAMIC PRODUCT LOADING */
const loadDynamicProducts = async () => {
    try {
        const response = await fetch('php/get_products.php');
        const products = await response.json();

        const categories = {
            'Coffee': document.getElementById('coffee-list'),
            'Snack': document.getElementById('snack-list'),
            'Study Hub': document.getElementById('study-list'),
            'Wifi': document.getElementById('wifi-list'),
            'Printing': document.getElementById('printing-list'),
            'Amenities': document.getElementById('amenities-list'),
            'Lounge': document.getElementById('lounge-list')
        };

        // Clear existing items
        Object.values(categories).forEach(list => {
            if (list) list.innerHTML = '';
        });

        products.forEach(product => {
            const list = categories[product.category];
            if (list) {
                const li = document.createElement('li');
                li.className = `product-item ${product.is_available != 1 ? 'unavailable' : ''}`;
                const isAvail = product.is_available == 1;
                const isFoodOrDrink = product.category === 'Coffee' || product.category === 'Snack';
                const nameLower = product.name.toLowerCase();
                const catLower = product.category.toLowerCase();

                // Printing goes to cart, Charging station goes to booking
                const isPrint = catLower.includes('print') || nameLower.includes('print');
                const isCharging = nameLower.includes('charging');

                const showAddToCart = isFoodOrDrink || (isPrint && !isCharging);

                li.innerHTML = `
                    <img src="${product.image_path || 'assets/image/image.png'}" alt="${product.name}" style="${!isAvail ? 'filter: grayscale(1); opacity: 0.5;' : ''}">
                    <h3>${product.name} ${!isAvail ? '<span class="out-of-stock">(Not Available)</span>' : ''}</h3>
                    <p>${product.description || ''}</p>
                    <p class="price">₱${parseFloat(product.price).toFixed(2)}</p>
                    <button class="cart-btn" data-id="${product.id}">
                        <i class="fas ${showAddToCart ? 'fa-cart-plus' : 'fa-calendar-check'}"></i> 
                        ${isAvail ? (showAddToCart ? 'Add to Cart' : 'Book Now') : 'Not Available'}
                    </button>
                `;
                list.appendChild(li);

                // Show the parent category section
                list.closest('.menu-category').style.display = 'block';
            }
        });

        // Initialize Cart buttons after loading
        initCartButtons();

    } catch (error) {
        console.error('Error loading products:', error);
    }
};

/**3. SEARCH & FILTER LOGIC */
const searchInput = document.querySelector('.search-box input');
const searchButton = document.querySelector('.search-box button');

const performSearch = () => {
    const filter = searchInput.value.toLowerCase();
    const categories = document.querySelectorAll('.menu-category');

    categories.forEach(category => {
        const items = category.querySelectorAll('.product-item');
        let hasVisibleItems = false;

        items.forEach(item => {
            const title = item.querySelector('h3').innerText.toLowerCase();
            const desc = item.querySelector('p').innerText.toLowerCase();
            if (title.includes(filter) || desc.includes(filter)) {
                item.style.display = "flex";
                hasVisibleItems = true;
            } else {
                item.style.display = "none";
            }
        });

        // Only show category if it has matching items AND was originally active
        const hasProducts = category.querySelectorAll('.product-item').length > 0;
        if (hasProducts) {
            category.style.display = hasVisibleItems ? "block" : "none";
        }
    });
};

if (searchButton) searchButton.addEventListener('click', (e) => { e.preventDefault(); performSearch(); });
if (searchInput) searchInput.addEventListener('keyup', performSearch);

/**3. SCROLL TO TOP & BOTTOM BUTTONS & DARK MODE TOGGLE **/
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');

window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const fullHeight = document.body.offsetHeight;

    // Top Button Visibility
    if (scrollToTopBtn) {
        if (scrollTop > 300) {
            scrollToTopBtn.style.opacity = '1';
            scrollToTopBtn.style.pointerEvents = 'auto';
        } else {
            scrollToTopBtn.style.opacity = '0';
            scrollToTopBtn.style.pointerEvents = 'none';
        }
    }

    // Bottom Button Visibility (Hides near footer)
    if (scrollToBottomBtn) {
        if ((windowHeight + scrollTop) >= (fullHeight - 100)) {
            scrollToBottomBtn.style.opacity = '0';
            scrollToBottomBtn.style.pointerEvents = 'none';
        } else {
            scrollToBottomBtn.style.opacity = '1';
            scrollToBottomBtn.style.pointerEvents = 'auto';
        }
    }
});

if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

if (scrollToBottomBtn) {
    scrollToBottomBtn.addEventListener('click', () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
}

const darkModeToggle = document.querySelector('.dark-mode-toggle');
const body = document.body;

const setTheme = (theme) => {
    if (theme === 'dark') {
        body.setAttribute('data-theme', 'dark');
        if (darkModeToggle) {
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
        localStorage.setItem('theme', 'dark');
    } else {
        body.removeAttribute('data-theme');
        if (darkModeToggle) {
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
        localStorage.setItem('theme', 'light');
    }
};

if (localStorage.getItem('theme') === 'dark') setTheme('dark');

if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        const isDark = body.getAttribute('data-theme') === 'dark';
        setTheme(isDark ? 'light' : 'dark');
    });
}

/** 5. LIVE CLOCK & CALENDER **/
function updateDateTime() {
    const now = new Date();
    const clockElement = document.getElementById('liveClock');
    const dateElement = document.getElementById('calendar');

    // Time Update
    if (clockElement) {
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        clockElement.innerText = now.toLocaleTimeString('en-US', timeOptions);
    }

    // Date Update
    if (dateElement) {
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        dateElement.innerText = now.toLocaleDateString('en-US', dateOptions);
    }
}

// Run every second
setInterval(updateDateTime, 1000);
updateDateTime();
/** 6. SMOOTH SCROLL FOR ANCHOR LINKS **/
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', (event) => {
            const url = link.getAttribute('href');
            if (url && url.startsWith('#')) {
                event.preventDefault();
                const target = document.querySelector(url);
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
/* ==========================================================================
   CART SYSTEM LOGIC
   ========================================================================== */
function initCartButtons() {
    document.querySelectorAll('.cart-btn').forEach(button => {
        // Remove existing listeners to avoid doubles
        button.onclick = null;

        button.addEventListener('click', () => {
            const productItem = button.closest('.product-item');

            // Availability Check
            if (productItem.classList.contains('unavailable')) {
                alert('We are sorry, but this product/service is currently not available.');
                return;
            }

            const category = productItem.closest('.menu-category').id;
            const productName = productItem.querySelector('h3').textContent.replace('(Not Available)', '').trim();
            const nameLower = productName.toLowerCase();

            // LOGIC: 'Charging Room' or 'Charging Station' goes to booking
            // Other 'Printing' (B&W, Color) goes to cart
            const isCharging = nameLower.includes('charging');
            const isRoomType = category === 'study-category' || category === 'wifi-category' || category === 'amenities-category' || category === 'lounge-category' || isCharging;

            if (isRoomType) {
                // Redirect to booking page
                window.location.href = `book.html?type=${encodeURIComponent(productName)}`;
                return;
            }

            // Standard Product Logic (Add to Cart)
            const product = {
                id: button.dataset.id || Date.now(),
                name: productName,
                price: productItem.querySelector('.price').innerText.replace('₱', ''),
                image: productItem.querySelector('img').src,
                quantity: 1
            };

            addToCart(product);
        });
    });
}

function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('blj_cart')) || [];

    const existingItem = cart.find(item => item.name === product.name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push(product);
    }

    localStorage.setItem('blj_cart', JSON.stringify(cart));
    alert(`${product.name} added to cart!`);
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    loadDynamicProducts();
});

// Redirect to cart page when clicking the cart icon
const cartIcon = document.getElementById('cart');
if (cartIcon) {
    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'cart.html';
    });
}