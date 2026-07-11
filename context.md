# Prévoya - Consultor de Negócios Virtual

> **Atualizado:** 11 Julho 2026 | [Repo](https://github.com/renato0503/CerraSmartek) | [Produção](https://prevoya.web.app)

## Visão Geral

Prévoya é uma plataforma SaaS que entrega **relatórios de inteligência de localização** para empreendedores que desejam abrir ou expandir negócios físicos. A promessa central é **"entregar a decisão pronta"** em formato de laudo técnico profissional (PDF/Dashboard).

---

## Conceito: "O Consultor de Bolso"

| Elemento | Descrição |
|----------|-----------|
| **Interface** | Wizard (assistente passo a passo) + Modal rápido na landing page |
| **Entregável** | Relatório visual com gráficos, mapas, análise SWOT e conclusões executivas |
| **Diferencial** | Curadoria visual + dados validados + tom de consultoria (McKinsey) |
| **Público-alvo** | Empreendedores, franqueados, corretores comerciais (CRECI), pequenos empresários |

---

## Features do Relatório

### A. Raio-X de Concorrentes
Busca de estabelecimentos via Google Places API no raio definido. Lista com nome, rating, endereço, total de avaliações.

### B. Análise Demográfica
Cruza CEP com dados do IBGE (população, renda média, densidade). Dados cacheados por 30 dias.

### C. Termômetro de Reputação
Análise das avaliações do Google Maps dos 5 principais concorrentes. Extrai reclamações e elogios via análise de palavras-chave. Gera nuvem de palavras.

### D. Análise de Fornecedores B2B
Busca de fornecedores próximos ao ponto comercial (distribuidores, atacados). Keywords específicas por nicho.

### E. SWOT Automático
Matriz SWOT gerada por IA (Groq Llama 3.3 70B) com templates específicos para 9 nichos.

### F. Plano de Ação
Recomendações de curto e médio prazo, estratégia de diferenciação baseada nos dados coletados.

---

## Modelo de Negócio

### Precificação

| Plano | Preço | Descrição |
|-------|-------|-----------|
| Grátis | R$ 0 | Raio-X de concorrentes (1 página), PDF jsPDF |
| Completo | R$ 75/relatório | Análise completa com IA, SWOT, demografia, PDF profissional (Puppeteer) |
| Pro | R$ 200/mês | 10 relatórios/mês, API, white-label, suporte prioritário |

### Funil de Vendas

1. **Lead gen**: Landing page → modal com Nome, Email, WhatsApp, CNPJ → análise gratuita → upsell completo
2. **CNPJ rate limit**: 1 análise grátis por CNPJ a cada 30 dias
3. **CRM no admin**: pipeline de leads (novo → em_contato → qualificado → fechado → perdido) com kanban board

---

## Arquitetura Técnica

### Stack Atual

| Camada | Tecnologia | Detalhes |
|--------|-----------|----------|
| **Frontend** | Next.js 16 (App Router) + TypeScript + Tailwind v4 | Static export para Firebase Hosting |
| **Auth** | Firebase Auth | Google + Email/Senha |
| **Banco de Dados** | Cloud Firestore | NoSQL, tempo real |
| **Backend** | Cloud Functions 1st gen + 2nd gen (Node 22) | 12 funções deployadas, região southamerica-east1 |
| **Pipeline IA** | Cloud Functions 2nd gen | triggerReport → aiReportWriter → pdfGenerator |
| **Storage** | Cloud Storage | PDFs dos relatórios |
| **Pagamentos** | Stripe | Checkout + Subscription + Webhook + Refund |
| **IA / LLM** | Groq API (Llama 3.3 70B) | Chave via `functions:config` |
| **PDF cliente** | jsPDF | Download imediato na página de resultado |
| **PDF servidor** | Puppeteer + Chart.js | Relatório profissional ~10 páginas |
| **Mapas** | Leaflet.js + OpenStreetMap | Interativo no wizard |
| **Dados** | Google Places API, IBGE, ViaCEP, Brasil API (CNPJ) | Todos via Cloud Functions |
| **CI/CD** | GitHub Actions | Build + deploy automático a cada push na main |
| **SDK Functions** | firebase-functions@6.6.0 | v1 API em `firebase-functions/v1`, v2 em `firebase-functions/v2/*` |

### O Frontend NÃO expõe APIs

- API keys (Google, Groq, Stripe) ficam como `functions:config` ou `process.env` nas Cloud Functions
- Rate limiting e cache centralizados evitam chamadas duplicadas
- Static export: sem servidor Next.js — Firebase Hosting serve HTML puro

---

## Fluxo de Dados (Pipeline)

```
Cliente (Frontend)
  ↓ Landing page → Modal lead capture (nome, email, WhatsApp, CNPJ)
  ↓ Lead salvo no Firestore (coleção leads)
  ↓
Cloud Function: analyzeBairro (2nd gen, callable)
  ↓ Geocoding (ViaCEP + Nominatim)
  ↓ Google Places API (nearby search)
  ↓ Cria briefing no Firestore { status: 'concluido' }
  ↓
Redireciona → /resultado?id=xxx
  ↓ Tabela interativa + jsPDF download

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para plano COMPLETO (pago):

Cliente paga via Stripe Checkout
  ↓ Webhook confirma pagamento
  ↓ Briefing { status: 'pagamento_confirmado' }
  ↓
Cloud Function: triggerReport (onDocumentCreated)
  ↓ Execução PARALELA:
  │  • placesWorker     → Google Places API
  │  • ibgeWorker       → IBGE API
  │  • sentimentWorker  → Google Place Details (reviews)
  ↓ Firestore { status: 'dados_coletados' }
  ↓
Cloud Function: aiReportWriter (onDocumentCreated aiQueue)
  ↓ Monta contexto + System Prompt (estilo McKinsey + template do nicho)
  ↓ Groq API → JSON estruturado
  ↓ Firestore { status: 'relatorio_gerado', aiReport, swot }
  ↓
Cloud Function: pdfGenerator (onDocumentCreated pdfQueue)
  ↓ HTML template → Puppeteer → PDF A4
  ↓ Upload Cloud Storage + signed URL (7 dias)
  ↓ Firestore { status: 'concluido', pdfUrl }
```

---

## Coleções Firestore

| Coleção | Descrição | Regras |
|---------|-----------|--------|
| `users/{uid}` | Perfil do usuário (créditos, role) | Read/Write: próprio usuário |
| `briefings/{id}` | Dados do relatório, status, AI report, PDF URL | Read: próprio usuário ou admin; Create: auth; Update: Cloud Functions |
| `leads/{id}` | Leads capturados (nome, email, WhatsApp, CNPJ, notas) | Read: público; Create: público; Update: auth ou admin |
| `cacheBairros/{cep_raio}` | Cache de Places + IBGE (30 dias TTL) | Read: público; Write: Cloud Functions |
| `rateLimits/{uid}` | Contador de requisições por usuário/hora | Read/Write: público |
| `affiliates/{id}` | Registro de cliques de afiliados (?ref=) | Create: público |
| `failedJobs/{id}` | Dead-letter queue para jobs com falha | Write: Cloud Functions |
| `aiQueue/{id}` | Fila interna para geração de relatório IA | Bloqueado do cliente |
| `pdfQueue/{id}` | Fila interna para geração de PDF | Bloqueado do cliente |

### Índices Compostos

| Coleção | Campos | 
|---------|--------|
| `briefings` | userId ASC + createdAt DESC |
| `leads` | cnpj ASC + createdAt ASC |

---

## Cloud Functions Deployadas (12 funções)

| Função | Geração | Trigger | Runtime |
|--------|---------|---------|---------|
| `analyzeBairro` | 2nd gen | callable | nodejs22 |
| `getReportStatus` | 2nd gen | callable | nodejs22 |
| `triggerReport` | 2nd gen | Firestore onDocumentCreated | nodejs20 |
| `aiReportWriter` | 2nd gen | Firestore onDocumentCreated | nodejs20 |
| `pdfGenerator` | 2nd gen | Firestore onDocumentCreated | nodejs20 |
| `createStripeCheckout` | 2nd gen | callable | nodejs20 |
| `createSubscriptionCheckout` | 2nd gen | callable | nodejs20 |
| `stripeWebhook` | 2nd gen | https onRequest | nodejs20 |
| `solicitarReembolso` | 2nd gen | callable | nodejs20 |
| `generateFreeReport` | 2nd gen | callable | nodejs20 |
| `getDemographicData` | 2nd gen | callable | nodejs20 |
| `searchPlaces` | 2nd gen | callable | nodejs20 |

---

## Custos Operacionais (estimativa)

| Serviço | 100 relatórios/mês | 1000 relatórios/mês |
|---------|:---:|:---:|
| Firebase Hosting | Grátis | Grátis |
| Firebase Auth | Grátis | Grátis |
| Cloud Functions | Grátis | ~R$ 25 |
| Firestore | Grátis | ~R$ 40 |
| Google Places API | ~R$ 80 | ~R$ 800 |
| Groq API | **Grátis** | ~R$ 200 |
| Stripe | 3,99% + R$1,50 | 3,99% |
| **TOTAL** | **~R$ 300/mês** | **~R$ 3.500/mês** |

---

## APIs Externas

| API | Função | Custo |
|-----|--------|-------|
| Google Places API | Concorrentes, reviews, fornecedores | $40/1k req |
| IBGE API | Demografia e censo | **Grátis** |
| ViaCEP | Busca CEP Brasil | **Grátis** |
| Nominatim (OSM) | Geocoding CEP → coordenadas | **Grátis** |
| Brasil API | Dados de CNPJ (razão social, etc) | **Grátis** |
| Groq API (Llama 3.3) | Redação do relatório (IA) | **Grátis** (dev) |
| Stripe | Pagamentos | 3,99% |

---

## Deploy

```bash
# CI/CD automático via GitHub Actions (push na main)
# Ou manualmente:
npm run build              # Build Next.js static export
firebase deploy --only hosting     # Deploy frontend
firebase deploy --only functions   # Deploy backend

# Para deploy local de funções, é necessário ter as permissões IAM corretas:
# - Service account 318851644585-compute@developer.gserviceaccount.com
#   precisa dos papéis: Storage Object Admin, Logs Writer
# OU deploy via GitHub Actions (recomendado)
```

### GitHub Actions

Workflow em `.github/workflows/deploy.yml`. Secrets necessários:
- `FIREBASE_SERVICE_ACCOUNT` — JSON da service account key
- `NEXT_PUBLIC_FIREBASE_API_KEY` — API key do Firebase

---

## Pendências Conhecidas

- [ ] Configurar Google Places API key (`functions:config:set google.places_api_key="..."`)
- [ ] Configurar Stripe keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- [ ] Substituir dados mock da landing page por dados reais
- [ ] Migrar `functions:config` para `params` package (antes de Março 2027)
- [ ] Atualizar funções de nodejs20 para nodejs22 (antes de Outubro 2026)
