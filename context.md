# Prévoya - Consultor de Negócios Virtual

## Visão Geral

Prévoya é uma plataforma SaaS que entrega **relatórios de inteligência de localização** para empreendedores que desejam abrir ou expandir negócios físicos. A promessa central não é "usar IA", mas sim **"entregar a decisão pronta"** em formato de laudo técnico profissional (PDF/Dashboard).

---

## Conceito: "O Consultor de Bolso"

| Elemento | Descrição |
|----------|-----------|
| **Interface** | Wizard (assistente passo a passo) / Formulário de Briefing |
| **Entregável** | Relatório visual com gráficos, mapas, análise SWOT e conclusões executivas |
| **Diferencial** | Curadoria visual + dados validados + tom de consultoria (McKinsey) |
| **Público-alvo** | Empreendedores, franqueados, corretores comerciais (CRECI), pequenos empresários |

---

## Features do Relatório

### A. Raio-X Demográfico
Cruza CEP/Bairro com dados do IBGE. Exibe gráficos de pizza e barras com faixa etária, renda média, densidade populacional no raio definido.

### B. Termômetro de Reputação (Sentimento)
Scraping de avaliações do Google Maps dos concorrentes. Gera nuvem de palavras + resumo executivo das reclamações e elogios.

### C. Análise de Tráfego e Fluxo
Estimativa de horários de pico usando dados de "Popular Times" do Google.

### D. Análise de "Oceano Azul" (Gap de Mercado)
Mapa de calor: zonas verdes (oportunidade) vs zonas vermelhas (saturadas) baseado em densidade populacional vs oferta de concorrentes.

### E. Análise de Fornecedores e Parceiros
Lista de fornecedores B2B próximos ao ponto comercial (distribuidores, embalagens, etc.).

### F. SWOT Automático
Matriz SWOT (Forças, Fraquezas, Oportunidades, Ameaças) gerada por IA com base em todos os dados coletados.

---

## Modelo de Negócio

### Precificação (Créditos)

| Plano | Créditos | Preço | Público |
|-------|----------|-------|---------|
| Análise Básica (Mapa + Lista) | 1 crédito | R$ 25 | Leads (validação) |
| Análise Completa (Demografia + Reviews + SWOT) | 3 créditos | R$ 75 | Empreendedores |
| Plano Pro (10 análises/mês) | 10 créditos | R$ 200 | Franqueados |
| Plano Empresarial (B2B) | ilimitado | R$ 497/mês | Imobiliárias/CRECI |

### Estratégia de Aquisição (Growth)

1. **Relatório Grátis do Seu Bairro**: Lead gen via tráfego pago (Meta Ads). Cliente insere CEP → recebe mini-relatório de 1 página → upsell para relatório completo (R$ 47).
   - CAC estimado: R$ 3,00 por cliente pago (R$ 0,15/clique, 5% conversão).

2. **Parceria CRECI**: API B2B para imobiliárias. Corretores pagam R$ 197/mês para gerar relatórios para seus clientes comerciais.
   - Mercado potencial: 180 mil corretores SP × 0,5% = 900 clientes = R$ 177.300/mês.

---

## Arquitetura Técnica

### Stack Principal

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Frontend** | Next.js 14 (App Router) + TypeScript | SSR opcional, rotas dinâmicas, SEO |
| **Hosting** | Firebase Hosting | CDN global, SSL grátis, deploy contínuo |
| **Autenticação** | Firebase Auth | Login Google/Email, 50k MAU grátis |
| **Banco de Dados** | Cloud Firestore | NoSQL, tempo real, escala automática |
| **Backend** | Cloud Functions v2 (Node.js 20) | Serverless, 2M invocações/mês grátis |
| **Storage** | Cloud Storage | PDFs dos relatórios, 5GB grátis |
| **Pagamentos** | Stripe (Firebase Extension) | Checkout integrado, assinaturas |
| **Mapas (Frontend)** | Leaflet.js + OpenStreetMap | Grátis, sem limite de requisição |
| **Mapas (Dados)** | Google Places API | Dados de concorrentes, reviews |
| **IA / LLM** | Groq API (Llama 4) → OpenAI fallback | Groq gratuito para início, OpenAI para qualidade |
| **PDF** | Puppeteer + Chart.js | Geração de relatórios visuais no servidor |
| **Scraping** | Apify (Google Maps Reviews) | Extração legalizada de reviews |

### Por que Cloud Functions e não chamadas diretas?

