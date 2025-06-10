// Get URL parameters and populate booking details
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        hotel: params.get('hotel'),
        roomType: params.get('roomType'),
        guests: params.get('guests'),
        checkin: params.get('checkin'),
        checkout: params.get('checkout'),
        nights: params.get('nights'),
        pricePerNight: params.get('pricePerNight'),
        total: params.get('total')
    };
}

// Populate booking summary
function populateBookingSummary() {
    const bookingData = getUrlParams();
    
    if (bookingData.hotel) {
        document.getElementById('hotelName').textContent = bookingData.hotel;
        document.getElementById('roomType').textContent = bookingData.roomType;
        document.getElementById('guestCount').textContent = `${bookingData.guests} Guest${bookingData.guests > 1 ? 's' : ''}`;
        
        // Format dates
        const checkinDate = new Date(bookingData.checkin);
        const checkoutDate = new Date(bookingData.checkout);
        
        document.getElementById('checkinDate').textContent = checkinDate.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        document.getElementById('checkoutDate').textContent = checkoutDate.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        document.getElementById('nightCount').textContent = `${bookingData.nights} Night${bookingData.nights > 1 ? 's' : ''}`;
        
        // Price calculations
        const subtotal = parseInt(bookingData.total);
        const taxes = Math.round(subtotal * 0.12); // 12% tax
        const totalAmount = subtotal + taxes;
        
        document.getElementById('priceCalculation').textContent = `₹${parseInt(bookingData.pricePerNight).toLocaleString()} × ${bookingData.nights} nights`;
        document.getElementById('subtotal').textContent = `₹${subtotal.toLocaleString()}`;
        document.getElementById('taxes').textContent = `₹${taxes.toLocaleString()}`;
        document.getElementById('totalAmount').textContent = `₹${totalAmount.toLocaleString()}`;
        document.getElementById('payAmount').textContent = `₹${totalAmount.toLocaleString()}`;
    }
}

// Payment method switching
function setupPaymentMethods() {
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const cardDetails = document.getElementById('cardDetails');
    const upiDetails = document.getElementById('upiDetails');
    const netbankingDetails = document.getElementById('netbankingDetails');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            // Hide all payment sections
            cardDetails.classList.add('hidden');
            upiDetails.classList.add('hidden');
            netbankingDetails.classList.add('hidden');
            
            // Show selected payment section
            switch(this.value) {
                case 'card':
                    cardDetails.classList.remove('hidden');
                    break;
                case 'upi':
                    upiDetails.classList.remove('hidden');
                    break;
                case 'netbanking':
                    netbankingDetails.classList.remove('hidden');
                    break;
            }
        });
    });
}

// Card number formatting
function setupCardFormatting() {
    const cardNumberInput = document.getElementById('cardNumber');
    const expiryDateInput = document.getElementById('expiryDate');
    const cvvInput = document.getElementById('cvv');
    
    // Format card number with spaces
    cardNumberInput.addEventListener('input', function() {
        let value = this.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        this.value = formattedValue;
    });
    
    // Format expiry date MM/YY
    expiryDateInput.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        this.value = value;
    });
    
    // CVV numbers only
    cvvInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
}

// Form validation
function validateForm() {
    const form = document.getElementById('paymentForm');
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    // Basic validation
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const terms = document.getElementById('terms').checked;
    
    if (!firstName || !lastName || !email || !phone) {
        alert('Please fill in all guest information fields');
        return false;
    }
    
    if (!terms) {
        alert('Please agree to the terms and conditions');
        return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return false;
    }
    
    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
        alert('Please enter a valid 10-digit phone number');
        return false;
    }
    
    // Payment method specific validation
    if (paymentMethod === 'card') {
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;
        const cardName = document.getElementById('cardName').value.trim();
        
        if (!cardNumber || cardNumber.length !== 16) {
            alert('Please enter a valid 16-digit card number');
            return false;
        }
        
        if (!expiryDate || expiryDate.length !== 5) {
            alert('Please enter a valid expiry date (MM/YY)');
            return false;
        }
        
        if (!cvv || cvv.length !== 3) {
            alert('Please enter a valid 3-digit CVV');
            return false;
        }
        
        if (!cardName) {
            alert('Please enter the name on the card');
            return false;
        }
    } else if (paymentMethod === 'upi') {
        const upiId = document.getElementById('upiId').value.trim();
        if (!upiId || !upiId.includes('@')) {
            alert('Please enter a valid UPI ID');
            return false;
        }
    } else if (paymentMethod === 'netbanking') {
        const bankSelect = document.getElementById('bankSelect').value;
        if (!bankSelect) {
            alert('Please select a bank for net banking');
            return false;
        }
    }
    
    return true;
}

// Form submission
function setupFormSubmission() {
    const form = document.getElementById('paymentForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            // Show loading state
            const submitBtn = document.querySelector('.pay-now-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span>Processing...</span>';
            submitBtn.disabled = true;
            
            // Simulate payment processing
            setTimeout(() => {
                alert('Payment successful! Your booking has been confirmed. You will receive a confirmation email shortly.');
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Redirect to home page or booking confirmation
                window.location.href = 'index.html';
            }, 2000);
        }
    });
}

// Initialize payment page
document.addEventListener('DOMContentLoaded', function() {
    populateBookingSummary();
    setupPaymentMethods();
    setupCardFormatting();
    setupFormSubmission();
});
