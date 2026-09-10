const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://SUBSTITUIR-PELO-TEU-BACKEND-EM-PRODUCAO.com/api';

const SITE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://SUBSTITUIR-PELO-TEU-BACKEND-EM-PRODUCAO.com';

let cart = JSON.parse(localStorage.getItem('ella_cart') || '[]');
let categoriaAtiva = null;
let termoPesquisa = '';
let debounceTimer = null;

function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

const menuToggle = document.getElementById('menu-toggle');
const navList = document.getElementById('nav-list');
if (menuToggle && navList) {
    menuToggle.addEventListener('click', () => {
        const aberto = navList.classList.toggle('aberto');
        menuToggle.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
}

async function fetchCategories() {
    try {
        const res = await fetch(`${API_URL}/categories`);
        const { data } = await res.json();
        renderCategoryFilters(data);
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

function renderCategoryFilters(categorias) {
    const container = document.getElementById('category-filters');
    if (!container) return;

    if (!categorias || categorias.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <button class="filtro-categoria ${categoriaAtiva === null ? 'ativo' : ''}" data-slug="" aria-pressed="${categoriaAtiva === null}">Todos</button>
        ${categorias.map(c => `
            <button class="filtro-categoria ${categoriaAtiva === c.slug ? 'ativo' : ''}" data-slug="${sanitize(c.slug)}" aria-pressed="${categoriaAtiva === c.slug}">${sanitize(c.name)}</button>
        `).join('')}
    `;

    document.querySelectorAll('.filtro-categoria').forEach(btn => {
        btn.addEventListener('click', () => {
            categoriaAtiva = btn.dataset.slug || null;
            fetchProducts();
            document.querySelectorAll('.filtro-categoria').forEach(b => {
                b.classList.remove('ativo');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('ativo');
            btn.setAttribute('aria-pressed', 'true');
        });
    });
}

async function fetchProducts() {
    const loading = document.getElementById('loading');
    if (!loading) return;
    loading.style.display = 'block';
    loading.textContent = 'A carregar produtos...';
    try {
        const params = new URLSearchParams();
        if (categoriaAtiva) params.set('category', categoriaAtiva);
        if (termoPesquisa) params.set('search', termoPesquisa);

        const url = `${API_URL}/products${params.toString() ? '?' + params.toString() : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Erro na resposta');
        const { data } = await res.json();
        loading.style.display = 'none';
        renderProducts(data);
    } catch (error) {
        loading.textContent = 'Erro ao carregar produtos. Tenta mais tarde.';
        console.error(error);
    }
}

function renderProducts(products) {
    const feed = document.getElementById('product-feed');
    feed.innerHTML = '';

    if (products.length === 0) {
        feed.innerHTML = '<p>Sem produtos encontrados.</p>';
        return;
    }

    products.forEach(product => {
        const div = document.createElement('div');
        div.className = 'product';
        const name  = sanitize(product.name);
        const price = parseFloat(product.price).toFixed(2);
        const image = sanitize(product.image || 'images/placeholder.jpg');
        const desc  = sanitize(product.description || '');
        const isAffiliate = product.product_type === 'affiliate';
        const categoryTag = product.category_name
            ? `<span class="category-tag">${sanitize(product.category_name)}</span>`
            : '';

        const botao = isAffiliate
            ? `<a class="add-cart-btn" href="${SITE_URL}/go/${sanitize(product.slug || '')}" target="_blank" rel="noopener sponsored" aria-label="Ver ${name} no comerciante externo (link de afiliado)">Ver Produto</a>
               <p class="affiliate-note">🔗 Link de afiliado</p>`
            : `<button class="add-cart-btn" data-id="${product.id}" data-name="${name}" data-price="${price}" aria-label="Adicionar ${name} ao carrinho, ${price} euros">
                Adicionar ao Carrinho
               </button>`;

        div.innerHTML = `
            <a href="produto.html?id=${product.id}" class="product-link" aria-label="Ver detalhes de ${name}">
                <img src="${image}" alt="${name}" onerror="this.src='images/placeholder.jpg'">
                ${categoryTag}
                <h2>${name}</h2>
                <p class="desc">${desc}</p>
                <p class="price">${price}€</p>
            </a>
            ${botao}
        `;
        feed.appendChild(div);
    });

    document.querySelectorAll('.add-cart-btn[data-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            addToCart({ id: btn.dataset.id, name: btn.dataset.name, price: parseFloat(btn.dataset.price) });
        });
    });
}

const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const valor = e.target.value.trim();
        debounceTimer = setTimeout(() => {
            termoPesquisa = valor;
            fetchProducts();
        }, 400);
    });
}

function addToCart(product) {
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    updateCartCount();
    alert(`"${product.name}" adicionado ao carrinho!`);
}

function saveCart() {
    localStorage.setItem('ella_cart', JSON.stringify(cart));
}

function updateCartCount() {
    const el = document.getElementById('cart-count');
    if (!el) return;
    const count = cart.reduce((acc, i) => acc + i.quantity, 0);
    el.textContent = count;
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const totalEl   = document.getElementById('cart-total');
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p>Carrinho vazio.</p>';
        totalEl.textContent = '0.00€';
        return;
    }

    let total = 0;
    cart.forEach((item, i) => {
        total += item.price * item.quantity;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <span>${sanitize(item.name)} x${item.quantity}</span>
            <span>${(item.price * item.quantity).toFixed(2)}€</span>
            <button data-index="${i}" class="remove-item" aria-label="Remover ${sanitize(item.name)} do carrinho">Remover</button>
        `;
        container.appendChild(div);
    });

    totalEl.textContent = total.toFixed(2) + '€';

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            cart.splice(parseInt(btn.dataset.index), 1);
            saveCart();
            updateCartCount();
            renderCart();
        });
    });
}

const navCarrinho = document.getElementById('nav-carrinho');
if (navCarrinho) {
    navCarrinho.addEventListener('click', e => {
        e.preventDefault();
        renderCart();
        document.getElementById('cart-modal').classList.remove('hidden');
    });
}

const closeCart = document.getElementById('close-cart');
if (closeCart) {
    closeCart.addEventListener('click', () => {
        document.getElementById('cart-modal').classList.add('hidden');
    });
}

const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
        const token = localStorage.getItem('ella_token');
        if (!token) {
            alert('Tens de fazer login para finalizar a compra.');
            window.location.href = 'login.html';
            return;
        }
        if (cart.length === 0) {
            alert('O carrinho está vazio.');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/payments/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    items: cart.map(i => ({ product_id: i.id, quantity: i.quantity }))
                })
            });

            const data = await res.json();
            if (res.ok && data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Erro ao iniciar pagamento');
            }
        } catch {
            alert('Erro de ligação ao servidor');
        }
    });
}

updateCartCount();
if (document.getElementById('product-feed')) {
    fetchCategories();
    fetchProducts();
}
