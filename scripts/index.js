let isShowingMore = false;
let featuredHotels = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadFeaturedHotels();
    setupSearchFunctionality();
});

// Toggle more destinations functionality
function toggleMoreDestinations() {
    const hiddenDestinations = document.querySelectorAll('.hidden-destination');
    const viewMoreBtn = document.getElementById('viewMoreBtn');
    
    if (!isShowingMore) {
        hiddenDestinations.forEach(destination => {
            destination.style.display = 'block';
        });
        viewMoreBtn.textContent = 'View Less';
        isShowingMore = true;
    } else {
        hiddenDestinations.forEach(destination => {
            destination.style.display = 'none';
        });
        viewMoreBtn.textContent = 'View More';
        isShowingMore = false;
    }
}

async function loadFeaturedHotels() {
    try {
        showLoader('Loading featured hotels...');
        
        // Check if API service is available
        if (!window.tripAdvisorAPI) {
            console.error('TripAdvisor API service not available');
            featuredHotels = getFallbackFeaturedHotels();
            displayFeaturedHotels(featuredHotels);
            return;
        }
        
        console.log('Loading featured hotels from API...');
        console.log('API status:', window.tripAdvisorAPI.getApiStatus());
        
        // ✅ FIXED: Try with smaller limits and better error handling
        const delhiHotels = await window.tripAdvisorAPI.searchHotelsByCity('delhi', 2);
        console.log('Delhi hotels loaded:', delhiHotels.length);
        
        const goaHotels = await window.tripAdvisorAPI.searchHotelsByCity('goa', 1);
        console.log('Goa hotels loaded:', goaHotels.length);
        
        const mumbaiHotels = await window.tripAdvisorAPI.searchHotelsByCity('mumbai', 1);
        console.log('Mumbai hotels loaded:', mumbaiHotels.length);
        
        featuredHotels = [...delhiHotels, ...goaHotels, ...mumbaiHotels];
        console.log('Total featured hotels:', featuredHotels.length);
        
        // If no hotels were returned, use fallback
        if (featuredHotels.length === 0) {
            console.log('No hotels from API, using fallback');
            featuredHotels = getFallbackFeaturedHotels();
        }
        
        displayFeaturedHotels(featuredHotels);
        
    } catch (error) {
        console.error('Error loading featured hotels:', error);
        featuredHotels = getFallbackFeaturedHotels();
        displayFeaturedHotels(featuredHotels);
    } finally {
        hideLoader();
    }
}

function getFallbackFeaturedHotels() {
    return [
        {
            id: 'radisson-blu-delhi',
            name: 'Radisson Blu Hotel',
            location: 'New Delhi',
            rating: 4.2,
            reviewCount: 1250,
            price: '₹8,500/night',
            image: 'https://media-cdn.tripadvisor.com/media/photo-w/17/b3/09/b4/by-the-poolside.jpg',
            amenities: ['Free WiFi', 'Swimming Pool', 'Gym', 'Restaurant']
        },
        {
            id: 'lalit-delhi',
            name: 'The Lalit New Delhi',
            location: 'New Delhi',
            rating: 4.5,
            reviewCount: 980,
            price: '₹12,000/night',
            image: 'https://media-cdn.tripadvisor.com/media/photo-w/15/06/31/5f/facade.jpg',
            amenities: ['Free WiFi', 'Swimming Pool', 'Spa', 'Restaurant']
        },
        {
            id: 'taj-palace-delhi',
            name: 'Taj Palace',
            location: 'New Delhi',
            rating: 4.7,
            reviewCount: 2100,
            price: '₹15,500/night',
            image: 'https://media-cdn.tripadvisor.com/media/photo-w/1b/4e/9b/11/exterior.jpg',
            amenities: ['Free WiFi', 'Multiple Restaurants', 'Spa', 'Garden']
        },
        {
            id: 'goa-beach-resort',
            name: 'Beach Resort Goa',
            location: 'Goa',
            rating: 4.3,
            reviewCount: 750,
            price: '₹7,800/night',
            image: 'https://media-cdn.tripadvisor.com/media/photo-w/15/33/fc/f0/goa.jpg',
            amenities: ['Beach Access', 'Swimming Pool', 'Restaurant']
        }
    ];
}

