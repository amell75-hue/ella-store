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
