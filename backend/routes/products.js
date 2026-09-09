const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminRequired } = require('../middleware/authMiddleware');

const CAMPOS = `
    p.id, p.product_type, p.name, p.description, p.price, p.original_price,
    p.discount_percent, p.image, p.slug, p.sku, p.stock, p.merchant_id,
    p.affiliate_network_id, p.affiliate_url, p.category_id, p.active,
    c.name AS category_name, c.slug AS category_slug
`;

router.get('/', async (req, res) => {
    try {
        const { type, category, search } = req.query;
        let sql = `
            SELECT ${CAMPOS}
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.active = 1
        `;
        const params = [];

        if (type === 'own' || type === 'affiliate') {
            sql += ' AND p.product_type = ?';
            params.push(type);
        }

        if (category) {
            sql += ' AND c.slug = ?';
            params.push(category);
        }

        if (search) {
            sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            const termo = `%${search}%`;
            params.push(termo, termo);
        }

        sql += ' ORDER BY p.id DESC';

        const [products] = await db.query(sql, params);
        res.json({ success: true, data: products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT ${CAMPOS} FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ? AND p.active = 1`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Produto nao encontrado' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno' });
    }
});

router.post('/', adminRequired, async (req, res) => {
    try {
        const {
            product_type, name, price, image, description,
            slug, sku, stock, original_price, discount_percent,
            merchant_id, affiliate_network_id, affiliate_url, category_id
        } = req.body;

        if (!name || !price) {
            return res.status(400).json({ error: 'Nome e preco obrigatorios' });
        }

        const tipo = product_type === 'affiliate' ? 'affiliate' : 'own';

        if (tipo === 'affiliate' && !affiliate_url) {
            return res.status(400).json({ error: 'Produtos afiliados precisam de affiliate_url' });
        }

        await db.query(
            `INSERT INTO products
             (product_type, name, price, image, description, slug, sku, stock,
              original_price, discount_percent, merchant_id, affiliate_network_id,
              affiliate_url, category_id, active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                tipo, name, price, image || '', description || '',
                slug || null, sku || null, stock || null,
                original_price || null, discount_percent || null,
                merchant_id || null, affiliate_network_id || null,
                affiliate_url || null, category_id || null
            ]
        );
        res.status(201).json({ message: 'Produto criado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

router.put('/:id', adminRequired, async (req, res) => {
    try {
        const {
            name, price, image, description, active,
            slug, sku, stock, original_price, discount_percent,
            merchant_id, affiliate_network_id, affiliate_url, category_id
        } = req.body;

        await db.query(
            `UPDATE products SET
                name=?, price=?, image=?, description=?, active=?,
                slug=?, sku=?, stock=?, original_price=?, discount_percent=?,
                merchant_id=?, affiliate_network_id=?, affiliate_url=?, category_id=?
             WHERE id=?`,
            [
                name, price, image, description, active,
                slug || null, sku || null, stock || null,
                original_price || null, discount_percent || null,
                merchant_id || null, affiliate_network_id || null,
                affiliate_url || null, category_id || null,
                req.params.id
            ]
        );
        res.json({ message: 'Produto atualizado' });
    } catch (error) {
        console.error(error);
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
