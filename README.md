# Prévoya — Inteligência de Localização

Plataforma SaaS de análise de viabilidade comercial. Descubra se o ponto comercial é realmente bom antes de investir.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS (static export) |
| Auth | Firebase Auth (Google + Email/Senha) |
| Backend | Firebase Cloud Functions (Node.js 22, southamerica-east1) |
| Database | Firestore |
| IA | Groq (Llama 3.3 70B) com fallback |
| Mapas | Leaflet + Google Places API |
| Dados externos | IBGE, ViaCEP, Brasil API (CNPJ) |
| PDF | jsPDF (client) + Puppeteer (server) |
| Pagamentos | Stripe (checkout + subscription + webhook + refund) |
| Hosting | Firebase Hosting |
| PWA | Manifest + Install prompt |

## Deploy

```bash
npm run build          # Build Next.js (static export → out/)
npm run deploy:all     # Deploy hosting + firestore + functions
```

URL produção: https://prevoya.web.app

## Desenvolvimento local

```bash
npm run dev            # Next.js dev server
firebase emulators:start  # Firebase local
```

## Estrutura

```
prevoya/
├── src/
│   ├── app/              # Pages (/, /login, /dashboard, /wizard, /admin, /resultado, etc)
│   ├── components/
│   │   ├── landing/      # LeadModal, CepForm, AffiliateTracker
│   │   ├── layout/       # Header, Footer, AuthGuard
│   │   ├── ui/           # Button, Card, Input, MapPicker, PWA, WhatsApp
│   │   └── wizard/       # WizardContainer, StepIndicator
│   ├── lib/              # firebase, auth, firestore
│   ├── services/         # places, ibge, reports
│   └── types/            # briefing, report, user
├── functions/
│   └── src/
│       ├── index.ts              # Cloud Functions entry
│       ├── workers/              # places, ibge, sentiment, supplier
│       └── utils/                # cache, geocoding, prompts, rateLimit, errorHandler
├── public/               # Static assets, manifest.json, robots.txt, sitemap.xml
├── firebase.json         # Firebase config
├── firestore.rules       # Security rules
└── .env.local            # Firebase keys (gitignored)
```

## Funcionalidades

- Landing page com modal de lead capture (CNPJ, nome, email, WhatsApp)
- Wizard de briefing 4 passos (nicho → localização → contexto → resumo)
- Raio-X gratuito do bairro via Cloud Function + Google Places API
- Relatório completo com IA (SWOT, demografia, concorrência, plano de ação)
- Dashboard com status em tempo real, comparativo de bairros
- Admin CRM com pipeline de leads (novo → em_contato → qualificado → fechado)
- Stripe checkout para planos pagos
- PWA instalável + WhatsApp share
- Programa de afiliados (?ref=)
