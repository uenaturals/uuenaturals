// ============================================
// uenaturals - ORGANIC HAIR OIL WEBSITE
// JavaScript - Interactive Features with Shopping Cart
// ============================================

// Cart data stored in localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const ORDERS_STORAGE_KEY = 'orders';
const CUSTOMER_STORAGE_KEY = 'checkoutCustomer';
const ORDER_API_URL = window.__UENATURALS_ORDER_API_URL__ || 'http://localhost:4000/api/orders';

document.addEventListener('DOMContentLoaded', function() {
    initializeAll();
});

// Initialize all features
function initializeAll() {
    initFAQ();
    initTestimonials();
    initContactForm();
    initMobileMenu();
    initSmoothScroll();
    initProductButtons();
    initCart();
    initCheckout();
    updateCartBadge();
    observeElements();
}

// ============================================
// CART FUNCTIONALITY
// ============================================

function initCart() {
    const cartIcon = document.getElementById('cartIcon');
    const cartModal = document.getElementById('cartModal');
    const closeCartBtn = document.getElementById('closeCart');
    
    // Create overlay
    let overlay = document.querySelector('.cart-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'cart-overlay';
        document.body.appendChild(overlay);
    }
    
    // Open cart
    if (cartIcon) {
        cartIcon.addEventListener('click', openCart);
    }
    
    // Close cart
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', closeCart);
    }
    
    // Close cart when clicking overlay
    overlay.addEventListener('click', closeCart);
    
    function openCart() {
        cartModal.style.display = '';
        overlay.style.display = '';
        cartModal.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderCartItems();
    }
    
    function closeCart() {
        cartModal.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    window.openCart = openCart;
    window.closeCart = closeCart;
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartFooter.style.display = 'none';
        return;
    }
    
    cartItemsContainer.innerHTML = '';
    let total = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'cart-item';
        cartItemEl.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">PKR ${item.price.toLocaleString('en-IN')}</div>
            </div>
            <div class="cart-item-actions">
                <div class="qty-control">
                    <button class="qty-btn" onclick="decreaseQty(${index})">-</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="increaseQty(${index})">+</button>
                </div>
                <button class="remove-item" onclick="removeFromCart(${index})">Remove</button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItemEl);
    });
    
    // Update total
    document.getElementById('cartTotal').textContent = 'PKR ' + total.toLocaleString('en-IN');
    cartFooter.style.display = 'block';
}

function addToCart(productName, price) {
    // Check if item already exists
    const existingItem = cart.find(item => item.name === productName);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            name: productName,
            price: price,
            quantity: 1
        });
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    renderCheckoutSummary();
    showNotification(`${productName} added to cart!`, 'success');
}

function removeFromCart(index) {
    const item = cart[index];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    renderCartItems();
    renderCheckoutSummary();
    showNotification(`${item.name} removed from cart`, 'success');
}

function increaseQty(index) {
    cart[index].quantity++;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    renderCartItems();
    renderCheckoutSummary();
}

function decreaseQty(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity--;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
        renderCartItems();
        renderCheckoutSummary();
    }
}

function updateCartBadge() {
    const cartCountEl = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountEl) {
        cartCountEl.textContent = totalItems;
    }
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;

// ============================================
// CHECKOUT FLOW
// ============================================

function initCheckout() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    const backToCartBtn = document.getElementById('backToCartBtn');
    const checkoutForm = document.getElementById('checkoutForm');
    const continueShoppingBtn = document.getElementById('continueShoppingBtn');

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(event) {
            // Always route to dedicated checkout page for reliable behavior.
            event.preventDefault();
            window.location.href = 'checkout.html';
        });
    }

    // Fallback delegation ensures checkout still opens if the button is re-rendered.
    document.addEventListener('click', function(event) {
        const checkoutTrigger = event.target.closest('#checkoutBtn');
        if (checkoutTrigger) {
            openCheckout();
        }
    });

    if (backToCartBtn) {
        backToCartBtn.addEventListener('click', function() {
            setCheckoutVisibility(false);
            if (window.openCart) {
                window.openCart();
            }
        });
    }

    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', function() {
            setConfirmationVisibility(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            showNotification('You can continue shopping now.', 'success');
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }

    restoreSavedCustomerDetails();
    renderCheckoutSummary();
}

function initProductButtons() {
    const buttons = document.querySelectorAll('[data-product]');

    buttons.forEach((button) => {
        button.addEventListener('click', function() {
            const productName = button.getAttribute('data-product') || 'UENATURALS Hair Oil';
            const price = Number(button.getAttribute('data-price') || 0);

            if (!price) {
                showNotification('Product price is missing.', 'error');
                return;
            }

            addToCart(productName, price);
        });
    });
}

