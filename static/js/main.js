/**
 * AURA Luxe Modern Atelier - Frontend Application Logic
 * Interacts with Python Flask REST APIs for real-time catalog, cart, and checkout.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    const state = {
        products: [],
        filteredProducts: [],
        currentCategory: 'all',
        searchQuery: '',
        sortBy: 'featured',
        cart: JSON.parse(localStorage.getItem('aura_cart')) || [],
        wishlist: JSON.parse(localStorage.getItem('aura_wishlist')) || [],
        discount: 0, // Percentage discount
        appliedPromo: ''
    };

    // --- DOM Elements ---
    const productGrid = document.getElementById('productGrid');
    const categoryTabs = document.getElementById('categoryTabs');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const sortSelect = document.getElementById('sortSelect');
    const resultsCount = document.getElementById('resultsCount');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const themeToggle = document.getElementById('themeToggle');

    // Cart Elements
    const cartBtn = document.getElementById('cartBtn');
    const cartDrawer = document.getElementById('cartDrawer');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartCount = document.getElementById('cartCount');
    const drawerCartCount = document.getElementById('drawerCartCount');
    const cartTotalPrice = document.getElementById('cartTotalPrice');
    const promoInput = document.getElementById('promoInput');
    const applyPromoBtn = document.getElementById('applyPromoBtn');
    const discountRow = document.getElementById('discountRow');
    const discountValue = document.getElementById('discountValue');
    const checkoutBtn = document.getElementById('checkoutBtn');

    // Modal Elements
    const quickViewOverlay = document.getElementById('quickViewOverlay');
    const closeQuickView = document.getElementById('closeQuickView');
    const quickViewBody = document.getElementById('quickViewBody');
    const checkoutOverlay = document.getElementById('checkoutOverlay');
    const closeCheckout = document.getElementById('closeCheckout');
    const checkoutForm = document.getElementById('checkoutForm');
    const checkoutSummaryBox = document.getElementById('checkoutSummaryBox');

    // Toast Container
    const toastContainer = document.getElementById('toastContainer');
    const newsletterForm = document.getElementById('newsletterForm');

    // --- Initialize App ---
    setupThemeToggle();
    init();

    function setupThemeToggle() {
        const updateThemeToggle = (theme) => {
            const nextTheme = theme === 'dark' ? 'light' : 'dark';
            themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
            themeToggle.setAttribute('title', `Switch to ${nextTheme} mode`);
            themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
        };

        const currentTheme = document.documentElement.dataset.theme || 'dark';
        updateThemeToggle(currentTheme);

        themeToggle.addEventListener('click', () => {
            const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.dataset.theme = theme;
            localStorage.setItem('aura_theme', theme);
            updateThemeToggle(theme);
        });
    }

    async function init() {
        await fetchProducts();
        setupEventListeners();
        updateCartUI();
    }

    // --- Fetch Products from Flask API ---
    async function fetchProducts() {
        try {
            const res = await fetch(`/api/products`);
            const data = await res.json();

            if (data.status === 'success') {
                state.products = data.products;
                applyFiltersAndRender();
            } else {
                showToast('Failed to load catalog data from server', 'error');
            }
        } catch (err) {
            console.error('API Fetch Error:', err);
            showToast('Error connecting to Python backend API', 'error');
        }
    }

    // --- Filter, Sort, and Render Catalog ---
    function applyFiltersAndRender() {
        let result = [...state.products];

        // 1. Category Filter
        if (state.currentCategory !== 'all') {
            result = result.filter(p => p.category === state.currentCategory);
        }

        // 2. Search Filter
        if (state.searchQuery.trim() !== '') {
            const q = state.searchQuery.toLowerCase();
            result = result.filter(p => 
                p.name.toLowerCase().includes(q) || 
                p.description.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
            );
        }

        // 3. Sorting
        if (state.sortBy === 'price-low') {
            result.sort((a, b) => a.price - b.price);
        } else if (state.sortBy === 'price-high') {
            result.sort((a, b) => b.price - a.price);
        } else if (state.sortBy === 'rating') {
            result.sort((a, b) => b.rating - a.rating);
        }

        state.filteredProducts = result;
        renderProducts(result);
        updateResultsInfo();
    }

    function renderProducts(items) {
        if (items.length === 0) {
            productGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-compass"></i>
                    <h3>No Atelier Creations Found</h3>
                    <p>We could not find any items matching your selected filter or query.</p>
                    <button class="btn btn-secondary btn-sm" style="margin-top:1rem;" id="resetInEmpty">Reset Search & Filters</button>
                </div>
            `;
            document.getElementById('resetInEmpty')?.addEventListener('click', resetFilters);
            return;
        }

        productGrid.innerHTML = items.map(product => `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                    <span class="product-badge">${product.badge}</span>
                    <button class="quick-view-btn" data-action="quick-view" data-id="${product.id}">
                        <i class="fa-solid fa-eye"></i> Quick View
                    </button>
                </div>
                <div class="product-info">
                    <span class="product-category-tag">${product.category}</span>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-rating">
                        <i class="fa-solid fa-star"></i>
                        <span>${product.rating}</span>
                        <span class="reviews-count">(${product.reviews} reviews)</span>
                    </div>
                    <div class="product-bottom">
                        <div class="price-box">
                            <span class="current-price">$${product.price.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                            ${product.originalPrice ? `<span class="original-price">$${product.originalPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>` : ''}
                        </div>
                        <button class="add-to-cart-btn" data-action="add-cart" data-id="${product.id}" title="Add to Bag">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function updateResultsInfo() {
        const count = state.filteredProducts.length;
        resultsCount.textContent = `Showing ${count} item${count === 1 ? '' : 's'}`;
        
        const isFiltered = state.currentCategory !== 'all' || state.searchQuery !== '' || state.sortBy !== 'featured';
        resetFiltersBtn.hidden = !isFiltered;
    }

    function resetFilters() {
        state.currentCategory = 'all';
        state.searchQuery = '';
        state.sortBy = 'featured';
        
        searchInput.value = '';
        clearSearchBtn.hidden = true;
        sortSelect.value = 'featured';

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === 'all');
        });

        applyFiltersAndRender();
        showToast('Filters reset to default', 'info');
    }

    // --- Cart Management ---
    function addToCart(productId) {
        const product = state.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = state.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            state.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
                quantity: 1
            });
        }

        saveCart();
        updateCartUI();
        showToast(`Added <strong>${product.name}</strong> to your bag!`, 'success');
    }

    function updateQuantity(productId, delta) {
        const item = state.cart.find(i => i.id === productId);
        if (!item) return;

        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCartUI();
        }
    }

    function removeFromCart(productId) {
        const item = state.cart.find(i => i.id === productId);
        state.cart = state.cart.filter(i => i.id !== productId);
        saveCart();
        updateCartUI();
        if (item) {
            showToast(`Removed ${item.name} from bag`, 'info');
        }
    }

    function saveCart() {
        localStorage.setItem('aura_cart', JSON.stringify(state.cart));
    }

    function updateCartUI() {
        const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        drawerCartCount.textContent = totalItems;

        if (state.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-state" style="padding: 2rem 0;">
                    <i class="fa-solid fa-bag-shopping" style="font-size: 2.5rem; margin-bottom: 0.5rem;"></i>
                    <p>Your shopping bag is currently empty.</p>
                </div>
            `;
        } else {
            cartItemsContainer.innerHTML = state.cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.name}</h4>
                        <span class="cart-item-price">$${(item.price * item.quantity).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                        <div class="cart-item-actions">
                            <div class="qty-control">
                                <button class="qty-btn" data-action="qty-minus" data-id="${item.id}"><i class="fa-solid fa-minus"></i></button>
                                <span>${item.quantity}</span>
                                <button class="qty-btn" data-action="qty-plus" data-id="${item.id}"><i class="fa-solid fa-plus"></i></button>
                            </div>
                            <button class="remove-item-btn" data-action="remove" data-id="${item.id}"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Subtotal and Total calculations
        const rawTotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmt = rawTotal * (state.discount / 100);
        const finalTotal = rawTotal - discountAmt;

        if (state.discount > 0) {
            discountRow.hidden = false;
            discountValue.textContent = `-$${discountAmt.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
        } else {
            discountRow.hidden = true;
        }

        cartTotalPrice.textContent = `$${finalTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    }

    // --- Quick View Modal ---
    function openQuickView(productId) {
        const product = state.products.find(p => p.id === productId);
        if (!product) return;

        quickViewBody.innerHTML = `
            <div class="quick-view-grid">
                <div class="modal-img-container">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="modal-info-col">
                    <span class="product-category-tag">${product.category}</span>
                    <h2>${product.name}</h2>
                    <div class="product-rating">
                        <i class="fa-solid fa-star"></i> <span>${product.rating}</span> (${product.reviews} reviews)
                    </div>
                    <div class="price-box">
                        <span class="current-price">$${product.price.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                    </div>
                    <p>${product.description}</p>

                    <h4 style="font-size:0.9rem; margin-bottom:0.6rem; color:#fff;">Craftsmanship Highlights:</h4>
                    <ul class="feature-list">
                        ${product.features.map(f => `<li><i class="fa-solid fa-check"></i> ${f}</li>`).join('')}
                    </ul>

                    <button class="btn btn-gold btn-block" id="modalAddCart" data-id="${product.id}">
                        <i class="fa-solid fa-bag-shopping"></i> Add to Atelier Bag
                    </button>
                </div>
            </div>
        `;

        quickViewOverlay.classList.add('active');

        document.getElementById('modalAddCart')?.addEventListener('click', () => {
            addToCart(product.id);
            quickViewOverlay.classList.remove('active');
        });
    }

    // --- Checkout Logic ---
    function openCheckout() {
        if (state.cart.length === 0) {
            showToast('Your cart is empty. Please add items before checking out.', 'error');
            return;
        }

        const rawTotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmt = rawTotal * (state.discount / 100);
        const finalTotal = rawTotal - discountAmt;

        checkoutSummaryBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
                <span style="color:var(--color-text-muted);">Items (${state.cart.length})</span>
                <span style="color:#fff;">$${rawTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
            ${state.discount > 0 ? `
                <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem; color:#10b981;">
                    <span>Promo Discount (${state.discount}%)</span>
                    <span>-$${discountAmt.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
            ` : ''}
            <div style="display:flex; justify-content:space-between; font-weight:700; font-size:1.1rem; color:#fff; padding-top:0.6rem; border-top:1px solid rgba(255,255,255,0.1);">
                <span>Order Total</span>
                <span style="color:var(--color-gold-light);">$${finalTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
        `;

        cartDrawer.classList.remove('active');
        cartOverlay.classList.remove('active');
        checkoutOverlay.classList.add('active');
    }

    async function handleCheckoutSubmit(e) {
        e.preventDefault();
        const submitBtn = document.getElementById('submitOrderBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing Order...`;

        try {
            const payload = {
                items: state.cart,
                customer: {
                    firstName: document.getElementById('firstName').value,
                    lastName: document.getElementById('lastName').value,
                    email: document.getElementById('email').value,
                    address: document.getElementById('address').value,
                    city: document.getElementById('city').value,
                    postalCode: document.getElementById('postalCode').value
                }
            };

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.status === 'success') {
                showToast(`Order Confirmed! Order Ref: <strong>${data.orderId}</strong>`, 'success');
                state.cart = [];
                state.discount = 0;
                saveCart();
                updateCartUI();
                checkoutOverlay.classList.remove('active');
                checkoutForm.reset();
            } else {
                showToast(data.message || 'Checkout failed', 'error');
            }
        } catch (err) {
            console.error('Checkout API error:', err);
            showToast('Failed to contact checkout service', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Confirm & Place Order <i class="fa-solid fa-check"></i>`;
        }
    }

    // --- Toast Notifications ---
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'fa-circle-info';
        if (type === 'success') icon = 'fa-circle-check';
        if (type === 'error') icon = 'fa-circle-exclamation';

        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        // Category tabs click
        categoryTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab-btn');
            if (!btn) return;

            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            state.currentCategory = btn.dataset.category;
            applyFiltersAndRender();
        });

        // Search input
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            clearSearchBtn.hidden = state.searchQuery.length === 0;
            applyFiltersAndRender();
        });

        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            state.searchQuery = '';
            clearSearchBtn.hidden = true;
            applyFiltersAndRender();
        });

        // Sort Select
        sortSelect.addEventListener('change', (e) => {
            state.sortBy = e.target.value;
            applyFiltersAndRender();
        });

        resetFiltersBtn.addEventListener('click', resetFilters);

        // Product Grid Action Clicks (Add to cart, Quick View)
        productGrid.addEventListener('click', (e) => {
            const addBtn = e.target.closest('[data-action="add-cart"]');
            const quickBtn = e.target.closest('[data-action="quick-view"]');

            if (addBtn) {
                const id = parseInt(addBtn.dataset.id, 10);
                addToCart(id);
            } else if (quickBtn) {
                const id = parseInt(quickBtn.dataset.id, 10);
                openQuickView(id);
            }
        });

        // Cart Drawer Toggles
        cartBtn.addEventListener('click', () => {
            cartDrawer.classList.add('active');
            cartOverlay.classList.add('active');
        });

        const closeDrawer = () => {
            cartDrawer.classList.remove('active');
            cartOverlay.classList.remove('active');
        };

        closeCartBtn.addEventListener('click', closeDrawer);
        cartOverlay.addEventListener('click', closeDrawer);

        // Cart Item Actions (Quantity, Remove)
        cartItemsContainer.addEventListener('click', (e) => {
            const minusBtn = e.target.closest('[data-action="qty-minus"]');
            const plusBtn = e.target.closest('[data-action="qty-plus"]');
            const removeBtn = e.target.closest('[data-action="remove"]');

            if (minusBtn) {
                updateQuantity(parseInt(minusBtn.dataset.id, 10), -1);
            } else if (plusBtn) {
                updateQuantity(parseInt(plusBtn.dataset.id, 10), 1);
            } else if (removeBtn) {
                removeFromCart(parseInt(removeBtn.dataset.id, 10));
            }
        });

        // Promo Code
        applyPromoBtn.addEventListener('click', () => {
            const code = promoInput.value.trim().toUpperCase();
            if (code === 'AURA20') {
                state.discount = 20;
                state.appliedPromo = 'AURA20';
                updateCartUI();
                showToast('20% VIP Privé discount applied!', 'success');
            } else if (code === '') {
                showToast('Please enter a valid promo code.', 'error');
            } else {
                showToast('Invalid promo code.', 'error');
            }
        });

        // Modal Closures
        closeQuickView.addEventListener('click', () => quickViewOverlay.classList.remove('active'));
        quickViewOverlay.addEventListener('click', (e) => {
            if (e.target === quickViewOverlay) quickViewOverlay.classList.remove('active');
        });

        checkoutBtn.addEventListener('click', openCheckout);
        closeCheckout.addEventListener('click', () => checkoutOverlay.classList.remove('active'));
        checkoutOverlay.addEventListener('click', (e) => {
            if (e.target === checkoutOverlay) checkoutOverlay.classList.remove('active');
        });

        // Checkout Form Submit
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);

        // Newsletter Form
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletterEmail').value;
            showToast(`Thank you! <strong>${email}</strong> is now registered for Privé Salon drops.`, 'success');
            newsletterForm.reset();
        });
    }
});
