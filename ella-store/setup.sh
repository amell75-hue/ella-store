#!/bin/bash
# ELLA'S STORE - Script de criação do projeto completo
# Como usar: cola este ficheiro inteiro no Terminal do Mac e prime ENTER
# (ou guarda como setup.sh e corre: bash setup.sh)

set -e

echo "A criar estrutura de pastas..."
mkdir -p ella-store/backend/routes
mkdir -p ella-store/backend/middleware
mkdir -p ella-store/frontend
mkdir -p ella-store/database

cd ella-store

# ── backend/app.js ────────────────────────────────────────────
cat > backend/app.js <<'FILE_EOF'
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes   = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

app.use(cors({
    origin: process.env.ALLOWED_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Demasiados pedidos, tenta mais tarde' }
}));

app.use('/api/auth/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Demasiadas tentativas de login' }
}));

// IMPORTANTE: o webhook do Stripe precisa do corpo em formato RAW,
// por isso é registado antes do express.json() global.
app.use('/api/payments/webhook', webhookRoutes);

app.use(express.json({ limit: '10kb' }));

app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(PORT, () => {
    console.log(`ELLA'S Store a correr na porta ${PORT}`);
});
FILE_EOF

# ── backend/db.js ──────────────────────────────────────────────
cat > backend/db.js <<'FILE_EOF'
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
});

module.exports = pool;
FILE_EOF

# ── backend/package.json ──────────────────────────────────────
cat > backend/package.json <<'FILE_EOF'
{
  "name": "ellas-store",
  "version": "1.0.0",
  "description": "ELLA'S Loja Virtual",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.2",
    "express-rate-limit": "^7.0.0",
    "helmet": "^7.0.0",
    "jsonwebtoken": "^9.0.0",
    "mysql2": "^3.0.0",
    "stripe": "^14.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
FILE_EOF

# ── backend/.env.example ──────────────────────────────────────
cat > backend/.env.example <<'FILE_EOF'
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=coloca_aqui_a_tua_password
DB_NAME=ellas_store
JWT_SECRET=gera_com_node_-e_console.log(require('crypto').randomBytes(64).toString('hex'))
ALLOWED_ORIGIN=http://localhost:5500
NODE_ENV=development
STRIPE_SECRET_KEY=sk_test_coloca_a_tua_chave_de_teste_aqui
STRIPE_WEBHOOK_SECRET=whsec_coloca_o_teu_segredo_de_webhook_aqui
FRONTEND_URL=http://localhost:5500
FILE_EOF

# ── backend/middleware/authMiddleware.js ──────────────────────
cat > backend/middleware/authMiddleware.js <<'FILE_EOF'
const jwt = require('jsonwebtoken');

function authRequired(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token em falta' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

function adminRequired(req, res, next) {
    authRequired(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        next();
    });
}

module.exports = { authRequired, adminRequired };
FILE_EOF

# ── backend/routes/auth.js ────────────────────────────────────
cat > backend/routes/auth.js <<'FILE_EOF'
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Campos obrigatórios em falta' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password deve ter mínimo 8 caracteres' });
        }

        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ?', [email]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email já registado' });
        }

        const hash = await bcrypt.hash(password, 12);
        await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hash, 'client']
        );

        res.status(201).json({ message: 'Conta criada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e password obrigatórios' });
        }

        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?', [email]
        );
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({
            token,
            user: { id: user.id, name: user.name, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

module.exports = router;
FILE_EOF

# ── backend/routes/products.js ────────────────────────────────
cat > backend/routes/products.js <<'FILE_EOF'
const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminRequired } = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
    try {
        const [products] = await db.query(
            'SELECT id, name, price, image, description FROM products WHERE active = 1'
        );
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, name, price, image, description FROM products WHERE id = ? AND active = 1',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno' });
    }
});

router.post('/', adminRequired, async (req, res) => {
    try {
        const { name, price, image, description } = req.body;
        if (!name || !price) {
            return res.status(400).json({ error: 'Nome e preço obrigatórios' });
        }
        await db.query(
            'INSERT INTO products (name, price, image, description, active) VALUES (?, ?, ?, ?, 1)',
            [name, price, image || '', description || '']
        );
        res.status(201).json({ message: 'Produto criado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno' });
    }
});

router.put('/:id', adminRequired, async (req, res) => {
    try {
        const { name, price, image, description, active } = req.body;
        await db.query(
            'UPDATE products SET name=?, price=?, image=?, description=?, active=? WHERE id=?',
            [name, price, image, description, active, req.params.id]
        );
        res.json({ message: 'Produto atualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno' });
    }
});