function openCheckout() {
    if (!cart.length) {
        showNotification('Your cart is empty. Add products before checkout.', 'error');
        return;
    }

    // Force close cart modal/overlay in case stale event bindings keep it open.
    const cartModal = document.getElementById('cartModal');
    const cartOverlay = document.querySelector('.cart-overlay');
    if (cartModal) {
        cartModal.classList.remove('active');
    }
    if (cartOverlay) {
        cartOverlay.classList.remove('active');
    }
    document.body.style.overflow = 'auto';

    if (window.closeCart) {
        window.closeCart();
    }

    setConfirmationVisibility(false);
    renderCheckoutSummary();
    setCheckoutVisibility(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.openCheckout = openCheckout;

async function handleCheckoutSubmit(e) {
    e.preventDefault();

    if (!cart.length) {
        showNotification('Your cart is empty. Add products before placing an order.', 'error');
        return;
    }

    const checkoutForm = e.currentTarget;
    const orderData = collectCheckoutData(checkoutForm);
    const validation = validateCheckoutData(orderData);
    const submitBtn = document.getElementById('placeOrderBtn');

    if (!validation.valid) {
        showNotification(validation.message, 'error');
        if (validation.focusFieldId) {
            const field = document.getElementById(validation.focusFieldId);
            if (field) {
                field.focus();
            }
        }
        return;
    }

    const orderNumber = `UE${Date.now().toString().slice(-8)}`;
    const orderTotal = getCartTotal();
    const order = {
        orderNumber,
        createdAt: new Date().toISOString(),
        customer: {
            fullName: orderData.fullName,
            emailAddress: orderData.emailAddress,
            phoneNumber: orderData.phoneNumber
        },
        shippingAddress: {
            houseNumber: orderData.houseNumber,
            streetAddress: orderData.streetAddress,
            city: orderData.city,
            stateProvince: orderData.stateProvince,
            postalCode: orderData.postalCode,
            country: orderData.country
        },
        paymentMethod: orderData.paymentMethod,
        items: cart.map(item => ({ ...item })),
        total: orderTotal
    };

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Placing Order...';
    }

    const apiResult = await saveOrderToApi(order);
    if (apiResult.success && apiResult.data && apiResult.data.orderNumber) {
        order.orderNumber = apiResult.data.orderNumber;
    }

    // Keep local backup even when API succeeds for resilience.
    persistOrder(order);
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(orderData));

    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    renderCartItems();
    renderCheckoutSummary();

    showConfirmation(order);
    setCheckoutVisibility(false);
    setConfirmationVisibility(true);
    checkoutForm.reset();
    restoreSavedCustomerDetails();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Place Order';
    }

    if (!apiResult.success) {
        showNotification('Order placed and saved locally. API server is currently unavailable.', 'error');
    }
}

