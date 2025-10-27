/**
 * Authentication Management System
 * BLJ Study Hub & Cafe
 */

// Authentication state management
const Auth = {
    // Check if user is authenticated
    isAuthenticated: function() {
        return localStorage.getItem('isAuthenticated') === 'true' || 
               sessionStorage.getItem('isAuthenticated') === 'true';
    },

    // Check if user is admin
    isAdmin: function() {
        return localStorage.getItem('isAdmin') === 'true';
    },

    // Get current username
    getUsername: function() {
        return localStorage.getItem('username') || 
               sessionStorage.getItem('username') || 
               'Guest';
    },

    // Sign in user
    signIn: function(username, password, rememberMe = false) {
        // In production, this should validate against a backend
        if (username && password) {
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('isAuthenticated', 'true');
            storage.setItem('username', username);
            return true;
        }
        return false;
    },

    // Sign out user
    signOut: function() {
        // Clear all authentication data
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('username');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminUsername');
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('username');
        
        // Clear cart data
        localStorage.removeItem('cart');
        sessionStorage.removeItem('cart');
    },

    // Require authentication (redirect if not authenticated)
    requireAuth: function(redirectUrl = 'signin.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    },

    // Require admin access
    requireAdmin: function(redirectUrl = 'homepage.html') {
        if (!this.isAdmin()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    },

    // Initialize authentication check on page load
    init: function(requireAuth = false, requireAdmin = false) {
        if (requireAdmin && !this.requireAdmin()) {
            return;
        }
        if (requireAuth && !this.requireAuth()) {
            return;
        }
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}