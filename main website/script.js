
document.addEventListener('DOMContentLoaded', () => {

    /* ============================================================
     * SECTION 1: GLOBAL ELEMENT REFERENCES & CONSTANTS
     * ============================================================ */
// State for the Notification System
let notifications = [];

// State for the Message System
let messages = [];
let currentReplyingTo = null; // Used by the MessageSystem

// State for the Cart Management System (SECTION 7)
let cart = [];      // The main array holding cart item objects
let nextItemId = 1; // Counter to assign unique IDs to new cart items

    // Header & Navigation Elements
    const ELEMENTS = {
        // Dropdown Icons & Menus
        profileIcon: document.getElementById('profile-icon'),
        profileCard: document.getElementById('profile-card'),
        settingsIcon: document.getElementById('settings-icon'),
        settingsCard: document.querySelector('.settings-card'),
        mailIcon: document.getElementById('mail-icon'),
        mailMenu: document.querySelector('.mail-menu'),
        notificationIcon: document.getElementById('notification-icon'),
        notificationMenu: document.querySelector('.notification-menu'),
        
        // 🚀 FIXED CART ELEMENTS: NOW SELECTING THE DROPDOWN MENU STRUCTURE
        cartIcon: document.getElementById('cart-icon'),
        cartBadge: document.getElementById('cart-badge'),
        cartMenu: document.querySelector('.cart-menu'), // The dropdown container
        cartContent: document.getElementById('cart-content'), // The content area inside the menu
        clearCartBtn: document.getElementById('clear-cart'),
        cartTotalItems: document.getElementById('cart-total-items'),
        cartTotalPrice: document.getElementById('cart-total-price'),
        cartCheckoutBtn: document.getElementById('checkout-btn'),

        // Profile Management
        bioContainer: document.querySelector('.bio-container'),
        locationContainer: document.querySelector('.location-container'),

        // Search & Content
        searchInput: document.getElementById('searchInput'),
        searchButton: document.getElementById('searchButton'),
        mainContent: document.getElementById('mainContent'),

        // Notification & Message System
        mailBadge: document.getElementById('mail-badge'),
        notificationBadge: document.getElementById('notification-badge'),
        messagesContent: document.getElementById('messages-content'),
        notificationsContent: document.getElementById('notifications-content'),
        messageInputArea: document.querySelector('.message-input-area'),
        replyTextarea: document.getElementById('reply-textarea'),
        sendReplyBtn: document.getElementById('send-reply'),
        cancelReplyBtn: document.getElementById('cancel-reply'),
        clearMessagesBtn: document.getElementById('clear-messages'),
        clearNotificationsBtn: document.getElementById('clear-notifications'),
        markMessagesReadBtn: document.getElementById('mark-messages-read'),
        markNotificationsReadBtn: document.getElementById('mark-notifications-read'),

        // Theme Management
        darkModeToggleLink: document.querySelector('.settings-card a:has(i.fi-sr-brightness)')
    };

    /* ============================================================
     * SECTION 2: UTILITY FUNCTIONS & HELPERS
     * ============================================================ */

    /**
     * Theme Management Utilities
     */
    const ThemeManager = {
        toggle() {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            return isDarkMode;
        },

        applyInitial() {
            const storedTheme = localStorage.getItem('theme');
            if (storedTheme === 'dark') {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        }
    };

    /**
     * Dropdown Management Utilities
     */
    const DropdownManager = {
        hideOthers(activeCard) {
            const dropdowns = [
                ELEMENTS.profileCard, 
                ELEMENTS.settingsCard, 
                ELEMENTS.mailMenu, 
                ELEMENTS.notificationMenu,
                ELEMENTS.cartMenu // 👈 Added cart menu here
            ];
            
            dropdowns.forEach(dropdown => {
                // IMPORTANT: Use 'show' class for standard dropdowns
                if (dropdown && dropdown !== activeCard) {
                    dropdown.classList.remove('show');
                }
            });
        },

        handleDocumentClick(event) {
            const elementsToIgnore = [
                ELEMENTS.profileIcon, ELEMENTS.profileCard,
                ELEMENTS.settingsIcon, ELEMENTS.settingsCard,
                ELEMENTS.mailIcon, ELEMENTS.mailMenu,
                ELEMENTS.notificationIcon, ELEMENTS.notificationMenu,
                ELEMENTS.cartIcon, ELEMENTS.cartMenu // 👈 Added cart elements here
            ].filter(el => el);

            const isClickInside = elementsToIgnore.some(el => el.contains(event.target));

            if (!isClickInside) {
                this.hideOthers(null);
            }
        },

        setupToggle(icon, menu) {
            if (icon && menu) {
                console.log('Setting up dropdown for:', icon.id, menu.className);
                icon.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Dropdown clicked:', icon.id);
                    if (!menu.classList.contains('show')) {
                        this.hideOthers(menu);
                    }
                    // Toggles the 'show' class which controls visibility
                    menu.classList.toggle('show'); 
                    console.log('Menu show class:', menu.classList.contains('show'));
                });
            } else {
                console.warn('Missing elements for dropdown setup:', { icon, menu });
            }
        }
    };

    /**
     * Form Validation & Utilities
     */
    const FormUtils = {
        sanitizeInput(input) {
            return input.trim().replace(/[<>\"']/g, '');
        },

        formatTime() {
            return new Date().toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        },

        generateId(prefix = 'item') {
            return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    };

    /* ============================================================
     * SECTION 3: NOTIFICATION & MESSAGE SYSTEM (No changes needed)
     * ============================================================ */

    /**
     * Notification System
     */
    const NotificationSystem = {
        create(title, content, from = 'System') {
            return {
                id: FormUtils.generateId('notif'),
                title: FormUtils.sanitizeInput(title),
                content: FormUtils.sanitizeInput(content),
                from: FormUtils.sanitizeInput(from),
                time: FormUtils.formatTime(),
                read: false
            };
        },

        add(title, content, from = 'System') {
            const notification = this.create(title, content, from);
            notifications.unshift(notification);
            this.render();
        },

        createItemElement(notification) {
            const item = document.createElement('div');
            item.className = `notification-item ${notification.read ? '' : 'unread'}`;
            item.dataset.id = notification.id;

            item.innerHTML = `
                <div class="item-header">
                    <span class="item-title">${notification.title}</span>
                    <span class="item-time">${notification.time}</span>
                </div>
                <div class="item-content">${notification.content}</div>
                <div class="item-actions">
                    <button class="move-to-messages-btn" data-id="${notification.id}">Reply</button>
                </div>
            `;

            // Event Listeners
            item.querySelector('.move-to-messages-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                MessageSystem.moveFromNotification(notification.id);
            });

            item.addEventListener('click', () => {
                if (!notification.read) {
                    notification.read = true;
                    this.render();
                }
            });

            return item;
        },

        render() {
            if (!ELEMENTS.notificationsContent) return;
            
            if (notifications.length === 0) {
                ELEMENTS.notificationsContent.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-bell-slash"></i>
                        <p>No notifications yet</p>
                    </div>
                `;
            } else {
                ELEMENTS.notificationsContent.innerHTML = '';
                notifications.forEach(notification => {
                    ELEMENTS.notificationsContent.appendChild(
                        this.createItemElement(notification)
                    );
                });
            }
            
            const unreadCount = notifications.filter(n => !n.read).length;
            BadgeManager.update(ELEMENTS.notificationBadge, unreadCount);
        },

        markAllRead() {
            let markedCount = 0;
            notifications.forEach(item => {
                if (!item.read) {
                    item.read = true;
                    markedCount++;
                }
            });
            
            if (markedCount > 0) {
                this.render();
            }
            
            return markedCount;
        },

        clearAll() {
            notifications = [];
            this.render();
        }
    };

    /**
     * Message System
     */
    const MessageSystem = {
        create(from, content, isReply = false, originalNotificationId = null) {
            return {
                id: FormUtils.generateId('msg'),
                from: FormUtils.sanitizeInput(from),
                content: FormUtils.sanitizeInput(content),
                time: FormUtils.formatTime(),
                read: false,
                isReply: isReply,
                originalNotificationId: originalNotificationId
            };
        },

        createItemElement(message) {
            const item = document.createElement('div');
            item.className = `message-item ${message.read ? '' : 'unread'} ${message.isReply ? 'reply-out' : 'message-in'}`;
            item.dataset.id = message.id;

            item.innerHTML = `
                <div class="item-header">
                    <span class="item-title">${message.from}</span>
                    <span class="item-time">${message.time}</span>
                </div>
                <div class="item-content">${message.content}</div>
                <div class="item-actions">
                    <button class="reply-btn" data-id="${message.id}">Reply</button>
                </div>
            `;

            // Event Listeners
            item.querySelector('.reply-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.startReply(message.id);
            });

            item.addEventListener('click', () => {
                if (!message.read) {
                    message.read = true;
                    this.render();
                }
            });

            return item;
        },

        render() {
            if (!ELEMENTS.messagesContent) return;
            
            if (messages.length === 0) {
                ELEMENTS.messagesContent.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-inbox"></i>
                        <p>No messages yet</p>
                    </div>
                `;
            } else {
                ELEMENTS.messagesContent.innerHTML = '';
                messages.forEach(message => {
                    ELEMENTS.messagesContent.appendChild(
                        this.createItemElement(message)
                    );
                });
            }
            
            const unreadCount = messages.filter(m => !m.read).length;
            BadgeManager.update(ELEMENTS.mailBadge, unreadCount);
        },

        moveFromNotification(notificationId) {
            const notification = notifications.find(n => n.id === notificationId);
            if (!notification) return;

            const newMessage = this.create(
                notification.from || 'System',
                notification.content,
                false,
                notificationId
            );
            
            messages.unshift(newMessage);
            notifications = notifications.filter(n => n.id !== notificationId);
            
            NotificationSystem.render();
            this.render();
            
            // Switch to messages
            if (ELEMENTS.mailMenu) {
                DropdownManager.hideOthers(ELEMENTS.mailMenu);
                ELEMENTS.mailMenu.classList.add('show');
            }
        },

        startReply(messageId) {
            const message = messages.find(m => m.id === messageId);
            if (!message || !ELEMENTS.messageInputArea || !ELEMENTS.replyTextarea) return;

            currentReplyingTo = message;
            ELEMENTS.messageInputArea.style.display = 'block';
            ELEMENTS.replyTextarea.placeholder = `Reply to ${message.from}...`;
            ELEMENTS.replyTextarea.focus();
            
            if (!message.read) {
                message.read = true;
                this.render();
            }
        },

        sendReply() {
            const replyText = ELEMENTS.replyTextarea?.value.trim();
            if (!replyText || !currentReplyingTo) return;

            const replyMessage = this.create(
                'You',
                `Reply to "${currentReplyingTo.content.substring(0, 30)}...": ${replyText}`,
                true
            );
            replyMessage.read = true;
            
            messages.unshift(replyMessage);
            this.render();
            
            // Clear reply area
            ELEMENTS.replyTextarea.value = '';
            ELEMENTS.messageInputArea.style.display = 'none';
            
            const repliedToFrom = currentReplyingTo.from;
            currentReplyingTo = null;
            
            // Simulate response
            setTimeout(() => {
                NotificationSystem.add(
                    'Response Received',
                    `${repliedToFrom} replied to your message`,
                    repliedToFrom
                );
            }, 2000);
        },

        cancelReply() {
            if (ELEMENTS.replyTextarea && ELEMENTS.messageInputArea) {
                ELEMENTS.replyTextarea.value = '';
                ELEMENTS.messageInputArea.style.display = 'none';
                currentReplyingTo = null;
            }
        },

        markAllRead() {
            let markedCount = 0;
            messages.forEach(item => {
                if (!item.read) {
                    item.read = true;
                    markedCount++;
                }
            });
            
            if (markedCount > 0) {
                this.render();
            }
            
            return markedCount;
        },

        clearAll() {
            messages = [];
            this.render();
            if (ELEMENTS.messageInputArea) ELEMENTS.messageInputArea.style.display = 'none';
            currentReplyingTo = null;
        }
    };

    /* ============================================================
     * SECTION 4: PROFILE MANAGEMENT SYSTEM (No changes needed)
     * ============================================================ */

    /**
     * Bio Management
     */
    const BioManager = {
        init() {
            if (!ELEMENTS.bioContainer) return;

            const editBtn = ELEMENTS.bioContainer.querySelector('.edit-bio-btn');
            const saveBtn = ELEMENTS.bioContainer.querySelector('.save-btn');
            const cancelBtn = ELEMENTS.bioContainer.querySelector('.cancel-btn');
            const bioTextDisplay = ELEMENTS.bioContainer.querySelector('.bio-display-state .bio-text');
            const bioTextarea = ELEMENTS.bioContainer.querySelector('.bio-edit-form textarea');

            if (!editBtn || !saveBtn || !cancelBtn || !bioTextDisplay || !bioTextarea) return;

            // Event Listeners
            editBtn.addEventListener('click', () => this.toggleEditMode(true, bioTextDisplay, bioTextarea));
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleEditMode(false);
            });
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveBio(bioTextarea, bioTextDisplay);
            });
        },

        toggleEditMode(isActive, bioTextDisplay = null, bioTextarea = null) {
            if (isActive) {
                ELEMENTS.bioContainer.classList.add('edit-active');
                if (bioTextarea && bioTextDisplay) {
                    bioTextarea.value = bioTextDisplay.textContent.trim();
                    bioTextarea.focus();
                }
            } else {
                ELEMENTS.bioContainer.classList.remove('edit-active');
            }
        },

        saveBio(bioTextarea, bioTextDisplay) {
            const newBio = FormUtils.sanitizeInput(bioTextarea.value);
            bioTextDisplay.textContent = newBio || "No bio set.";
            this.toggleEditMode(false);
        }
    };

    /**
     * Location Management
     */
    const LocationManager = {
        init() {
            if (!ELEMENTS.locationContainer) return;

            const editLocationBtn = document.getElementById('edit-location-btn');
            const locationInput = document.getElementById('location-input');
            const saveLocationBtn = document.getElementById('save-location-btn');
            const currentLocationDisplay = document.getElementById('current-location-display');

            if (!editLocationBtn || !locationInput || !saveLocationBtn || !currentLocationDisplay) return;

            // Event Listeners
            editLocationBtn.addEventListener('click', () => 
                this.toggleEditMode(true, locationInput, currentLocationDisplay)
            );
            saveLocationBtn.addEventListener('click', () => 
                this.saveLocation(locationInput, currentLocationDisplay)
            );
            ELEMENTS.locationContainer.addEventListener('click', (e) => e.stopPropagation());
        },

        toggleEditMode(isActive, locationInput = null, currentLocationDisplay = null) {
            if (isActive) {
                ELEMENTS.locationContainer.classList.add('active');
                if (locationInput && currentLocationDisplay) {
                    const displayedText = currentLocationDisplay.textContent;
                    const locationValue = displayedText.startsWith('Location:')
                        ? displayedText.replace('Location:', '').trim()
                        : displayedText.trim();

                    locationInput.value = locationValue === 'Not set' ? '' : locationValue;
                    locationInput.focus();
                }
            } else {
                ELEMENTS.locationContainer.classList.remove('active');
            }
        },

        saveLocation(locationInput, currentLocationDisplay) {
            const newLocation = FormUtils.sanitizeInput(locationInput.value);
            currentLocationDisplay.textContent = `Location: ${newLocation || 'Not set'}`;
            this.toggleEditMode(false);
        }
    };

    /* ============================================================
     * SECTION 5: SEARCH & FILTER SYSTEM (No changes needed)
     * ============================================================ */

    const SearchSystem = {
        filterCards(term) {
            const menuItems = document.querySelectorAll('.coffee-menu-section li, .study-hub-section li');
            let matchesFound = 0;

            menuItems.forEach(item => {
                const itemText = item.textContent.toLowerCase();
                const itemMatch = term && itemText.includes(term);

                if (term === null || itemMatch) {
                    item.style.display = 'flex';
                    if (itemMatch) matchesFound++;
                } else {
                    item.style.display = 'none';
                }
            });

            const contentCards = document.querySelectorAll('.coffee-menu-section form, .study-hub-section form');
            contentCards.forEach(card => {
                const visibleItems = card.querySelectorAll('li[style*="flex"]').length;
                card.style.display = (term === null || visibleItems > 0) ? 'flex' : 'none';
            });

            this.updateResults(term, matchesFound);
        },

        updateResults(term, matchesFound) {
            let searchResultsDiv = document.getElementById('searchResults');
            
            if (!searchResultsDiv) {
                searchResultsDiv = document.createElement('div');
                searchResultsDiv.id = 'searchResults';
                ELEMENTS.mainContent?.prepend(searchResultsDiv);
            }

            if (term) {
                searchResultsDiv.innerHTML = `
                    <p class="search-message">Found <strong>${matchesFound}</strong> matching item(s) for "${term}".</p>
                `;
            } else {
                searchResultsDiv.innerHTML = '';
            }
        },

        perform() {
            if (!ELEMENTS.searchInput || !ELEMENTS.mainContent) {
                console.error('Search elements not found!');
                return;
            }

            const searchTerm = ELEMENTS.searchInput.value.toLowerCase().trim();

            if (searchTerm === "") {
                this.updateResults(null, 0);
                this.filterCards(null);
                return;
            }

            this.filterCards(searchTerm);
            
            const searchResultsDiv = document.getElementById('searchResults');
            searchResultsDiv?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },

        init() {
            if (!ELEMENTS.searchButton || !ELEMENTS.searchInput) {
                console.error('Search elements not found in DOM!');
                return;
            }

            ELEMENTS.searchButton.addEventListener('click', () => this.perform());
            ELEMENTS.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.perform();
                }
            });
        }
    };

   /* ============================================================
 * SECTION 8: BADGE MANAGEMENT SYSTEM 🏷️ (CRITICAL FOR BADGE FUNCTIONALITY)
 * ============================================================ */

