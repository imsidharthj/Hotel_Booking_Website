// Navigation functions
function goToHome() {
    showPageLoader();
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

function goToLogin() {
    showPageLoader();
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 500);
}

function goToContact() {
    showPageLoader();
    setTimeout(() => {
        window.location.href = 'contact.html';
    }, 500);
}

function goToList() {
    showPageLoader();
    setTimeout(() => {
        window.location.href = 'list.html';
    }, 500);
}

// Additional navigation functions for index.js compatibility
function goToCityHotels(cityName) {
    showPageLoader();
    sessionStorage.setItem('selectedCity', cityName);
    setTimeout(() => {
        window.location.href = `list.html?city=${cityName}`;
    }, 500);
}

function goToHotelDetail(hotelId) {
    showPageLoader();
    setTimeout(() => {
        window.location.href = `detail.html?hotel=${hotelId}`;
    }, 500);
}

function goToHotelsList() {
    showPageLoader();
    setTimeout(() => {
        window.location.href = 'list.html';
    }, 500);
}

// Mobile detection and handling
function isMobileDevice() {
    return window.innerWidth <= 768;
}

function isSmallMobile() {
    return window.innerWidth <= 480;
}

// Touch event handling for mobile
function setupMobileInteractions() {
    if (isMobileDevice()) {
        // Add touch-friendly interactions
        document.body.classList.add('mobile-device');
        
        // Improve button interactions for mobile
        const buttons = document.querySelectorAll('button, .btn, .login-btn, .submit-btn');
        buttons.forEach(button => {
            button.style.minHeight = '44px'; // iOS recommended touch target
            button.style.minWidth = '44px';
        });
        
        // Add mobile-specific styles
        addMobileStyles();
    }
}

// Mobile-specific styles
function addMobileStyles() {
    const mobileStyle = document.createElement('style');
    mobileStyle.textContent = `
        .mobile-device {
            -webkit-tap-highlight-color: rgba(0,0,0,0);
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        }
        
        .mobile-device input,
        .mobile-device textarea,
        .mobile-device select {
            -webkit-user-select: text;
            user-select: text;
        }
        
        @media (max-width: 768px) {
            .mobile-device .header {
                position: sticky;
                top: 0;
                z-index: 1000;
            }
            
            .mobile-device .notification {
                top: 10px !important;
                right: 10px !important;
                left: 10px !important;
                min-width: auto !important;
                max-width: none !important;
            }
            
            .mobile-device .modal,
            .mobile-device .popup {
                margin: 10px;
                max-width: calc(100vw - 20px);
            }
        }
        
        @media (max-width: 480px) {
            .mobile-device .notification {
                font-size: 0.9rem;
            }
            
            .mobile-device .notification-content {
                padding: 12px 15px;
            }
        }
    `;
    document.head.appendChild(mobileStyle);
}

// Responsive image loading
function setupResponsiveImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        img.addEventListener('error', function() {
            this.style.opacity = '0.5';
            this.alt = 'Image failed to load';
        });
    });
}

// Mobile viewport handling
function handleViewportChanges() {
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
}