- **Segurança**: API keys (Google, OpenAI, Apify) NUNCA expostas no frontend. Ficam como variáveis de ambiente nas Functions.
- **Custo**: Rate limiting e caching centralizados evitam chamadas duplicadas.
- **Controle**: Pipeline orquestrado com retry, timeout e logs.

---

## Fluxo de Dados (Pipeline)

```
Cliente (Frontend)
  ↓ Preenche Wizard de Briefing + Pagamento (Stripe)
  ↓
Cloud Function: triggerReport
  ↓ Cria doc Firestore { status: 'processing' }
  ↓
┌─────────────────────────────────────────────────┐
│ Execução PARALELA (Promise.all)                 │
│  • placesWorker      → Google Places API        │
│  • ibgeWorker        → IBGE API                 │
│  • sentimentWorker   → Apify Google Reviews     │
│ Todos escrevem resultados parciais no Firestore │
└─────────────────────────────────────────────────┘
  ↓
Cloud Function: aiReportWriter
  ↓ Coleta TODOS os dados do Firestore
  ↓ Monta System Prompt rigoroso (estilo McKinsey)
  ↓ LLM retorna JSON estruturado
  ↓
Cloud Function: pdfGenerator
  ↓ HTML template + Chart.js → Puppeteer → PDF
  ↓ Salva no Cloud Storage
  ↓ Firestore { status: 'completed', pdfUrl: '...' }
  ↓
Email ao cliente (Firebase Trigger Email Extension)
```

### Estratégia de Cache

Antes de chamar APIs externas, consultar `cacheBairros/{cep}_{raio}`. Se `dataCache < 30 dias`, reutilizar dados cacheados. Redução estimada de 80% nos custos de API.

---

## Modelo de Dados (Firestore)

### Coleção: `users`
```
docId: {uid}
  email: string
  nome: string
  plano: 'free' | 'pro' | 'enterprise'
  creditos: number
  createdAt: timestamp
```

### Coleção: `briefings`
```
docId: auto
  userId: string
  status: 'pagamento_pendente' | 'processando' | 'concluido' | 'erro'
  nicho: string
  cep: string
  coordenadas: { lat: number, lng: number }
  raio: number
  ticketMedio: number
  dor: string
  concorrentes: array
  demografia: object
  sentimentos: object
  swot: object
  aiReport: object
  pdfUrl: string
  createdAt: timestamp
  completedAt: timestamp
```

### Coleção: `cacheBairros`
```
docId: {cep}_{raio}
  concorrentes: array
  demografia: object
  dataCache: timestamp
```

---

## Estimativa de Custos Operacionais

| Serviço | Plano Gratuito | 100 relatórios/mês | 1000 relatórios/mês |
|---------|:---:|:---:|:---:|
| Firebase Hosting | Grátis | Grátis | Grátis |
| Firebase Auth | Grátis | Grátis | Grátis |
| Cloud Functions | Grátis | Grátis | ~$5 |
| Firestore | Grátis | Grátis | ~$10 |
| Google Places API | $200 crédito | ~$20 | ~$200 |
| OpenAI / LLM | Pago por uso | ~$15 (GPT-4o-mini) | ~$150 |
| Stripe | 3,99% + R$1,50 | 3,99% | 3,99% |
| **TOTAL** | Grátis (dev) | **~R$ 200/mês** | **~R$ 2.000/mês** |

### Estratégia de Custo Zero Inicial

1. **Google Places API**: $200 de crédito mensal gratuito por conta Google Cloud.
2. **Groq API (Llama 4)**: Gratuito para desenvolvimento e produção inicial.
3. **OpenStreetMap + Nominatim**: Geocoding gratuito como fallback.
4. **ViaCEP**: Busca de CEP gratuita e ilimitada.

---

## APIs Externas

| API | Função | Custo | Alternativa Grátis |
|-----|--------|-------|-------------------|
| Google Places API | Buscar concorrentes, reviews | $40/1k req | OpenStreetMap (limitado) |
| Google Maps JS | Mapa interativo no formulário | Grátis | Leaflet + OSM |
| Google Geocoding | CEP → coordenadas | $5/1k req | Nominatim / ViaCEP |
| IBGE API | Demografia e censo | **Grátis** | - |
| ViaCEP | Busca CEP Brasil | **Grátis** | - |
| Apify | Scraping Google Reviews | ~$5/1k perfis | Raspar direto (arriscado) |
| Groq API (Llama 4) | Redação do relatório (IA) | **Grátis** | OpenAI GPT-4o-mini |
| Stripe | Pagamentos | 3,99% + R$1,50 | Mercado Pago |