router.delete('/:id', adminRequired, async (req, res) => {
    try {
        await db.query('UPDATE products SET active = 0 WHERE id = ?', [req.params.id]);
        res.json({ message: 'Produto removido' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno' });
    }
});

module.exports = router;
FILE_EOF

# ── backend/routes/orders.js ──────────────────────────────────
cat > backend/routes/orders.js <<'FILE_EOF'
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authRequired, adminRequired } = require('../middleware/authMiddleware');

router.post('/', authRequired, async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Carrinho vazio' });
        }

        let total = 0;
        for (const item of items) {
            const [rows] = await db.query(
                'SELECT price FROM products WHERE id = ? AND active = 1',
                [item.product_id]
            );
            if (rows.length === 0) {
                return res.status(400).json({ error: `Produto ${item.product_id} não existe` });
            }
            total += rows[0].price * item.quantity;
        }

        const [result] = await db.query(
            'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)',
            [req.user.id, total, 'pending']
        );
        const orderId = result.insertId;

        for (const item of items) {
            await db.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.price]
            );
        }

        res.status(201).json({ message: 'Encomenda criada', order_id: orderId, total });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

router.get('/my', authRequired, async (req, res) => {
    try {
        const [orders] = await db.query(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno' });
    }
});

router.get('/all', adminRequired, async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT o.*, u.name, u.email
             FROM orders o
             JOIN users u ON o.user_id = u.id
             ORDER BY o.created_at DESC`
        );
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno' });
    }
});

router.put('/:id/status', adminRequired, async (req, res) => {
    try {
        const { status } = req.body;
        const validos = ['pending','paid','shipped','delivered','cancelled'];
        if (!validos.includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }
        await db.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        res.json({ message: 'Status atualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno' });
    }
});

module.exports = router;
FILE_EOF

# ── backend/routes/payments.js ────────────────────────────────
cat > backend/routes/payments.js <<'FILE_EOF'
const express = require('express');
const router  = express.Router();
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db      = require('../db');
const { authRequired } = require('../middleware/authMiddleware');

router.post('/checkout', authRequired, async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Carrinho vazio' });
        }

        const lineItems = [];
        for (const item of items) {
            const [rows] = await db.query(
                'SELECT name, price FROM products WHERE id = ? AND active = 1',
                [item.product_id]
            );
            if (rows.length === 0) {
                return res.status(400).json({
                    error: `Produto ${item.product_id} não existe`
                });
            }
            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: { name: rows[0].name },
                    unit_amount: Math.round(rows[0].price * 100),
                },
                quantity: item.quantity,
            });
        }

        let total = 0;
        for (const li of lineItems) {
            total += (li.price_data.unit_amount / 100) * li.quantity;
        }

        const [result] = await db.query(
            'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)',
            [req.user.id, total, 'pending']
        );
        const orderId = result.insertId;

        for (const item of items) {
            const [rows] = await db.query(
                'SELECT price FROM products WHERE id = ?',
                [item.product_id]
            );
            await db.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, rows[0].price]
            );
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/success.html?order=${orderId}`,
            cancel_url:  `${process.env.FRONTEND_URL}/index.html`,
            metadata: {
                order_id: String(orderId),
                user_id:  String(req.user.id),
            },
        });

        res.json({ success: true, url: session.url });

    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: 'Erro ao criar sessão de pagamento' });
    }
});

module.exports = router;
FILE_EOF

# ── backend/routes/webhook.js ─────────────────────────────────
cat > backend/routes/webhook.js <<'FILE_EOF'
const express = require('express');
const router  = express.Router();
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db      = require('../db');

router.post('/',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error('Webhook inválido:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const orderId = session.metadata.order_id;

            try {
                await db.query(
                    'UPDATE orders SET status = ? WHERE id = ?',
                    ['paid', orderId]
                );
                console.log(`Encomenda #${orderId} paga com sucesso`);
            } catch (err) {
                console.error('Erro ao atualizar encomenda:', err);
            }
        }

        res.json({ received: true });
    }
);

module.exports = router;
FILE_EOF

