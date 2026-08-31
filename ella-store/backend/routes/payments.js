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
