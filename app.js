class HairShopCatalog {
    constructor() {
        // Используем CORS прокси для обхода блокировки
        this.CSV_URL = "https://corsproxy.io/?https://docs.google.com/spreadsheets/d/e/2PACX-1vS800Y_zN10Ys9uQfkEB67ZqlWMobbZTAkIu4l4X-a2rp1e80jlrFfhQV1m18n5hHCBANXc7VjRhIo5/pub?output=csv";
        
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
        // Показываем заглушку сразу
        this.renderLoading();
        await this.loadProductsFromCSV();
        this.setupEventListeners();
    }

    async loadProductsFromCSV() {
        try {
            console.log('📥 Loading from:', this.CSV_URL);
            const response = await fetch(this.CSV_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvText = await response.text();
            console.log('📄 CSV content:', csvText.substring(0, 200));
            
            this.products = this.parseCSV(csvText);
            console.log('✅ Parsed products:', this.products);
            
            if (this.products.length > 0) {
                this.updateFilterRanges();
                this.renderProducts();
            } else {
                this.renderNoProducts();
            }
            
        } catch (error) {
            console.error('❌ Error loading CSV:', error);
            this.renderError(error.message);
        }
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim().length > 0);
        console.log('📝 Total lines:', lines.length);
        
        if (lines.length < 2) {
            console.warn('⚠️ Not enough lines in CSV');
            return [];
        }
        
        // Парсим заголовки
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        console.log('🏷 Headers:', headers);
        
        const products = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = this.parseCSVLine(line);
            console.log(`📊 Line ${i}:`, values);
            
            if (values.length !== headers.length) {
                console.warn(`⚠️ Line ${i} has ${values.length} values, expected ${headers.length}`);
                continue;
            }
            
            const product = {};
            let hasData = false;
            
            headers.forEach((header, index) => {
                let value = values[index] ? values[index].trim().replace(/"/g, '') : '';
                
                // Пропускаем пустые строки
                if (value === '' && header !== 'old_price') {
                    return;
                }
                
                hasData = true;
                
                // Конвертируем типы данных
                if (header === 'length' || header === 'price') {
                    value = parseInt(value) || 0;
                } else if (header === 'old_price') {
                    value = value ? parseInt(value) : null;
                }
                
                product[header] = value;
            });
            
            if (hasData) {
                product.id = i;
                products.push(product);
                console.log('➕ Added product:', product);
            }
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
        
        if (lengths.length === 0 || prices.length === 0) return;
        
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
        
        this.filters.minLength = this.filterRanges.length.min;
        this.filters.maxLength = this.filterRanges.length.max;
        this.filters.minPrice = this.filterRanges.price.min;
        this.filters.maxPrice = this.filterRanges.price.max;
        
        this.updateRangeSliders();
    }

    updateRangeSliders() {
        if (!this.filterRanges) return;
        
        // Длина
        const lengthMin = document.getElementById('lengthMin');
        const lengthMax = document.getElementById('lengthMax');
        if (lengthMin && lengthMax) {
            lengthMin.min = this.filterRanges.length.min;
            lengthMin.max = this.filterRanges.length.max;
            lengthMin.value = this.filters.minLength;
            
            lengthMax.min = this.filterRanges.length.min;
            lengthMax.max = this.filterRanges.length.max;
            lengthMax.value = this.filters.maxLength;
        }
        
        // Цена
        const priceMin = document.getElementById('priceMin');
        const priceMax = document.getElementById('priceMax');
        if (priceMin && priceMax) {
            priceMin.min = this.filterRanges.price.min;
            priceMin.max = this.filterRanges.price.max;
            priceMin.value = this.filters.minPrice;
            
            priceMax.min = this.filterRanges.price.min;
            priceMax.max = this.filterRanges.price.max;
            priceMax.value = this.filters.maxPrice;
        }
        
        this.updateRangeValues();
    }

    updateRangeValues() {
        const lengthValue = document.getElementById('lengthValue');
        const priceValue = document.getElementById('priceValue');
        
        if (lengthValue) {
            lengthValue.textContent = `${this.filters.minLength}-${this.filters.maxLength} см`;
        }
        
        if (priceValue) {
            priceValue.textContent = `${this.filters.minPrice}-${this.filters.maxPrice} ₽`;
        }
    }

    renderLoading() {
        const container = document.getElementById('productsContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Загрузка каталога...</p>
                </div>
            `;
        }
    }

    renderNoProducts() {
        const container = document.getElementById('productsContainer');
        if (container) {
            container.innerHTML = `
                <div class="no-products">
                    <h3>📝 Каталог пуст</h3>
                    <p>Добавьте товары в Google Sheets таблицу</p>
                    <p><small>Ссылка на таблицу: <a href="https://docs.google.com/spreadsheets/d/1YOUR_SHEET_ID" target="_blank">редактировать</a></small></p>
                </div>
            `;
        }
    }

    renderError(message) {
        const container = document.getElementById('productsContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>😕 Ошибка загрузки</h3>
                    <p>${message || 'Не удалось загрузить каталог'}</p>
                    <button onclick="catalog.loadProductsFromCSV()" class="btn-primary">
                        🔄 Попробовать снова
                    </button>
                </div>
            `;
        }
    }

    renderProducts(products = this.products) {
        const container = document.getElementById('productsContainer');
        if (!container) return;

        if (products.length === 0) {
            this.renderNoProducts();
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    ${product.images && product.images !== 'images' ? 
                        `<img src="${product.images}" alt="${product.name}" 
                              onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
                         <div class="image-placeholder" style="display:none">💇‍♀️</div>` : 
                        '<div class="image-placeholder">💇‍♀️</div>'}
                </div>
                <div class="product-info">
                    <h3>${product.name || 'Без названия'}</h3>
                    <div class="product-meta">
                        <div>${product.category || ''}</div>
                        <div>${product.length || ''} см | ${product.color || ''}</div>
                        <div>${product.texture || ''} | ${product.weight || ''}</div>
                    </div>
                    <div class="product-price">
                        ${product.price ? product.price.toLocaleString() + ' ₽' : 'Цена не указана'}
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

    setupEventListeners() {
        // Ползунки
        const lengthMin = document.getElementById('lengthMin');
        const lengthMax = document.getElementById('lengthMax');
        const priceMin = document.getElementById('priceMin');
        const priceMax = document.getElementById('priceMax');
        
        if (lengthMin) lengthMin.addEventListener('input', (e) => this.handleLengthChange(e, 'min'));
        if (lengthMax) lengthMax.addEventListener('input', (e) => this.handleLengthChange(e, 'max'));
        if (priceMin) priceMin.addEventListener('input', (e) => this.handlePriceChange(e, 'min'));
        if (priceMax) priceMax.addEventListener('input', (e) => this.handlePriceChange(e, 'max'));
        
        // Кнопки
        const applyBtn = document.getElementById('applyFilters');
        const resetBtn = document.getElementById('resetFilters');
        if (applyBtn) applyBtn.addEventListener('click', () => this.applyFilters());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetFilters());
    }

    handleLengthChange(e, type) {
        const value = parseInt(e.target.value);
        this.filters[type === 'min' ? 'minLength' : 'maxLength'] = value;
        
        // Синхронизируем ползунки
        if (type === 'min' && value > this.filters.maxLength) {
            this.filters.maxLength = value;
            document.getElementById('lengthMax').value = value;
        } else if (type === 'max' && value < this.filters.minLength) {
            this.filters.minLength = value;
            document.getElementById('lengthMin').value = value;
        }
        
        this.updateRangeValues();
        this.applyFilters();
    }

    handlePriceChange(e, type) {
        const value = parseInt(e.target.value);
        this.filters[type === 'min' ? 'minPrice' : 'maxPrice'] = value;
        
        // Синхронизируем ползунки
        if (type === 'min' && value > this.filters.maxPrice) {
            this.filters.maxPrice = value;
            document.getElementById('priceMax').value = value;
        } else if (type === 'max' && value < this.filters.minPrice) {
            this.filters.minPrice = value;
            document.getElementById('priceMin').value = value;
        }
        
        this.updateRangeValues();
        this.applyFilters();
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
        if (this.filterRanges) {
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
    }

    addToCart(productId) {
        alert(`Товар #${productId} добавлен в корзину!`);
    }
}

// Запускаем каталог
document.addEventListener('DOMContentLoaded', function() {
    window.catalog = new HairShopCatalog();
});