# ── frontend/index.html ───────────────────────────────────────
cat > frontend/index.html <<'FILE_EOF'
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <title>ELLA'S - Loja Virtual</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <div class="logo">ELLA'S</div>
        <nav>
            <ul>
                <li><a href="index.html">Início</a></li>
                <li><a href="#" id="nav-gostos">Gostos</a></li>
                <li><a href="#" id="nav-carrinho">
                    Carrinho <span id="cart-count">0</span>
                </a></li>
                <li><a href="login.html" id="nav-login">Entrar</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <h1>Produtos em Destaque</h1>
        <div id="loading">A carregar produtos...</div>
        <div class="product-feed" id="product-feed"></div>
    </main>

    <div id="cart-modal" class="modal hidden">
        <div class="modal-content">
            <h2>O Teu Carrinho</h2>
            <div id="cart-items"></div>
            <p>Total: <strong id="cart-total">0.00€</strong></p>
            <button id="checkout-btn">Finalizar Compra</button>
            <button id="close-cart">Fechar</button>
        </div>
    </div>

    <footer>
        <p>ELLA'S Store — Todos os direitos reservados</p>
        <p><a href="#">Política de Privacidade</a> |
           <a href="#">Termos e Condições</a> |
           <a href="#">Contacto</a></p>
    </footer>

    <script src="script.js"></script>
</body>
</html>
FILE_EOF

# ── frontend/login.html ───────────────────────────────────────
cat > frontend/login.html <<'FILE_EOF'
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ELLA'S - Entrar</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <div class="logo">ELLA'S</div>
        <nav><ul><li><a href="index.html">Voltar à loja</a></li></ul></nav>
    </header>

    <main class="auth-container">
        <div class="auth-box">
            <h1>Entrar na tua conta</h1>
            <div id="auth-error" class="error-msg hidden"></div>

            <div id="form-login">
                <input type="email" id="login-email" placeholder="Email" autocomplete="email">
                <input type="password" id="login-password" placeholder="Password" autocomplete="current-password">
                <button id="btn-login">Entrar</button>
                <p>Não tens conta? <a href="#" id="show-register">Criar conta</a></p>
            </div>

            <div id="form-register" class="hidden">
                <input type="text" id="reg-name" placeholder="Nome completo">
                <input type="email" id="reg-email" placeholder="Email">
                <input type="password" id="reg-password" placeholder="Password (mín. 8 caracteres)">
                <button id="btn-register">Criar Conta</button>
                <p>Já tens conta? <a href="#" id="show-login">Entrar</a></p>
            </div>
        </div>
    </main>

    <script>
    const API_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : 'https://SUBSTITUIR-PELO-TEU-BACKEND-EM-PRODUCAO.com/api';

    function showError(msg) {
        const el = document.getElementById('auth-error');
        el.textContent = msg;
        el.classList.remove('hidden');
    }

    document.getElementById('show-register').addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('form-login').classList.add('hidden');
        document.getElementById('form-register').classList.remove('hidden');
        document.getElementById('auth-error').classList.add('hidden');
    });
    document.getElementById('show-login').addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('form-register').classList.add('hidden');
        document.getElementById('form-login').classList.remove('hidden');
        document.getElementById('auth-error').classList.add('hidden');
    });

    document.getElementById('btn-login').addEventListener('click', async () => {
        const email    = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            showError('Preenche todos os campos.');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('ella_token', data.token);
                localStorage.setItem('ella_user',  JSON.stringify(data.user));
                window.location.href = data.user.role === 'admin' ? 'admin.html' : 'index.html';
            } else {
                showError(data.error || 'Erro no login');
            }
        } catch {
            showError('Erro de ligação ao servidor');
        }
    });

    document.getElementById('btn-register').addEventListener('click', async () => {
        const name     = document.getElementById('reg-name').value.trim();
        const email    = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;

        if (!name || !email || !password) {
            showError('Preenche todos os campos.');
            return;
        }
        if (password.length < 8) {
            showError('Password deve ter mínimo 8 caracteres.');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Conta criada! Podes fazer login agora.');
                document.getElementById('show-login').click();
            } else {
                showError(data.error || 'Erro no registo');
            }
        } catch {
            showError('Erro de ligação ao servidor');
        }
    });
    </script>
</body>
</html>
FILE_EOF

