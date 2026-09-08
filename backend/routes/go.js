const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');

router.get('/:slug', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, product_type, affiliate_url FROM products WHERE slug = ? AND active = 1',
            [req.params.slug]
        );

        if (rows.length === 0) {
            return res.status(404).send('Produto nao encontrado');
        }

        const product = rows[0];

        if (product.product_type !== 'affiliate' || !product.affiliate_url) {
            return res.status(400).send('Este produto nao tem link de afiliado');
        }

        let destino;
        try {
            destino = new URL(product.affiliate_url);
            if (destino.protocol !== 'http:' && destino.protocol !== 'https:') {
                throw new Error('Protocolo invalido');
            }
        } catch {
            return res.status(400).send('Link de afiliado invalido');
        }

        const ip = req.ip || (req.connection && req.connection.remoteAddress) || '';
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        await db.query(
            `INSERT INTO click_tracking
             (product_id, utm_source, utm_medium, utm_campaign, ip_hash, user_agent, referrer)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                product.id,
                req.query.utm_source || null,
                req.query.utm_medium || null,
                req.query.utm_campaign || null,
                ipHash,
                req.headers['user-agent'] || null,
                req.headers['referer'] || null
            ]
        );

        res.redirect(302, destino.toString());
    } catch (error) {
        console.error('Erro na rota /go:', error);
        res.status(500).send('Erro interno');
    }
});

module.exports = router;
