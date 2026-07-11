"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFloat from "@/components/ui/WhatsAppFloat";
import PwaInstallPrompt from "@/components/ui/PwaInstallPrompt";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import LeadModal from "@/components/landing/LeadModal";
import AffiliateTracker from "@/components/landing/AffiliateTracker";

const FAQ_ITEMS = [
  {
    q: "Quanto tempo leva para gerar o relatório?",
    a: "Em média, de 3 a 5 minutos. O tempo pode variar conforme o raio de análise e a quantidade de estabelecimentos na região. Você pode acompanhar o progresso em tempo real pelo dashboard.",
  },
  {
    q: "Os dados são atualizados com que frequência?",
    a: "Os dados de concorrentes são obtidos em tempo real via API do Google Places. Dados demográficos vêm do IBGE (Censo 2022) e são atualizados conforme novas publicações oficiais.",
  },
  {
    q: "Preciso pagar para testar?",
    a: "Não. Você pode gerar uma análise gratuita de 1 página com o raio-X de concorrentes do seu bairro, sem compromisso e sem cartão de crédito.",
  },
  {
    q: "E se eu não gostar do relatório?",
    a: "Oferecemos garantia de 7 dias. Se não estiver satisfeito com a qualidade do relatório completo, devolvemos 100% do valor pago.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Sim. Utilizamos infraestrutura Google Cloud com criptografia em trânsito e em repouso. Seguimos a LGPD e nunca compartilhamos seus dados com terceiros.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. Não trabalhamos com fidelidade. Planos de assinatura podem ser cancelados a qualquer momento diretamente pelo painel.",
  },
];

const PLANOS = [
  {
    name: "Grátis",
    price: "R$ 0",
    description: "Perfeito para validar sua ideia inicial",
    features: [
      "Raio-X de concorrentes",
      "Mapa do bairro",
      "PDF de 1 página",
    ],
    cta: "Começar Grátis",
    href: "/wizard",
    highlight: false,
  },
  {
    name: "Completo",
    price: "R$ 75",
    priceLabel: "/relatório",
    description: "Análise profissional completa para tomar decisões com segurança",
    features: [
      "Tudo do plano Grátis",
      "Dados demográficos IBGE",
      "Renda média do bairro",
      "Matriz SWOT completa",
      "Análise de avaliações online",
      "Plano de ação personalizado",
    ],
    cta: "Comprar",
    href: "/wizard",
    highlight: true,
  },
  {
    name: "Pro",
    price: "R$ 200",
    priceLabel: "/mês",
    description: "Para corretores e franqueadores que analisam múltiplos pontos",
    features: [
      "Tudo do plano Completo",
      "10 relatórios por mês",
      "API de integração",
      "White-label",
      "Suporte prioritário",
    ],
    cta: "Falar com Vendas",
    href: "https://wa.me/5565963744450",
    highlight: false,
  },
];

