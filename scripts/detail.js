let currentHotel = null;
let selectedRoomType = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeDetailPage();
});

async function initializeDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const hotelId = urlParams.get('id') || urlParams.get('hotel');
    
    if (!hotelId) {
        displayErrorMessage('Hotel not specified');
        return;
    }
    
    await loadHotelDetails(hotelId);
}

async function loadHotelDetails(hotelId) {
    try {
        showLoader('Loading hotel details...');
        
        console.log(`Loading detailed information for hotel ID: ${hotelId}`);
        
        // ✅ FIXED: Add better error checking
        if (!window.tripAdvisorAPI) {
            console.error('TripAdvisor API service not available');
            displayErrorMessage('Service unavailable. Please try again.');
            return;
        }
        
        console.log('API service status:', window.tripAdvisorAPI.getApiStatus());
        
        currentHotel = await window.tripAdvisorAPI.getHotelDetails(hotelId);
        
        if (!currentHotel) {
            console.error('No hotel data returned for ID:', hotelId);
            displayErrorMessage('Hotel not found');
            return;
        }
        
        console.log(`Loaded details for: ${currentHotel.name}`);
        console.log('Hotel details:', currentHotel);
        
        displayHotelDetails(currentHotel);
        setupBookingForm();
        
    } catch (error) {
        console.error('Error loading hotel details:', error);
        displayErrorMessage('Failed to load hotel details. Please try again.');
    } finally {
        hideLoader();
    }
}

function displayHotelDetails(hotel) {
    // Update page title
    document.title = `${hotel.name} - Hotel Booking`;
    
    // Update hotel header with detailed info
    updateHotelHeader(hotel);
    
    // Update hotel gallery with full image set
    updateHotelGallery(hotel.images);
    
    // Update detailed hotel info
    updateHotelInfo(hotel);
    
    // Update comprehensive amenities list
    updateAmenities(hotel.amenities);
    
    // Update contact information
    updateContactInfo(hotel.contact);
    
    // Update room types if available
    updateRoomTypes(hotel.roomTypes);
    
    // Update reviews if available
    updateReviews(hotel.reviews);
    
    // Update policies if available
    updatePolicies(hotel.policies);
}

function updateHotelHeader(hotel) {
    const hotelTitle = document.querySelector('.hotel-title');
    const hotelLocation = document.querySelector('.hotel-location');
    const hotelRating = document.querySelector('.hotel-rating');
    const priceAmount = document.querySelector('.price-amount');
    
    if (hotelTitle) hotelTitle.textContent = hotel.name;
    if (hotelLocation) hotelLocation.textContent = `📍 ${hotel.location}`;
    if (priceAmount) priceAmount.textContent = hotel.price.replace('/night', '');
    
    if (hotelRating) {
        const stars = generateStarRating(hotel.rating);
        hotelRating.innerHTML = `
            <span class="stars">${stars}</span>
            <span class="rating-score">${hotel.rating}</span>
            ${hotel.reviewCount ? `<span class="rating-count">(${hotel.reviewCount} reviews)</span>` : ''}
        `;
    }
}

function updateHotelGallery(images) {
    const gallery = document.getElementById('hotel-gallery');
    if (!gallery || !images || images.length === 0) return;
    
    gallery.innerHTML = '';
    
    // Main image
    const mainImage = document.createElement('div');
    mainImage.className = 'main-image';
    mainImage.innerHTML = `
        <img src="${images[0]}" alt="Hotel main image" id="main-hotel-image"
             onerror="this.src='https://via.placeholder.com/800x400?text=Hotel+Image'">
    `;
    gallery.appendChild(mainImage);
    
    // Thumbnail images
    if (images.length > 1) {
        const thumbnails = document.createElement('div');
        thumbnails.className = 'thumbnail-images';
        
        images.slice(1, 5).forEach((image, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = image;
            thumbnail.alt = `Hotel image ${index + 2}`;
            thumbnail.className = 'thumbnail';
            thumbnail.onclick = () => changeMainImage(image);
            thumbnail.onerror = function() {
                this.src = 'https://via.placeholder.com/200x150?text=Hotel+Image';
            };
            thumbnails.appendChild(thumbnail);
        });
        
        gallery.appendChild(thumbnails);
    }
}

function updateHotelInfo(hotel) {
    const hotelDescription = document.getElementById('hotel-description');
    if (hotelDescription && hotel.description) {
        hotelDescription.textContent = hotel.description;
    }
    
    // Update additional info sections
    updateLocationInfo(hotel);
    updatePolicies(hotel);
}

function updateAmenities(amenities) {
    const amenitiesContainer = document.getElementById('amenities-list');
    if (!amenitiesContainer || !amenities) return;
    
    amenitiesContainer.innerHTML = '';
    amenities.forEach(amenity => {
        const amenityItem = document.createElement('div');
        amenityItem.className = 'amenity-item';
        amenityItem.innerHTML = `
            <i class="amenity-icon">✓</i>
            <span>${amenity}</span>
        `;
        amenitiesContainer.appendChild(amenityItem);
    });
}

