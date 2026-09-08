




#!/bin/bash
set -e

PROJECT="astro-world"
ZIPFILE="${PROJECT}.zip"

rm -rf "$PROJECT" "$ZIPFILE"

mkdir -p "$PROJECT"
cd "$PROJECT"

cat > package.json <<'JSON'
{
  "name": "astro-world",
  "version": "0.1.0",
  "private": true,
  "scripts": {

    "build": "next build",
    "start": "next start",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "next": "13.5.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@prisma/client": "4.15.0"
  },

  "devDependencies": {

    "prisma": "4.15.0",
    "typescript": "5.1.6",
    "ts-node": "10.9.1",
    "@types/react": "18.2.24",
    "@types/node": "20.4.2"
  }
}
JSON

cat > tsconfig.json <<'TS'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "prisma/seed.ts"],
  "exclude": ["node_modules"]
}
TS

cat > next.config.js <<'JS'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
}
module.exports = nextConfig
JS

cat > next-env.d.ts <<'DTS'
/// <reference types="next" />
/// <reference types="next/types/global" />
/// <reference types="next/image-types/global" />
DTS

mkdir -p pages
cat > pages/_app.tsx <<'TSX'
import '../styles.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
TSX

cat > pages/index.tsx <<'TSX'
export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h1>Astro World (demo)</h1>
      <p>Projeto mínimo pronto para instalar e executar.</p>
      <p>API de exemplo: <a href="/api/hello">/api/hello</a></p>
    </main>
  );
}
TSX

cat > pages/api/hello.ts <<'TS'
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: 'Olá do Astro World!' });
}
TS

cat > styles.css <<'CSS'
body { margin: 0; padding: 0; }
CSS

cat > .gitignore <<'GIT'
node_modules
.env
dev.db
*.log
.vscode
.DS_Store
GIT

mkdir -p prisma
cat > prisma/schema.prisma <<'PRISMA'
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  role      String
  createdAt DateTime @default(now())
}
PRISMA

cat > prisma/seed.ts <<'SEED'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@loja.test';
  const adminPass = process.env.ADMIN_PASS || 'Admin123!';

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPass,
      role: 'ADMIN'
    }
  });
  console.log('Seed: admin user ensured', adminEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
SEED

cat > .env.example <<'ENV'
# Exemplo: DATABASE_URL="postgresql://user:password@host:5432/dbname"
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
ADMIN_EMAIL="admin@loja.test"
ADMIN_PASS="Admin123!"
ENV

cat > README.md <<'MD'
# Astro World (demo) — preparado para Postgres / Supabase

Resumo de passos para local:
1) Copiar .env.example para .env e preencher DATABASE_URL:
   cp .env.example .env
   # editar .env e colar a connection string do Supabase (DATABASE_URL)

2) Instalar dependências:
   npm install

3) Gerar cliente Prisma:
   npx prisma generate

4) Aplicar schema na DB:
   npx prisma db push

5) Executar seed:
   npm run seed
   (o seed usa ADMIN_EMAIL e ADMIN_PASS do .env)

6) Executar em dev:
   npm run dev
   Abre http://localhost:3000

Notas:
- Em Vercel adiciona a variável de ambiente DATABASE_URL (e ADMIN_EMAIL/ADMIN_PASS se quiseres).
- Recomenda-se alterar a password admin em produção.
MD

mkdir -p .github/workflows
cat > .github/workflows/prisma-seed.yml <<'YML'
name: Prisma push & seed

on:
  push:
    branches: [ main ]

jobs:
  prisma:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Prisma generate
        run: npx prisma generate
      - name: Prisma db push
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npx prisma db push
      - name: Run seed
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
          ADMIN_PASS: ${{ secrets.ADMIN_PASS }}
        run: npm run seed
YML

cd ..

zip -r "$ZIPFILE" "$PROJECT" >/dev/null

echo "$ZIPFILE criado."
echo "Descompacta com: unzip $ZIPFILE"