async function saveOrderToApi(order) {
    try {
        const response = await fetch(ORDER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(order)
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const payload = await response.json().catch(() => null);
        return { success: true, data: payload };
    } catch (error) {
        console.warn('Order API unavailable:', error);
        return { success: false, error: error.message };
    }
}

function collectCheckoutData(form) {
    const paymentMethodInput = form.querySelector('input[name="paymentMethod"]:checked');

    return {
        fullName: form.fullName.value.trim(),
        emailAddress: form.emailAddress.value.trim(),
        phoneNumber: form.phoneNumber.value.trim(),
        houseNumber: form.houseNumber.value.trim(),
        streetAddress: form.streetAddress.value.trim(),
        city: form.city.value.trim(),
        stateProvince: form.stateProvince.value.trim(),
        postalCode: form.postalCode.value.trim(),
        country: form.country.value.trim(),
        paymentMethod: paymentMethodInput ? paymentMethodInput.value : ''
    };
}

function validateCheckoutData(data) {
    const requiredFields = [
        ['fullName', 'Full Name is required.'],
        ['emailAddress', 'Email Address is required.'],
        ['phoneNumber', 'Phone Number is required.'],
        ['houseNumber', 'House/Apartment Number is required.'],
        ['streetAddress', 'Street Address is required.'],
        ['city', 'City is required.'],
        ['stateProvince', 'State/Province is required.'],
        ['postalCode', 'Postal Code is required.'],
        ['country', 'Country is required.']
    ];

    for (const [fieldName, message] of requiredFields) {
        if (!data[fieldName]) {
            return { valid: false, message, focusFieldId: fieldName };
        }
    }

    if (!isValidEmail(data.emailAddress)) {
        return { valid: false, message: 'Please enter a valid Email Address.', focusFieldId: 'emailAddress' };
    }

    const cleanPhone = data.phoneNumber.replace(/[\s\-()+]/g, '');
    if (!/^\d{7,15}$/.test(cleanPhone)) {
        return { valid: false, message: 'Please enter a valid Phone Number.', focusFieldId: 'phoneNumber' };
    }

    if (!data.paymentMethod) {
        return { valid: false, message: 'Please select a Payment Method.', focusFieldId: 'paymentOptions' };
    }

    return { valid: true };
}

function renderCheckoutSummary() {
    const summaryItems = document.getElementById('checkoutSummaryItems');
    const grandTotal = document.getElementById('checkoutGrandTotal');

    if (!summaryItems || !grandTotal) {
        return;
    }

    if (!cart.length) {
        summaryItems.innerHTML = '<p class="checkout-empty">Your cart is empty.</p>';
        grandTotal.textContent = 'PKR 0';
        return;
    }

    summaryItems.innerHTML = '';
    cart.forEach(item => {
        const lineItem = document.createElement('div');
        lineItem.className = 'order-line-item';
        lineItem.innerHTML = `
            <span class="line-product">${item.name}</span>
            <span class="line-qty">${item.quantity}</span>
            <span class="line-price">PKR ${(item.price * item.quantity).toLocaleString('en-IN')}</span>
        `;
        summaryItems.appendChild(lineItem);
    });

    grandTotal.textContent = `PKR ${getCartTotal().toLocaleString('en-IN')}`;
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function setCheckoutVisibility(visible) {
    const checkoutSection = document.getElementById('checkoutSection');
    const cartModal = document.getElementById('cartModal');
    const cartOverlay = document.querySelector('.cart-overlay');
    if (!checkoutSection) {
        return;
    }

    checkoutSection.classList.toggle('active', visible);
    document.body.classList.toggle('checkout-active', visible);
    if (visible) {
        document.body.classList.remove('confirmation-active');
        const confirmationSection = document.getElementById('confirmationSection');
        if (confirmationSection) {
            confirmationSection.classList.remove('active');
        }

        // Hard-hide cart UI so checkout is always visible.
        if (cartModal) {
            cartModal.classList.remove('active');
            cartModal.style.display = 'none';
        }
        if (cartOverlay) {
            cartOverlay.classList.remove('active');
            cartOverlay.style.display = 'none';
        }
        document.body.style.overflow = 'auto';
    } else {
        if (cartModal) {
            cartModal.style.display = '';
        }
        if (cartOverlay) {
            cartOverlay.style.display = '';
        }
    }
}

function setConfirmationVisibility(visible) {
    const confirmationSection = document.getElementById('confirmationSection');
    if (!confirmationSection) {
        return;
    }

    confirmationSection.classList.toggle('active', visible);
    document.body.classList.toggle('confirmation-active', visible);
    if (visible) {
        document.body.classList.remove('checkout-active');
        const checkoutSection = document.getElementById('checkoutSection');
        if (checkoutSection) {
            checkoutSection.classList.remove('active');
        }
    }
}

function persistOrder(order) {
    const allOrders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
    allOrders.push(order);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(allOrders));
}

function showConfirmation(order) {
    const orderNumber = document.getElementById('confirmOrderNumber');
    const customerName = document.getElementById('confirmCustomerName');
    const orderTotal = document.getElementById('confirmOrderTotal');
    const message = document.getElementById('confirmationMessage');

    if (orderNumber) {
        orderNumber.textContent = order.orderNumber;
    }
    if (customerName) {
        customerName.textContent = order.customer.fullName;
    }
    if (orderTotal) {
        orderTotal.textContent = `₹${order.total.toLocaleString('en-IN')}`;
    }
    if (message) {
        message.textContent = 'Thank you for shopping with uenaturals. We have received your order and will contact you shortly.';
    }
}

function restoreSavedCustomerDetails() {
    const checkoutForm = document.getElementById('checkoutForm');
    const saved = JSON.parse(localStorage.getItem(CUSTOMER_STORAGE_KEY) || 'null');

    if (!checkoutForm || !saved) {
        return;
    }

    checkoutForm.fullName.value = saved.fullName || '';
    checkoutForm.emailAddress.value = saved.emailAddress || '';
    checkoutForm.phoneNumber.value = saved.phoneNumber || '';
    checkoutForm.houseNumber.value = saved.houseNumber || '';
    checkoutForm.streetAddress.value = saved.streetAddress || '';
    checkoutForm.city.value = saved.city || '';
    checkoutForm.stateProvince.value = saved.stateProvince || '';
    checkoutForm.postalCode.value = saved.postalCode || '';
    checkoutForm.country.value = saved.country || '';

    if (saved.paymentMethod) {
        const paymentRadio = checkoutForm.querySelector(`input[name="paymentMethod"][value="${saved.paymentMethod}"]`);
        if (paymentRadio) {
            paymentRadio.checked = true;
        }
    }
}

// ============================================
// FAQ ACCORDION
// ============================================

function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            // Close other items
            faqItems.forEach(other => {
                if (other !== item) {
                    other.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
}

// ============================================
// TESTIMONIALS SLIDER
// ============================================

function initTestimonials() {
    const testimonials = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.querySelector('.slider-btn.prev');
    const nextBtn = document.querySelector('.slider-btn.next');
    let currentIndex = 0;
    
    if (testimonials.length === 0) return;
    
    function showTestimonial(index) {
        testimonials.forEach((card, i) => {
            card.classList.remove('active');
            if (i === index) {
                card.classList.add('active');
            }
        });
    }
    
    function nextTestimonial() {
        currentIndex = (currentIndex + 1) % testimonials.length;
        showTestimonial(currentIndex);
    }
    
    function prevTestimonial() {
        currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
        showTestimonial(currentIndex);
    }
    
    // Show first testimonial
    showTestimonial(0);
    
    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', nextTestimonial);
    if (prevBtn) prevBtn.addEventListener('click', prevTestimonial);
    
    // Auto rotate testimonials every 5 seconds
    setInterval(nextTestimonial, 5000);
}

// ============================================
// CONTACT FORM
// ============================================

function initContactForm() {
    const form = document.getElementById('contactForm');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = form.querySelector('input[type="text"]').value;
            const email = form.querySelector('input[type="email"]').value;
            const message = form.querySelector('textarea').value;
            
            // Validation
            if (!name || !email || !message) {
                showNotification('Please fill all fields', 'error');
                return;
            }
            
            // Email validation
            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email', 'error');
                return;
            }
            
            // Simulate form submission
            const submitBtn = form.querySelector('button');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
                form.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1500);
        });
    }
}