function displayFeaturedHotels(hotels) {
    const hotelsContainer = document.querySelector('.hotels-container');
    if (!hotelsContainer) {
        console.error('Hotels container not found in index page!');
        return;
    }
    
    console.log(`Displaying ${hotels.length} featured hotels`);
    
    // Clear existing hotels but keep the "View More" card
    const viewMoreCard = hotelsContainer.querySelector('.view-more-hotels');
    const existingCards = hotelsContainer.querySelectorAll('.hotel-card');
    existingCards.forEach(card => card.remove());
    
    hotels.forEach((hotel, index) => {
        console.log(`Creating featured card ${index + 1}:`, hotel.name);
        const hotelCard = createHotelCard(hotel);
        
        // Insert before the "View More" card
        if (viewMoreCard) {
            hotelsContainer.insertBefore(hotelCard, viewMoreCard);
        } else {
            hotelsContainer.appendChild(hotelCard);
        }
    });
    
    console.log(`Successfully displayed ${hotels.length} featured hotel cards`);
}

function createHotelCard(hotel) {
    const card = document.createElement('div');
    card.className = 'hotel-card';
    // ✅ FIXED: Use numeric ID for proper API lookup
    card.onclick = () => goToHotelDetail(hotel.id);
    
    const stars = generateStarRating(hotel.rating);
    
    card.innerHTML = `
        <img src="${hotel.image}" alt="${hotel.name}" onerror="this.src='https://via.placeholder.com/400x300?text=Hotel+Image'">
        <div class="hotel-overlay">
            <h3>${hotel.name}</h3>
            <p>${hotel.location}</p>
            <div class="rating">
                <span class="stars">${stars}</span>
                <span>${hotel.rating}</span>
                ${hotel.reviewCount ? `<span class="review-count">(${hotel.reviewCount})</span>` : ''}
            </div>
            <div class="price">${hotel.price}</div>
        </div>
    `;
    
    return card;
}

function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '★';
    }
    if (hasHalfStar) {
        stars += '☆';
    }
    while (stars.length < 5) {
        stars += '☆';
    }
    
    return stars;
}

function setupSearchFunctionality() {
    const searchInput = document.querySelector('.hero-search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchQuery = this.value.trim();
                if (searchQuery) {
                    // Store search query in sessionStorage and redirect to list page
                    sessionStorage.setItem('searchQuery', searchQuery);
                    window.location.href = 'list.html';
                }
            }
        });
    }
}

// Enhanced search functionality that works with common.js
function setupIndexSearch() {
    const searchInput = document.querySelector('.hero-search-input');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim().toLowerCase();
                if (searchTerm) {
                    sessionStorage.setItem('searchTerm', searchTerm);
                    
                    // Show loading before navigation
                    if (window.commonUtils && window.commonUtils.showPageLoader) {
                        window.commonUtils.showPageLoader();
                    }
                    
                    setTimeout(() => {
                        window.location.href = `list.html?search=${encodeURIComponent(searchTerm)}`;
                    }, 500);
                }
            }
        });
    }
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

// Initialize page functionality
function initializePage() {
    setupIndexSearch();
    setupDestinationHoverEffects();
    
    // Check login status on index page
    if (window.commonUtils && window.commonUtils.checkLoginStatus) {
        window.commonUtils.checkLoginStatus();
    }
    
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
    // Hide loading overlay when page is ready
    setTimeout(() => {
        if (window.commonUtils && window.commonUtils.hidePageLoader) {
            window.commonUtils.hidePageLoader();
        }
    }, 200);
    
    // Wait for common.js to load first
    setTimeout(() => {
        initializePage();
        
        // Double-check login status after initialization
        setTimeout(() => {
            if (window.commonUtils && window.commonUtils.checkLoginStatus) {
                window.commonUtils.checkLoginStatus();
            }
        }, 200);
    }, 100);
    
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
    
    // No need to adjust height anymore since it's now a button
    if (viewMoreBtn) {
        // Any mobile-specific adjustments can be added here if needed
        console.log('Window resized, current width:', window.innerWidth);
    }
});

function showLoader(message = 'Loading...') {
    const loader = document.createElement('div');
    loader.id = 'page-loader';
    loader.innerHTML = `
        <div class="loader-content">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.remove();
    }
}

// Export functions for potential use in other scripts (enhanced)
window.hotelBookingApp = {
    toggleMoreDestinations,
    trackClick,
    initializePage
};