const BadgeManager = {
    /**
     * Updates the text content of a badge element and controls its visibility.
     * This is the function responsible for making the number "pop up."
     * @param {HTMLElement} element - The badge element (ELEMENTS.cartBadge).
     * @param {number} count - The new count to display.
     */
    update(element, count) {
        if (!element) return; // Safely exit if element is not found

        const countValue = parseInt(count);

        if (countValue > 0) {
            element.textContent = countValue;
            element.style.display = 'block'; // Make the badge visible
        } else {
            element.textContent = '0';
            element.style.display = 'none'; // Hide the badge when the count is zero
        }
    }
};

/* ============================================================
 * SECTION 7: CART MANAGEMENT SYSTEM 🛒 (NEW)
 * ============================================================ */

const CartSystem = {
    addItem(name, price) {
        const priceValue = parseFloat(price);
        if (isNaN(priceValue)) return;

        const existingItem = cart.find(item => item.name === name);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: nextItemId++,
                name: name,
                price: priceValue,
                quantity: 1
            });
        }
        this.render();
    },
    
    removeItem(itemId) {
        cart = cart.filter(item => item.id !== itemId);
        this.render();
    },

    clear() {
        cart = [];
        this.render();
    },

    calculateTotal() {
        let totalItems = 0;
        let totalPrice = 0.0;
        
        cart.forEach(item => {
            totalItems += item.quantity;
            totalPrice += item.price * item.quantity;
        });

        return { totalItems, totalPrice };
    },

    render() {
        if (!ELEMENTS.cartContent || !ELEMENTS.cartTotalItems || !ELEMENTS.cartTotalPrice) return;

        const { totalItems, totalPrice } = this.calculateTotal();

        // Update badges and total display
        BadgeManager.update(ELEMENTS.cartBadge, totalItems); // Now functional!
        ELEMENTS.cartTotalItems.textContent = totalItems;
        ELEMENTS.cartTotalPrice.textContent = `$${totalPrice.toFixed(2)}`;

        if (cart.length === 0) {
            // Render empty state
            ELEMENTS.cartContent.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-mug-hot"></i>
                    <p>Your cart is empty. Time for coffee!</p>
                </div>
            `;
        } else {
            // Render item list
            ELEMENTS.cartContent.innerHTML = '';
            const cartList = document.createElement('ul');
            cartList.className = 'cart-item-list';

            cart.forEach(item => {
                const listItem = document.createElement('li');
                listItem.className = 'cart-item';
                listItem.innerHTML = `
                    <span class="item-name">${item.name} (x${item.quantity})</span>
                    <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                    <button class="remove-item-btn" data-id="${item.id}">X</button>
                `;
                
                listItem.querySelector('.remove-item-btn').addEventListener('click', () => {
                    this.removeItem(item.id);
                });
                
                cartList.appendChild(listItem);
            });
            ELEMENTS.cartContent.appendChild(cartList);
        }
    },

    setupAddButtons() {
        // Find all 'Add to Cart' buttons in the menu
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                const itemElement = e.target.closest('li');
                const itemName = itemElement.querySelector('.item-name')?.textContent.trim();
                const itemPriceText = itemElement.querySelector('.item-price')?.textContent.trim();
                
                // Basic parsing (assuming price is like '$X.XX')
                const itemPrice = itemPriceText ? itemPriceText.replace('$', '') : '0';
                
                if (itemName && itemPrice) {
                    this.addItem(itemName, itemPrice);
                    // Optional: close the cart menu after adding an item
                    ELEMENTS.cartMenu?.classList.remove('show'); 
                }
            });
        });
    },

    init() {
        // Setup the main dropdown toggle
        DropdownManager.setupToggle(ELEMENTS.cartIcon, ELEMENTS.cartMenu);
        
        // Setup internal buttons
        ELEMENTS.clearCartBtn?.addEventListener('click', () => this.clear());
        ELEMENTS.cartCheckoutBtn?.addEventListener('click', () => {
            alert('Proceeding to checkout with ' + this.calculateTotal().totalItems + ' items!');
            // In a real app, you'd navigate here
        });
        
        // Setup item adding logic from the menu cards

        
        // Initial render
        this.render();
    }
};


/* ============================================================
 * SECTION 6: EVENT LISTENERS & INITIALIZATION
 * ============================================================ */

/**
 * Initialize All Systems
 */
const AppInitializer = {
    setupDropdowns() {
        // Setup all dropdown toggles
        DropdownManager.setupToggle(ELEMENTS.profileIcon, ELEMENTS.profileCard);
        DropdownManager.setupToggle(ELEMENTS.settingsIcon, ELEMENTS.settingsCard);
        DropdownManager.setupToggle(ELEMENTS.mailIcon, ELEMENTS.mailMenu);
        DropdownManager.setupToggle(ELEMENTS.notificationIcon, ELEMENTS.notificationMenu);
        // The CartSystem.init() function sets up the cart toggle.

        // Document click handler
        document.addEventListener('click', (event) => 
            DropdownManager.handleDocumentClick(event)
        );
    },

    setupTheme() {
        // Apply initial theme
        ThemeManager.applyInitial();

        // Theme toggle listener
        if (ELEMENTS.darkModeToggleLink) {
            ELEMENTS.darkModeToggleLink.addEventListener('click', (e) => {
                e.preventDefault();
                ThemeManager.toggle();
                if (ELEMENTS.settingsCard) {
                    ELEMENTS.settingsCard.classList.remove('show');
                }
            });
        }
    },

    setupMessageSystem() {
        // Message system listeners
        if (ELEMENTS.sendReplyBtn) {
            ELEMENTS.sendReplyBtn.addEventListener('click', () => MessageSystem.sendReply());
        }
        
        if (ELEMENTS.cancelReplyBtn) {
            ELEMENTS.cancelReplyBtn.addEventListener('click', () => MessageSystem.cancelReply());
        }
        
        if (ELEMENTS.clearMessagesBtn) {
            ELEMENTS.clearMessagesBtn.addEventListener('click', () => MessageSystem.clearAll());
        }
        
        if (ELEMENTS.clearNotificationsBtn) {
            ELEMENTS.clearNotificationsBtn.addEventListener('click', () => NotificationSystem.clearAll());
        }

        // Mark all read listeners with stopPropagation
        if (ELEMENTS.markMessagesReadBtn) {
            ELEMENTS.markMessagesReadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                MessageSystem.markAllRead();
            });
        }

        if (ELEMENTS.markNotificationsReadBtn) {
            ELEMENTS.markNotificationsReadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                NotificationSystem.markAllRead();
            });
        }
    },

    loadSampleData() {
        // 1. Initialize with sample notifications
        setTimeout(() => {
            NotificationSystem.add('New Order', 'Customer John ordered 2 Cappuccinos', 'John Doe');
            NotificationSystem.add('Table Request', 'Table 5 needs assistance', 'Table 5');
            NotificationSystem.add('Announcement', 'The new seasonal menu is live!', 'Admin');
            NotificationSystem.render(); 
        }, 500);
        
        // 2. Add a sample item to the cart state for initial testing
        cart.push({
            id: nextItemId++,
            name: "Espresso",
            price: 2.50,
            quantity: 1
        });
    },
    
    // Main initialization function
    init() {
        this.setupTheme();
        this.setupDropdowns();
        this.setupMessageSystem();
        SearchSystem.init();      // Initialize Search (SECTION 5)
        BioManager.init();        // Initialize Bio (SECTION 4)
        LocationManager.init();   // Initialize Location (SECTION 4)
        CartSystem.init();        // Initialize Cart System (SECTION 7)
        CartSystem.setupAddButtons(); // Set up menu buttons to add to cart
        this.loadSampleData();
    }
};

// Final execution block
AppInitializer.init();

}); // End of document.addEventListener('DOMContentLoaded', ...)