# ── frontend/admin.html ───────────────────────────────────────
cat > frontend/admin.html <<'FILE_EOF'
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ELLA'S - Painel Admin</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <div class="logo">ELLA'S Admin</div>
        <nav>
            <ul>
                <li><a href="#" id="tab-produtos">Produtos</a></li>
                <li><a href="#" id="tab-encomendas">Encomendas</a></li>
                <li><a href="#" id="btn-logout">Sair</a></li>
            </ul>
        </nav>
    </header>

    <main class="admin-container">
        <section id="secao-produtos">
            <h2>Gerir Produtos</h2>
            <div class="admin-form">
                <h3 id="form-titulo">Adicionar Produto</h3>
                <input type="hidden" id="produto-id">
                <input type="text"   id="produto-nome"     placeholder="Nome do produto">
                <input type="number" id="produto-preco"    placeholder="Preço (ex: 29.99)" step="0.01">
                <input type="text"   id="produto-imagem"   placeholder="URL da imagem">
                <textarea            id="produto-descricao" placeholder="Descrição"></textarea>
                <div class="form-buttons">
                    <button id="btn-guardar">Guardar Produto</button>
                    <button id="btn-cancelar" class="hidden">Cancelar</button>
                </div>
                <div id="form-msg" class="msg hidden"></div>
            </div>
            <div id="lista-produtos" class="admin-lista"><p>A carregar produtos...</p></div>
        </section>

        <section id="secao-encomendas" class="hidden">
            <h2>Encomendas</h2>
            <div id="lista-encomendas" class="admin-lista"><p>A carregar encomendas...</p></div>
        </section>
    </main>

    <script>
    const API_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : 'https://SUBSTITUIR-PELO-TEU-BACKEND-EM-PRODUCAO.com/api';

    const token = localStorage.getItem('ella_token');
    const user  = JSON.parse(localStorage.getItem('ella_user') || 'null');

    if (!token || !user || user.role !== 'admin') {
        alert('Acesso negado. Faz login como administrador.');
        window.location.href = 'login.html';
    }

    function authHeaders() {
        return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    }

    function sanitize(str) {
        const div = document.createElement('div');
        div.textContent = String(str || '');
        return div.innerHTML;
    }

    function showMsg(texto, tipo = 'sucesso') {
        const el = document.getElementById('form-msg');
        el.textContent = texto;
        el.className = `msg ${tipo}`;
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 3000);
    }

    document.getElementById('tab-produtos').addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('secao-produtos').classList.remove('hidden');
        document.getElementById('secao-encomendas').classList.add('hidden');
    });

    document.getElementById('tab-encomendas').addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('secao-produtos').classList.add('hidden');
        document.getElementById('secao-encomendas').classList.remove('hidden');
        carregarEncomendas();
    });

    document.getElementById('btn-logout').addEventListener('click', e => {
        e.preventDefault();
        localStorage.removeItem('ella_token');
        localStorage.removeItem('ella_user');
        window.location.href = 'login.html';
    });

    async function carregarProdutos() {
        const lista = document.getElementById('lista-produtos');
        try {
            const res  = await fetch(`${API_URL}/products`, { headers: authHeaders() });
            const { data } = await res.json();
            renderProdutos(data);
        } catch {
            lista.innerHTML = '<p>Erro ao carregar produtos.</p>';
        }
    }

    function renderProdutos(produtos) {
        const lista = document.getElementById('lista-produtos');
        if (!produtos || produtos.length === 0) {
            lista.innerHTML = '<p>Nenhum produto encontrado.</p>';
            return;
        }
        lista.innerHTML = `
            <table class="admin-table">
                <thead><tr><th>ID</th><th>Nome</th><th>Preço</th><th>Ações</th></tr></thead>
                <tbody>
                    ${produtos.map(p => `
                        <tr>
                            <td>${sanitize(p.id)}</td>
                            <td>${sanitize(p.name)}</td>
                            <td>${parseFloat(p.price).toFixed(2)}€</td>
                            <td>
                                <button class="btn-editar" data-id="${p.id}" data-nome="${sanitize(p.name)}" data-preco="${p.price}" data-imagem="${sanitize(p.image || '')}" data-descricao="${sanitize(p.description || '')}">Editar</button>
                                <button class="btn-apagar" data-id="${p.id}">Apagar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('produto-id').value        = btn.dataset.id;
                document.getElementById('produto-nome').value      = btn.dataset.nome;
                document.getElementById('produto-preco').value     = btn.dataset.preco;
                document.getElementById('produto-imagem').value    = btn.dataset.imagem;
                document.getElementById('produto-descricao').value = btn.dataset.descricao;
                document.getElementById('form-titulo').textContent = 'Editar Produto';
                document.getElementById('btn-cancelar').classList.remove('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        document.querySelectorAll('.btn-apagar').forEach(btn => {
            btn.addEventListener('click', () => apagarProduto(btn.dataset.id));
        });
    }

    document.getElementById('btn-guardar').addEventListener('click', async () => {
        const id        = document.getElementById('produto-id').value;
        const name      = document.getElementById('produto-nome').value.trim();
        const price     = document.getElementById('produto-preco').value;
        const image     = document.getElementById('produto-imagem').value.trim();
        const description = document.getElementById('produto-descricao').value.trim();

        if (!name || !price) {
            showMsg('Nome e preço são obrigatórios.', 'erro');
            return;
        }

        const metodo = id ? 'PUT' : 'POST';
        const url    = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;

        try {
            const res = await fetch(url, {
                method: metodo,
                headers: authHeaders(),
                body: JSON.stringify({ name, price: parseFloat(price), image, description, active: 1 })
            });
            const data = await res.json();
            if (res.ok) {
                showMsg(id ? 'Produto atualizado!' : 'Produto criado!');
                resetForm();
                carregarProdutos();
            } else {
                showMsg(data.error || 'Erro ao guardar', 'erro');
            }
        } catch {
            showMsg('Erro de ligação ao servidor', 'erro');
        }
    });

    async function apagarProduto(id) {
        if (!confirm('Tens a certeza que queres apagar este produto?')) return;
        try {
            const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: authHeaders() });
            if (res.ok) {
                showMsg('Produto apagado.');
                carregarProdutos();
            }
        } catch {
            showMsg('Erro ao apagar produto.', 'erro');
        }
    }

    document.getElementById('btn-cancelar').addEventListener('click', resetForm);

    function resetForm() {
        document.getElementById('produto-id').value        = '';
        document.getElementById('produto-nome').value      = '';
        document.getElementById('produto-preco').value     = '';
        document.getElementById('produto-imagem').value    = '';
        document.getElementById('produto-descricao').value = '';
        document.getElementById('form-titulo').textContent = 'Adicionar Produto';
        document.getElementById('btn-cancelar').classList.add('hidden');
    }

    async function carregarEncomendas() {
        const lista = document.getElementById('lista-encomendas');
        try {
            const res  = await fetch(`${API_URL}/orders/all`, { headers: authHeaders() });
            const { data } = await res.json();
            renderEncomendas(data);
        } catch {
            lista.innerHTML = '<p>Erro ao carregar encomendas.</p>';
        }
    }

    function renderEncomendas(encomendas) {
        const lista = document.getElementById('lista-encomendas');
        if (!encomendas || encomendas.length === 0) {
            lista.innerHTML = '<p>Nenhuma encomenda ainda.</p>';
            return;
        }

        const statusOpcoes = ['pending','paid','shipped','delivered','cancelled'];

        lista.innerHTML = `
            <table class="admin-table">
                <thead><tr><th>ID</th><th>Cliente</th><th>Email</th><th>Total</th><th>Estado</th><th>Data</th><th>Atualizar</th></tr></thead>
                <tbody>
                    ${encomendas.map(o => `
                        <tr>
                            <td>#${sanitize(o.id)}</td>
                            <td>${sanitize(o.name)}</td>
                            <td>${sanitize(o.email)}</td>
                            <td>${parseFloat(o.total).toFixed(2)}€</td>
                            <td>
                                <select class="status-select" data-id="${o.id}">
                                    ${statusOpcoes.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                                </select>
                            </td>
                            <td>${new Date(o.created_at).toLocaleDateString('pt-PT')}</td>
                            <td><button class="btn-status" data-id="${o.id}">Guardar</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.querySelectorAll('.btn-status').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id     = btn.dataset.id;
                const select = document.querySelector(`.status-select[data-id="${id}"]`);
                const status = select.value;
                try {
                    const res = await fetch(`${API_URL}/orders/${id}/status`, {
                        method: 'PUT',
                        headers: authHeaders(),
                        body: JSON.stringify({ status })
                    });
                    if (res.ok) {
                        showMsg(`Encomenda #${id} atualizada para "${status}"`);
                    }
                } catch {
                    showMsg('Erro ao atualizar encomenda.', 'erro');
                }
            });
        });
    }

    carregarProdutos();
    </script>