// Search functionality (common across pages)
function setupCommonSearch() {
    const searchInput = document.querySelector('.search-input, .hero-search-input');
    
    if (searchInput) {
        // Mobile-specific search enhancements
        if (isMobileDevice()) {
            searchInput.setAttribute('autocomplete', 'off');
            searchInput.setAttribute('autocorrect', 'off');
            searchInput.setAttribute('autocapitalize', 'off');
            searchInput.setAttribute('spellcheck', 'false');
        }
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    window.location.href = `list.html?search=${encodeURIComponent(searchTerm)}`;
                }
            }
        });
        
        // Add search icon for mobile
        if (isMobileDevice() && !searchInput.nextElementSibling?.classList.contains('search-icon')) {
            const searchIcon = document.createElement('span');
            searchIcon.className = 'search-icon';
            searchIcon.innerHTML = '🔍';
            searchIcon.style.cssText = `
                position: absolute;
                right: 15px;
                top: 50%;
                transform: translateY(-50%);
                pointer-events: none;
                font-size: 1.2rem;
            `;
            
            const container = searchInput.parentElement;
            container.style.position = 'relative';
            container.appendChild(searchIcon);
        }
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
    
    // Mobile-responsive positioning
    const isMobile = isMobileDevice();
    notification.style.cssText = `
        position: fixed;
        ${isMobile ? 'top: 10px; right: 10px; left: 10px;' : 'top: 20px; right: 20px;'}
        z-index: 10000;
        ${isMobile ? 'min-width: auto; max-width: none;' : 'min-width: 300px; max-width: 500px;'}
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
        font-family: Arial, sans-serif;
        font-size: ${isMobile ? '0.9rem' : '1rem'};
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
    
    // Auto remove after duration (shorter on mobile)
    const actualDuration = isMobile ? Math.min(duration, 3000) : duration;
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, actualDuration);
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
function toggleToSignup(setHash = true) {
    const loginBox = document.querySelector('.login-box');
    const signupBox = document.getElementById('signupBox');
    
    if (loginBox && signupBox) {
        loginBox.style.display = 'none';
        signupBox.style.display = 'block';
        if (setHash) {
            window.location.hash = 'signup';
        }
    }
}

function toggleToLogin(setHash = true) {
    const loginBox = document.querySelector('.login-box');
    const signupBox = document.getElementById('signupBox');
    
    if (loginBox && signupBox) {
        loginBox.style.display = 'block';
        signupBox.style.display = 'none';
        if (setHash) {
            window.location.hash = 'login';
        }
    }
}

// Function to handle view based on URL hash
function handleLoginSignupView() {
    const loginBox = document.querySelector('.login-box');
    const signupBox = document.getElementById('signupBox');

    // Only proceed if login/signup boxes are on the current page
    if (loginBox && signupBox) {
        if (window.location.hash === '#signup') {
            toggleToSignup(false); // Show signup form, don't update hash again
        } else {
            // Default to login view if hash is #login, empty, or anything else
            toggleToLogin(false); // Show login form, don't update hash again
        }
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

// Enhanced login status check with better UI updates
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userEmail = sessionStorage.getItem('userEmail');
    const loginTitle = document.querySelector('.login-title');
    
    if (isLoggedIn === 'true' && userEmail && loginTitle) {
        const userName = userEmail.split('@')[0];
        loginTitle.textContent = `Welcome, ${userName}`;
        loginTitle.classList.add('logged-in');
        loginTitle.onclick = handleLogout;
        
        // Update title attribute for better UX
        loginTitle.title = 'Click to logout';
    } else if (loginTitle) {
        // Ensure login functionality is maintained for non-logged-in users
        loginTitle.textContent = 'Login';
        loginTitle.classList.remove('logged-in');
        loginTitle.onclick = goToLogin;
        loginTitle.title = 'Click to login';
    }
}

// Separate logout handler for better code organization
function handleLogout() {
    if (confirm('Do you want to logout?')) {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('userEmail');
        sessionStorage.removeItem('selectedCity');
        sessionStorage.removeItem('searchTerm');
        
        showNotification('Logged out successfully', 'success');
        
        setTimeout(() => {
            // Refresh the page to update UI
            window.location.reload();
        }, 1000);
    }
}

// Loading animation functionality
let loadingOverlay = null;

function createLoadingOverlay() {
    if (loadingOverlay) return loadingOverlay;
    
    loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'page-loader-overlay';
    loadingOverlay.innerHTML = `
        <div class="page-loader-container">
            <div class="page-loader-spinner">
                <div class="spinner-ring"></div>
                <div class="loader-icon">🏨</div>
            </div>
            <div class="page-loading-text">Loading...</div>
        </div>
    `;
    
    // Add styles
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #bb8d8c, #a67b7a);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(loadingOverlay);
    return loadingOverlay;
}

function showPageLoader() {
    const overlay = createLoadingOverlay();
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
}

function hidePageLoader() {
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        loadingOverlay.style.visibility = 'hidden';
    }
}

// Template loading functionality
async function loadTemplate(templateName) {
    try {
        const response = await fetch('index.html');
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        
        if (templateName === 'header') {
            return doc.querySelector('.header').outerHTML;
        } else if (templateName === 'footer') {
            return doc.querySelector('.footer').outerHTML;
        }
    } catch (error) {
        console.error(`Error loading ${templateName} template:`, error);
        return null;
    }
}

async function loadHeaderTemplate() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        const headerHTML = await loadTemplate('header');
        if (headerHTML) {
            headerPlaceholder.outerHTML = headerHTML;
            
            // Re-initialize header functionality
            setTimeout(() => {
                checkLoginStatus();
                setupHeaderEvents();
            }, 100);
        }
    }
}

async function loadFooterTemplate() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        const footerHTML = await loadTemplate('footer');
        if (footerHTML) {
            footerPlaceholder.outerHTML = footerHTML;
            setupFooterEvents();
        }
    }
}

function setupHeaderEvents() {
    const logo = document.querySelector('.logo');
    const loginTitle = document.querySelector('.login-title');
    
    if (logo) {
        logo.onclick = goToHome;
    }
    
    if (loginTitle && !loginTitle.onclick) {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        if (isLoggedIn === 'true') {
            loginTitle.onclick = handleLogout;
        } else {
            loginTitle.onclick = goToLogin;
        }
    }
}

function setupFooterEvents() {
    const contactBtn = document.querySelector('.contact');
    if (contactBtn) {
        contactBtn.onclick = goToContact;
    }
}

async function loadAllTemplates() {
    await Promise.all([
        loadHeaderTemplate(),
        loadFooterTemplate()
    ]);
}

// Initialize common functionality with template loading
function initializeCommonFeatures() {
    handleViewportChanges();
    setupMobileInteractions();
    setupResponsiveImages();
    
    // Load templates first, then initialize other features
    loadAllTemplates().then(() => {
        setupCommonSearch();
        setupContactForm();
        setupLoginForm();
        setupSignupForm();
        
        // Handle login/signup view based on hash
        handleLoginSignupView();
        
        // Check login status after templates are loaded
        setTimeout(() => {
            checkLoginStatus();
        }, 200);
    });
    
    // Add CSS animations and loading styles
    addCommonStyles();
    
    // Create loading overlay
    createLoadingOverlay();
    
    // Hide page loader when page is fully loaded
    window.addEventListener('load', () => {
        hidePageLoader();
    });
    
    // Show loader when page is about to unload
    window.addEventListener('beforeunload', () => {
        showPageLoader();
    });
    
    // Mobile-specific initialization
    window.addEventListener('resize', function() {
        if (isMobileDevice()) {
            document.body.classList.add('mobile-device');
        } else {
            document.body.classList.remove('mobile-device');
        }
    });
    
    console.log('Common features initialized with template loading support');
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
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.1); }
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
        
        /* Page Loader Styles */
        .page-loader-container {
            text-align: center;
            color: white;
        }
        
        .page-loader-spinner {
            width: 60px;
            height: 60px;
            margin: 0 auto 1rem;
            position: relative;
        }
        
        .page-loader-spinner .spinner-ring {
            width: 60px;
            height: 60px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        .page-loader-spinner .loader-icon {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 1.5rem;
            animation: pulse 2s ease-in-out infinite;
        }
        
        .page-loading-text {
            font-size: 1.1rem;
            font-weight: 600;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        @media (max-width: 768px) {
            .page-loader-spinner {
                width: 50px;
                height: 50px;
            }
            
            .page-loader-spinner .spinner-ring {
                width: 50px;
                height: 50px;
            }
            
            .page-loader-spinner .loader-icon {
                font-size: 1.2rem;
            }
            
            .page-loading-text {
                font-size: 1rem;
            }
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
    goToCityHotels,
    goToHotelDetail,
    goToHotelsList,
    showNotification,
    validateEmail,
    validatePassword,
    validatePhone,
    togglePassword,
    socialLogin,
    toggleToSignup,
    toggleToLogin,
    checkLoginStatus,
    handleLogout,
    showPageLoader,
    hidePageLoader
};
