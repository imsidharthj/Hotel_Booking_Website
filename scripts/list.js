let currentCity = '';
let currentHotels = [];
let filteredHotels = [];
let currentSortBy = 'rating';

document.addEventListener('DOMContentLoaded', function() {
    initializeListPage();
});

async function initializeListPage() {
    // Get city from URL params or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    currentCity = urlParams.get('city') || sessionStorage.getItem('selectedCity') || 'delhi';
    
    // Update page title
    document.title = `Hotels in ${capitalizeFirstLetter(currentCity)} - Hotel Booking`;
    
    // Load hotels for the city
    await loadHotelsByCity(currentCity);
    
    // Setup filters and sorting
    setupFilters();
    setupSorting();
    
    // Handle search query if exists
    const searchQuery = sessionStorage.getItem('searchQuery');
    if (searchQuery) {
        document.getElementById('search-input').value = searchQuery;
        filterHotelsBySearch(searchQuery);
        sessionStorage.removeItem('searchQuery');
    }
}

async function loadHotelsByCity(city) {
    try {
        showLoader(`Loading hotels in ${capitalizeFirstLetter(city)}...`);
        
        console.log(`Loading hotel summaries for ${city}`);
        
        console.log('API service available:', !!window.tripAdvisorAPI);
        console.log('City location IDs:', window.tripAdvisorAPI?.cityLocationIds);
        
        // ✅ FIXED: Use a more reasonable limit that works with the API
        currentHotels = await window.tripAdvisorAPI.searchHotelsByCity(city, 15); // Reduced from 30 to 15
        filteredHotels = [...currentHotels];
        
        console.log(`Loaded ${currentHotels.length} hotels for ${city}`);
        console.log('Hotel data:', currentHotels);
        
        updateCityHeader(city);
        displayHotels(filteredHotels);
        updateResultsCount(filteredHotels.length);
        
        if (currentHotels.length > 0) {
            const locationId = window.tripAdvisorAPI.cityLocationIds[city.toLowerCase()];
            if (locationId) {
                loadFilterOptions(locationId);
            } else {
                console.warn(`No location ID found for city: ${city}`);
            }
        }
        
    } catch (error) {
        console.error('Error loading hotels:', error);
        displayErrorMessage('Failed to load hotels. Please try again.');
    } finally {
        hideLoader();
    }
}