</body>
</html>
FILE_EOF

# ── frontend/success.html ─────────────────────────────────────
cat > frontend/success.html <<'FILE_EOF'
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ELLA'S - Pagamento Confirmado</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header><div class="logo">ELLA'S</div></header>
    <main class="auth-container">
        <div class="auth-box" style="text-align:center">
            <h1>Pagamento Confirmado!</h1>
            <p>A tua encomenda foi recebida com sucesso.</p>
            <p id="order-info"></p>
            <a href="index.html"><button>Continuar a comprar</button></a>
        </div>
    </main>
    <script>
        localStorage.removeItem('ella_cart');
        const params  = new URLSearchParams(window.location.search);
        const orderId = params.get('order');
        if (orderId) {
            document.getElementById('order-info').textContent = `Número da encomenda: #${orderId}`;
        }
    </script>
</body>
</html>
FILE_EOF

# ── frontend/script.js ────────────────────────────────────────
cat > frontend/script.js <<'FILE_EOF'
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://SUBSTITUIR-PELO-TEU-BACKEND-EM-PRODUCAO.com/api';

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

        div.innerHTML = `
            <img src="${image}" alt="${name}" onerror="this.src='images/placeholder.jpg'">
            <h2>${name}</h2>
            <p class="desc">${desc}</p>
            <p class="price">${price}€</p>
            <button class="add-cart-btn" data-id="${product.id}" data-name="${name}" data-price="${price}">
                Adicionar ao Carrinho
            </button>
        `;
        feed.appendChild(div);
    });

    document.querySelectorAll('.add-cart-btn').forEach(btn => {
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
FILE_EOF

# ── frontend/styles.css ───────────────────────────────────────
cat > frontend/styles.css <<'FILE_EOF'
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
    --preto: #111111;
    --branco: #ffffff;
    --cinza-claro: #f5f5f5;
    --cinza-medio: #dddddd;
    --cinza-texto: #555555;
    --destaque: #c9a96e;
    --erro: #c0392b;
    --sucesso: #27ae60;
    --sombra: 0 2px 12px rgba(0,0,0,0.08);
    --raio: 8px;
    --fonte: 'Segoe UI', Arial, sans-serif;
}

body { font-family: var(--fonte); background-color: var(--cinza-claro); color: var(--preto); min-height: 100vh; display: flex; flex-direction: column; }
a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; }

