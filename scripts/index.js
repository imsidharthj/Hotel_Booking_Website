// Toggle more destinations functionality
function toggleMoreDestinations() {
    const hiddenDestinations = document.querySelectorAll('.hidden-destination');
    const viewMoreBtn = document.getElementById('viewMoreBtn');
    
    if (hiddenDestinations[0].style.display === 'none') {
        // Show hidden destinations
        hiddenDestinations.forEach(dest => {
            dest.style.display = 'block';
        });
        viewMoreBtn.textContent = 'View Less';
    } else {
        // Hide destinations
        hiddenDestinations.forEach(dest => {
            dest.style.display = 'none';
        });
        viewMoreBtn.textContent = 'View More';
    }
}

// Navigate to city hotels list
function goToCityHotels(cityName) {
    // Store selected city in sessionStorage for list page to use
    sessionStorage.setItem('selectedCity', cityName);
    window.location.href = `list.html?city=${cityName}`;
}

// Navigate to hotel details
function goToHotelDetail(hotelId) {
    window.location.href = `detail.html?hotel=${hotelId}`;
}

// Navigate to hotels list page
function goToHotelsList() {
    window.location.href = 'list.html';
}

// Search functionality
function setupSearch() {
    const searchInput = document.querySelector('.search-input');
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.trim().toLowerCase();
            if (searchTerm) {
                // Store search term and redirect to list page
                sessionStorage.setItem('searchTerm', searchTerm);
                window.location.href = `list.html?search=${encodeURIComponent(searchTerm)}`;
            }
        }
    });
}

// Add hover effects to destination cards
function setupDestinationHoverEffects() {
    const destinationCards = document.querySelectorAll('.destination-card');
    
    destinationCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Add click analytics (for future use)
function trackClick(elementType, elementName) {
    console.log(`User clicked on ${elementType}: ${elementName}`);
    // Here you could send analytics data to your server
}

// Enhanced destination card click with analytics
function enhancedGoToCityHotels(cityName) {
    trackClick('destination', cityName);
    goToCityHotels(cityName);
}

// Enhanced hotel card click with analytics
function enhancedGoToHotelDetail(hotelId) {
    trackClick('hotel', hotelId);
    goToHotelDetail(hotelId);
}

// Initialize page functionality
function initializePage() {
    setupSearch();
    setupDestinationHoverEffects();
    
    // Add smooth scrolling to hotels section
    const hotelsSection = document.querySelector('.hotels-section');
    if (hotelsSection) {
        // Auto-scroll to hotels section after 3 seconds (optional)
        setTimeout(() => {
            // You can uncomment this if you want auto-scroll
            // hotelsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 3000);
    }
    
    // Add loading animation complete class
    document.body.classList.add('loaded');
}

// Handle page load
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    // Add fade-in animation to sections
    const sections = document.querySelectorAll('.destinations, .hotels-section');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
});

// Handle window resize for responsive adjustments
window.addEventListener('resize', function() {
    // Adjust layouts if needed for different screen sizes
    const isMobile = window.innerWidth <= 768;
    const viewMoreBtn = document.getElementById('viewMoreBtn');
    
    if (isMobile && viewMoreBtn) {
        viewMoreBtn.style.minHeight = '80px';
    } else if (viewMoreBtn) {
        viewMoreBtn.style.minHeight = '300px';
    }
});

// Export functions for potential use in other scripts
window.hotelBookingApp = {
    toggleMoreDestinations,
    goToCityHotels,
    goToHotelDetail,
    goToHotelsList,
    trackClick
};
