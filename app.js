class HairShop {
    constructor() {
        this.products = [];
        this.filters = {
            category: '',
            length: '',
            color: '',
            minPrice: '',
            maxPrice: ''
        };
        this.currentPage = 1;
        this.pageSize = 12;
        this.sortBy = 'name';
        
        this.init();
    }

    async init() {
        await this.loadFilters();
        await this.loadProducts();
        this.setupEventListeners();
    }

    async loadFilters() {
        try {
            const response = await fetch('/api/filters');
            const filters = await response.json();
            
            this.populateSelect('categoryFilter', filters.categories);
            this.populateSelect('lengthFilter', filters.lengths);
            this.populateSelect('colorFilter', filters.colors);
        } catch (error) {
            console.error('Error loading filters:', error);
        }
    }

    populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
    }

    async loadProducts() {
        const productsContainer = document.getElementById('productsContainer');
        productsContainer.innerHTML = '<div class="loading">Загрузка товаров...</div>';

        try {
            const queryParams = new URLSearchParams({
                page: this.currentPage,
                page_size: this.pageSize,
                ...this.filters
            });

            const response = await fetch(`/api/products?${queryParams}`);
            this.products = await response.json();
            
            this.renderProducts();
            this.updatePagination();
        } catch (error) {
            console.error('Error loading products:', error);
            productsContainer.innerHTML = '<div class="loading">Ошибка загрузки товаров</div>';
        }
    }

    renderProducts() {
        const container = document.getElementById('productsContainer');
        
        if (this.products.length === 0) {
            container.innerHTML = '<div class="loading">Товары не найдены</div>';
            return;
        }

        container.innerHTML = this.products.map(product => `
            <div class="product-card" onclick="hairShop.openProductModal(${product.id})">
                ${product.old_price ? '<div class="product-badge">SALE</div>' : ''}
                <div class="product-image">💇‍♀️</div>
                <h3>${product.name}</h3>
                <div class="product-meta">
                    <div>${product.category}</div>
                    <div>${product.length} | ${product.color}</div>
                    <div>${product.texture} | ${product.weight}</div>
                </div>
                <div class="product-price">
                    ${product.price.toLocaleString()} ₽
                    ${product.old_price ? `<span class="product-old-price">${product.old_price.toLocaleString()} ₽</span>` : ''}
                </div>
                <div class="product-rating" id="rating-${product.id}">
                    Загрузка рейтинга...
                </div>
                <button class="btn-primary" onclick="event.stopPropagation(); hairShop.addToCart(${product.id})">
                    🛒 В корзину
                </button>
            </div>
        `).join('');

        // Загружаем рейтинги для каждого товара
        this.products.forEach(product => this.loadProductRating(product.id));
    }

    async loadProductRating(productId) {
        try {
            const response = await fetch(`/api/products/${productId}/rating-stats`);
            const ratingStats = await response.json();
            
            const ratingElement = document.getElementById(`rating-${productId}`);
            if (ratingElement) {
                ratingElement.innerHTML = `
                    <span class="stars">${this.generateStars(ratingStats.average_rating)}</span>
                    <span class="rating-count">${ratingStats.average_rating}/5 (${ratingStats.total_reviews})</span>
                `;
            }
        } catch (error) {
            console.error('Error loading rating:', error);
        }
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        return '⭐'.repeat(fullStars) + (halfStar ? '✨' : '') + '☆'.repeat(emptyStars);
    }

    setupEventListeners() {
        // Фильтры
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('resetFilters').addEventListener('click', () => {
            this.resetFilters();
        });

        // Сортировка
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.loadProducts();
        });

        // Пагинация
        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadProducts();
            }
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            this.currentPage++;
            this.loadProducts();
        });

        // Модальное окно
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('productModal')) {
                this.closeModal();
            }
        });
    }

    applyFilters() {
        this.filters = {
            category: document.getElementById('categoryFilter').value,
            length: document.getElementById('lengthFilter').value,
            color: document.getElementById('colorFilter').value,
            minPrice: document.getElementById('minPrice').value,
            maxPrice: document.getElementById('maxPrice').value
        };
        this.currentPage = 1;
        this.loadProducts();
    }

    resetFilters() {
        document.getElementById('categoryFilter').value = '';
        document.getElementById('lengthFilter').value = '';
        document.getElementById('colorFilter').value = '';
        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';
        this.filters = {
            category: '',
            length: '',
            color: '',
            minPrice: '',
            maxPrice: ''
        };
        this.currentPage = 1;
        this.loadProducts();
    }

    updatePagination() {
        document.getElementById('pageInfo').textContent = `Страница ${this.currentPage}`;
        document.getElementById('prevPage').disabled = this.currentPage === 1;
    }

    async openProductModal(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            const product = await response.json();
            
            const ratingResponse = await fetch(`/api/products/${productId}/rating-stats`);
            const ratingStats = await ratingResponse.json();
            
            const reviewsResponse = await fetch(`/api/products/${productId}/reviews`);
            const reviews = await reviewsResponse.json();

            const modalContent = `
                <h2>${product.name}</h2>
                <div class="product-image" style="font-size: 4rem; margin: 1rem 0;">💇‍♀️</div>
                
                <div class="product-details">
                    <div class="detail-row">
                        <strong>Категория:</strong> ${product.category}
                    </div>
                    <div class="detail-row">
                        <strong>Длина:</strong> ${product.length}
                    </div>
                    <div class="detail-row">
                        <strong>Цвет:</strong> ${product.color}
                    </div>
                    <div class="detail-row">
                        <strong>Текстура:</strong> ${product.texture}
                    </div>
                    <div class="detail-row">
                        <strong>Вес:</strong> ${product.weight}
                    </div>
                    <div class="detail-row">
                        <strong>Цена:</strong> 
                        <span class="product-price">${product.price.toLocaleString()} ₽</span>
                        ${product.old_price ? `<span class="product-old-price">${product.old_price.toLocaleString()} ₽</span>` : ''}
                    </div>
                </div>

                <div class="rating-section">
                    <h3>Рейтинг: ${ratingStats.average_rating}/5 ⭐ (${ratingStats.total_reviews} отзывов)</h3>
                </div>

                <div class="description-section">
                    <h3>Описание</h3>
                    <p>${product.description}</p>
                </div>

                <div class="reviews-section">
                    <h3>Отзывы (${reviews.length})</h3>
                    ${reviews.length > 0 ? 
                        reviews.map(review => `
                            <div class="review-item">
                                <div class="review-header">
                                    <strong>Пользователь #${review.user_id}</strong>
                                    <span>${this.generateStars(review.rating)}</span>
                                </div>
                                <div class="review-content">
                                    <p><strong>Достоинства:</strong> ${review.advantages}</p>
                                    <p><strong>Недостатки:</strong> ${review.disadvantages}</p>
                                    ${review.comment ? `<p><strong>Комментарий:</strong> ${review.comment}</p>` : ''}
                                </div>
                            </div>
                        `).join('') : 
                        '<p>Пока нет отзывов. Будьте первым!</p>'
                    }
                </div>

                <button class="btn-primary" style="margin-top: 1rem; width: 100%;" 
                        onclick="hairShop.addToCart(${product.id})">
                    🛒 Добавить в корзину
                </button>
            `;

            document.getElementById('productDetails').innerHTML = modalContent;
            document.getElementById('productModal').style.display = 'block';
        } catch (error) {
            console.error('Error loading product details:', error);
        }
    }

    closeModal() {
        document.getElementById('productModal').style.display = 'none';
    }

    addToCart(productId) {
        alert(`Товар #${productId} добавлен в корзину!`);
        // Здесь будет логика добавления в корзину
    }
}

// Инициализация приложения
const hairShop = new HairShop();