header { background-color: var(--preto); color: var(--branco); padding: 0 32px; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.logo { font-size: 22px; font-weight: 700; letter-spacing: 4px; color: var(--destaque); text-transform: uppercase; }
nav ul { list-style: none; display: flex; gap: 28px; align-items: center; }
nav ul li a { color: var(--cinza-medio); font-size: 14px; letter-spacing: 1px; text-transform: uppercase; transition: color 0.2s; padding: 4px 0; border-bottom: 2px solid transparent; }
nav ul li a:hover { color: var(--destaque); border-bottom-color: var(--destaque); }
#cart-count { background: var(--destaque); color: var(--preto); border-radius: 50%; padding: 1px 6px; font-size: 11px; font-weight: 700; margin-left: 4px; }

main { flex: 1; max-width: 1200px; width: 100%; margin: 0 auto; padding: 40px 24px; }
main h1 { font-size: 24px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px; border-bottom: 2px solid var(--destaque); padding-bottom: 10px; display: inline-block; }

.product-feed { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px; }
.product { background: var(--branco); border-radius: var(--raio); box-shadow: var(--sombra); overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; }
.product:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.product img { width: 100%; height: 200px; object-fit: cover; background: var(--cinza-claro); }
.product h2 { font-size: 15px; font-weight: 600; padding: 14px 14px 4px; }
.product .desc { font-size: 12px; color: var(--cinza-texto); padding: 0 14px 8px; flex: 1; line-height: 1.5; }
.product .price { font-size: 18px; font-weight: 700; color: var(--destaque); padding: 0 14px 14px; }
.add-cart-btn { margin: 0 14px 14px; padding: 10px; background: var(--preto); color: var(--branco); border: none; border-radius: var(--raio); font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: background 0.2s; }
.add-cart-btn:hover { background: var(--destaque); color: var(--preto); }

#loading { text-align: center; padding: 40px; color: var(--cinza-texto); font-size: 15px; }

.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal.hidden { display: none; }
.modal-content { background: var(--branco); border-radius: var(--raio); padding: 32px; width: 90%; max-width: 480px; max-height: 80vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
.modal-content h2 { font-size: 20px; margin-bottom: 20px; letter-spacing: 2px; text-transform: uppercase; border-bottom: 2px solid var(--destaque); padding-bottom: 8px; }
.cart-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--cinza-medio); font-size: 14px; gap: 8px; }
.cart-item span:first-child { flex: 1; }
.remove-item { background: none; border: 1px solid var(--erro); color: var(--erro); padding: 4px 10px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.2s; }
.remove-item:hover { background: var(--erro); color: var(--branco); }
#cart-total { font-size: 18px; color: var(--destaque); }
.modal-content p { margin: 16px 0 20px; font-size: 15px; }
#checkout-btn { width: 100%; padding: 14px; background: var(--destaque); color: var(--preto); border: none; border-radius: var(--raio); font-size: 14px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s; margin-bottom: 10px; }
#checkout-btn:hover { opacity: 0.85; }
#close-cart { width: 100%; padding: 10px; background: none; border: 1px solid var(--cinza-medio); border-radius: var(--raio); font-size: 13px; color: var(--cinza-texto); cursor: pointer; transition: border-color 0.2s; }
#close-cart:hover { border-color: var(--preto); color: var(--preto); }

