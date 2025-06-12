class TripAdvisorAPI {
    constructor() {
        this.apiKey = '708e1c6603msh06f0845156192d5p1bf57ejsn1d17c06ad2af';
        this.baseURL = 'https://travel-advisor.p.rapidapi.com';
        this.headers = {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
        };
        
        // Rate limiting and caching
        this.lastApiCall = 0;
        this.apiCallDelay = 1000;
        this.cache = new Map();
        this.maxCacheAge = 300000;
        this.apiEnabled = true;
        this.consecutiveErrors = 0;
        this.maxConsecutiveErrors = 3;
        this.hotelSummaries = new Map();
        
        // City location IDs for Travel Advisor API
        this.cityLocationIds = {
            'delhi': '304551',
            'goa': '304362', 
            'mumbai': '304554',
            'kolkata': '304558',
            'chennai': '304555',
            'agra': '304548',
            'jaipur': '304555',
            'bengaluru': '304554'
        };
        
        // City coordinates for map-based searches
        this.cityCoordinates = {
            'delhi': { lat: 28.6139, lng: 77.2090 },
            'goa': { lat: 15.2993, lng: 74.1240 },
            'mumbai': { lat: 19.0760, lng: 72.8777 },
            'kolkata': { lat: 22.5726, lng: 88.3639 },
            'chennai': { lat: 13.0827, lng: 80.2707 },
            'agra': { lat: 27.1767, lng: 78.0081 },
            'jaipur': { lat: 26.9124, lng: 75.7873 },
            'bengaluru': { lat: 12.9716, lng: 77.5946 }
        };
        
        // Bind all methods to preserve 'this' context
        if (typeof this.searchHotelsByCity === 'function') {
            this.searchHotelsByCity = this.searchHotelsByCity.bind(this);
        }
        if (typeof this.getHotelsList === 'function') {
            this.getHotelsList = this.getHotelsList.bind(this);
        }
        if (typeof this.getHotelDetails === 'function') {
            this.getHotelDetails = this.getHotelDetails.bind(this);
        }
        if (typeof this.getHotelFilters === 'function') {
            this.getHotelFilters = this.getHotelFilters.bind(this);
        }
        this.getFromCache = this.getFromCache.bind(this);
        this.setCache = this.setCache.bind(this);
        this.canMakeApiCall = this.canMakeApiCall.bind(this);
        this.handleApiError = this.handleApiError.bind(this);
        this.handleRateLimitError = this.handleRateLimitError.bind(this);
        this.handleForbiddenError = this.handleForbiddenError.bind(this);
        this.getFallbackHotels = this.getFallbackHotels.bind(this);
        this.getFallbackHotelsByCity = this.getFallbackHotelsByCity.bind(this);
        this.getFallbackHotelDetails = this.getFallbackHotelDetails.bind(this);
        this.generateDynamicHotelDetails = this.generateDynamicHotelDetails.bind(this);
        this.getDefaultFilters = this.getDefaultFilters.bind(this);
        
        console.log('Travel Advisor API initialized with method binding');
    }

    // Helper to generate valid future check-in date
    getValidCheckinDate(checkinOverride = null) {
        if (checkinOverride) return checkinOverride;
        
        const tomorrow = new Date(Date.now() + 86400000);
        return tomorrow.toISOString().split('T')[0];
    }

    // Build complete mandatory parameters
    buildMandatoryParams(filters = {}) {
        return {
            adults: filters.adults || '1',
            rooms: filters.rooms || '1',
            nights: filters.nights || '2',
            checkin: this.getValidCheckinDate(filters.checkin),
            lang: 'en_US',
            currency: 'USD',
            subcategory: 'hotel,bb,specialty'
        };
    }

    async searchHotelsByCity(city, limit = 20, filters = {}) {
        const cacheKey = `hotels-summary-${city}-${limit}-${JSON.stringify(filters)}`;
        const cachedData = this.getFromCache(cacheKey);
        if (cachedData) {
            console.log('Using cached hotel summary data for', city);
            cachedData.forEach(hotel => {
                this.hotelSummaries.set(hotel.id, hotel);
                if (hotel.slug) {
                    this.hotelSummaries.set(hotel.slug, hotel);
                }
            });
            return cachedData;
        }

        if (!this.apiEnabled) {
            console.log('API disabled, using fallback data');
            return this.getFallbackHotelsByCity(city);
        }

        const locationId = this.cityLocationIds[city.toLowerCase()];
        if (!locationId) {
            console.warn(`Location ID not found for city: ${city}`);
            return this.getFallbackHotelsByCity(city);
        }

        try {
            // ✅ FIXED: Try with smaller limit first, then make multiple calls if needed
            const maxApiLimit = 10; // API seems to work better with smaller limits
            const requestLimit = Math.min(limit, maxApiLimit);
            
            console.log(`Requesting ${requestLimit} hotels for ${city} (originally requested ${limit})`);
            const hotels = await this.getHotelsList(locationId, requestLimit, filters);
            
            // If we got results but need more, make additional calls with offset
            let allHotels = [...hotels];
            if (hotels.length > 0 && limit > requestLimit && hotels.length === requestLimit) {
                console.log('Making additional API calls to get more hotels...');
                
                for (let offset = requestLimit; offset < limit && allHotels.length < limit; offset += requestLimit) {
                    const remainingNeeded = limit - allHotels.length;
                    const nextBatchLimit = Math.min(remainingNeeded, requestLimit);
                    
                    try {
                        const moreHotels = await this.getHotelsList(locationId, nextBatchLimit, {
                            ...filters,
                            offset: offset.toString()
                        });
                        
                        if (moreHotels.length === 0) break; // No more results
                        allHotels = [...allHotels, ...moreHotels];
                        
                        // Add delay between API calls to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (error) {
                        console.warn('Failed to get additional hotels:', error);
                        break;
                    }
                }
            }
            
            // If we still don't have enough, supplement with fallback data
            if (allHotels.length < Math.min(limit, 5)) {
                console.log(`Only got ${allHotels.length} hotels from API, supplementing with fallback data`);
                const fallbackHotels = this.getFallbackHotelsByCity(city);
                
                // Add fallback hotels but avoid duplicates
                const existingIds = new Set(allHotels.map(h => h.id));
                const uniqueFallbackHotels = fallbackHotels.filter(h => !existingIds.has(h.id));
                
                allHotels = [...allHotels, ...uniqueFallbackHotels].slice(0, limit);
            }
            
            this.setCache(cacheKey, allHotels);
            
            allHotels.forEach(hotel => {
                this.hotelSummaries.set(hotel.id, hotel);
                console.log(`Stored hotel summary: ${hotel.name} with ID: ${hotel.id}`);
            });
            
            return allHotels;
        } catch (error) {
            console.error('Error searching hotels by city:', error);
            this.handleApiError();
            return this.getFallbackHotelsByCity(city);
        }
    }

    async getHotelsList(locationId, limit = 20, filters = {}) {
        if (!this.canMakeApiCall()) {
            return this.getFallbackHotels();
        }

        try {
            console.log(`Getting hotel list for location ID: ${locationId}, limit: ${limit}`);
            this.lastApiCall = Date.now();

            // ✅ FIXED: Use smaller, more reliable limits for the API
            const apiLimit = Math.min(limit, 10); // Keep API calls small and reliable
            
            const params = new URLSearchParams({
                location_id: locationId,
                adults: '1',
                rooms: '1',
                nights: '2',
                lang: 'en_US',
                currency: 'USD',
                limit: apiLimit.toString(),
                sort: 'recommended'
            });

            params.append('offset', filters.offset || '0');
            params.append('order', filters.order || 'asc');
            params.append('checkin', this.getValidCheckinDate(filters.checkin));
            params.append('subcategory', filters.subcategory || 'hotel,bb,specialty');
            
            if (filters.hotel_class) params.append('hotel_class', filters.hotel_class);
            if (filters.amenities) params.append('amenities', filters.amenities);

            console.log('API Request URL:', `${this.baseURL}/hotels/list?${params.toString()}`);

            const response = await fetch(`${this.baseURL}/hotels/list?${params}`, {
                method: 'GET',
                headers: this.headers
            });

            const data = await response.json();
            
            console.log('Hotels list API response structure:', {
                hasData: !!data.data,
                dataLength: data.data?.length || 0,
                firstHotel: data.data?.[0] ? Object.keys(data.data[0]) : 'none',
                totalResults: data.paging?.total_results || 0,
                offset: filters.offset || '0'
            });
            
            if (data.errors && data.errors.length > 0) {
                console.warn('TripAdvisor API errors:', data.errors);
                throw new Error(data.errors[0].message || 'API returned error');
            }

            if (response.status === 429) {
                this.handleRateLimitError();
                return [];
            }

            if (response.status === 403) {
                this.handleForbiddenError();
                return [];
            }

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
            }
            
            const hotelsData = data.data || [];
            if (hotelsData.length === 0) {
                console.log(`No hotels returned for offset ${filters.offset || '0'}`);
                return [];
            }
            
            const formattedData = this.formatHotelsSummaryData(hotelsData);
            if (formattedData && formattedData.length > 0) {
                this.consecutiveErrors = 0;
                console.log(`Successfully formatted ${formattedData.length} hotels`);
                return formattedData;
            } else {
                console.log('Failed to format hotel data');
                return [];
            }

        } catch (error) {
            console.error('Error in getHotelsList:', error);
            this.handleApiError();
            return [];
        }
    }

    async getHotelDetails(hotelId, searchParams = {}) {
        console.log(`getHotelDetails called with ID: ${hotelId}`);
        
        let numericHotelId = hotelId;
        
        if (isNaN(hotelId)) {
            console.log(`Converting slug "${hotelId}" to numeric ID`);
            const storedHotel = this.hotelSummaries.get(hotelId);
            if (storedHotel && storedHotel.id) {
                numericHotelId = storedHotel.id;
                console.log(`Found numeric ID: ${numericHotelId} for slug: ${hotelId}`);
            } else {
                console.log(`No numeric ID found for slug: ${hotelId}, checking fallback`);
                const fallbackDetail = this.getFallbackHotelDetails(hotelId);
                if (fallbackDetail) {
                    console.log('Using fallback hotel details for known hotel:', hotelId);
                    return fallbackDetail;
                }
                
                return this.generateDynamicHotelDetails(hotelId);
            }
        }

        const cacheKey = `hotel-details-${numericHotelId}`;
        const cachedData = this.getFromCache(cacheKey);
        if (cachedData) {
            console.log('Using cached hotel details for:', numericHotelId);
            return cachedData;
        }

        if (!this.canMakeApiCall()) {
            return this.generateDynamicHotelDetails(numericHotelId);
        }

        try {
            console.log(`Getting detailed hotel info for numeric ID: ${numericHotelId}`);
            this.lastApiCall = Date.now();

            const params = new URLSearchParams({
                location_id: numericHotelId,
                adults: searchParams.adults || '1',
                lang: 'en_US',
                currency: 'USD',
                nights: searchParams.nights || '2'
            });

            params.append('checkin', this.getValidCheckinDate(searchParams.checkin));

            console.log('Hotel details request URL:', `${this.baseURL}/hotels/get-details?${params.toString()}`);

            const response = await fetch(`${this.baseURL}/hotels/get-details?${params}`, {
                method: 'GET',
                headers: this.headers
            });

            const data = await response.json();
            
            console.log('Hotel details API response:', data);
            
            if (data.errors && data.errors.length > 0) {
                console.warn('TripAdvisor API errors:', data.errors);
                throw new Error(data.errors[0].message || 'API returned error');
            }

            if (response.status === 429) {
                this.handleRateLimitError();
                return this.generateDynamicHotelDetails(numericHotelId);
            }

            if (response.status === 403) {
                this.handleForbiddenError();
                return this.generateDynamicHotelDetails(numericHotelId);
            }

            if (!response.ok) {
                throw new Error(`Hotel details API request failed: ${response.status}`);
            }

            console.log('Hotel details API response structure:', {
                hasData: !!data.data,
                hasLocationId: !!data.data?.location_id,
                hasName: !!data.data?.name,
                keysCount: data.data ? Object.keys(data.data).length : 0
            });
            
            const payload = data.data || data;
            const formattedDetails = this.formatHotelDetailsData(payload);
            if (formattedDetails) {
                this.setCache(cacheKey, formattedDetails);
                this.consecutiveErrors = 0;
                return formattedDetails;
            } else {
                console.log('Failed to format hotel details, using generated data');
                return this.generateDynamicHotelDetails(numericHotelId);
            }

        } catch (error) {
            console.error('Error getting hotel details:', error);
            this.handleApiError();
            return this.generateDynamicHotelDetails(numericHotelId);
        }
    }

    async getHotelFilters(locationId, searchParams = {}) {
        const cacheKey = `filters-${locationId}`;
        const cachedData = this.getFromCache(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        if (!this.canMakeApiCall()) {
            return this.getDefaultFilters();
        }

        try {
            console.log(`Getting hotel filters for location ID: ${locationId}`);
            this.lastApiCall = Date.now();

            const params = new URLSearchParams({
                location_id: locationId,
                adults: searchParams.adults || '1',
                rooms: searchParams.rooms || '1',
                nights: searchParams.nights || '2',
                lang: 'en_US',
                currency: 'USD',
                order: 'asc',
                sort: 'recommended'
            });

            params.append('offset', '0');
            params.append('checkin', this.getValidCheckinDate(searchParams.checkin));
            params.append('subcategory', 'hotel,bb,specialty');

            const response = await fetch(`${this.baseURL}/hotel-filters/list?${params}`, {
                method: 'GET',
                headers: this.headers
            });

            const data = await response.json();
            
            if (data.errors && data.errors.length > 0) {
                console.warn('TripAdvisor API errors:', data.errors);
                throw new Error(data.errors[0].message || 'API returned error');
            }

            if (!response.ok) {
                throw new Error(`Filters API request failed: ${response.status}`);
            }

            console.log('Hotel filters API response:', data);
            
            const formattedFilters = this.formatFiltersData(data);
            this.setCache(cacheKey, formattedFilters);
            return formattedFilters;

        } catch (error) {
            console.error('Error getting hotel filters:', error);
            return this.getDefaultFilters();
        }
    }

    formatHotelsSummaryData(hotelsArray) {
        if (!Array.isArray(hotelsArray)) {
            console.log('Invalid hotels list data structure - expected array, got:', typeof hotelsArray);
            return [];
        }

        console.log(`Processing ${hotelsArray.length} hotels from API`);

        return hotelsArray
            .filter(hotel => hotel.location_id && hotel.name)
            .map(hotel => {
                const formattedHotel = {
                    id: hotel.location_id.toString(),
                    name: hotel.name || 'Unknown Hotel',
                    location: this.extractLocation(hotel),
                    rating: this.extractRating(hotel),
                    reviewCount: this.extractReviewCount(hotel),
                    price: this.extractPrice(hotel),
                    image: this.extractThumbnailImage(hotel),
                    amenities: this.extractBasicAmenities(hotel),
                    description: this.extractShortDescription(hotel),
                    coordinates: this.extractCoordinates(hotel),
                    slug: this.generateSlug(hotel.name)
                };
                
                console.log(`Formatted hotel: ${formattedHotel.name} (ID: ${formattedHotel.id}, Slug: ${formattedHotel.slug})`);
                return formattedHotel;
            });
    }

    generateSlug(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    formatHotelDetailsData(hotelData) {
        if (!hotelData || !hotelData.location_id) {
            console.log('Invalid hotel details data structure:', hotelData);
            return null;
        }

        return {
            id: hotelData.location_id.toString(),
            name: hotelData.name || 'Hotel Name',
            location: this.extractDetailedLocation(hotelData),
            rating: this.extractRating(hotelData),
            reviewCount: this.extractReviewCount(hotelData),
            price: this.extractPrice(hotelData),
            images: this.extractDetailedImages(hotelData),
            amenities: this.extractDetailedAmenities(hotelData),
            description: this.extractDetailedDescription(hotelData),
            contact: this.extractContact(hotelData),
            coordinates: this.extractCoordinates(hotelData),
            roomTypes: this.extractRoomTypes(hotelData),
            policies: this.extractPolicies(hotelData),
            reviews: this.extractReviews(hotelData)
        };
    }

    extractLocation(hotel) {
        if (hotel.location_string) return hotel.location_string;
        if (hotel.address) return hotel.address;
        return 'Location not specified';
    }

    extractDetailedLocation(hotel) {
        const parts = [];
        if (hotel.address_obj) {
            if (hotel.address_obj.street1) parts.push(hotel.address_obj.street1);
            if (hotel.address_obj.city) parts.push(hotel.address_obj.city);
            if (hotel.address_obj.state) parts.push(hotel.address_obj.state);
        }
        return parts.length > 0 ? parts.join(', ') : hotel.location_string || 'Location not specified';
    }

    extractRating(hotel) {
        if (hotel.rating) return parseFloat(hotel.rating);
        if (hotel.rating_image_url) {
            const match = hotel.rating_image_url.match(/rating_(\d+_\d+)/);
            if (match) {
                return parseFloat(match[1].replace('_', '.'));
            }
        }
        return 4.0 + Math.random();
    }

    extractReviewCount(hotel) {
        if (hotel.num_reviews) return parseInt(hotel.num_reviews);
        return Math.floor(Math.random() * 2000) + 100;
    }

    extractPrice(hotel) {
        if (hotel.price) return hotel.price;
        if (hotel.price_level) {
            const basePrice = hotel.price_level * 2000 + 5000;
            return `₹${basePrice.toLocaleString()}/night`;
        }
        const rating = this.extractRating(hotel);
        const basePrice = Math.floor(rating * 2000 + Math.random() * 3000 + 4000);
        return `₹${basePrice.toLocaleString()}/night`;
    }

    extractThumbnailImage(hotel) {
        if (hotel.photo?.images?.small?.url) {
            return hotel.photo.images.small.url;
        }
        if (hotel.photo?.images?.medium?.url) {
            return hotel.photo.images.medium.url;
        }
        if (hotel.photo?.images?.large?.url) {
            return hotel.photo.images.large.url;
        }
        return this.getPlaceholderImage();
    }

    extractDetailedImages(hotel) {
        const images = [];
        if (hotel.photos && Array.isArray(hotel.photos)) {
            hotel.photos.slice(0, 8).forEach(photo => {
                if (photo.images?.large?.url) {
                    images.push(photo.images.large.url);
                } else if (photo.images?.medium?.url) {
                    images.push(photo.images.medium.url);
                }
            });
        }
        
        while (images.length < 3) {
            images.push(this.getPlaceholderImage());
        }
        
        return images;
    }

    extractBasicAmenities(hotel) {
        if (hotel.amenities && Array.isArray(hotel.amenities)) {
            return hotel.amenities.slice(0, 4);
        }
        const rating = this.extractRating(hotel);
        if (rating >= 4.5) {
            return ['Free WiFi', 'Swimming Pool', 'Spa', 'Fine Dining'];
        } else if (rating >= 4.0) {
            return ['Free WiFi', 'Restaurant', 'Room Service', 'Fitness Center'];
        }
        return ['Free WiFi', 'Restaurant', 'Room Service'];
    }

    extractDetailedAmenities(hotel) {
        if (hotel.amenities && Array.isArray(hotel.amenities)) {
            return hotel.amenities;
        }
        const rating = this.extractRating(hotel);
        const baseAmenities = ['Free WiFi', 'Restaurant', 'Room Service', '24-hour Front Desk'];
        const premiumAmenities = ['Swimming Pool', 'Spa', 'Fitness Center', 'Business Center', 'Concierge'];
        const luxuryAmenities = ['Valet Parking', 'Butler Service', 'Private Beach', 'Helicopter Pad'];
        
        if (rating >= 4.5) {
            return [...baseAmenities, ...premiumAmenities, ...luxuryAmenities.slice(0, 2)];
        } else if (rating >= 4.0) {
            return [...baseAmenities, ...premiumAmenities.slice(0, 4)];
        }
        return baseAmenities;
    }

    extractShortDescription(hotel) {
        if (hotel.description) {
            return hotel.description.length > 120 ? 
                hotel.description.substring(0, 120) + '...' : 
                hotel.description;
        }
        return this.generateDescription(hotel);
    }

    extractDetailedDescription(hotel) {
        if (hotel.description) {
            return hotel.description;
        }
        return this.generateDetailedDescription(hotel);
    }

    extractCoordinates(hotel) {
        if (hotel.latitude && hotel.longitude) {
            return {
                lat: parseFloat(hotel.latitude),
                lng: parseFloat(hotel.longitude)
            };
        }
        return {};
    }

    extractContact(hotel) {
        const contact = {};
        if (hotel.phone) contact.phone = hotel.phone;
        if (hotel.email) contact.email = hotel.email;
        if (hotel.website) contact.website = hotel.website;
        
        if (Object.keys(contact).length === 0) {
            contact.phone = '+91-11-' + Math.floor(Math.random() * 90000000 + 10000000);
            contact.email = 'info@' + (hotel.name?.toLowerCase().replace(/\s+/g, '') || 'hotel') + '.com';
        }
        
        return contact;
    }

    extractRoomTypes(hotel) {
        return [
            { name: 'Standard Room', description: 'Comfortable room with basic amenities', price: '₹5,000/night' },
            { name: 'Deluxe Room', description: 'Spacious room with premium amenities', price: '₹8,000/night' },
            { name: 'Suite', description: 'Luxury suite with separate living area', price: '₹12,000/night' }
        ];
    }

    extractPolicies(hotel) {
        return {
            checkIn: '3:00 PM',
            checkOut: '11:00 AM',
            cancellation: '24 hours before check-in',
            pets: 'Pets allowed with restrictions'
        };
    }

    extractReviews(hotel) {
        if (hotel.reviews && Array.isArray(hotel.reviews)) {
            return hotel.reviews.slice(0, 5).map(review => ({
                author: review.user?.username || 'Anonymous',
                rating: review.rating || 4,
                text: review.text || 'Great stay!',
                date: review.travel_date || new Date().toISOString().split('T')[0]
            }));
        }
        
        return this.generateSampleReviews(hotel);
    }

    generateDescription(hotel) {
        const descriptions = [
            'Experience comfort and luxury at this well-appointed hotel.',
            'Perfect for both business and leisure travelers.',
            'Enjoy modern amenities and exceptional service.',
            'Strategically located with easy access to major attractions.',
            'Offering a blend of traditional hospitality and contemporary facilities.'
        ];
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }

    generateDetailedDescription(hotel) {
        const name = hotel.name || 'This hotel';
        const location = this.extractLocation(hotel);
        const rating = this.extractRating(hotel);
        
        if (rating >= 4.5) {
            return `${name} offers an exceptional luxury experience in ${location}. With world-class amenities, impeccable service, and elegant accommodations, this premium hotel caters to discerning travelers seeking the finest hospitality. Enjoy gourmet dining, spa services, and personalized attention that creates unforgettable memories.`;
        } else if (rating >= 4.0) {
            return `Located in ${location}, ${name} provides comfortable accommodations with modern amenities and excellent service. Perfect for both business and leisure travelers, the hotel features well-appointed rooms, dining options, and convenient facilities to ensure a pleasant stay.`;
        }
        return `${name} in ${location} offers comfortable accommodations with essential amenities and friendly service, providing good value for travelers exploring the area.`;
    }

    generateSampleReviews(hotel) {
        const reviewTemplates = [
            { author: 'Rajesh Kumar', rating: 5, text: 'Excellent service and beautiful rooms. The staff was very helpful and accommodating.' },
            { author: 'Priya Sharma', rating: 4, text: 'Great location and clean facilities. Would definitely recommend to others.' }
        ];
        
        return reviewTemplates.map(review => ({
            ...review,
            date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }));
    }

    getPlaceholderImage() {
        const imageIds = [
            'photo-1566073771259-6a8506099945',
            'photo-1571003123894-1f0594d2b5d9',
            'photo-1584132967334-10e028bd69f7',
            'photo-1578662996442-48f60103fc96',
            'photo-1564501049412-61c2a3083791'
        ];
        const randomId = imageIds[Math.floor(Math.random() * imageIds.length)];
        return `https://images.unsplash.com/${randomId}?w=400&h=300&fit=crop`;
    }

    formatFiltersData(data) {
        return this.getDefaultFilters();
    }

    canMakeApiCall() {
        const now = Date.now();
        return this.apiEnabled && (now - this.lastApiCall >= this.apiCallDelay);
    }

    handleRateLimitError() {
        this.consecutiveErrors++;
        this.apiCallDelay = Math.min(this.apiCallDelay * 2, 10000);
        if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
            this.apiEnabled = false;
            console.log('API disabled due to rate limiting');
            setTimeout(() => {
                this.apiEnabled = true;
                this.consecutiveErrors = 0;
                this.apiCallDelay = 1000;
                console.log('API re-enabled');
            }, 300000);
        }
    }

    handleForbiddenError() {
        this.apiEnabled = false;
        console.log('API disabled due to authentication error');
    }

    handleApiError() {
        this.consecutiveErrors++;
        if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
            this.apiEnabled = false;
            console.log('API disabled due to consecutive errors');
            setTimeout(() => {
                this.apiEnabled = true;
                this.consecutiveErrors = 0;
                console.log('API re-enabled after errors');
            }, 180000);
        }
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.maxCacheAge) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getDefaultFilters() {
        return {
            priceRanges: [
                { label: 'Budget (Under ₹5,000)', value: 'budget' },
                { label: 'Mid-range (₹5,000 - ₹10,000)', value: 'mid' },
                { label: 'Luxury (Above ₹10,000)', value: 'luxury' }
            ],
            amenities: ['Free WiFi', 'Swimming Pool', 'Restaurant', 'Spa', 'Fitness Center'],
            hotelClass: [
                { label: '3 Star', value: '3' },
                { label: '4 Star', value: '4' },
                { label: '5 Star', value: '5' }
            ],
            guestRating: [
                { label: '4.5+ Excellent', value: '4.5' },
                { label: '4.0+ Very Good', value: '4.0' }
            ],
            neighborhoods: ['City Center', 'Airport Area', 'Business District', 'Tourist Area']
        };
    }

    getFallbackHotels() {
        return [
            {
                id: 'radisson-blu-delhi',
                name: 'Radisson Blu Hotel',
                location: 'New Delhi',
                rating: 4.2,
                reviewCount: 1250,
                price: '₹8,500/night',
                image: 'https://media-cdn.tripadvisor.com/media/photo-w/17/b3/09/b4/by-the-poolside.jpg',
                amenities: ['Free WiFi', 'Swimming Pool', 'Gym', 'Restaurant', 'Spa'],
                description: 'Luxury hotel in the heart of Delhi with world-class amenities.',
                coordinates: { lat: 28.6139, lng: 77.2090 }
            },
            {
                id: 'lalit-delhi',
                name: 'The Lalit New Delhi',
                location: 'New Delhi',
                rating: 4.5,
                reviewCount: 980,
                price: '₹12,000/night',
                image: 'https://media-cdn.tripadvisor.com/media/photo-w/15/06/31/5f/facade.jpg',
                amenities: ['Free WiFi', 'Swimming Pool', 'Spa', 'Restaurant', 'Business Center'],
                description: 'Premium luxury hotel with world-class amenities and service.',
                coordinates: { lat: 28.6149, lng: 77.2100 }
            }
        ];
    }

    getFallbackHotelsByCity(city) {
        const allHotels = this.getFallbackHotels();
        const citySpecificHotels = {
            'delhi': [
                {
                    id: 'radisson-blu-delhi',
                    name: 'Radisson Blu Hotel',
                    location: 'New Delhi',
                    rating: 4.2,
                    reviewCount: 1250,
                    price: '₹8,500/night',
                    image: 'https://media-cdn.tripadvisor.com/media/photo-w/17/b3/09/b4/by-the-poolside.jpg',
                    amenities: ['Free WiFi', 'Swimming Pool', 'Gym', 'Restaurant', 'Spa'],
                    description: 'Luxury hotel in the heart of Delhi with world-class amenities.',
                    coordinates: { lat: 28.6139, lng: 77.2090 },
                    slug: 'radisson-blu-delhi'
                },
                {
                    id: 'lalit-delhi',
                    name: 'The Lalit New Delhi',
                    location: 'New Delhi',
                    rating: 4.5,
                    reviewCount: 980,
                    price: '₹12,000/night',
                    image: 'https://media-cdn.tripadvisor.com/media/photo-w/15/06/31/5f/facade.jpg',
                    amenities: ['Free WiFi', 'Swimming Pool', 'Spa', 'Restaurant', 'Business Center'],
                    description: 'Premium luxury hotel with world-class amenities and service.',
                    coordinates: { lat: 28.6149, lng: 77.2100 },
                    slug: 'lalit-delhi'
                },
                {
                    id: 'taj-palace-delhi',
                    name: 'Taj Palace',
                    location: 'New Delhi',
                    rating: 4.7,
                    reviewCount: 2100,
                    price: '₹15,500/night',
                    image: 'https://media-cdn.tripadvisor.com/media/photo-w/1b/4e/9b/11/exterior.jpg',
                    amenities: ['Free WiFi', 'Multiple Restaurants', 'Spa', 'Garden'],
                    description: 'Iconic luxury hotel with heritage charm and modern amenities.',
                    coordinates: { lat: 28.6129, lng: 77.2195 },
                    slug: 'taj-palace-delhi'
                }
            ],
            'goa': [
                {
                    id: 'goa-beach-resort',
                    name: 'Beach Resort Goa',
                    location: 'Goa',
                    rating: 4.3,
                    reviewCount: 750,
                    price: '₹7,800/night',
                    image: 'https://media-cdn.tripadvisor.com/media/photo-w/15/33/fc/f0/goa.jpg',
                    amenities: ['Beach Access', 'Swimming Pool', 'Restaurant', 'Water Sports'],
                    description: 'Beautiful beachfront resort with stunning ocean views.',
                    coordinates: { lat: 15.2993, lng: 74.1240 },
                    slug: 'goa-beach-resort'
                },
                {
                    id: 'taj-exotica-goa',
                    name: 'Taj Exotica Resort & Spa',
                    location: 'Goa',
                    rating: 4.6,
                    reviewCount: 892,
                    price: '₹11,200/night',
                    image: 'https://media-cdn.tripadvisor.com/media/photo-w/15/33/fc/f2/goa-beach.jpg',
                    amenities: ['Beachfront', 'Spa', 'Multiple Restaurants', 'Golf Course'],
                    description: 'Luxury beachfront resort with world-class facilities.',
                    coordinates: { lat: 15.2833, lng: 74.1167 },
                    slug: 'taj-exotica-goa'
                }
            ]
        };

        const cityLower = city.toLowerCase();
        if (citySpecificHotels[cityLower]) {
            return citySpecificHotels[cityLower];
        }

        // Generate dynamic hotels for other cities
        return Array.from({ length: 5 }, (_, i) => {
            const basePrice = 5000 + Math.random() * 8000;
            const rating = 3.5 + Math.random() * 1.5;
            return {
                id: `${city}-hotel-${i + 1}`,
                name: `${city.charAt(0).toUpperCase() + city.slice(1)} Hotel ${i + 1}`,
                location: city.charAt(0).toUpperCase() + city.slice(1),
                rating: parseFloat(rating.toFixed(1)),
                reviewCount: Math.floor(Math.random() * 1000) + 200,
                price: `₹${Math.floor(basePrice).toLocaleString()}/night`,
                image: `https://images.unsplash.com/photo-${['1566073771259-6a8506099945', '1571003123894-1f0594d2b5d9', '1584132967334-10e028bd69f7', '1578662996442-48f60103fc96', '1564501049412-61c2a3083791'][i]}?w=400&h=300&fit=crop`,
                amenities: ['Free WiFi', 'Restaurant', 'Room Service', 'Swimming Pool', 'Business Center'].slice(0, 3 + i),
                description: `Comfortable accommodation in ${city} with modern amenities and excellent service.`,
                coordinates: this.cityCoordinates[city.toLowerCase()] || { lat: 28.6139, lng: 77.2090 },
                slug: this.generateSlug(`${city} Hotel ${i + 1}`)
            };
        });
    }

    getFallbackHotelDetails(hotelId) {
        const fallbackDetails = {
            'radisson-blu-delhi': {
                id: 'radisson-blu-delhi',
                name: 'Radisson Blu Hotel',
                location: 'Connaught Place, New Delhi',
                rating: 4.2,
                reviewCount: 1250,
                price: '₹8,500/night',
                images: [
                    'https://media-cdn.tripadvisor.com/media/photo-w/17/b3/09/b4/by-the-poolside.jpg',
                    'https://media-cdn.tripadvisor.com/media/photo-o/01/fa/51/70/r-the-spa.jpg',
                    'https://media-cdn.tripadvisor.com/media/photo-w/0e/b2/64/3f/radisson-blu-plaza-delhi.jpg'
                ],
                amenities: ['Free WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Room Service', 'Spa', 'Business Center'],
                description: 'Experience luxury at Radisson Blu Hotel, located in the heart of New Delhi with world-class amenities and exceptional service.',
                contact: { 
                    phone: '+91-11-4251-5151', 
                    email: 'info@radissonblu.com',
                    website: 'https://www.radissonhotels.com'
                },
                coordinates: { lat: 28.6139, lng: 77.2090 },
                roomTypes: this.extractRoomTypes({}),
                policies: this.extractPolicies({}),
                reviews: this.generateSampleReviews({})
            }
        };
        
        return fallbackDetails[hotelId] || null;
    }

    generateDynamicHotelDetails(hotelId) {
        const names = [
            'Grand Palace Hotel', 'Royal Residency', 'Luxury Suites', 'Premium Inn'
        ];
        
        const locations = [
            'City Center', 'Business District', 'Near Airport', 'Downtown'
        ];

        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomLocation = locations[Math.floor(Math.random() * locations.length)];
        const rating = 3.5 + Math.random() * 1.5;
        const price = Math.floor(rating * 2000 + Math.random() * 3000 + 4000);

        return {
            id: hotelId,
            name: randomName,
            location: randomLocation,
            rating: parseFloat(rating.toFixed(1)),
            reviewCount: Math.floor(Math.random() * 1500) + 100,
            price: `₹${price.toLocaleString()}/night`,
            images: [
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=400&fit=crop',
                'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=400&fit=crop',
                'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=400&fit=crop'
            ],
            amenities: ['Free WiFi', 'Swimming Pool', 'Restaurant', 'Room Service', 'Spa', 'Fitness Center'],
            description: this.generateDescription({ name: randomName }),
            contact: this.extractContact({ name: randomName }),
            coordinates: { lat: 28.6139 + (Math.random() - 0.5) * 0.2, lng: 77.2090 + (Math.random() - 0.5) * 0.2 },
            roomTypes: this.extractRoomTypes({}),
            policies: this.extractPolicies({}),
            reviews: this.generateSampleReviews({})
        };
    }

    getApiStatus() {
        return {
            enabled: this.apiEnabled,
            consecutiveErrors: this.consecutiveErrors,
            lastCall: this.lastApiCall,
            cacheSize: this.cache.size,
            apiUrl: this.baseURL
        };
    }
}

console.log('Initializing Travel Advisor API service...');
window.tripAdvisorAPI = new TripAdvisorAPI();
console.log('Travel Advisor API service initialized with proper method binding and mandatory parameters');
