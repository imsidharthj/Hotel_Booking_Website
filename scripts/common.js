// Navigation functions
function goToHome() {
    window.location.href = 'index.html';
}

function goToLogin() {
    window.location.href = 'login.html';
}

function goToContact() {
    window.location.href = 'contact.html';
}

function goToList() {
    window.location.href = 'list.html';
}

// Search functionality (common across pages)
function setupCommonSearch() {
    const searchInput = document.querySelector('.search-input');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    window.location.href = `list.html?search=${encodeURIComponent(searchTerm)}`;
                }
            }
        });
    }
}

// Alert/Notification system
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        min-width: 300px;
        max-width: 500px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
        font-family: Arial, sans-serif;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.style.color = 'white';
    
    document.body.appendChild(notification);
    
    // Auto remove after duration
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

function getNotificationIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

// Form validation utilities
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

function validatePhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Contact form functionality
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Validate required fields
            if (!data.fullName || !data.email || !data.subject || !data.message) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            // Validate email
            if (!validateEmail(data.email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Validate phone if provided
            if (data.phone && !validatePhone(data.phone)) {
                showNotification('Please enter a valid phone number', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span>Sending...</span><span class="btn-icon">⏳</span>';
            submitBtn.disabled = true;
            
            // Simulate form submission
            setTimeout(() => {
                showNotification('Thank you for your message! We will get back to you soon.', 'success');
                contactForm.reset();
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
}

// Login form functionality
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Validate fields
            if (!data.email || !data.password) {
                showNotification('Please enter both email and password', 'error');
                return;
            }
            
            if (!validateEmail(data.email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Show loading state
            const loginBtn = loginForm.querySelector('.login-btn');
            const originalText = loginBtn.innerHTML;
            loginBtn.innerHTML = '<span>Signing In...</span><span class="btn-icon">⏳</span>';
            loginBtn.disabled = true;
            
            // Simulate login
            setTimeout(() => {
                // Store user session (in real app, this would be handled by backend)
                sessionStorage.setItem('userEmail', data.email);
                sessionStorage.setItem('isLoggedIn', 'true');
                
                showNotification('Login successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }, 2000);
        });
    }
}

// Signup form functionality
function setupSignupForm() {
    const signupForm = document.getElementById('signupForm');
    
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Validate required fields
            if (!data.firstName || !data.lastName || !data.email || !data.password || !data.confirmPassword) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            // Validate email
            if (!validateEmail(data.email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Validate password
            if (!validatePassword(data.password)) {
                showNotification('Password must be at least 8 characters with uppercase, lowercase, and number', 'error');
                return;
            }
            
            // Check password confirmation
            if (data.password !== data.confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            // Check terms agreement
            if (!document.getElementById('agreeTerms').checked) {
                showNotification('Please agree to the Terms of Service and Privacy Policy', 'error');
                return;
            }
            
            // Show loading state
            const signupBtn = signupForm.querySelector('.login-btn');
            const originalText = signupBtn.innerHTML;
            signupBtn.innerHTML = '<span>Creating Account...</span><span class="btn-icon">⏳</span>';
            signupBtn.disabled = true;
            
            // Simulate signup
            setTimeout(() => {
                showNotification('Account created successfully! Please sign in.', 'success');
                
                // Switch to login form
                toggleToLogin();
                
                // Pre-fill email
                document.getElementById('loginEmail').value = data.email;
                
                // Reset signup form
                signupForm.reset();
                signupBtn.innerHTML = originalText;
                signupBtn.disabled = false;
            }, 2000);
        });
    }
}

// Login/Signup toggle functionality
function toggleToSignup() {
    const loginBox = document.querySelector('.login-box');
    const signupBox = document.getElementById('signupBox');
    
    if (loginBox && signupBox) {
        loginBox.style.display = 'none';
        signupBox.style.display = 'block';
    }
}

function toggleToLogin() {
    const loginBox = document.querySelector('.login-box');
    const signupBox = document.getElementById('signupBox');
    
    if (loginBox && signupBox) {
        loginBox.style.display = 'block';
        signupBox.style.display = 'none';
    }
}

// Password visibility toggle
function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    const toggleBtn = passwordInput.nextElementSibling.nextElementSibling;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}

// Social login functionality
function socialLogin(provider) {
    showNotification(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login would be implemented here`, 'info');
    
    // In a real application, this would redirect to OAuth providers
    setTimeout(() => {
        showNotification('Social login feature coming soon!', 'warning');
    }, 1500);
}

// Check if user is logged in and update UI
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userEmail = sessionStorage.getItem('userEmail');
    const loginTitle = document.querySelector('.login-title');
    
    if (isLoggedIn === 'true' && userEmail && loginTitle) {
        loginTitle.textContent = `Welcome, ${userEmail.split('@')[0]}`;
        loginTitle.style.cursor = 'pointer';
        
        // Add logout functionality
        loginTitle.addEventListener('click', function() {
            if (confirm('Do you want to logout?')) {
                sessionStorage.removeItem('isLoggedIn');
                sessionStorage.removeItem('userEmail');
                showNotification('Logged out successfully', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        });
    }
}

// Initialize common functionality
function initializeCommonFeatures() {
    setupCommonSearch();
    setupContactForm();
    setupLoginForm();
    setupSignupForm();
    checkLoginStatus();
    
    // Add CSS animations
    addCommonStyles();
    
    console.log('Common features initialized');
}

// Add common CSS styles
function addCommonStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 15px 20px;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            margin-left: auto;
        }
        
        .login-title.active {
            color: #3498db !important;
            border-bottom: 2px solid #3498db;
        }
    `;
    document.head.appendChild(style);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCommonFeatures();
});

// Export functions for global use
window.commonUtils = {
    goToHome,
    goToLogin,
    goToContact,
    goToList,
    showNotification,
    validateEmail,
    validatePassword,
    validatePhone,
    togglePassword,
    socialLogin,
    toggleToSignup,
    toggleToLogin
};