// Email validation
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Show notification
function showNotification(message, type) {
    // Remove existing notification if any
    const existingNotif = document.querySelector('.notification');
    if (existingNotif) {
        existingNotif.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#6B8E6F' : '#FF6B6B'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// MOBILE MENU
// ============================================

function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            
            // Animate hamburger
            const spans = hamburger.querySelectorAll('span');
            spans.forEach(span => {
                span.style.transition = 'all 0.3s ease';
            });
            
            if (navLinks.style.display === 'flex') {
                spans[0].style.transform = 'rotate(45deg) translate(10px, 10px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
        
        // Close menu when link is clicked
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', function() {
                navLinks.style.display = 'none';
                const spans = hamburger.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    }
}

// ============================================
// SMOOTH SCROLL
// ============================================

function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Only smooth scroll for valid section IDs
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                const target = document.querySelector(href);
                const offsetTop = target.offsetTop - 80;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// PRODUCT BUTTONS
// ============================================

function initProductButtons() {
    const addToCartButtons = document.querySelectorAll('.product-card .btn-secondary');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get product name and price from the card
            const card = this.closest('.product-card');
            const productName = card.querySelector('h3').textContent;
            const priceText = card.querySelector('.price').textContent.replace('₹', '').replace(',', '');
            const price = parseInt(priceText);
            
            // Add to cart
            addToCart(productName, price);
            
            // Show feedback
            const originalText = this.textContent;
            this.textContent = '✓ Added';
            this.style.background = '#6B8E6F';
            
            // Restore button
            setTimeout(() => {
                this.textContent = originalText;
                this.style.background = '';
            }, 1500);
        });
    });
}

// ============================================
// SCROLL ANIMATIONS
// ============================================

function observeElements() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe cards and sections
    const elements = document.querySelectorAll(
        '.product-card, .ingredient-card, .benefit-item, ' +
        '.why-card, .testimonial-card, .before-after-item'
    );
    
    elements.forEach(el => {
        observer.observe(el);
    });
}

// ============================================
// NEWSLETTER SUBSCRIPTION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="email"]').value;
            
            if (isValidEmail(email)) {
                showNotification('Thank you for subscribing!', 'success');
                this.reset();
            } else {
                showNotification('Please enter a valid email', 'error');
            }
        });
    }
});

// ============================================
// PAGE LOAD ANIMATIONS
// ============================================

window.addEventListener('load', function() {
    // Fade in hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.animation = 'slideUp 0.8s ease';
    }
});

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================

// Lazy load images (if needed)
if ('IntersectionObserver' in window) {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Debounce function for scroll/resize events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add scroll event listener for navbar effects
window.addEventListener('scroll', debounce(function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
    }
}, 100));

// ============================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================

// Add focus visible styles for keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        document.body.style.outlineOffset = '2px';
    }
});

document.addEventListener('mousedown', function() {
    document.body.style.outlineOffset = '';
});

console.log('✓ uenaturals website loaded successfully!');
