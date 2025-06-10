// Hotel data storage
let currentHotelData = {
    name: 'Radisson Blu Hotel',
    location: 'New Delhi, India',
    rating: 4.2,
    reviewCount: 1250,
    basePrice: 8500,
    images: [
        'https://media-cdn.tripadvisor.com/media/photo-w/17/b3/09/b4/by-the-poolside.jpg',
        'https://media-cdn.tripadvisor.com/media/photo-o/01/fa/51/70/r-the-spa.jpg',
        'https://media-cdn.tripadvisor.com/media/photo-w/0e/b2/64/3f/radisson-blu-plaza-delhi.jpg',
        'https://media-cdn.tripadvisor.com/media/photo-w/15/06/31/5f/facade.jpg'
    ]
};

// Image gallery functionality
function changeMainImage(thumbnail) {
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    // Remove active class from all thumbnails
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    
    // Add active class to clicked thumbnail
    thumbnail.classList.add('active');
    
    // Change main image source with smooth transition
    mainImage.style.opacity = '0.5';
    
    setTimeout(() => {
        mainImage.src = thumbnail.src;
        mainImage.alt = thumbnail.alt;
        mainImage.style.opacity = '1';
    }, 200);
}

// Price calculation functionality
function calculateTotal() {
    const checkin = document.getElementById('checkin').value;
    const checkout = document.getElementById('checkout').value;
    const roomtype = document.getElementById('roomtype').value;
    
    if (checkin && checkout) {
        const checkinDate = new Date(checkin);
        const checkoutDate = new Date(checkout);
        const timeDiff = checkoutDate.getTime() - checkinDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (daysDiff <= 0) {
            document.querySelector('.total-price span').textContent = 'Invalid date range';
            return;
        }
        
        let pricePerNight = 8500;
        if (roomtype === 'premium') pricePerNight = 12000;
        if (roomtype === 'presidential') pricePerNight = 20000;
        
        const total = daysDiff * pricePerNight;
        const totalPriceElement = document.querySelector('.total-price span');
        
        // Animate price change
        totalPriceElement.style.transform = 'scale(1.1)';
        totalPriceElement.style.color = '#e74c3c';
        
        setTimeout(() => {
            totalPriceElement.textContent = `Total: ₹${total.toLocaleString()} (${daysDiff} night${daysDiff > 1 ? 's' : ''})`;
            totalPriceElement.style.transform = 'scale(1)';
        }, 150);
    }
}

// Form validation
function validateBookingForm() {
    const checkin = document.getElementById('checkin').value;
    const checkout = document.getElementById('checkout').value;
    const guests = document.getElementById('guests').value;
    const roomtype = document.getElementById('roomtype').value;
    
    if (!checkin || !checkout) {
        showAlert('Please select check-in and check-out dates', 'error');
        return false;
    }
    
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkinDate < today) {
        showAlert('Check-in date cannot be in the past', 'error');
        return false;
    }
    
    if (checkoutDate <= checkinDate) {
        showAlert('Check-out date must be after check-in date', 'error');
        return false;
    }
    
    const timeDiff = checkoutDate.getTime() - checkinDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff > 30) {
        showAlert('Maximum stay duration is 30 nights', 'error');
        return false;
    }
    
    return { checkin, checkout, guests, roomtype, daysDiff };
}

// Custom alert function
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `custom-alert ${type}`;
    alert.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add styles
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'error') {
        alert.style.backgroundColor = '#e74c3c';
    } else if (type === 'success') {
        alert.style.backgroundColor = '#27ae60';
    } else {
        alert.style.backgroundColor = '#3498db';
    }
    
    document.body.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

// Form submission handling
function setupFormSubmission() {
    const form = document.querySelector('.booking-form');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = validateBookingForm();
        if (!formData) return;
        
        // Show loading state
        const submitBtn = document.querySelector('.book-now-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        
        // Calculate pricing details
        let pricePerNight = 8500;
        let roomTypeName = 'Deluxe Room';
        
        if (formData.roomtype === 'premium') {
            pricePerNight = 12000;
            roomTypeName = 'Premium Suite';
        }
        if (formData.roomtype === 'presidential') {
            pricePerNight = 20000;
            roomTypeName = 'Presidential Suite';
        }
        
        const total = formData.daysDiff * pricePerNight;
        
        // Simulate booking validation
        setTimeout(() => {
            // Create URL with booking details
            const params = new URLSearchParams({
                hotel: currentHotelData.name,
                roomType: roomTypeName,
                guests: formData.guests,
                checkin: formData.checkin,
                checkout: formData.checkout,
                nights: formData.daysDiff,
                pricePerNight: pricePerNight,
                total: total
            });
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            
            // Show success message
            showAlert('Redirecting to payment page...', 'success');
            
            // Redirect to payment page
            setTimeout(() => {
                window.location.href = `payment.html?${params.toString()}`;
            }, 1000);
            
        }, 1500);
    });
}

