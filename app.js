class HairShopCatalog {
    constructor() {
        this.products = [];
        this.filters = {
            minLength: 14,
            maxLength: 30,
            minPrice: 1000,
            maxPrice: 10000,
            colors: []
        };
        this.filterRanges = {
            length: { min: 14, max: 30 },
            price: { min: 1000, max: 10000 }
        };
        
        this.init();
    }

    async init() {
        await this.loadFilterRanges();
        await this.loadProducts();
        this.setupEventListeners();
        this.updateRangeSliders();
    }

    async loadFilterRanges() {
        try {
            const response = await fetch('/api/products/filters/range');
            this.filterRanges = await response.json();
            
            // Обновляем ползунки
            this.updateRangeSliders();
        } catch (error) {
            console.error('Error loading filter ranges:', error);
        }
    }

    updateRangeSliders() {
        // Длина
        document.getElementById('lengthMin').min = this.filterRanges.length.min;
        document.getElementById('lengthMin').max = this.filterRanges.length.max;
        document.getElementById('lengthMin').value = this.filterRanges.length.min;
        
        document.getElementById('lengthMax').min = this.filterRanges.length.min;
        document.getElementById('lengthMax').max = this.filterRanges.length.max;
        document.getElementById('lengthMax').value = this.filterRanges.length.max;
        
        // Цена
        document.getElementById('priceMin').min = this.filterRanges.price.min;
        document.getElementById('priceMin').max = this.filterRanges.price.max;
        document.getElementById('priceMin').value = this.filterRanges.price.min;
        
        document.getElementById('priceMax').min = this.filterRanges.price.min;
        document.getElementById('priceMax').max = this.filterRanges.price.max;
        document.getElementById('priceMax').value = this.filterRanges.price.max;
        
        this.updateRangeValues();
    }

    updateRangeValues() {
        document.getElementById('lengthValue').textContent = 
            `${this.filters.minLength}-${this.filters.maxLength} см`;
        
        document.getElementById('priceValue').textContent = 
            `${this.filters.minPrice}-${this.filters.maxPrice} ₽`;
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/products');
            this.products = await response.json();
            this.renderProducts();
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    setupEventListeners() {
        // Ползунки длины
        document.getElementById('lengthMin').addEventListener('input', (e) => {
            this.filters.minLength = parseInt(e.target.value);
            if (this.filters.minLength > this.filters.maxLength) {
                this.filters.maxLength = this.filters.minLength;
                document.getElementById('lengthMax').value = this.filters.maxLength;
            }
            this.updateRangeValues();
            this.applyFilters();
        });

        document.getElementById('lengthMax').addEventListener('input', (e) => {
            this.filters.maxLength = parseInt(e.target.value);
            if (this.filters.maxLength < this.filters.minLength) {
                this.filters.minLength = this.filters.maxLength;
                document.getElementById('lengthMin').value = this.filters.minLength;
            }
            this.updateRangeValues();
            this.applyFilters();
        });

        // Ползунки цены
        document.getElementById('priceMin').addEventListener('input', (e) => {
            this.filters.minPrice = parseInt(e.target.value);
            if (this.filters.minPrice > this.filters.maxPrice) {
                this.filters.maxPrice = this.filters.minPrice;
                document.getElementById('priceMax').value = this.filters.maxPrice;
            }
            this.updateRangeValues();
            this.applyFilters();
        });

        document.getElementById('priceMax').addEventListener('input', (e) => {
            this.filters.maxPrice = parseInt(e.target.value);
            if (this.filters.maxPrice < this.filters.minPrice) {
                this.filters.minPrice = this.filters.maxPrice;
                document.getElementById('priceMin').value = this.filters.minPrice;
            }
            this.updateRangeValues();
            this.applyFilters();
        });

        // Цвета
        document.getElementById('colorFilter').addEventListener('change', (e) => {
            this.filters.colors = Array.from(e.target.selectedOptions).map(opt => opt.value);
            this.applyFilters();
        });

        // Кнопки
        document.getElementById('applyFilters').addEventListener('click', () => this.applyFilters());
        document.getElementById('resetFilters').addEventListener('click', () => this.resetFilters());
    }

    applyFilters() {
        const filteredProducts = this.products.filter(product => {
            // Фильтр по длине
            const lengthMatch = product.length >= this.filters.minLength && 
                              product.length <= this.filters.maxLength;
            
            // Фильтр по цене
            const priceMatch = product.price >= this.filters.minPrice && 
                             product.price <= this.filters.maxPrice;
            
            // Фильтр по цвету
            const colorMatch = this.filters.colors.length === 0 || 
                             this.filters.colors.includes(product.color);
            
            return lengthMatch && priceMatch && colorMatch;
        });
        
        this.renderProducts(filteredProducts);
    }

    resetFilters() {
        this.filters = {
            minLength: this.filterRanges.length.min,
            maxLength: this.filterRanges.length.max,
            minPrice: this.filterRanges.price.min,
            maxPrice: this.filterRanges.price.max,
            colors: []
        };
        
        this.updateRangeSliders();
        this.applyFilters();
    }

    renderProducts(products = this.products) {
        const container = document.getElementById('productsContainer');
        
        container.innerHTML = products.map(product => `
            <div class="product-card">
                <img src="/uploads/${product.images.split(',')[0]}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-meta">
                        <div>${product.category}</div>
                        <div>${product.length} см | ${product.color}</div>
                        <div>${product.texture} | ${product.weight}</div>
                    </div>
                    
                    <div class="product-price">
                        ${product.price.toLocaleString()} ₽
                        ${product.old_price ? 
                            `<span class="product-old-price">${product.old_price.toLocaleString()} ₽</span>` : 
                            ''}
                    </div>
                    
                    <button class="btn-primary" onclick="catalog.addToCart(${product.id})">
                        🛒 В корзину
                    </button>
                </div>
            </div>
        `).join('');
    }

    addToCart(productId) {
        alert(`Товар #${productId} добавлен в корзину!`);
    }
}

// Инициализация каталога
const catalog = new HairShopCatalog();