async function loadFilterOptions(locationId) {
    try {
        console.log('Loading filter options for location:', locationId);
        // ✅ CORRECT: Call on the instance
        const filters = await window.tripAdvisorAPI.getHotelFilters(locationId);
        updateFilterControls(filters);
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

function updateFilterControls(filters) {
    // Update price filter options if available
    const priceFilter = document.getElementById('priceFilter');
    if (priceFilter && filters.priceRanges) {
        priceFilter.innerHTML = '<option value="all">All Prices</option>';
        filters.priceRanges.forEach(range => {
            const option = document.createElement('option');
            option.value = range.value;
            option.textContent = range.label;
            priceFilter.appendChild(option);
        });
    }
    
    // Add amenities filter if available
    if (filters.amenities && filters.amenities.length > 0) {
        addAmenitiesFilter(filters.amenities);
    }
}

function addAmenitiesFilter(amenities) {
    const filterSection = document.querySelector('.filter-controls');
    if (!filterSection || document.getElementById('amenitiesFilter')) return;
    
    const select = document.createElement('select');
    select.id = 'amenitiesFilter';
    select.innerHTML = '<option value="all">All Amenities</option>';
    
    amenities.slice(0, 10).forEach(amenity => {
        const option = document.createElement('option');
        option.value = amenity.toLowerCase();
        option.textContent = amenity;
        select.appendChild(option);
    });
    
    select.addEventListener('change', applyFilters);
    filterSection.appendChild(select);
}

function displayHotels(hotels) {
    const hotelsContainer = document.getElementById('hotels-container');
    if (!hotelsContainer) {
        console.error('Hotels container not found!');
        return;
    }
    
    console.log(`Displaying ${hotels.length} hotels`);
    
    if (hotels.length === 0) {
        hotelsContainer.innerHTML = `
            <div class="no-results">
                <h3>No hotels found</h3>
                <p>Try adjusting your search criteria or browse hotels in other cities.</p>
                <button onclick="location.reload()" class="retry-btn">Retry</button>
            </div>
        `;
        return;
    }
    
    hotelsContainer.innerHTML = '';
    hotels.forEach((hotel, index) => {
        console.log(`Creating card for hotel ${index + 1}:`, hotel.name);
        const hotelCard = createHotelListCard(hotel);
        hotelsContainer.appendChild(hotelCard);
    });
    
    console.log(`Successfully displayed ${hotels.length} hotel cards`);
}

function createHotelListCard(hotel) {
    const card = document.createElement('div');
    card.className = 'hotel-list-card';
    
    // ✅ FIXED: Pass the numeric ID for proper API lookup
    card.onclick = () => {
        console.log(`User clicked hotel ${hotel.name} (ID: ${hotel.id})`);
        // Use numeric ID for API calls, not slug
        goToHotelDetail(hotel.id);
    };
    
    const stars = generateStarRating(hotel.rating);
    const amenitiesHtml = hotel.amenities.slice(0, 3).map(amenity => 
        `<span class="amenity-tag">${amenity}</span>`
    ).join('');
    
    card.innerHTML = `
        <div class="hotel-image">
            <img src="${hotel.image}" alt="${hotel.name}" 
                 onerror="this.src='https://via.placeholder.com/300x200?text=Hotel+Image'">
        </div>
        <div class="hotel-info">
            <h3 class="hotel-name">${hotel.name}</h3>
            <p class="hotel-location">${hotel.location}</p>
            <div class="hotel-rating">
                <span class="stars">${stars}</span>
                <span class="rating-number">${hotel.rating}</span>
                ${hotel.reviewCount ? `<span class="review-count">(${hotel.reviewCount} reviews)</span>` : ''}
            </div>
            <div class="hotel-amenities">
                ${amenitiesHtml}
            </div>
            ${hotel.description ? `<p class="hotel-description">${hotel.description}</p>` : ''}
        </div>
        <div class="hotel-price">
            <span class="price">${hotel.price}</span>
            <button class="book-now-btn" onclick="event.stopPropagation(); goToHotelDetail('${hotel.id}')">
                View Details
            </button>
        </div>
    `;
    
    return card;
}

function setupFilters() {
    // Price range filter
    const priceFilter = document.getElementById('price-filter');
    if (priceFilter) {
        priceFilter.addEventListener('change', applyFilters);
    }
    
    // Rating filter
    const ratingFilter = document.getElementById('rating-filter');
    if (ratingFilter) {
        ratingFilter.addEventListener('change', applyFilters);
    }
    
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterHotelsBySearch(this.value);
        });
    }
}

function setupSorting() {
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSortBy = this.value;
            sortHotels(filteredHotels, currentSortBy);
            displayHotels(filteredHotels);
        });
    }
}

function applyFilters() {
    const priceFilter = document.getElementById('price-filter')?.value;
    const ratingFilter = document.getElementById('rating-filter')?.value;
    const amenitiesFilter = document.getElementById('amenitiesFilter')?.value;
    
    filteredHotels = currentHotels.filter(hotel => {
        let passesFilter = true;
        
        // Price filter
        if (priceFilter && priceFilter !== 'all') {
            const price = extractPriceNumber(hotel.price);
            switch (priceFilter) {
                case 'budget':
                    passesFilter = passesFilter && price < 5000;
                    break;
                case 'mid':
                    passesFilter = passesFilter && price >= 5000 && price <= 10000;
                    break;
                case 'luxury':
                    passesFilter = passesFilter && price > 10000;
                    break;
            }
        }
        
        // Rating filter
        if (ratingFilter && ratingFilter !== 'all') {
            const minRating = parseFloat(ratingFilter);
            passesFilter = passesFilter && hotel.rating >= minRating;
        }
        
        // Amenities filter
        if (amenitiesFilter && amenitiesFilter !== 'all') {
            passesFilter = passesFilter && hotel.amenities.some(amenity => amenity.toLowerCase() === amenitiesFilter);
        }
        
        return passesFilter;
    });
    
    sortHotels(filteredHotels, currentSortBy);
    displayHotels(filteredHotels);
    updateResultsCount(filteredHotels.length);
}

