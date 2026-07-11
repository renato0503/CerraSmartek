# Prévoya - Plano de Implementação

> **Atualizado:** Julho 2026 | [Repo](https://github.com/renato0503/CerraSmartek) | [Produção](https://prevoya.web.app)

## Status Atual (Jul/2026)

| Fase | Status | Entregue |
|---|---|---|
| 0 - Fundação | ✅ Concluída | Next.js, Firebase Auth, Layout, Landing page, Rotas |
| 1 - Lead Gen | ✅ Concluída | Wizard 4 passos, MapPicker, Raio-X gratuito, PDF jsPDF, Cloud Function `analyzeBairro` |
| 2 - Monetização | ✅ Concluída | Stripe checkout/webhook, Pipeline IA (Groq+Puppeteer), Dashboard, Visualização relatório |
| 3 - Crescimento | ✅ Concluída | Leads CRM (CNPJ + Brasil API), Admin dashboard, Rate limiting, Reembolso, Comparativo |
| 4 - Escala | ✅ Concluída | PWA, WhatsApp share, Nicho templates (9 nichos), Afiliados, Fornecedores B2B |

### Cloud Functions deployadas

| Function | Tipo | Status |
|---|---|---|
| `analyzeBairro` (ex-generateFreeReport) | 1st gen HTTPS | ✅ Deployed |
| `triggerReport`, `aiReportWriter`, `pdfGenerator` | 2nd gen Firestore trigger | ⏳ Pendente (bloqueio org policy Cloud Build) |

### Pendências

- [ ] Resolver bloqueio de Org Policy no Cloud Build para deploy das funções 2nd gen
- [ ] Configurar Google Places API key (`firebase functions:config:set google.places_api_key="..."`)  
- [ ] Configurar Stripe keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- [ ] Criar índices compostos no Firestore (leads por CNPJ)

## Índice

1. [Setup Inicial do Projeto](#1-setup-inicial-do-projeto)
2. [Configuração Firebase](#2-configuração-firebase)
3. [Estrutura do Frontend (Next.js)](#3-estrutura-do-frontend-nextjs)
4. [Wizard de Briefing](#4-wizard-de-briefing)
5. [Cloud Functions (Backend)](#5-cloud-functions-backend)
6. [Pipeline de Geração do Relatório](#6-pipeline-de-geração-do-relatório)
7. [Geração de PDF](#7-geração-de-pdf)
8. [Integração Stripe](#8-integração-stripe)
9. [Regras de Segurança Firestore](#9-regras-de-segurança-firestore)
10. [Estratégia de Cache](#10-estratégia-de-cache)
11. [Deploy](#11-deploy)
12. [Roadmap de Lançamento](#12-roadmap-de-lançamento)

---

## 1. Setup Inicial do Projeto

### Pré-requisitos

```bash
# Ferramentas necessárias
Node.js 20+
Firebase CLI: npm install -g firebase-tools
Conta Firebase (Blaze Plan - pay as you go)
Conta Google Cloud (com Places API habilitada)
Conta Stripe
```

### Criação do Projeto

```bash
npx create-next-app@latest prevoya --typescript --tailwind --eslint --app --src-dir
cd prevoya
npm install firebase leaflet react-leaflet chart.js react-chartjs-2 @stripe/stripe-js
npm install -D @types/leaflet
```

### Estrutura de Diretórios

```
prevoya/
├── public/
│   ├── images/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout com providers
│   │   ├── page.tsx                # Landing page
│   │   ├── login/
│   │   │   └── page.tsx            # Login page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Dashboard layout (autenticado)
│   │   │   ├── page.tsx            # Lista de relatórios
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Detalhe do relatório
│   │   └── wizard/
│   │       ├── page.tsx            # Wizard passo 1
│   │       └── steps/
│   │           ├── NichoForm.tsx
│   │           ├── LocalizacaoForm.tsx
│   │           ├── AnaliseForm.tsx
│   │           └── PagamentoForm.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── MapPicker.tsx        # Leaflet map component
│   │   ├── wizard/
│   │   │   ├── WizardContainer.tsx  # Stepper + navegação
│   │   │   └── StepIndicator.tsx
│   │   ├── reports/
│   │   │   ├── ReportViewer.tsx     # Visualização do relatório
│   │   │   ├── DemographicChart.tsx # Gráficos IBGE
│   │   │   ├── SentimentCloud.tsx   # Nuvem de palavras
│   │   │   ├── SwotMatrix.tsx       # Matriz SWOT
│   │   │   └── HeatmapView.tsx      # Mapa de calor
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── AuthGuard.tsx
│   ├── lib/
│   │   ├── firebase.ts              # firebaseConfig + inicialização
│   │   ├── firestore.ts             # Helpers CRUD Firestore
│   │   └── auth.ts                  # useAuth hook, signIn, signUp
│   ├── services/
│   │   ├── places.ts                # Google Places via Cloud Function proxy
│   │   ├── ibge.ts                  # IBGE API via Cloud Function proxy
│   │   └── reports.ts               # triggerReport, getStatus, downloadPDF
│   └── types/
│       ├── briefing.ts              # BriefingData, BriefingStatus
│       ├── report.ts                # ReportData, SwotData, etc.
│       └── user.ts                  # UserData
├── functions/
│   ├── src/
│   │   ├── index.ts                 # Exporta todas as functions
│   │   ├── triggerReport.ts         # Entry point do pipeline
│   │   ├── workers/
│   │   │   ├── placesWorker.ts      # Google Places API
│   │   │   ├── ibgeWorker.ts        # IBGE demografia
│   │   │   └── sentimentWorker.ts   # Apify/Scraping reviews
│   │   ├── aiReportWriter.ts        # LLM → JSON estruturado
│   │   ├── pdfGenerator.ts          # Puppeteer → PDF
│   │   └── utils/
│   │       ├── cache.ts             # Verifica/atualiza cache bairros
│   │       ├── geocoding.ts         # CEP → coordenadas (ViaCEP + Nominatim)
│   │       └── prompts.ts           # System prompts da LLM
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules
├── firebase.json
├── .env.local                       # Variáveis de ambiente dev
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 2. Configuração Firebase

### 2.1 Inicializar Firebase no Projeto

```bash
firebase login
firebase init
```

Selecionar:
- Firestore
- Functions (TypeScript)
- Hosting
- Storage
- Emulators (opcional para dev local)

### 2.2 Configuração do Frontend (`src/lib/firebase.ts`)

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'southamerica-east1');
```

### 2.3 Cloud Functions Config

```json
// functions/package.json
{
  "name": "prevoya-functions",
  "main": "lib/index.js",
  "engines": { "node": "20" },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "@googlemaps/google-maps-services-js": "^3.4.0",
    "openai": "^4.50.0",
    "groq-sdk": "^0.8.0",
    "puppeteer": "^22.0.0",
    "chart.js": "^4.4.0",
    "chartjs-node-canvas": "^4.1.0",
    "axios": "^1.7.0"
  }
}
```

### 2.4 Variáveis de Ambiente

```bash
# .env.local (NUNCA comitar)
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx

# Cloud Functions (set via firebase CLI)
# firebase functions:config:set google.places_api_key="xxx"
# firebase functions:config:set openai.api_key="xxx"
# firebase functions:config:set stripe.secret_key="sk_live_xxx"
# firebase functions:config:set apify.token="xxx"
```

---

## 3. Estrutura do Frontend (Next.js)

### 3.1 Root Layout (`src/app/layout.tsx`)

```typescript
import { AuthProvider } from '@/lib/auth';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### 3.2 Auth Hook (`src/lib/auth.tsx`)

```typescript
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from './firebase';

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}>({ user: null, loading: true, signInGoogle: async () => {}, signOut: async () => {} });

export function AuthProvider({ children }) { /* ... */ }
export const useAuth = () => useContext(AuthContext);
```

### 3.3 Rotas

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Público | Landing page + CTA |
| `/login` | Público | Login Google/Email |
| `/wizard` | Autenticado | Formulário de briefing (4 passos) |
| `/dashboard` | Autenticado | Lista de relatórios do usuário |
| `/dashboard/[id]` | Autenticado | Visualização do relatório |
| `/api/stripe/webhook` | Público | Webhook do Stripe |

---

## 4. Wizard de Briefing

### 4.1 Estados do Wizard

```
Passo 1: Nicho de Mercado
  ├── Categoria (dropdown: alimentação, varejo, serviços, saúde...)
  ├── Subcategoria (autocomplete: hamburgueria, pet shop, barbearia...)
  └── Ticket Médio (R$)

Passo 2: Localização
  ├── CEP (autocomplete com ViaCEP)
  ├── Mapa Interativo (Leaflet - clicar no ponto exato)
  └── Raio de Análise (slider: 500m / 1km / 2km / 3km)

Passo 3: Contexto do Negócio
  ├── Principal Medo/Dor (textarea ou opções pré-definidas)
  ├── Diferencial competitivo (opcional)
  └── Orçamento inicial (opcional)

Passo 4: Resumo + Pagamento
  ├── Card resumo com todos os dados
  ├── Seleção de plano (Básico 1 crédito / Completo 3 créditos)
  └── Botão "Gerar Relatório" → Stripe Checkout
```

### 4.2 Componente WizardContainer

```typescript
'use client';
import { useState } from 'react';

const STEPS = [
  { id: 'nicho', label: 'Nicho', component: NichoForm },
  { id: 'localizacao', label: 'Localização', component: LocalizacaoForm },
  { id: 'contexto', label: 'Contexto', component: AnaliseForm },
  { id: 'pagamento', label: 'Pagamento', component: PagamentoForm },
];

export default function WizardContainer() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<BriefingData>>({});

  const handleNext = (data: Partial<BriefingData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const CurrentStepComponent = STEPS[currentStep].component;
  return (
    <div className="max-w-2xl mx-auto p-6">
      <StepIndicator steps={STEPS} current={currentStep} />
      <CurrentStepComponent
        data={formData}
        onNext={handleNext}
        onBack={handleBack}
      />
    </div>
  );
}
```

### 4.3 Componente MapPicker (Leaflet)

```typescript
'use client';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';

function LocationMarker({ position, onLocationSelect }) {
  useMapEvents({
    click(e) { onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng }); },
  });
  return position ? <Marker position={position} /> : null;
}

export default function MapPicker({ onLocationSelect, initialPosition = [-23.5505, -46.6333] }) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  const handleSelect = (coords: { lat: number; lng: number }) => {
    setPosition([coords.lat, coords.lng]);
    onLocationSelect(coords);
  };

  return (
    <MapContainer center={initialPosition} zoom={13} style={{ height: '400px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker position={position} onLocationSelect={handleSelect} />
    </MapContainer>
  );
}
```

---

## 5. Cloud Functions (Backend)

### 5.1 Entry Point (`functions/src/index.ts`)

```typescript
import * as admin from 'firebase-admin';
admin.initializeApp();

export { triggerReport } from './triggerReport';
export { generateFreeReport } from './generateFreeReport';
export { createStripeCheckout } from './createStripeCheckout';
export { stripeWebhook } from './stripeWebhook';
```

### 5.2 triggerReport - Orquestrador Principal

```typescript
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

export const triggerReport = onDocumentCreated(
  { document: 'briefings/{briefingId}', region: 'southamerica-east1' },
  async (event) => {
    const briefing = event.data?.data();
    if (!briefing || briefing.status !== 'pagamento_confirmado') return;

    await event.data?.ref.update({ status: 'processando' });

    try {
      // Execução paralela dos 3 workers
      const [concorrentes, demografia, sentimentos] = await Promise.all([
        placesWorker(briefing),
        ibgeWorker(briefing),
        sentimentWorker(briefing),
      ]);

      await event.data?.ref.update({
        concorrentes,
        demografia,
        sentimentos,
        status: 'dados_coletados',
      });

      // Trigger próxima etapa via novo document create
      await admin.firestore().collection('aiQueue').add({
        briefingId: event.params.briefingId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      await event.data?.ref.update({
        status: 'erro',
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }
);
```

### 5.3 placesWorker

```typescript
// functions/src/workers/placesWorker.ts
import { Client } from '@googlemaps/google-maps-services-js';
import { checkCache, saveCache } from '../utils/cache';

const googleMapsClient = new Client({});

export async function placesWorker(briefing: BriefingData) {
  const cacheKey = `${briefing.cep}_${briefing.raio}`;
  const cached = await checkCache(cacheKey);
  if (cached) return cached.concorrentes;

  const { coordenadas, raio, nicho } = briefing;

  // Buscar concorrentes por tipo de negócio
  const response = await googleMapsClient.placesNearby({
    params: {
      location: coordenadas,
      radius: raio,
      keyword: nicho,
      type: 'establishment',
      key: process.env.GOOGLE_PLACES_API_KEY!,
    },
  });

  const concorrentes = response.data.results.map(place => ({
    place_id: place.place_id,
    nome: place.name,
    endereco: place.vicinity,
    rating: place.rating,
    total_ratings: place.user_ratings_total,
    tipos: place.types,
    coordenadas: place.geometry?.location,
    aberto_agora: place.opening_hours?.open_now,
  }));

  await saveCache(cacheKey, { concorrentes });
  return concorrentes;
}
```

### 5.4 ibgeWorker

```typescript
// functions/src/workers/ibgeWorker.ts
import axios from 'axios';
import { checkCache, saveCache } from '../utils/cache';

export async function ibgeWorker(briefing: BriefingData) {
  const cacheKey = `${briefing.cep}_ibge`;
  const cached = await checkCache(cacheKey);
  if (cached) return cached.demografia;

  // IBGE API - dados por setor censitário
  // Exemplo: pirâmide etária, renda, densidade
  const { cep } = briefing;

  // 1. CEP → código do município (ViaCEP)
  const viaCepRes = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
  const { ibge: codigoIbge, localidade, uf } = viaCepRes.data;

  // 2. Dados do censo IBGE
  const censoRes = await axios.get(
    `https://servicodados.ibge.gov.br/api/v3/agregados/...`
  );

  const demografia = {
    municipio: localidade,
    uf,
    populacao: censoRes.data.populacao_estimada,
    densidade: censoRes.data.densidade_demografica,
    renda_media: censoRes.data.renda_media_domiciliar,
    faixa_etaria: censoRes.data.piramid_etaria,
  };

  await saveCache(cacheKey, { demografia });
  return demografia;
}
```

### 5.5 sentimentWorker

```typescript
// functions/src/workers/sentimentWorker.ts
import axios from 'axios';
import { Client } from '@googlemaps/google-maps-services-js';

export async function sentimentWorker(briefing: BriefingData, concorrentes: any[]) {
  const googleMapsClient = new Client({});

  const reviewsData = [];

  // Para cada concorrente, buscar reviews detalhadas
  for (const concorrente of concorrentes.slice(0, 5)) {
    // Opção 1: Google Places Details (limitado a 5 reviews)
    const details = await googleMapsClient.placeDetails({
      params: {
        place_id: concorrente.place_id,
        fields: ['reviews', 'name'],
        key: process.env.GOOGLE_PLACES_API_KEY!,
      },
    });

    reviewsData.push({
      nome: details.data.result.name,
      reviews: details.data.result.reviews?.map(r => ({
        texto: r.text,
        rating: r.rating,
        data: r.time,
      })),
    });

    // Opção 2: Apify Actor para Google Maps Scraper (reviews ilimitadas)
    // const apifyRes = await axios.post(
    //   `https://api.apify.com/v2/acts/...`,
    //   { placeId: concorrente.place_id },
    //   { params: { token: process.env.APIFY_TOKEN } }
    // );
  }

  return {
    total_concorrentes: reviewsData.length,
    rating_medio_regiao: calculateAverageRating(reviewsData),
    principais_reclamacoes: extractCommonComplaints(reviewsData),
    principais_elogios: extractCommonPraises(reviewsData),
    nuvem_palavras: generateWordCloud(reviewsData),
  };
}
```

---

## 6. Pipeline de Geração do Relatório

### 6.1 aiReportWriter - O Redator Fantasma

```typescript
// functions/src/aiReportWriter.ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import Groq from 'groq-sdk';
import { SYSTEM_PROMPT } from './utils/prompts';

export const aiReportWriter = onDocumentCreated(
  { document: 'aiQueue/{docId}', region: 'southamerica-east1' },
  async (event) => {
    const { briefingId } = event.data?.data();
    const briefingDoc = await admin.firestore()
      .collection('briefings').doc(briefingId).get();
    const briefing = briefingDoc.data();

    // Monta contexto completo para a LLM
    const contexto = {
      nicho: briefing.nicho,
      localizacao: briefing.coordenadas,
      raio: briefing.raio,
      ticketMedio: briefing.ticketMedio,
      dorDoCliente: briefing.dor,
      concorrentes: briefing.concorrentes,
      demografia: briefing.demografia,
      sentimentos: briefing.sentimentos,
    };

    // Groq (gratuito) como primeira opção, OpenAI como fallback
    let aiReport;
    try {
      aiReport = await callLLM(contexto);
    } catch (groqError) {
      aiReport = await callOpenAI(contexto);
    }

    // Salva resultado
    await briefingDoc.ref.update({
      aiReport,
      swot: aiReport.swot,
      status: 'relatorio_gerado',
    });

    // Dispara geração do PDF
    await event.data?.ref.delete();
    await admin.firestore().collection('pdfQueue').add({
      briefingId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);

async function callLLM(contexto: any) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(contexto, null, 2) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  return JSON.parse(completion.choices[0]?.message?.content || '{}');
}
```

### 6.2 System Prompt (McKinsey Style)

```typescript
// functions/src/utils/prompts.ts
export const SYSTEM_PROMPT = `
Você é um consultor sênior de estratégia da McKinsey & Company, especializado em
inteligência de localização e análise de mercado para negócios físicos.

Seu trabalho é analisar dados brutos de localização e gerar um laudo executivo
estruturado em JSON.

TOM: Formal, direto, executivo. Evite adjetivos vagos como "ótimo" ou "excelente".
Use dados quantitativos sempre que possível. Escreva como se estivesse apresentando
para um investidor ou CEO.

ESTRUTURA DO JSON DE SAÍDA (obrigatório):
{
  "resumo_executivo": {
    "nota_viabilidade": "ALTA" | "MEDIA" | "BAIXA" | "NAO_RECOMENDADA",
    "justificativa": "2-3 frases objetivas baseadas nos dados",
    "recomendacao_principal": "Ação concreta recomendada com base nos dados"
  },
  "analise_concorrencia": {
    "total_concorrentes": number,
    "densidade_concorrencial": "ALTA" | "MEDIA" | "BAIXA",
    "concorrentes_diretos": number,
    "concorrentes_indiretos": number,
    "analise": "Análise do cenário competitivo",
    "ameacas": ["lista de ameaças identificadas"],
    "oportunidades": ["gaps e oportunidades identificados"]
  },
  "analise_demografica": {
    "publico_alvo_atingivel": number,
    "renda_compativel": boolean,
    "analise": "Análise do perfil demográfico vs ticket médio do negócio"
  },
  "analise_reputacao": {
    "satisfacao_media_regiao": number,
    "principais_reclamacoes": ["top 3 reclamações"],
    "principais_elogios": ["top 3 elogios"],
    "insight": "O que o empreendedor pode fazer diferente baseado nas reclamações"
  },
  "swot": {
    "forcas": ["lista de forças do ponto comercial"],
    "fraquezas": ["lista de fraquezas"],
    "oportunidades": ["lista de oportunidades de mercado"],
    "ameacas": ["lista de ameaças externas"]
  },
  "plano_acao": {
    "curto_prazo": ["ações para primeiros 30 dias"],
    "medio_prazo": ["ações para 3-6 meses"],
    "diferenciacao": "Estratégia de diferenciação baseada nos dados"
  }
}

REGRAS:
- NUNCA invente dados. Se um campo não tiver dados disponíveis, use "DADOS_INSUFICIENTES".
- Seja pessimista quando dados forem negativos, mas sempre ofereça alternativas.
- Compare SEMPRE o ticket médio do cliente com a renda média da região.
- Considere a densidade de concorrentes por km², não apenas o número absoluto.
`;
```

---

## 7. Geração de PDF

### 7.1 pdfGenerator

```typescript
// functions/src/pdfGenerator.ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import puppeteer from 'puppeteer';
import * as admin from 'firebase-admin';
import { generateReportHTML } from './utils/reportTemplate';

export const pdfGenerator = onDocumentCreated(
  { document: 'pdfQueue/{docId}', region: 'southamerica-east1', memory: '1GiB' },
  async (event) => {
    const { briefingId } = event.data?.data();
    const briefingDoc = await admin.firestore()
      .collection('briefings').doc(briefingId).get();
    const briefing = briefingDoc.data();

    const html = generateReportHTML(briefing);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });

    await browser.close();

    // Upload para Cloud Storage
    const bucket = admin.storage().bucket();
    const filePath = `reports/${briefingId}/relatorio_${briefing.nicho}_${briefing.cep}.pdf`;
    const file = bucket.file(filePath);

    await file.save(pdfBuffer, {
      metadata: { contentType: 'application/pdf' },
    });

    // URL pública (expira em 7 dias)
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    await briefingDoc.ref.update({
      pdfUrl: url,
      status: 'concluido',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await event.data?.ref.delete();
  }
);
```

### 7.2 Template HTML do Relatório

O template deve incluir:
- Capa com logo Prévoya
- Índice
- Resumo Executivo (box destacado)
- Gráficos (Chart.js renderizado como imagem via canvas)
- Mapa estático (Leaflet → screenshot via Puppeteer)
- Matriz SWOT (tabela 2x2)
- Plano de Ação (checklist)
- Contracapa com disclaimer

---

## 8. Integração Stripe

### 8.1 createStripeCheckout

```typescript
// functions/src/createStripeCheckout.ts
import { onCall } from 'firebase-functions/v2/https';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createStripeCheckout = onCall(
  { region: 'southamerica-east1' },
  async (request) => {
    const { briefingId, plano, userId } = request.data;

    const PRICES = {
      basico: { amount: 2500, label: 'Análise Básica', credits: 1 },    // R$ 25
      completo: { amount: 7500, label: 'Análise Completa', credits: 3 }, // R$ 75
      pro: { amount: 20000, label: 'Plano Pro (10/mês)', credits: 10 }, // R$ 200
    };

    const price = PRICES[plano];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: { name: price.label },
          unit_amount: price.amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.BASE_URL}/dashboard/${briefingId}?success=true`,
      cancel_url: `${process.env.BASE_URL}/wizard?canceled=true`,
      metadata: { briefingId, userId, credits: price.credits },
    });

    return { url: session.url };
  }
);
```

### 8.2 stripeWebhook

```typescript
// functions/src/stripeWebhook.ts
import { onRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const stripeWebhook = onRequest(
  { region: 'southamerica-east1' },
  async (req, res) => {
    const sig = req.headers['stripe-signature']!;
    const event = stripe.webhooks.constructEvent(
      req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { briefingId, userId, credits } = session.metadata!;

      // Atualizar status do briefing
      await admin.firestore().collection('briefings').doc(briefingId).update({
        status: 'pagamento_confirmado',
      });

      // Consumir créditos do usuário
      await admin.firestore().collection('users').doc(userId).update({
        creditos: admin.firestore.FieldValue.increment(-Number(credits)),
      });
    }

    res.json({ received: true });
  }
);
```

---

## 9. Regras de Segurança Firestore

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /briefings/{briefingId} {
      allow read: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.status == 'pagamento_pendente';
      allow update: if false; // apenas Cloud Functions via Admin SDK
    }

    match /cacheBairros/{docId} {
      allow read: if true;
      allow write: if false; // apenas Cloud Functions
    }

  }
}
```

---

## 10. Estratégia de Cache

### Objetivo
Reduzir 80% das chamadas a APIs pagas (Google Places, OpenAI) reutilizando dados de bairros consultados recentemente.

### Implementação

```typescript
// functions/src/utils/cache.ts
import * as admin from 'firebase-admin';

const CACHE_TTL_DAYS = 30;

export async function checkCache(key: string) {
  const doc = await admin.firestore().collection('cacheBairros').doc(key).get();
  if (!doc.exists) return null;

  const data = doc.data();
  const cacheAge = Date.now() - data?.dataCache?.toDate()?.getTime();
  const maxAge = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

  if (cacheAge < maxAge) {
    console.log(`Cache HIT for key: ${key}`);
    return data;
  }

  console.log(`Cache EXPIRED for key: ${key}`);
  return null;
}

export async function saveCache(key: string, data: Record<string, any>) {
  await admin.firestore().collection('cacheBairros').doc(key).set({
    ...data,
    dataCache: admin.firestore.FieldValue.serverTimestamp(),
  });
}
```

---

## 11. Deploy

### Scripts no package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "deploy:hosting": "next build && firebase deploy --only hosting",
    "deploy:functions": "firebase deploy --only functions",
    "deploy:rules": "firebase deploy --only firestore:rules",
    "deploy:all": "next build && firebase deploy",
    "emulators": "firebase emulators:start"
  }
}
```

### Sequência de Deploy

```bash
# 1. Build do Next.js
npm run build

# 2. Deploy das regras de segurança
firebase deploy --only firestore:rules

# 3. Deploy das Cloud Functions
firebase deploy --only functions

# 4. Deploy do Hosting (frontend)
firebase deploy --only hosting

# Ou tudo de uma vez
npm run deploy:all
```

---

## 12. Roadmap de Lançamento

### 12.1 Visão Geral das Fases

| Fase | Sprint | Semanas | Objetivo | Entregável Principal |
|------|--------|---------|----------|---------------------|
| 0 | Setup | 1-2 | Infraestrutura base | Projeto rodando no Firebase Hosting com auth |
| 1 | Lead Gen | 3-4 | Relatório grátis de 1 página | Funil de captura de leads funcionando |
| 2 | Monetização | 5-8 | Relatório completo + pagamento | Cliente paga e recebe PDF profissional |
| 3 | Crescimento | 9-12 | Otimização e B2B | Plataforma escalável com API para parceiros |
| 4 | Escala | 13-16 | Canais e retenção | White-label, WhatsApp, assinaturas |

---

### 12.2 Tabelão de Sprints (Detalhado)

#### FASE 0: FUNDAÇÃO

| Sprint | Semana | ID | História | Tarefas | Esforço | Dependências | Entregável | KPI |
|--------|--------|----|----------|---------|---------|-------------|------------|-----|
| **Sprint 0** | **1** | S0-01 | Setup do projeto Next.js + Firebase | `create-next-app`, `firebase init`, configurar `firebase.json`, instalar dependências (`firebase`, `leaflet`, `chart.js`, `stripe`), configurar Tailwind | 3h | Nenhuma | Projeto rodando localmente com `npm run dev` | - |
| | | S0-02 | Configurar Firebase Auth (Google) | Ativar Google Sign-In no Firebase Console, implementar `AuthProvider` com Context API, criar hook `useAuth`, página `/login` com botão "Entrar com Google" | 4h | S0-01 | Login funcional redirecionando para `/dashboard` | - |
| | | S0-03 | Layout base + componentes UI | Criar `Header` com logo + avatar + logout, `Footer`, `AuthGuard` (HOC para rotas protegidas), componentes base: `Button`, `Input`, `Card`, `ProgressBar` | 5h | S0-02 | Layout responsivo aplicado a todas as páginas | - |
| | | S0-04 | Estrutura de rotas e páginas vazias | Criar `/(public)/page.tsx` (Landing placeholder), `/dashboard/page.tsx` (lista vazia), `/wizard/page.tsx` ( placeholder), configurar middleware de auth no Next.js | 3h | S0-03 | Navegação completa com proteção de rotas | - |
| **Sprint 1** | **2** | S1-01 | Landing Page (versão 1) | Hero section com CTA "Análise Grátis do Seu Bairro", seção "Como Funciona" (3 passos visuais), seção de planos/preços, footer com links legais, SEO básico (metadata, OG tags) | 6h | S0-04 | Landing page publicada e indexável | - |
| | | S1-02 | Deploy inicial no Firebase Hosting | Configurar `firebase.json` para Next.js, build de produção, deploy `firebase deploy --only hosting`, testar em produção, configurar domínio customizado | 2h | S1-01 | App acessível em URL pública | URLs acessíveis |
| | | S1-03 | CI/CD com GitHub Actions | Criar workflow: `on push main` → `npm run build` → `firebase deploy`, configurar secrets do Firebase no GitHub | 3h | S1-02 | Deploy automático a cada push na main | - |
| | | S1-04 | Configurar Google Cloud + APIs | Criar projeto GCP, habilitar Places API, Geocoding API, restringir API key por HTTP referrer, configurar quotas e alertas de billing | 2h | S0-01 | API key do Google segura e pronta para uso | - |

| **Milestone Fase 0** | Projeto rodando em produção com auth, landing page, e Google Cloud configurado. |
|-----------------------|-------------------------------------------------------------------------------|

---

#### FASE 1: LEAD GEN (RELATÓRIO GRÁTIS)

| Sprint | Semana | ID | História | Tarefas | Esforço | Dependências | Entregável | KPI |
|--------|--------|----|----------|---------|---------|-------------|------------|-----|
| **Sprint 2** | **3** | S2-01 | Wizard de Briefing (3 passos) | Implementar `WizardContainer` com stepper, `StepIndicator` visual, estado global com `useReducer` para `formData`, validação por passo (Zod) | 6h | S0-03 | Wizard funcional salvo no estado | - |
| | | S2-02 | Passo 1: Nicho de Mercado | Dropdown de categorias (alimentação, varejo, serviços, saúde, beleza, educação), autocomplete de subcategoria, campo ticket médio (R$), validação de campos obrigatórios | 3h | S2-01 | Formulário de nicho completo | Taxa de abandono < 20% |
| | | S2-03 | Passo 2: Localização + MapPicker | Input de CEP com autocomplete ViaCEP, componente `MapPicker` com Leaflet (click-to-pin), slider de raio (500m/1km/2km/3km), exibir endereço formatado ao selecionar | 5h | S2-01 | Coordenadas + raio capturados com precisão | - |
| | | S2-04 | Passo 3: Contexto do Negócio | Textarea "Principal medo/dor", campo "Diferencial competitivo" (opcional), select "Estágio do negócio" (ideia/abrir/expandir/validar), salvamento parcial no Firestore (rascunho) | 3h | S2-02, S2-03 | Briefing completo salvo como rascunho no Firestore | Briefings criados |
| **Sprint 3** | **4** | S3-01 | Cloud Function: `generateFreeReport` | Função `onCall` que recebe `{ cep, nicho }`, chama Google Places API (nearbySearch), retorna lista de concorrentes + mapa estático (Leaflet → canvas via Puppeteer) | 6h | S1-04 | PDF de 1 página gerado e retornado | Tempo de geração < 15s |
| | | S3-02 | PDF template simples (1 página) | HTML/CSS inline: logo Prévoya, título "Raio-X do Bairro X", tabela de concorrentes (nome, rating, endereço), mini-mapa estático, CTA "Quer o relatório completo? R$47", contracapa com disclaimer legal | 5h | S3-01 | PDF visualmente profissional | - |
| | | S3-03 | Tela de resultado + barra de progresso | Componente `ProcessingScreen` com animação: "Consultando mapas..." → "Analisando concorrentes..." → "Gerando laudo...", substituir "loading..." genérico por etapas reais (via listener Firestore + status) | 4h | S3-01 | Feedback visual do processamento | - |
| | | S3-04 | Landing Page: formulário de CEP | Embedar campo de CEP na landing (seção hero + seção "Grátis"), validação de CEP (formato XXXXX-XXX), submit → `generateFreeReport` → download automático do PDF | 4h | S3-01, S3-02 | Funil de lead gen funcional (visitante → CEP → PDF) | Conversão landing page |
| **Sprint 4** | **4.5** | S4-01 | Tracking e Analytics | Instalar Firebase Analytics (eventos: `wizard_step_completed`, `free_report_generated`, `paid_report_purchased`, `cep_submitted`), configurar Google Tag Manager, Meta Pixel + evento `Lead` no download do PDF grátis | 3h | S3-04 | Eventos rastreáveis para calcular CAC | - |
| | | S4-02 | Setup Meta Ads (teste CAC) | Criar campanha no Meta Ads (orçamento R$ 30/dia), criativos: "Descubra seus concorrentes de graça", segmentação: empreendedores 25-55, SP capital, públicos-alvo (lookalike), configurar pixel de conversão no evento `Lead` | 3h | S4-01 | Campanha rodando com métricas de CAC | CAC < R$ 3,00 |
| | | S4-03 | Teste de usabilidade + ajustes | 3-5 usuários teste (amigos empreendedores), gravar sessão, medir tempo até completar wizard (meta < 2 min), ajustar UX baseado em feedback | 4h | S3-03 | UX validada com usuários reais | Tempo wizard < 2 min |

| **Milestone Fase 1** | Visitante anônimo insere CEP → baixa PDF grátis com concorrentes → pixel de lead disparado. CAC medido. |
|-----------------------|--------------------------------------------------------------------------------------------------------|

---

#### FASE 2: MONETIZAÇÃO (RELATÓRIO COMPLETO)

| Sprint | Semana | ID | História | Tarefas | Esforço | Dependências | Entregável | KPI |
|--------|--------|----|----------|---------|---------|-------------|------------|-----|
| **Sprint 5** | **5** | S5-01 | Integração Stripe - Checkout | Criar Cloud Function `createStripeCheckout` (`onCall`), configurar produtos/planos no Stripe (Básico R$25, Completo R$75, Pro R$200), tela de pagamento (embed Stripe Elements ou redirect Checkout), tratamento de cancelamento | 5h | S0-01 | Checkout Stripe funcional em sandbox | - |
| | | S5-02 | Webhook Stripe + atualização Firestore | Cloud Function `stripeWebhook` (`onRequest`), validar assinatura do webhook, atualizar `briefings/{id}` status para `pagamento_confirmado`, consumir créditos do usuário, tratamento de `payment_intent.failed` | 4h | S5-01 | Pagamento confirmado → briefing disparado | Taxa de confirmação > 95% |
| | | S5-03 | Passo 4 do Wizard: Resumo + Pagamento | Card resumo com todos os dados preenchidos (revisão final), seleção de plano com radio buttons (preço + créditos), botão "Gerar Relatório" que dispara `createStripeCheckout`, modal de confirmação "Você será redirecionado ao pagamento" | 4h | S5-02, S2-04 | Wizard completo (4 passos) com checkout | Conversão wizard → pagamento |
| | | S5-04 | Sistema de créditos do usuário | Campo `creditos` no doc `users/{uid}`, função `hasCredits(uid, amount)` para validar antes do checkout, funções `addCredits` e `consumeCredits`, exibir saldo no Header e Dashboard, tratamento de saldo insuficiente (bloquear botão + upsell) | 3h | S0-02 | Usuário visualiza e consome créditos | - |
| **Sprint 6** | **6** | S6-01 | Cloud Function: `triggerReport` (orquestrador) | `onDocumentCreated` no Firestore `briefings/{id}`, validar `status == 'pagamento_confirmado'`, atualizar status para `processando`, disparar `Promise.all([placesWorker, ibgeWorker, sentimentWorker])`, salvar resultados no doc, trigger `aiQueue` | 5h | S5-02 | Pipeline orquestrado automaticamente | - |
| | | S6-02 | Worker: `placesWorker` (Google Places) | Função com `@googlemaps/google-maps-services-js`, `placesNearby` com keyword do nicho + raio, mapear resultado para array de concorrentes padronizado (place_id, nome, rating, endereço, tipos), salvar no Firestore | 4h | S6-01, S1-04 | Concorrentes salvos no briefing | - |
| | | S6-03 | Worker: `ibgeWorker` (Demografia) | Buscar CEP → ViaCEP (código IBGE do município), consultar IBGE API para população, densidade, renda média, pirâmide etária por setor censitário, estruturar objeto `demografia` padronizado, salvar no Firestore | 4h | S6-01 | Dados demográficos salvos no briefing | - |
| **Sprint 7** | **7** | S7-01 | Worker: `sentimentWorker` (Reviews) | Para cada concorrente (top 5), chamar `placeDetails` (fields: reviews), extrair texto + rating + data, calcular média de rating da região, extrair top 3 reclamações e elogios (análise de frequência de palavras-chave), estruturar objeto `sentimentos` | 5h | S6-02 | Análise de sentimento salva no briefing | - |
| | | S7-02 | `aiReportWriter` - System Prompt McKinsey | Implementar função que lê briefing completo do Firestore, monta contexto (JSON com todos os dados), chama Groq API (Llama 4) com `response_format: json_object`, parse JSON de resposta, salvar `aiReport` + `swot` no doc, fallback OpenAI se Groq falhar | 6h | S7-01, S6-03 | JSON do relatório gerado por IA | Qualidade do output > 4/5 |
| | | S7-03 | `pdfGenerator` - Template visual completo | `onDocumentCreated` na coleção `pdfQueue`, gerar HTML completo com: capa (logo + título + dados do briefing), índice, resumo executivo (box colorido), gráficos Chart.js → canvas → base64 (demografia, concorrência, rating), mapa Leaflet → screenshot Puppeteer, tabela SWOT 2x2, plano de ação (checklist), contracapa, exportar PDF A4 com `printBackground: true` | 8h | S7-02 | PDF profissional de ~8-12 páginas | Tempo geração < 60s |
| | | S7-04 | Upload PDF no Storage + URL assinada | Salvar buffer do PDF no Cloud Storage (`reports/{userId}/{id}.pdf`), gerar signed URL (expira em 7 dias), atualizar `briefings/{id}.pdfUrl` + `status: 'concluido'` + `completedAt` | 2h | S7-03 | Link do PDF acessível ao cliente | - |
| **Sprint 8** | **8** | S8-01 | Dashboard: lista de relatórios | `onSnapshot` na coleção `briefings` filtrada por `userId`, cards com: status (ícone colorido), nicho, CEP, data, ações (visualizar/baixar PDF), estados: processando (spinner), concluído (botão download), erro (mensagem + reembolso) | 5h | S7-04 | Cliente vê histórico de relatórios | - |
| | | S8-02 | Dashboard: visualização do relatório | Rota `/dashboard/[id]`, carregar briefing do Firestore (real-time), renderizar seções: resumo executivo, demografia (gráficos), concorrência (tabela), SWOT (matriz visual), plano de ação, botão "Baixar PDF", estado de carregamento por seção | 6h | S8-01 | Relatório navegável no dashboard | - |
| | | S8-03 | E-mail de notificação + Trigger Email | Configurar Firebase Trigger Email Extension, template de e-mail: "Seu relatório Prévoya está pronto!", link direto para o PDF + dashboard, design com logo e CTA, configurar evento `onDocumentUpdated` (status → `concluido`) como trigger | 3h | S7-04 | E-mail enviado automaticamente ao concluir | Taxa de abertura > 40% |
| | | S8-04 | Teste end-to-end do pipeline | Criar briefing de teste, pagar (modo teste Stripe), verificar pipeline completo: worker → IA → PDF, medir tempo total (meta < 3 min), conferir qualidade do PDF gerado, teste de borda (CEP inválido, nicho inexistente, 0 concorrentes, API offline) | 4h | S8-03 | Pipeline validado ponta a ponta | Tempo total < 3 min |

| **Milestone Fase 2** | Cliente paga com Stripe → pipeline completo executa → PDF profissional entregue por e-mail e dashboard. |
|-----------------------|----------------------------------------------------------------------------------------------------------|

---

#### FASE 3: CRESCIMENTO

| Sprint | Semana | ID | História | Tarefas | Esforço | Dependências | Entregável | KPI |
|--------|--------|----|----------|---------|---------|-------------|------------|-----|
| **Sprint 9** | **9** | S9-01 | Estratégia de cache (cacheBairros) | Implementar `checkCache(key)` e `saveCache(key, data)` no Firestore (`cacheBairros/{cep_raio}`), TTL de 30 dias, integrar cache em `placesWorker` e `ibgeWorker` (antes de chamar API, verificar cache), log de cache hits/misses, invalidar cache manualmente via console admin | 5h | S6-02, S6-03 | 80% de cache hit em bairros repetidos | Redução de custo API > 60% |
| | | S9-02 | Rate limiting nas Cloud Functions | Implementar contador no Firestore (`rateLimits/{uid}`), limitar a 5 relatórios/hora por usuário, retornar erro 429 com mensagem "Aguarde X minutos", limitar 3 relatórios grátis/dia por IP (evitar abuso do lead gen) | 3h | S6-01 | Proteção contra abuso de API | - |
| | | S9-03 | Dashboard Admin (interno) | Rota `/admin` (só para role=admin), visão geral: relatórios gerados/dia, receita/dia, cache hit rate, erros, top bairros analisados, top nichos, gráfico de evolução (Chart.js), exportar CSV | 6h | S8-01 | Visibilidade operacional para o fundador | - |
| | | S9-04 | Tratamento de erros + retry | Implementar retry com backoff exponencial nas Cloud Functions (máx 3 tentativas), fila de dead-letter (`failedJobs/{id}`) para jobs com falha permanente, notificação por e-mail ao admin em erro crítico, botão "Tentar novamente" no dashboard para o cliente | 4h | S8-04 | Resiliência do pipeline | Taxa de erro < 2% |
| **Sprint 10** | **10** | S10-01 | API B2B para corretores/CRECI | Criar endpoint REST `POST /api/v1/reports` com API key por corretor/ imobiliária, documentação OpenAPI/Swagger, limitar por plano (pro: 10/mês, enterprise: ilimitado), webhook de callback quando relatório ficar pronto, gerar PDF white-label com logo da imobiliária | 8h | S7-04 | API documentada e testável externamente | - |
| | | S10-02 | Portal do corretor (B2B) | Página `/corretor/login`, auth por API key + e-mail, dashboard B2B com: saldo de relatórios, histórico dos relatórios gerados para clientes, campo para inserir e-mail do cliente final (envia PDF direto), template de e-mail customizável, billing recorrente Stripe (R$197/mês ou R$497/mês) | 8h | S10-01 | Corretores onboardados e gerando relatórios | MRR de parceiros |
| | | S10-03 | Comparativo de bairros (Dashboard) | Feature premium: selecionar 2+ bairros no histórico, gerar tabela comparativa com: score de viabilidade, densidade concorrencial, renda média, rating médio, radar chart com 5 dimensões, botão "Exportar comparativo em PDF" | 6h | S8-02 | Cliente compara múltiplas localizações | Upsell para plano Pro |
| **Sprint 11** | **11** | S11-01 | Otimização de custos LLM | A/B test: Groq (Llama 4) vs OpenAI GPT-4o-mini (custo vs qualidade), implementar cache de prompts similares (se mesmo bairro + mesmo nicho → reutilizar análise textual), processamento em batch (acumular 5 relatórios → 1 chamada LLM com lote), usar modelo menor para tarefas simples (ex: apenas SWOT) | 5h | S7-02 | Custo LLM < R$ 0,50/relatório | Custo por relatório |
| | | S11-02 | SEO + Blog de conteúdo | Criar `/blog` com CMS estático (MDX), artigos: "Como escolher o ponto comercial ideal", "5 erros ao abrir uma franquia", "Bairros mais promissores de SP em 2026", cada artigo com CTA "Analise seu bairro grátis" com campo de CEP inline, gerar sitemap.xml dinâmico, Schema.org `SoftwareApplication` | 6h | S1-01 | Tráfego orgânico entrando | Visitas orgânicas > 100/mês |
| | | S11-03 | Landing Page v2 (otimizada) | A/B test com variações de headline, prova social (depoimentos falsos iniciais → reais depois), seção "Quem confia" (logos inventados → reais), integração com RD Station/Mailchimp para captura de e-mail + CEP (lead sem cadastro), timer de urgência "Oferta de lançamento: 50% off" | 5h | S4-03 | Taxa de conversão landing page otimizada | Conversão > 5% |
| **Sprint 12** | **12** | S12-01 | Garantia + Reembolso automático | Política "Satisfação Garantida ou Dinheiro de Volta em 7 dias", botão "Solicitar reembolso" no dashboard, Cloud Function que chama Stripe Refund API + devolve créditos, salvar motivo do reembolso (select: "relatório raso"/"dados errados"/"não era o que esperava"), métrica de churn por motivo | 4h | S5-02 | Política de reembolso operacional | Taxa de reembolso < 5% |
| | | S12-02 | Onboarding pós-compra | Sequência de e-mails (via Trigger Email): D+0 "Relatório pronto", D+2 "Como interpretar sua análise SWOT", D+5 "Case de sucesso: loja X no bairro Y", D+10 "Precisa analisar outro ponto?", CTA em cada e-mail para novo relatório, métrica de retenção (recompra em 30 dias) | 3h | S8-03 | Automação de nurturing | Recompra > 15% |
| | | S12-03 | Teste de carga + stress test | Simular 10/50/100 relatórios simultâneos (via script Node.js), medir tempo de resposta das Cloud Functions (cold start vs warm), identificar gargalos (Google Places rate limit, Groq rate limit), ajustar quotas e concorrência máxima, documentar limites da plataforma | 4h | S9-02 | Plataforma dimensionada | Suportar 100 relatórios/hora |

| **Milestone Fase 3** | Plataforma estável, cache reduzindo custos, API B2B ativa, SEO gerando tráfego orgânico. |
|-----------------------|------------------------------------------------------------------------------------------|

---

#### FASE 4: ESCALA

| Sprint | Semana | ID | História | Tarefas | Esforço | Dependências | Entregável | KPI |
|--------|--------|----|----------|---------|---------|-------------|------------|-----|
| **Sprint 13** | **13** | S13-01 | PWA + App Mobile | Configurar `next-pwa`, manifest.json, service worker (cache offline do dashboard), ícone para homescreen (iOS + Android), testar "Adicionar à tela inicial", notificações push (Firebase Cloud Messaging) para "Seu relatório ficou pronto!" | 6h | S8-02 | App instalável no celular | Installs PWA |
| | | S13-02 | Integração WhatsApp | Cloud Function que gera link do WhatsApp com mensagem pré-formatada: "Olá [nome], seu relatório de inteligência de localização está pronto: [link]", opção de envio automático ao concluir (preferência do usuário), template aprovado pelo WhatsApp Business API (Meta), fallback: link direto `wa.me/55...` | 4h | S8-03 | Cliente recebe relatório via WhatsApp | Taxa de entrega > 90% |
| | | S13-03 | Relatórios customizados por tipo de negócio | Templates específicos: "Hamburgueria" (análise de fornecedores de carne/pão), "Pet Shop" (densidade de pets no bairro via IBGE), "Barbearia" (fluxo de pedestres), "Farmácia" (distância de hospitais/postos), adaptar System Prompt da LLM por template de nicho | 8h | S7-02 | Relatórios com insights específicos por nicho | Satisfação > 4.5/5 |
| **Sprint 14** | **14** | S14-01 | White-label para imobiliárias | Subdomínio customizado (`imobiliaria.prevoya.com.br`), logo customizada no header + PDF, cores customizadas (CSS variables via admin panel), e-mail com domínio da imobiliária (remetente customizável), página de login com logo do parceiro, faturamento direto (imobiliária cobra o cliente final) | 10h | S10-02 | Imobiliária onboarda com a própria marca | MRR white-label |
| | | S14-02 | Planos de assinatura recorrente | Implementar Stripe Billing (Subscription), planos: Starter (R$97/mês, 3 relatórios), Growth (R$197/mês, 10 relatórios), Scale (R$497/mês, ilimitado), renovação automática mensal, upgrade/downgrade no meio do ciclo (pro-rata), fatura em PDF (Stripe invoice), lembrete de expiração de plano | 6h | S5-01 | MRR previsível | Churn < 5%/mês |
| | | S14-03 | Programa de afiliados | Tabela `affiliates` no Firestore, link único de indicação (`prevoya.com.br?ref=XYZ`), cookie de 30 dias, comissão de 20% sobre primeira compra, dashboard de afiliado (cliques, conversões, saldo), pagamento de comissão via PIX manual ou automatizado (Split Stripe Connect) | 8h | S5-02 | Canal de aquisição por indicação | CAC via afiliado < via ads |
| **Sprint 15** | **15** | S15-01 | Análise de Fornecedores B2B | Nova feature no relatório: buscar no Google Places fornecedores do nicho (keyword: "distribuidor de carne", "embalagens para restaurante", "atacado"), exibir no mapa com ícone diferente (azul = fornecedor, vermelho = concorrente), lista de contatos (telefone + endereço), seção "Sua cadeia de suprimentos a X km" no PDF | 6h | S6-02 | Diferencial competitivo no relatório | Upsell de feature |
| | | S15-02 | Análise de "Oceano Azul" (Heatmap) | Calcular índice de saturação por quadrante do mapa: `densidade_concorrentes / densidade_populacional`, gerar mapa de calor (verde = oportunidade, vermelho = saturado), sobrepor no Leaflet como layer, incluir no PDF como imagem estática, destacar "Zona de oportunidade a X metros do seu ponto" | 8h | S6-03, S6-02 | Mapa de calor no relatório | - |
| | | S15-03 | Integração: Google Popular Times | Extrair `popular_times` via Google Places (quando disponível), exibir gráfico de barras "Melhores horários para abrir", cruzar com perfil demográfico (ex: "região movimentada das 12h-14h = foco em almoço executivo"), recomendação de horário de funcionamento no plano de ação | 5h | S6-02 | Feature de tráfego e fluxo | - |
| **Sprint 16** | **16** | S16-01 | Monitoramento de bairros (recorrente) | Feature premium: "Monitore este bairro", usuário recebe alerta quando: novo concorrente abre, rating de concorrentes cai/ sobe > 20%, novos reviews negativos detectados, e-mail semanal de resumo "O que mudou no seu bairro esta semana", dashboard com timeline de mudanças | 8h | S9-01, S13-03 | Retenção por monitoramento contínuo | Retenção > 60% em 90 dias |
| | | S16-02 | IA de previsão de faturamento | Prompt adicional na LLM: "Com base na densidade populacional de X pessoas, ticket médio de R$ Y, e Z concorrentes, estime o faturamento mensal potencial em 3 cenários: conservador, realista e otimista", exibir projeção com gráfico de barras multi-cenário, break-even estimado | 4h | S7-02 | Projeção financeira no relatório | - |
| | | S16-03 | Métricas de negócio (fundador) | Dashboard financeiro: MRR, ARR, LTV, CAC, payback, churn rate, NPS (survey pós-relatório), revenue por canal (B2C vs B2B vs afiliados), burn rate, runway, projeção de break-even, visualização no Data Studio/Metabase conectado ao Firestore (export BigQuery) | 6h | S9-03 | Visão completa de SaaS metrics | Break-even < 12 meses |

| **Milestone Fase 4** | Plataforma SaaS completa: PWA, WhatsApp, white-label, assinaturas, afiliados, monitoramento. Preparada para escala. |
|-----------------------|---------------------------------------------------------------------------------------------------------------------|

---

### 12.3 Resumo de Esforço por Fase

| Fase | Sprints | Semanas | Histórias | Horas Estimadas | Custo (dev R$ 80/h) |
|------|---------|---------|-----------|-----------------|---------------------|
| 0: Fundação | 2 | 1-2 | 8 | 28h | R$ 2.240 |
| 1: Lead Gen | 2.5 | 3-4.5 | 10 | 40h | R$ 3.200 |
| 2: Monetização | 4 | 5-8 | 16 | 76h | R$ 6.080 |
| 3: Crescimento | 4 | 9-12 | 16 | 73h | R$ 5.840 |
| 4: Escala | 4 | 13-16 | 13 | 81h | R$ 6.480 |
| **TOTAL** | **16.5** | **16 semanas** | **63** | **298h** | **R$ 23.840** |

---

### 12.4 Marcos de Receita Esperados

| Marco | Semana | Evento | Receita Estimada |
|-------|--------|--------|------------------|
| M0 | Semana 4 | Lead gen ativo + Meta Ads | R$ 0 (validação gratuita) |
| M1 | Semana 8 | Relatório completo à venda | R$ 500 - R$ 1.500/mês (early adopters) |
| M2 | Semana 12 | API B2B + SEO ativo | R$ 3.000 - R$ 8.000/mês |
| M3 | Semana 16 | Assinaturas + afiliados + white-label | R$ 15.000 - R$ 30.000/mês |
| Break-even | Semana 20 | Otimização de CAC + retenção | Receita > custos operacionais + ads |

---

### 12.5 Mapa de Dependências Críticas

```
S0 (Setup, Auth, Layout)
 └─► S1 (Deploy, Landing Page, GCP APIs)
      └─► S2 (Wizard)
      │    └─► S3 (FreeReport Function + PDF simples + Lead form)
      │         └─► S4 (Analytics + Meta Ads)
      │              └─► S5 (Stripe + Créditos)
      │                   └─► S6 (Pipeline workers: Places + IBGE)
      │                        └─► S7 (Sentiment + IA writer + PDF completo)
      │                             └─► S8 (Dashboard + Email)
      │                                  └─► S9 (Cache + Rate limit + Admin)
      │                                       └─► S10 (API B2B + Portal corretor)
      │                                            └─► S11 (Otimização custos + SEO)
      │                                                 └─► S12 (Reembolso + Onboarding + Stress test)
      │                                                      └─► S13 (PWA + WhatsApp + Templates nicho)
      │                                                           └─► S14 (White-label + Assinaturas + Afiliados)
      │                                                                └─► S15 (Fornecedores + Heatmap + Popular Times)
      │                                                                     └─► S16 (Monitoramento + Previsão faturamento + Métricas)
      │
      └─► [EM PARALELO] S0-S1: Firebase config, GCP billing, contas Stripe/ Apify/Groq
```

---

### 12.6 Riscos e Mitigações por Sprint

| Sprint | Risco | Prob. | Impacto | Mitigação |
|--------|-------|-------|---------|-----------|
| S3 | Google Places API retornar 0 results para CEPs pequenos | Média | Alto | Fallback: aumentar raio para 5km, buscar por bairro em vez de CEP exato |
| S5 | Stripe rejeitar conta brasileira (compliance) | Baixa | Crítico | Ter Mercado Pago como fallback pré-configurado |
| S6 | IBGE API offline ou dados desatualizados | Média | Médio | Cache de dados do censo 2022 offline, fallback para estimativas DataSUS |
| S7 | LLM alucinar dados no relatório | Alta | Crítico | System prompt rigoroso + validação de números contra dados brutos + review humano na Fase 1 |
| S7 | Puppeteer timeout (> 60s) no Cloud Functions | Média | Alto | Aumentar memória para 2GiB, timeout 5min, split geração de gráficos do HTML |
| S8 | Cold start das Cloud Functions > 3s | Alta | Médio | Usar `minInstances: 1` nas funções críticas (custo extra ~$5/mês) |
| S10 | Corretores não adotarem a ferramenta | Alta | Alto | Fase 1: fazer manual para 5 corretores e validar antes de automatizar B2B |
| S14 | Churn de assinatura > 10%/mês | Média | Crítico | Onboarding + NPS + monitoramento de bairros (sticky feature) |
```

---

## Apêndice: Checklist de Ambiente

```
[ ] Conta Firebase com plano Blaze
[ ] Conta Google Cloud com billing ativo
[ ] Google Places API habilitada no GCP
[ ] Conta Stripe (Brasil) ativa
[ ] Domínio registrado (prevoya.com.br ou similar)
[ ] Firebase CLI instalado globalmente
[ ] Node.js 20+ instalado localmente
```

---

## Apêndice: Comandos Úteis

```bash
# Dev local
npm run dev                  # Frontend Next.js
npm run emulators            # Firebase emulators

# Deploy seletivo
npm run deploy:hosting       # Só o frontend
npm run deploy:functions     # Só as Cloud Functions
npm run deploy:rules         # Só as regras do Firestore

# Firebase config
firebase functions:config:set google.places_api_key="xxx"
firebase functions:config:set openai.api_key="xxx"
firebase functions:config:get

# Logs das Cloud Functions
firebase functions:log
```