// Setup date inputs
function setupDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    
    checkinInput.setAttribute('min', today);
    checkoutInput.setAttribute('min', tomorrow);
    
    // Auto-set checkout date when checkin changes
    checkinInput.addEventListener('change', function() {
        const checkinDate = new Date(this.value);
        checkinDate.setDate(checkinDate.getDate() + 1);
        const minCheckout = checkinDate.toISOString().split('T')[0];
        checkoutInput.setAttribute('min', minCheckout);
        
        if (checkoutInput.value && checkoutInput.value <= this.value) {
            checkoutInput.value = minCheckout;
        }
        
        calculateTotal();
    });
    
    checkoutInput.addEventListener('change', calculateTotal);
}

// Setup room type interactions
function setupRoomTypeInteractions() {
    const roomTypes = document.querySelectorAll('.room-type');
    const roomTypeSelect = document.getElementById('roomtype');
    
    roomTypes.forEach((roomType, index) => {
        roomType.addEventListener('click', function() {
            // Remove active class from all room types
            roomTypes.forEach(rt => rt.classList.remove('active-room'));
            
            // Add active class to clicked room
            this.classList.add('active-room');
            
            // Update select value
            const options = ['deluxe', 'premium', 'presidential'];
            roomTypeSelect.value = options[index];
            
            // Trigger price calculation
            calculateTotal();
        });
    });
    
    // Also handle select change
    roomTypeSelect.addEventListener('change', function() {
        roomTypes.forEach(rt => rt.classList.remove('active-room'));
        
        const selectedIndex = ['deluxe', 'premium', 'presidential'].indexOf(this.value);
        if (selectedIndex !== -1) {
            roomTypes[selectedIndex].classList.add('active-room');
        }
        
        calculateTotal();
    });
}

// Setup amenity interactions
function setupAmenityInteractions() {
    const amenityItems = document.querySelectorAll('.amenity-item');
    
    amenityItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = 'none';
        });
    });
}

// Setup image gallery keyboard navigation
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        const thumbnails = document.querySelectorAll('.thumbnail');
        const activeThumbnail = document.querySelector('.thumbnail.active');
        
        if (!activeThumbnail) return;
        
        let currentIndex = Array.from(thumbnails).indexOf(activeThumbnail);
        
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            e.preventDefault();
            changeMainImage(thumbnails[currentIndex - 1]);
        } else if (e.key === 'ArrowRight' && currentIndex < thumbnails.length - 1) {
            e.preventDefault();
            changeMainImage(thumbnails[currentIndex + 1]);
        }
    });
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.querySelector('.search-input');
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.trim();
            if (searchTerm) {
                window.location.href = `list.html?search=${encodeURIComponent(searchTerm)}`;
            }
        }
    });
}

// Initialize page functionality
function initializeDetailPage() {
    setupDateInputs();
    setupFormSubmission();
    setupRoomTypeInteractions();
    setupAmenityInteractions();
    setupKeyboardNavigation();
    setupSearch();
    
    // Add event listeners for price calculation
    document.getElementById('checkin').addEventListener('change', calculateTotal);
    document.getElementById('checkout').addEventListener('change', calculateTotal);
    document.getElementById('roomtype').addEventListener('change', calculateTotal);
    
    // Initial price calculation
    calculateTotal();
    
    console.log('Detail page initialized successfully');
}

// Handle page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDetailPage();
    
    // Add loading animation for sections
    const sections = document.querySelectorAll('.hotel-header, .image-gallery, .hotel-details, .booking-section');
    
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, index * 150);
    });
});

// Handle URL parameters for different hotels
function handleHotelParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const hotelId = urlParams.get('hotel');
    
    // This could be expanded to load different hotel data based on hotelId
    if (hotelId && hotelId !== 'radisson-blu') {
        // Load different hotel data
        console.log(`Loading hotel: ${hotelId}`);
        // Future implementation for dynamic hotel loading
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .room-type.active-room {
        border-color: #3498db !important;
        background-color: #e3f2fd !important;
    }
    
    .amenity-item {
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);

// Export functions for potential use in other scripts
window.hotelDetailApp = {
    changeMainImage,
    calculateTotal,
    validateBookingForm,
    showAlert
};
