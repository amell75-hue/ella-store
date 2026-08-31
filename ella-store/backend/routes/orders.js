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