function updateContactInfo(contact) {
    if (!contact) return;
    
    const contactSection = document.getElementById('contact-info');
    if (contactSection) {
        contactSection.innerHTML = `
            ${contact.phone ? `<p><strong>Phone:</strong> ${contact.phone}</p>` : ''}
            ${contact.email ? `<p><strong>Email:</strong> ${contact.email}</p>` : ''}
            ${contact.website ? `<p><strong>Website:</strong> <a href="${contact.website}" target="_blank">${contact.website}</a></p>` : ''}
        `;
    }
}

function updateRoomTypes(roomTypes) {
    const roomsSection = document.querySelector('.rooms-section .room-types');
    if (!roomsSection || !roomTypes) return;
    
    roomsSection.innerHTML = '';
    roomTypes.forEach(room => {
        const roomDiv = document.createElement('div');
        roomDiv.className = 'room-type';
        roomDiv.innerHTML = `
            <h3>${room.name}</h3>
            <p>${room.description}</p>
            <span class="room-price">${room.price}</span>
        `;
        roomsSection.appendChild(roomDiv);
    });
}

function updateReviews(reviews) {
    const reviewsSection = document.querySelector('.reviews-section');
    if (!reviewsSection || !reviews) return;
    
    const existingReviews = reviewsSection.querySelectorAll('.review-item');
    existingReviews.forEach(review => review.remove());
    
    reviews.slice(0, 3).forEach(review => {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item';
        reviewDiv.innerHTML = `
            <div class="review-header">
                <span class="reviewer-name">${review.author}</span>
                <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
            </div>
            <p class="review-text">"${review.text}"</p>
            ${review.date ? `<span class="review-date">${review.date}</span>` : ''}
        `;
        reviewsSection.appendChild(reviewDiv);
    });
}

function updatePolicies(policies) {
    if (!policies) return;
    
    const policySection = document.querySelector('.policies-section') || createPolicySection();
    policySection.innerHTML = `
        <h3>Hotel Policies</h3>
        <div class="policy-item">
            <strong>Check-in:</strong> ${policies.checkIn || '3:00 PM'}
        </div>
        <div class="policy-item">
            <strong>Check-out:</strong> ${policies.checkOut || '11:00 AM'}
        </div>
        <div class="policy-item">
            <strong>Cancellation:</strong> ${policies.cancellation || '24 hours before check-in'}
        </div>
        <div class="policy-item">
            <strong>Pets:</strong> ${policies.pets || 'Contact hotel for pet policy'}
        </div>
    `;
}

function createPolicySection() {
    const policySection = document.createElement('div');
    policySection.className = 'policies-section';
    const bookingSection = document.querySelector('.booking-section');
    if (bookingSection) {
        bookingSection.appendChild(policySection);
    }
    return policySection;
}

function setupBookingForm() {
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
    }
    
    const checkinDate = document.getElementById('checkin-date');
    const checkoutDate = document.getElementById('checkout-date');
    
    if (checkinDate && checkoutDate) {
        const today = new Date().toISOString().split('T')[0];
        checkinDate.min = today;
        checkoutDate.min = today;
        
        checkinDate.addEventListener('change', function() {
            checkoutDate.min = this.value;
            if (checkoutDate.value && checkoutDate.value <= this.value) {
                const nextDay = new Date(this.value);
                nextDay.setDate(nextDay.getDate() + 1);
                checkoutDate.value = nextDay.toISOString().split('T')[0];
            }
        });
    }
}

function handleBookingSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const bookingData = {
        hotelId: currentHotel.id,
        hotelName: currentHotel.name,
        checkinDate: formData.get('checkin-date'),
        checkoutDate: formData.get('checkout-date'),
        guests: formData.get('guests'),
        rooms: formData.get('rooms'),
        totalPrice: calculateTotalPrice(formData.get('checkin-date'), formData.get('checkout-date'))
    };
    
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    window.location.href = 'payment.html';
}

function calculateTotalPrice(checkinDate, checkoutDate) {
    if (!checkinDate || !checkoutDate || !currentHotel.price) return 0;
    
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);
    const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
    
    const pricePerNight = extractPriceNumber(currentHotel.price);
    return nights * pricePerNight;
}

function extractPriceNumber(priceString) {
    const match = priceString.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, '')) : 0;
}

function changeMainImage(imageSrc) {
    const mainImage = document.getElementById('main-hotel-image');
    if (mainImage) {
        mainImage.src = imageSrc;
    }
}

function updateLocationInfo(hotel) {
    console.log('Updating location info for:', hotel.location);
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

function displayErrorMessage(message) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = `
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
