async function carregarProdutoIndividual() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const loading = document.getElementById('produto-loading');
    const container = document.getElementById('produto-detalhe');

    if (!id) {
        loading.textContent = 'Produto não especificado.';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/products/${id}`);
        if (!res.ok) throw new Error('Produto não encontrado');
        const { data: produto } = await res.json();

        loading.classList.add('hidden');
        container.classList.remove('hidden');

        preencherSEO(produto);

        const isAffiliate = produto.product_type === 'affiliate';
        const price = parseFloat(produto.price).toFixed(2);
        const image = sanitize(produto.image || 'images/placeholder.jpg');
        const categoryTag = produto.category_name
            ? `<span class="category-tag">${sanitize(produto.category_name)}</span>`
            : '';

        const cta = isAffiliate
            ? `<a class="produto-cta" href="${SITE_URL}/go/${sanitize(produto.slug || '')}" target="_blank" rel="noopener sponsored">Ver Produto no Comerciante</a>
               <p class="affiliate-note">🔗 Este é um link de afiliado. A ELLA'S Store pode receber uma comissão sem custo adicional para ti.</p>`
            : `<button class="produto-cta" id="produto-add-cart" data-id="${produto.id}" data-name="${sanitize(produto.name)}" data-price="${price}">
                Adicionar ao Carrinho
               </button>`;

        container.innerHTML = `
            <div class="produto-imagem">
                <img src="${image}" alt="${sanitize(produto.name)}" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="produto-info">
                ${categoryTag}
                <h1>${sanitize(produto.name)}</h1>
                <p class="produto-preco">${price}€</p>
                <p class="produto-descricao">${sanitize(produto.description || 'Sem descrição disponível.')}</p>
                ${cta}
                <a href="index.html" class="voltar-loja">← Voltar à loja</a>
            </div>
        `;

        const btnCart = document.getElementById('produto-add-cart');
        if (btnCart) {
            btnCart.addEventListener('click', () => {
                addToCart({
                    id: btnCart.dataset.id,
                    name: btnCart.dataset.name,
                    price: parseFloat(btnCart.dataset.price)
                });
            });
        }
    } catch (error) {
        loading.textContent = 'Produto não encontrado.';
        console.error(error);
    }
}

function preencherSEO(produto) {
    const nome = produto.name;
    const preco = parseFloat(produto.price).toFixed(2);
    const descricao = produto.description || `${nome} disponível na ELLA'S Store`;
    const imagem = produto.image || '';
    const url = `${SITE_URL_FRONTEND()}/produto.html?id=${produto.id}`;

    document.getElementById('page-title').textContent = `${nome} - ELLA'S Store`;
    document.getElementById('meta-description').setAttribute('content', descricao.substring(0, 160));
    document.getElementById('canonical-link').setAttribute('href', url);

    document.getElementById('og-title').setAttribute('content', nome);
    document.getElementById('og-description').setAttribute('content', descricao.substring(0, 200));
    document.getElementById('og-image').setAttribute('content', imagem);
    document.getElementById('og-url').setAttribute('content', url);

    document.getElementById('twitter-title').setAttribute('content', nome);
    document.getElementById('twitter-description').setAttribute('content', descricao.substring(0, 200));
    document.getElementById('twitter-image').setAttribute('content', imagem);

    const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": nome,
        "description": descricao,
        "image": imagem,
        "offers": {
            "@type": "Offer",
            "url": url,
            "priceCurrency": "EUR",
            "price": preco,
            "availability": produto.product_type === 'own'
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock"
        }
    };
    document.getElementById('schema-produto').textContent = JSON.stringify(schema);
}

function SITE_URL_FRONTEND() {
    return window.location.hostname === 'localhost'
        ? window.location.origin
        : 'https://ellasstore.com';
}

updateCartCount();
carregarProdutoIndividual();