function filterHotelsBySearch(query) {
    if (!query.trim()) {
        filteredHotels = [...currentHotels];
    } else {
        const searchLower = query.toLowerCase();
        filteredHotels = currentHotels.filter(hotel =>
            hotel.name.toLowerCase().includes(searchLower) ||
            hotel.location.toLowerCase().includes(searchLower) ||
            hotel.amenities.some(amenity => amenity.toLowerCase().includes(searchLower))
        );
    }
    
    sortHotels(filteredHotels, currentSortBy);
    displayHotels(filteredHotels);
    updateResultsCount(filteredHotels.length);
}

function sortHotels(hotels, sortBy) {
    hotels.sort((a, b) => {
        switch (sortBy) {
            case 'price-low':
                return extractPriceNumber(a.price) - extractPriceNumber(b.price);
            case 'price-high':
                return extractPriceNumber(b.price) - extractPriceNumber(a.price);
            case 'rating':
                return b.rating - a.rating;
            case 'name':
                return a.name.localeCompare(b.name);
            default:
                return 0;
        }
    });
}

function extractPriceNumber(priceString) {
    const match = priceString.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, '')) : 0;
}

function updateCityHeader(city) {
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = `Hotels in ${capitalizeFirstLetter(city)}`;
    }
}

function updateResultsCount(count) {
    let resultsCount = document.getElementById('results-count');
    if (!resultsCount) {
        resultsCount = document.createElement('p');
        resultsCount.id = 'results-count';
        resultsCount.style.margin = '10px 0';
        resultsCount.style.color = '#666';
        const filterSection = document.querySelector('.filter-section');
        if (filterSection) {
            filterSection.appendChild(resultsCount);
        }
    }
    resultsCount.textContent = `${count} hotel${count !== 1 ? 's' : ''} found`;
}

function displayErrorMessage(message) {
    const hotelsContainer = document.querySelector('.hotels-container');
    if (hotelsContainer) {
        hotelsContainer.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 40px; color: #d32f2f;">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 10px; padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Try Again
                </button>
            </div>
        `;
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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

function showLoader(message = 'Loading...') {
    let loader = document.getElementById('page-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(255, 255, 255, 0.9); display: flex;
            justify-content: center; align-items: center; z-index: 9999;
        `;
        document.body.appendChild(loader);
    }
    loader.innerHTML = `<div style="text-align: center;">
        <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #1976d2; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <p>${message}</p></div>`;
}

function hideLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) loader.remove();
}

// View control functions
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

// Slider functions for image carousel
let currentSlideIndex = 0;

function nextSlide() {
    const slides = document.querySelectorAll('.slider-image');
    const dots = document.querySelectorAll('.dot');
    if (slides.length === 0) return;
    
    slides[currentSlideIndex].classList.remove('active');
    dots[currentSlideIndex].classList.remove('active');
    
    currentSlideIndex = (currentSlideIndex + 1) % slides.length;
    
    slides[currentSlideIndex].classList.add('active');
    dots[currentSlideIndex].classList.add('active');
}

function previousSlide() {
    const slides = document.querySelectorAll('.slider-image');
    const dots = document.querySelectorAll('.dot');
    if (slides.length === 0) return;
    
    slides[currentSlideIndex].classList.remove('active');
    dots[currentSlideIndex].classList.remove('active');
    
    currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
    
    slides[currentSlideIndex].classList.add('active');
    dots[currentSlideIndex].classList.add('active');
}

function currentSlide(index) {
    const slides = document.querySelectorAll('.slider-image');
    const dots = document.querySelectorAll('.dot');
    if (slides.length === 0) return;
    
    slides[currentSlideIndex].classList.remove('active');
    dots[currentSlideIndex].classList.remove('active');
    
    currentSlideIndex = index - 1;
    
    slides[currentSlideIndex].classList.add('active');
    dots[currentSlideIndex].classList.add('active');
}