export default function Home() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("open") === "modal") setShowModal(true);
    }
  }, []);
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section id="hero" className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
          {/* Texture overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          {/* Decorative gradients */}
          <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                {/* Logo in hero */}
                <div className="mb-8 flex items-center gap-4">
                  <Image
                    src="/images/prevoya_logo.png"
                    alt="Prévoya"
                    width={300}
                    height={75}
                    className="brightness-0 invert drop-shadow-lg"
                    priority
                  />
                </div>

                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-sm font-medium text-amber-300 backdrop-blur">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                  </span>
                  Inteligência de localização comercial
                </div>

                <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Descubra se o ponto comercial é{" "}
                  <span className="relative">
                    <span className="relative z-10 text-amber-400">realmente bom</span>
                    <span className="absolute bottom-1 left-0 h-3 w-full bg-amber-400/20" />
                  </span>{" "}
                  antes de investir
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-blue-100">
                  Análise completa de concorrência, perfil demográfico, renda
                  média do bairro e viabilidade do seu negócio. Relatório
                  profissional gerado por IA com metodologia de consultorias de
                  elite.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/wizard">
                    <Button size="lg" className="bg-amber-400 text-blue-950 hover:bg-amber-300 font-bold shadow-lg shadow-amber-400/30">
                      Analisar Meu Bairro Grátis →
                    </Button>
                  </Link>
                  <Link
                    href="#como-funciona"
                    className="inline-flex items-center rounded-xl border-2 border-white/30 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
                  >
                    Ver Demonstração
                  </Link>
                </div>

                {/* Stats bar */}
                <div className="mt-10 flex flex-wrap gap-6 border-t border-white/10 pt-6">
                  <div>
                    <span className="block text-2xl font-bold text-white">+3.500</span>
                    <span className="text-sm text-blue-200">bairros analisados</span>
                  </div>
                  <div className="border-l border-white/10 pl-6">
                    <span className="block text-2xl font-bold text-white">+1.200</span>
                    <span className="text-sm text-blue-200">negócios ajudados</span>
                  </div>
                  <div className="border-l border-white/10 pl-6">
                    <span className="block text-2xl font-bold text-white">3 min</span>
                    <span className="text-sm text-blue-200">relatório pronto</span>
                  </div>
                </div>
              </div>

              {/* Visual card */}
              <div className="hidden lg:block">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-amber-400/20 to-blue-400/20 blur-2xl" />
                  <div className="relative rounded-2xl bg-white p-6 shadow-2xl">
                    <div className="mb-4 flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-yellow-400" />
                      <div className="h-3 w-3 rounded-full bg-green-400" />
                    </div>
                    {/* Report preview */}
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Relatório Prevoya</p>
                        <p className="text-xs text-gray-400">Análise #4821 · CEP 78000-000</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="h-3 w-full rounded bg-gray-100" />
                      <div className="h-3 w-4/5 rounded bg-gray-100" />
                      <div className="h-3 w-3/5 rounded bg-gray-100" />
                    </div>

                    {/* Key metrics */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-green-50 p-4 border border-green-100">
                        <p className="text-xs font-semibold text-green-700">VIABILIDADE</p>
                        <p className="mt-1 text-2xl font-extrabold text-green-600">Alta</p>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-green-100">
                          <div className="h-1.5 w-4/5 rounded-full bg-green-500" />
                        </div>
                      </div>
                      <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                        <p className="text-xs font-semibold text-blue-700">CONCORRÊNCIA</p>
                        <p className="mt-1 text-2xl font-extrabold text-blue-600">12</p>
                        <p className="text-xs text-blue-400">estabelecimentos</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">População no raio</span>
                        <span className="font-bold text-gray-700">45.000 hab</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Renda média</span>
                        <span className="font-bold text-gray-700">R$ 3.200</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Ticket médio compatível</span>
                        <span className="font-bold text-green-600">✓ Sim</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="relative border-t border-white/10 bg-blue-950/50 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-4 text-xs text-blue-200 sm:px-6 lg:px-8">
              <span className="font-semibold text-white">Dados de:</span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                Google Places
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l9 6 9-6" /></svg>
                IBGE
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ViaCEP
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                IA Groq Llama 3.3
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.138 4.108A9.949 9.949 0 0012 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10c0 .633-.059 1.252-.172 1.85" /></svg>
                LGPD compliant
              </span>
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section id="como-funciona" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-block rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-700">
                COMO FUNCIONA
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Em 3 passos, você tem uma análise completa
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Esqueça pesquisas manuais demoradas. Nossa IA faz o trabalho
                pesado por você.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Descreva seu Negócio",
                  description:
                    "Informe seu nicho de mercado, ticket médio e principais preocupações. Quanto mais detalhes, mais precisa será a análise.",
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                },
                {
                  step: "02",
                  title: "Marque a Localização",
                  description:
                    "Informe o CEP ou clique no mapa para marcar o ponto exato. Defina o raio de análise entre 500m e 3km.",
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                },
                {
                  step: "03",
                  title: "Receba o Relatório",
                  description:
                    "Em minutos, receba um PDF profissional com análise de concorrência, SWOT, demografia e plano de ação personalizado.",
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <Card key={item.step} padding="lg" hover className="text-center relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-7xl font-extrabold text-gray-50 select-none">
                    {item.step}
                  </div>
                  <div className="relative">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-600/30">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="bg-gray-50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-block rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-700">
                PLANOS E PREÇOS
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Escolha o plano ideal para você
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Comece grátis e evolua conforme sua necessidade. Sem
                fidelidade.
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-4xl gap-8 lg:grid-cols-3">
              {PLANOS.map((plano) => (
                <Card
                  key={plano.name}
                  padding="lg"
                  className={`relative flex flex-col ${
                    plano.highlight
                      ? "border-blue-600 ring-2 ring-blue-600 lg:scale-105 bg-white shadow-xl shadow-blue-600/10"
                      : ""
                  }`}
                >
                  {plano.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-1 text-xs font-semibold text-white shadow-md">
                      ★ Mais Popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{plano.name}</h3>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-gray-900">{plano.price}</span>
                    {plano.priceLabel && (
                      <span className="text-base font-normal text-gray-500">
                        {plano.priceLabel}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{plano.description}</p>

                  <ul className="mt-6 flex-1 space-y-3">
                    {plano.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plano.href}
                    className="mt-8"
                    {...(plano.name === "Pro" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    <Button
                      variant={plano.highlight ? "primary" : "outline"}
                      className="w-full"
                    >
                      {plano.cta}
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="inline-block rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-700">
                DÚVIDAS FREQUENTES
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Tire suas dúvidas
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Se não encontrar resposta, entre em contato conosco
              </p>
            </div>

            <div className="mt-12 space-y-4">
              {FAQ_ITEMS.map((item, index) => (
                <details key={index} className="group rounded-xl border border-gray-200 bg-white hover:border-blue-200 transition-colors">
                  <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50">
                    {item.q}
                    <svg className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </summary>
                  <div className="border-t border-gray-100 px-6 py-4 text-sm leading-relaxed text-gray-500">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 py-16 sm:py-20">
          <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mb-6 flex justify-center">
              <Image
                src="/images/prevoya_logo.png"
                alt="Prévoya"
                width={220}
                height={55}
                className="brightness-0 invert drop-shadow-lg"
              />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Pronto para descobrir o potencial do seu ponto comercial?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
              Comece agora com uma análise gratuita e tome decisões
              baseadas em dados reais.
            </p>
            <div className="mt-8">
              <Link href="/wizard">
                <Button size="lg" className="bg-amber-400 text-blue-950 hover:bg-amber-300 font-bold shadow-lg shadow-amber-400/30">
                  Analisar Meu Bairro Grátis Agora →
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-blue-200">
              Sem cartão de crédito · Cancelamento fácil · Dados seguros
            </p>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
      <PwaInstallPrompt />
      <LeadModal open={showModal} onClose={() => setShowModal(false)} />
      <Suspense><AffiliateTracker /></Suspense>
    </>
  );
}