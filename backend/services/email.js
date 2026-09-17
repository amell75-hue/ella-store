const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function enviarConfirmacaoEncomenda(destinatario, dados) {
    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: destinatario,
            subject: `Encomenda #${dados.orderId} confirmada - ELLA'S Store`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #c9a96e;">ELLA'S Store</h1>
                    <h2>A tua encomenda foi confirmada!</h2>
                    <p>Olá,</p>
                    <p>Recebemos o teu pagamento com sucesso. Aqui estão os detalhes:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Número da encomenda</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">#${dados.orderId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Total pago</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${dados.total}€</td>
                        </tr>
                    </table>
                    <p>Obrigado por comprares na ELLA'S Store!</p>
                    <p style="font-size: 12px; color: #999; margin-top: 40px;">
                        ELLA'S Store — Este é um email automático, não é necessário responder.
                    </p>
                </div>
            `
        });
        console.log(`Email de confirmacao enviado para ${destinatario}`);
    } catch (error) {
        // Nunca deixar uma falha de email quebrar o fluxo de pagamento
        console.error('Erro ao enviar email de confirmacao:', error);
    }
}

module.exports = { enviarConfirmacaoEncomenda };
