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
