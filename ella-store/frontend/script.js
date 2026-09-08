const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://SUBSTITUIR-PELO-TEU-BACKEND-EM-PRODUCAO.com/api';

const SITE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://SUBSTITUIR-PELO-TEU-BACKEND-EM-PRODUCAO.com';

let cart = JSON.parse(localStorage.getItem('ella_cart') || '[]');

function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function fetchProducts() {
    const loading = document.getElementById('loading');
    try {
        const res = await fetch(`${API_URL}/products`);
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
        feed.innerHTML = '<p>Sem produtos disponíveis.</p>';
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

        const botao = isAffiliate
            ? `<a class="add-cart-btn" href="${SITE_URL}/go/${sanitize(product.slug || '')}" target="_blank" rel="noopener sponsored">Ver Produto</a>
               <p class="affiliate-note">🔗 Link de afiliado</p>`
            : `<button class="add-cart-btn" data-id="${product.id}" data-name="${name}" data-price="${price}">
                Adicionar ao Carrinho
               </button>`;

        div.innerHTML = `
            <img src="${image}" alt="${name}" onerror="this.src='images/placeholder.jpg'">
            <h2>${name}</h2>
            <p class="desc">${desc}</p>
            <p class="price">${price}€</p>
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
    const count = cart.reduce((acc, i) => acc + i.quantity, 0);
    document.getElementById('cart-count').textContent = count;
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
            <button data-index="${i}" class="remove-item">Remover</button>
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

document.getElementById('nav-carrinho').addEventListener('click', e => {
    e.preventDefault();
    renderCart();
    document.getElementById('cart-modal').classList.remove('hidden');
});
document.getElementById('close-cart').addEventListener('click', () => {
    document.getElementById('cart-modal').classList.add('hidden');
});

document.getElementById('checkout-btn').addEventListener('click', async () => {
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

updateCartCount();
fetchProducts();