.auth-container { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 64px - 80px); padding: 40px 24px; }
.auth-box { background: var(--branco); border-radius: var(--raio); box-shadow: var(--sombra); padding: 40px; width: 100%; max-width: 420px; }
.auth-box h1 { font-size: 20px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 28px; border-bottom: 2px solid var(--destaque); padding-bottom: 10px; }
.auth-box input { width: 100%; padding: 12px 14px; margin-bottom: 14px; border: 1px solid var(--cinza-medio); border-radius: var(--raio); font-size: 14px; font-family: var(--fonte); transition: border-color 0.2s; background: var(--cinza-claro); }
.auth-box input:focus { outline: none; border-color: var(--destaque); background: var(--branco); }
.auth-box button { width: 100%; padding: 13px; background: var(--preto); color: var(--branco); border: none; border-radius: var(--raio); font-size: 14px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: background 0.2s; margin-top: 4px; }
.auth-box button:hover { background: var(--destaque); color: var(--preto); }
.auth-box p { margin-top: 18px; font-size: 13px; color: var(--cinza-texto); text-align: center; }
.auth-box p a { color: var(--destaque); font-weight: 600; text-decoration: underline; }
.error-msg { background: #fdecea; border: 1px solid var(--erro); color: var(--erro); padding: 10px 14px; border-radius: var(--raio); font-size: 13px; margin-bottom: 14px; }

.admin-container { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
.admin-container h2 { font-size: 20px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px; border-bottom: 2px solid var(--destaque); padding-bottom: 8px; }
.admin-form { background: var(--branco); border-radius: var(--raio); box-shadow: var(--sombra); padding: 28px; margin-bottom: 32px; }
.admin-form h3 { font-size: 15px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 18px; color: var(--cinza-texto); }
.admin-form input, .admin-form textarea { width: 100%; padding: 11px 14px; margin-bottom: 12px; border: 1px solid var(--cinza-medio); border-radius: var(--raio); font-size: 14px; font-family: var(--fonte); background: var(--cinza-claro); transition: border-color 0.2s; }
.admin-form input:focus, .admin-form textarea:focus { outline: none; border-color: var(--destaque); background: var(--branco); }
.admin-form textarea { min-height: 80px; resize: vertical; }
.form-buttons { display: flex; gap: 12px; margin-top: 4px; }
.admin-form button { padding: 11px 24px; border: none; border-radius: var(--raio); font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
#btn-guardar { background: var(--preto); color: var(--branco); }
#btn-guardar:hover { background: var(--destaque); color: var(--preto); }
#btn-cancelar { background: none; border: 1px solid var(--cinza-medio) !important; color: var(--cinza-texto); }
#btn-cancelar:hover { border-color: var(--preto) !important; color: var(--preto); }
.admin-table { width: 100%; border-collapse: collapse; background: var(--branco); border-radius: var(--raio); overflow: hidden; box-shadow: var(--sombra); font-size: 14px; }
.admin-table thead { background: var(--preto); color: var(--branco); }
.admin-table th { padding: 13px 16px; text-align: left; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; }
.admin-table td { padding: 12px 16px; border-bottom: 1px solid var(--cinza-claro); vertical-align: middle; }
.admin-table tbody tr:last-child td { border-bottom: none; }
.admin-table tbody tr:hover { background: var(--cinza-claro); }
.btn-editar { background: var(--preto); color: var(--branco); border: none; padding: 6px 14px; border-radius: 4px; font-size: 12px; cursor: pointer; margin-right: 6px; transition: background 0.2s; }
.btn-editar:hover { background: var(--destaque); color: var(--preto); }
.btn-apagar { background: none; border: 1px solid var(--erro); color: var(--erro); padding: 6px 14px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.2s; }
.btn-apagar:hover { background: var(--erro); color: var(--branco); }
.status-select { padding: 5px 8px; border: 1px solid var(--cinza-medio); border-radius: 4px; font-size: 13px; background: var(--cinza-claro); }
.btn-status { background: var(--preto); color: var(--branco); border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background 0.2s; }
.btn-status:hover { background: var(--destaque); color: var(--preto); }

.msg { padding: 10px 14px; border-radius: var(--raio); font-size: 13px; margin-top: 12px; }
.msg.sucesso { background: #eafaf1; border: 1px solid var(--sucesso); color: var(--sucesso); }
.msg.erro { background: #fdecea; border: 1px solid var(--erro); color: var(--erro); }

footer { background: var(--preto); color: var(--cinza-medio); text-align: center; padding: 24px; font-size: 13px; line-height: 2; margin-top: auto; }
footer a { color: var(--destaque); transition: opacity 0.2s; }
footer a:hover { opacity: 0.75; }

.hidden { display: none !important; }

@media (max-width: 768px) {
    header { padding: 14px 16px; flex-wrap: wrap; height: auto; gap: 12px; }
    nav ul { gap: 16px; }
    nav ul li a { font-size: 12px; }
    main { padding: 24px 16px; }
    .product-feed { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
    .product img { height: 160px; }
    .modal-content { padding: 24px 18px; }
    .auth-box { padding: 28px 20px; }
    .admin-form { padding: 20px 16px; }
    .admin-table { font-size: 12px; }
    .admin-table th, .admin-table td { padding: 10px 10px; }
    .form-buttons { flex-direction: column; }
}

@media (max-width: 480px) {
    .logo { font-size: 18px; }
    .product-feed { grid-template-columns: 1fr 1fr; }
    main h1 { font-size: 18px; }
}
FILE_EOF

# ── database/ellas_store.sql ──────────────────────────────────
cat > database/ellas_store.sql <<'FILE_EOF'
CREATE DATABASE IF NOT EXISTS ellas_store;
USE ellas_store;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('client','admin') DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(300),
    active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status ENUM('pending','paid','shipped','delivered','cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- IMPORTANTE: o hash abaixo NÃO é válido. É um placeholder.
-- Gera um hash real correndo (dentro da pasta backend, com dependências instaladas):
--   node -e "require('bcrypt').hash('TuaPasswordForte123!', 12).then(h => console.log(h))"
-- e substitui o valor abaixo antes de correres este SQL.
INSERT INTO users (name, email, password, role) VALUES (
    'Admin',
    'admin@ellasstore.com',
    'SUBSTITUIR_POR_HASH_BCRYPT_REAL_AQUI',
    'admin'
);
FILE_EOF

# ── .gitignore ─────────────────────────────────────────────────
cat > .gitignore <<'FILE_EOF'
node_modules/
.env
*.log
.DS_Store
dist/
build/
.vercel
FILE_EOF

# ── README.md ──────────────────────────────────────────────────
cat > README.md <<'FILE_EOF'
# ELLA'S Store

Loja virtual híbrida (venda direta + preparada para afiliados no futuro).
Stack: Node.js + Express + MySQL + HTML/CSS/JS puro + Stripe.

## Estado atual
Este pacote contém apenas a base funcional: autenticação, produtos,
carrinho, checkout Stripe e painel admin. A arquitetura híbrida,
SEO, RGPD e integrações com redes de afiliados ainda não estão
implementadas — ficam para fases seguintes do plano.

## Instalar

    cd backend
    cp .env.example .env
    npm install

## Base de dados

    mysql -u root -p < database/ellas_store.sql

Depois substitui o hash do admin no SQL — o valor incluído é um
placeholder, não um hash válido.

## Iniciar

    node app.js

## Testes básicos

    curl http://localhost:3000/health
    curl http://localhost:3000/api/products
FILE_EOF

echo ""
echo "✅ Projeto criado com sucesso em: $(pwd)"
echo ""
echo "Próximos passos:"
echo "  cd backend"
echo "  cp .env.example .env"
echo "  # edita o .env com os teus valores reais"
echo "  npm install"
echo "  node app.js"
