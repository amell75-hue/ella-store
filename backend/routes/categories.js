const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminRequired } = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, name, slug, parent_id FROM categories WHERE active = 1 ORDER BY name'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
});

router.post('/', adminRequired, async (req, res) => {
    try {
        const { name, slug, parent_id } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ error: 'Nome e slug obrigatorios' });
        }
        await db.query(
            'INSERT INTO categories (name, slug, parent_id, active) VALUES (?, ?, ?, 1)',
            [name, slug, parent_id || null]
        );
        res.status(201).json({ message: 'Categoria criada' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Ja existe uma categoria com esse slug' });
        }
        res.status(500).json({ error: 'Erro interno' });
    }
});

router.put('/:id', adminRequired, async (req, res) => {
    try {
        const { name, slug, parent_id } = req.body;
        await db.query(
            'UPDATE categories SET name=?, slug=?, parent_id=? WHERE id=?',
            [name, slug, parent_id || null, req.params.id]
        );
        res.json({ message: 'Categoria atualizada' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno' });
    }
});

router.delete('/:id', adminRequired, async (req, res) => {
    try {
        await db.query('UPDATE categories SET active = 0 WHERE id = ?', [req.params.id]);
        res.json({ message: 'Categoria removida' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno' });
    }
});

module.exports = router;
