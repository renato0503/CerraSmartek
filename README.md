# Prévoya — Inteligência de Localização

Plataforma SaaS de análise de viabilidade comercial. Descubra se o ponto comercial é realmente bom antes de investir.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS v4 (static export) |
| Auth | Firebase Auth (Google + Email/Senha) |
| Backend | Firebase Cloud Functions 1st gen + 2nd gen (Node.js 22, southamerica-east1) |
| Database | Firestore |
| IA | Groq (Llama 3.3 70B) |
| Mapas | Leaflet + Google Places API |
| Dados externos | IBGE, ViaCEP, Brasil API (CNPJ) |
| PDF | jsPDF (cliente) + Puppeteer (servidor) |
| Pagamentos | Stripe (checkout + subscription + webhook + refund) |
| Hosting | Firebase Hosting |
| CI/CD | GitHub Actions (deploy automático a cada push na main) |
| PWA | Manifest + Install prompt |

## Deploy

```bash
# CI/CD automático via GitHub Actions
# Ou manualmente:
npm run build              # Build Next.js static export → out/
firebase deploy --only hosting
firebase deploy --only functions --force
```

URL produção: https://prevoya.web.app

## Desenvolvimento local

```bash
npm run dev                 # Next.js dev server
firebase emulators:start    # Firebase local
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
│       ├── index.ts              # analyzeBairro + getReportStatus
│       ├── triggerReport.ts      # Pipeline orquestrator (2nd gen)
│       ├── aiReportWriter.ts     # IA writer (2nd gen)
│       ├── pdfGenerator.ts       # PDF generation (2nd gen)
│       ├── stripeWebhook.ts      # Stripe webhook handler
│       ├── createStripeCheckout.ts
│       ├── createSubscriptionCheckout.ts
│       ├── solicitarReembolso.ts
│       ├── workers/              # places, ibge, sentiment, supplier
│       └── utils/                # cache, geocoding, prompts, rateLimit, errorHandler
├── .github/workflows/
│   └── deploy.yml        # CI/CD pipeline
├── public/               # Static assets, manifest.json, robots.txt, sitemap.xml
├── firebase.json         # Firebase config (hosting, functions, firestore)
├── firestore.rules       # Security rules (com isAdmin)
├── firestore.indexes.json # Composite indexes
└── .env.local            # Firebase keys (gitignored)
```

## Funcionalidades

- Landing page com modal de lead capture (CNPJ, nome, email, WhatsApp)
- Wizard de briefing 4 passos (nicho → localização → contexto → resumo)
- Raio-X gratuito do bairro via Cloud Function + Google Places API
- Relatório completo com IA (SWOT, demografia, concorrência, plano de ação)
- Dashboard com status em tempo real, comparativo de bairros
- Admin CRM completo: kanban board, busca, add lead, notas, bulk actions, export CSV
- Admin métricas: pipeline de status, top nichos, top CEPs, erros recentes
- Stripe checkout para planos pagos
- PWA instalável + WhatsApp share
- Programa de afiliados (?ref=)
