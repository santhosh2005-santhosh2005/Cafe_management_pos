/* POS JS - LOGIC FOR MENU AND CART */

document.addEventListener('DOMContentLoaded', () => {
    const cartItemsList = document.getElementById('cart-items');
    const menuItemsGrid = document.getElementById('menu-items-grid');
    const categoryTabs = document.getElementById('category-tabs');
    const productSearch = document.getElementById('product-search');
    const priceFilter = document.getElementById('price-filter');

    const API_BASE_URL = '/api';
    
    let cart = [];
    let allProducts = [];
    let categories = [];
    let selectedCategoryId = 'all';
    let searchQuery = '';
    let maxPrice = 'all';

    // Fetch Products and Categories
    async function fetchData() {
        try {
            const [prodRes, catRes] = await Promise.all([
                fetch(`${API_BASE_URL}/products`),
                fetch(`${API_BASE_URL}/categories`)
            ]);
            
            const prodData = await prodRes.json();
            const catData = await catRes.json();

            if (prodData.success) allProducts = prodData.data;
            if (catData.success) categories = catData.data;

            renderCategories();
            filterAndRenderMenu();
        } catch (error) {
            console.error("Error fetching data:", error);
            // Fallback to mock data if server is down
            allProducts = [
                { _id: '1', name: 'Signature Cold Brew', basePrice: 4.80, category: { name: 'Cold Brew', _id: 'cb' }, imageUrl: 'assets/images/iced_coffee.png' },
                { _id: '2', name: 'Iced Caramel Latte', basePrice: 5.50, category: { name: 'Espresso', _id: 'es' }, imageUrl: 'assets/images/iced_coffee.png' },
                { _id: '3', name: 'Premium Bean Bag', basePrice: 25.00, category: { name: 'Merch', _id: 'me' }, imageUrl: 'assets/images/iced_coffee.png' }
            ];
            filterAndRenderMenu();
        }
    }

    function renderCategories() {
        categoryTabs.innerHTML = '<button class="cat-btn active" data-id="all">All</button>';
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.textContent = cat.name;
            btn.dataset.id = cat._id;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedCategoryId = cat._id;
                filterAndRenderMenu();
            });
            categoryTabs.appendChild(btn);
        });

        // Add listener to "All" button
        categoryTabs.querySelector('[data-id="all"]').addEventListener('click', (e) => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedCategoryId = 'all';
            filterAndRenderMenu();
        });
    }

    function filterAndRenderMenu() {
        const filtered = allProducts.filter(p => {
            const matchesCategory = selectedCategoryId === 'all' || (p.category && (p.category._id === selectedCategoryId || p.category === selectedCategoryId));
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPrice = maxPrice === 'all' || p.basePrice <= parseFloat(maxPrice);
            return matchesCategory && matchesSearch && matchesPrice;
        });

        renderMenu(filtered);
    }

    function renderMenu(products) {
        menuItemsGrid.innerHTML = '';
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'menu-item-card';
            card.innerHTML = `
                <div class="item-img">
                    ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name}" />` : `<div class="img-placeholder">${product.name.substring(0,2).toUpperCase()}</div>`}
                </div>
                <div class="item-info">
                    <div class="item-name">${product.name}</div>
                    <div class="item-price">$${product.basePrice.toFixed(2)}</div>
                </div>
            `;
            card.addEventListener('click', () => addToCart(product));
            menuItemsGrid.appendChild(card);
        });
    }

    function addToCart(product) {
        const existingItem = cart.find(i => i.productId === product._id);
        if (existingItem) {
            existingItem.qty += 1;
        } else {
            cart.push({
                productId: product._id,
                name: product.name,
                qty: 1,
                price: product.basePrice,
                imageUrl: product.imageUrl
            });
        }
        updateUI();
    }

    function updateUI() {
        cartItemsList.innerHTML = '';
        let subtotal = 0;

        cart.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            
            const itemTotal = item.qty * item.price;
            subtotal += itemTotal;

            itemEl.innerHTML = `
                <div class="cart-item-info">
                    <span class="item-qty">${item.qty}</span>
                    <div>
                        <div class="item-title">${item.name}</div>
                        <small>$${item.price.toFixed(2)} each</small>
                    </div>
                </div>
                <div class="item-price">$${itemTotal.toFixed(2)}</div>
            `;
            cartItemsList.appendChild(itemEl);
        });

        // Update summary (using original summary layout IDs/classes)
        const summaryLines = document.querySelectorAll('.summary-line span:last-child');
        if (summaryLines.length >= 3) {
            const tax = subtotal * 0.08;
            const total = subtotal + tax;
            
            summaryLines[0].textContent = `$${subtotal.toFixed(2)}`;
            summaryLines[1].textContent = `$${tax.toFixed(2)}`;
            summaryLines[2].textContent = `$${total.toFixed(2)}`;
        }
    }

    // Search handling
    productSearch.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        filterAndRenderMenu();
    });

    // Price filtering
    priceFilter.addEventListener('change', (e) => {
        maxPrice = e.target.value;
        filterAndRenderMenu();
    });

    // Initial load
    fetchData();
});
