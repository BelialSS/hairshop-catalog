class HairShopCatalog {
    constructor() {
        this.CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS800Y_zN10Ys9uQfkEB67ZqlWMobbZTAkIu4l4X-a2rp1e80jlrFfhQV1m18n5hHCBANXc7VjRhIo5/pub?output=csv";
        this.products = [];
        this.filters = {
            minLength: 14,
            maxLength: 30,
            minPrice: 1000,
            maxPrice: 10000,
            colors: []
        };
        
        this.init();
    }

    async init() {
        await this.loadProductsFromCSV();
        this.setupEventListeners();
        this.updateRangeSliders();
    }

    async loadProductsFromCSV() {
        try {
            console.log('📥 Loading products from Google Sheets...');
            const response = await fetch(this.CSV_URL);
            const csvText = await response.text();
            
            // Парсим CSV
            this.products = this.parseCSV(csvText);
            console.log('✅ Loaded products:', this.products);
            
            this.renderProducts();
            this.updateFilterRanges();
            
        } catch (error) {
            console.error('❌ Error loading CSV:', error);
            this.showErrorMessage();
        }
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];
        
        // Получаем заголовки
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Парсим данные
        const products = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length !== headers.length) continue;
            
            const product = {};
            headers.forEach((header, index) => {
                let value = values[index]?.trim() || '';
                
                // Конвертируем типы данных
                if (header === 'length' || header === 'price') {
                    value = parseInt(value) || 0;
                } else if (header === 'old_price') {
                    value = value ? parseInt(value) : null;
                }
                
                product[header] = value;
            });
            
            // Добавляем ID если нет
            if (!product.id) product.id = i;
            
            products.push(product);
        }
        
        return products;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    updateFilterRanges() {
        if (this.products.length === 0) return;
        
        const lengths = this.products.map(p => p.length).filter(l => l > 0);
        const prices = this.products.map(p => p.price).filter(p => p > 0);
        
        this.filterRanges = {
            length: {
                min: Math.min(...lengths),
                max: Math.max(...lengths)
            },
            price: {
                min: Math.min(...prices),
                max: Math.max(...prices)
            }
        };
        
        this.updateRangeSliders();
    }

    updateRangeSliders() {
        if (!this.filterRanges) return;
        
        // Обновляем ползунки длины
        const lengthMin = document.getElementById('lengthMin');
        const lengthMax = document.getElementById('lengthMax');
        if (lengthMin && lengthMax) {
            lengthMin.min = this.filterRanges.length.min;
            lengthMin.max = this.filterRanges.length.max;
            lengthMin.value = this.filterRanges.length.min;
            
            lengthMax.min = this.filterRanges.length.min;
            lengthMax.max = this.filterRanges.length.max;
            lengthMax.value = this.filterRanges.length.max;
        }
        
        // Обновляем ползунки цены
        const priceMin = document.getElementById('priceMin');
        const priceMax = document.getElementById('priceMax');
        if (priceMin && priceMax) {
            priceMin.min = this.filterRanges.price.min;
            priceMin.max = this.filterRanges.price.max;
            priceMin.value = this.filterRanges.price.min;
            
            priceMax.min = this.filterRanges.price.min;
            priceMax.max = this.filterRanges.price.max;
            priceMax.value = this.filterRanges.price.max;
        }
        
        this.updateRangeValues();
    }

    updateRangeValues() {
        document.getElementById('lengthValue').textContent = 
            `${this.filters.minLength}-${this.filters.maxLength} см`;
        
        document.getElementById('priceValue').textContent = 
            `${this.filters.minPrice}-${this.filters.maxPrice} ₽`;
    }

    setupEventListeners() {
        // Ползунки длины
        const lengthMin = document.getElementById('lengthMin');
        const lengthMax = document.getElementById('lengthMax');
        if (lengthMin && lengthMax) {
            lengthMin.addEventListener('input', (e) => {
                this.filters.minLength = parseInt(e.target.value);
                if (this.filters.minLength > this.filters.maxLength) {
                    this.filters.maxLength = this.filters.minLength;
                    lengthMax.value = this.filters.maxLength;
                }
                this.updateRangeValues();
                this.applyFilters();
            });
            
            lengthMax.addEventListener('input', (e) => {
                this.filters.maxLength = parseInt(e.target.value);
                if (this.filters.maxLength < this.filters.minLength) {
                    this.filters.minLength = this.filters.maxLength;
                    lengthMin.value = this.filters.minLength;
                }
                this.updateRangeValues();
                this.applyFilters();
            });
        }

        // Ползунки цены
        const priceMin = document.getElementById('priceMin');
        const priceMax = document.getElementById('priceMax');
        if (priceMin && priceMax) {
            priceMin.addEventListener('input', (e) => {
                this.filters.minPrice = parseInt(e.target.value);
                if (this.filters.minPrice > this.filters.maxPrice) {
                    this.filters.maxPrice = this.filters.minPrice;
                    priceMax.value = this.filters.maxPrice;
                }
                this.updateRangeValues();
                this.applyFilters();
            });
            
            priceMax.addEventListener('input', (e) => {
                this.filters.maxPrice = parseInt(e.target.value);
                if (this.filters.maxPrice < this.filters.minPrice) {
                    this.filters.minPrice = this.filters.maxPrice;
                    priceMin.value = this.filters.minPrice;
                }
                this.updateRangeValues();
                this.applyFilters();
            });
        }

        // Цвета
        const colorFilter = document.getElementById('colorFilter');
        if (colorFilter) {
            colorFilter.addEventListener('change', (e) => {
                this.filters.colors = Array.from(e.target.selectedOptions).map(opt => opt.value);
                this.applyFilters();
            });
        }

        // Кнопки
        const applyBtn = document.getElementById('applyFilters');
        const resetBtn = document.getElementById('resetFilters');
        if (applyBtn) applyBtn.addEventListener('click', () => this.applyFilters());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetFilters());
    }

    applyFilters() {
        const filteredProducts = this.products.filter(product => {
            const lengthMatch = product.length >= this.filters.minLength && 
                              product.length <= this.filters.maxLength;
            
            const priceMatch = product.price >= this.filters.minPrice && 
                             product.price <= this.filters.maxPrice;
            
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
        if (!container) {
            console.error('❌ Products container not found');
            return;
        }

        if (products.length === 0) {
            container.innerHTML = '<div class="no-products">Товары не найдены</div>';
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    ${product.images ? 
                        `<img src="${product.images}" alt="${product.name}" 
                              onerror="this.style.display='none'; this.parentElement.innerHTML='💇‍♀️'">` : 
                        '💇‍♀️'}
                </div>
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
        alert(`Товар добавлен в корзину! ID: ${productId}`);
    }

    showErrorMessage() {
        const container = document.getElementById('productsContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>😕 Не удалось загрузить каталог</h3>
                    <p>Проверьте подключение к интернету</p>
                    <button onclick="catalog.loadProductsFromCSV()" class="btn-primary">
                        🔄 Попробовать снова
                    </button>
                </div>
            `;
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    window.catalog = new HairShopCatalog();
});