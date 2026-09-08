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
