// View Toggle Functions
function showListView() {
    document.getElementById('listView').style.display = 'block';
    document.getElementById('mapView').style.display = 'none';
    document.getElementById('listViewBtn').classList.add('active');
    document.getElementById('mapViewBtn').classList.remove('active');
}

function showMapView() {
    document.getElementById('listView').style.display = 'none';
    document.getElementById('mapView').style.display = 'block';
    document.getElementById('listViewBtn').classList.remove('active');
    document.getElementById('mapViewBtn').classList.add('active');
}

// Slider Functions
let currentSlideIndex = 0;
let slides = [];
let dots = [];

function initializeSlider() {
    slides = document.querySelectorAll('.slider-image');
    dots = document.querySelectorAll('.dot');
}

function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    if (slides[index] && dots[index]) {
        slides[index].classList.add('active');
        dots[index].classList.add('active');
    }
}

function nextSlide() {
    currentSlideIndex = (currentSlideIndex + 1) % slides.length;
    showSlide(currentSlideIndex);
}

function previousSlide() {
    currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
    showSlide(currentSlideIndex);
}

function currentSlide(index) {
    currentSlideIndex = index - 1;
    showSlide(currentSlideIndex);
}

// Hotel detail navigation function
function goToHotelDetail(hotelId) {
    window.location.href = `detail.html?hotel=${hotelId}`;
}

// Initialize page with URL parameters
function initializePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const city = urlParams.get('city');
    const search = urlParams.get('search');
    
    if (city) {
        document.getElementById('cityFilter').value = city;
        document.getElementById('pageTitle').textContent = `Hotels in ${city.charAt(0).toUpperCase() + city.slice(1)}`;
        document.getElementById('breadcrumbCity').textContent = `${city.charAt(0).toUpperCase() + city.slice(1)} Hotels`;
        filterByCity();
    }
    
    if (search) {
        document.getElementById('pageTitle').textContent = `Search Results for "${search}"`;
        performSearch(search);
    }
}

// Filter functions
function filterByCity() {
    const selectedCity = document.getElementById('cityFilter').value;
    const hotelCards = document.querySelectorAll('.hotel-card');
    
    hotelCards.forEach(card => {
        const hotelCity = card.querySelector('.hotel-city').textContent.toLowerCase();
        if (selectedCity === 'all' || hotelCity.includes(selectedCity)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
    
    updatePageTitle(selectedCity);
}

function filterByPrice() {
    const selectedPrice = document.getElementById('priceFilter').value;
    const hotelCards = document.querySelectorAll('.hotel-card');
    
    hotelCards.forEach(card => {
        const priceText = card.querySelector('.price').textContent;
        const price = parseInt(priceText.replace(/[^0-9]/g, ''));
        
        let showCard = true;
        if (selectedPrice === 'low' && price >= 10000) showCard = false;
        if (selectedPrice === 'medium' && (price < 10000 || price > 15000)) showCard = false;
        if (selectedPrice === 'high' && price <= 15000) showCard = false;
        
        card.style.display = showCard ? 'flex' : 'none';
    });
}

// Search functionality
function performSearch(searchTerm) {
    const hotelCards = document.querySelectorAll('.hotel-card');
    const searchLower = searchTerm.toLowerCase();
    
    hotelCards.forEach(card => {
        const hotelName = card.querySelector('.hotel-name').textContent.toLowerCase();
        const hotelCity = card.querySelector('.hotel-city').textContent.toLowerCase();
        const amenities = card.querySelectorAll('.amenity');
        let amenityText = '';
        amenities.forEach(amenity => {
            amenityText += amenity.textContent.toLowerCase() + ' ';
        });
        
        if (hotelName.includes(searchLower) || 
            hotelCity.includes(searchLower) || 
            amenityText.includes(searchLower)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Update page title based on filters
function updatePageTitle(selectedCity) {
    const pageTitle = document.getElementById('pageTitle');
    const breadcrumbCity = document.getElementById('breadcrumbCity');
    
    if (selectedCity === 'all') {
        pageTitle.textContent = 'All Hotels';
        breadcrumbCity.textContent = 'All Hotels';
    } else {
        const cityName = selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1);
        pageTitle.textContent = `Hotels in ${cityName}`;
        breadcrumbCity.textContent = `${cityName} Hotels`;
    }
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.querySelector('.search-input');
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.trim();
            if (searchTerm) {
                document.getElementById('pageTitle').textContent = `Search Results for "${searchTerm}"`;
                performSearch(searchTerm);
                
                // Update URL without refreshing page
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('search', searchTerm);
                window.history.pushState({}, '', newUrl);
            }
        }
    });
}

// Setup auto-advance slider
function setupAutoSlider() {
    // Auto-advance slider every 5 seconds
    setInterval(() => {
        if (slides.length > 0) {
            nextSlide();
        }
    }, 5000);
}

// Setup hover effects for hotel cards
function setupHoverEffects() {
    const hotelCards = document.querySelectorAll('.hotel-card');
    
    hotelCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-5px)';
        });
    });
}

// Setup map marker interactions
function setupMapMarkers() {
    const mapMarkers = document.querySelectorAll('.map-marker');
    
    mapMarkers.forEach(marker => {
        marker.addEventListener('click', function() {
            const hotelName = this.getAttribute('data-hotel');
            
            // Find corresponding hotel card and scroll to it if in list view
            if (document.getElementById('listView').style.display !== 'none') {
                const hotelCards = document.querySelectorAll('.hotel-card');
                hotelCards.forEach(card => {
                    const cardHotelName = card.querySelector('.hotel-name').textContent;
                    if (cardHotelName === hotelName) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // Highlight the card temporarily
                        card.style.backgroundColor = '#e3f2fd';
                        setTimeout(() => {
                            card.style.backgroundColor = 'white';
                        }, 2000);
                    }
                });
            }
        });
    });
}

// Add loading animation
function addLoadingAnimation() {
    const hotelCards = document.querySelectorAll('.hotel-card');
    
    hotelCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    initializeSlider();
    setupSearch();
    setupAutoSlider();
    setupHoverEffects();
    setupMapMarkers();
    addLoadingAnimation();
    
    console.log('List page initialized successfully');
});

// Handle window resize
window.addEventListener('resize', function() {
    // Adjust layouts if needed for different screen sizes
    const isMobile = window.innerWidth <= 768;
    const sliderWrapper = document.querySelector('.slider-wrapper');
    
    if (isMobile && sliderWrapper) {
        sliderWrapper.style.height = '200px';
    } else if (sliderWrapper) {
        sliderWrapper.style.height = '300px';
    }
});

// Export functions for potential use in other scripts
window.hotelListApp = {
    showListView,
    showMapView,
    filterByCity,
    filterByPrice,
    goToHotelDetail,
    performSearch,
    nextSlide,
    previousSlide,
    currentSlide
};
