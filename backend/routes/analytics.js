const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminRequired } = require('../middleware/authMiddleware');

// POST /api/analytics/pageview
// Rota publica. So regista se o consentimento de analise foi dado -
// essa verificacao acontece no frontend antes de chamar esta rota.
router.post('/pageview', async (req, res) => {
    try {
        const { page_path, utm_source, utm_medium, utm_campaign, session_id } = req.body;

        if (!page_path) {
            return res.status(400).json({ error: 'page_path obrigatorio' });
        }

        await db.query(
            `INSERT INTO page_views (page_path, utm_source, utm_medium, utm_campaign, referrer, session_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                page_path,
                utm_source || null,
                utm_medium || null,
                utm_campaign || null,
                req.headers['referer'] || null,
                session_id || null
            ]
        );

        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Erro ao registar pageview:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// GET /api/analytics/dashboard (so admin)
router.get('/dashboard', adminRequired, async (req, res) => {
    try {
        const [totalVisitas] = await db.query(
            'SELECT COUNT(*) AS total FROM page_views'
        );

        const [visitasPorOrigem] = await db.query(
            `SELECT COALESCE(utm_source, 'direto') AS origem, COUNT(*) AS total
             FROM page_views
             GROUP BY origem
             ORDER BY total DESC
             LIMIT 10`
        );

        const [paginasMaisVistas] = await db.query(
            `SELECT page_path, COUNT(*) AS total
             FROM page_views
             GROUP BY page_path
             ORDER BY total DESC
             LIMIT 10`
        );

        const [totalCliquesAfiliados] = await db.query(
            'SELECT COUNT(*) AS total FROM click_tracking'
        );

        const [produtosMaisClicados] = await db.query(
            `SELECT p.name, COUNT(*) AS total
             FROM click_tracking c
             JOIN products p ON c.product_id = p.id
             GROUP BY p.id, p.name
             ORDER BY total DESC
             LIMIT 10`
        );

        const [totalEncomendas] = await db.query(
            `SELECT COUNT(*) AS total, COALESCE(SUM(total), 0) AS receita
             FROM orders WHERE status = 'paid'`
        );

        res.json({
            success: true,
            data: {
                totalVisitas: totalVisitas[0].total,
                visitasPorOrigem,
                paginasMaisVistas,
                totalCliquesAfiliados: totalCliquesAfiliados[0].total,
                produtosMaisClicados,
                totalEncomendas: totalEncomendas[0].total,
                receita: totalEncomendas[0].receita
            }
        });
    } catch (error) {
        console.error('Erro no dashboard:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

module.exports = router;
