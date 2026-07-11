import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFloat from "@/components/ui/WhatsAppFloat";
import PwaInstallPrompt from "@/components/ui/PwaInstallPrompt";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CepForm from "@/components/landing/CepForm";
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
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-blue-700">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-36">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur">
                  Análise de viabilidade comercial em minutos
                </div>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Descubra se o ponto comercial &eacute;{" "}
                  <span className="text-amber-400">realmente bom</span> antes de
                  investir
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-blue-100">
                  An&aacute;lise completa de concorr&ecirc;ncia, perfil
                  demogr&aacute;fico, renda m&eacute;dia do bairro e
                  viabilidade do seu neg&oacute;cio. Relat&oacute;rio
                  profissional gerado por IA com metodologia de
                  consultorias de elite.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/wizard">
                    <Button size="lg" className="bg-amber-400 text-blue-950 hover:bg-amber-300 font-bold shadow-lg shadow-amber-400/30">
                      Analisar Meu Bairro Gr&aacute;tis &rarr;
                    </Button>
                  </Link>
                  <Link
                    href="#como-funciona"
                    className="inline-flex items-center rounded-xl border-2 border-white/30 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
                  >
                    Ver Demonstra&ccedil;&atilde;o
                  </Link>
                </div>

                <p className="mt-6 flex items-center gap-3 text-sm text-blue-200">
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Sem cart&atilde;o de cr&eacute;dito
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    An&aacute;lise gratuita
                  </span>
                </p>

                <div className="mt-6 rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="mb-3 text-sm font-medium text-white">
                    Analise seu bairro agora:
                  </p>
                  <CepForm />
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="relative">
                  <div className="rounded-2xl bg-white p-6 shadow-2xl">
                    <div className="mb-4 flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-yellow-400" />
                      <div className="h-3 w-3 rounded-full bg-green-400" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 w-full rounded bg-gray-100" />
                      <div className="h-3 w-4/5 rounded bg-gray-100" />
                      <div className="h-3 w-3/5 rounded bg-gray-100" />
                    </div>
                    <div className="mt-6 rounded-xl bg-blue-50 p-4">
                      <p className="text-sm font-bold text-blue-900">Viabilidade: ALTA</p>
                      <p className="mt-1 text-xs text-blue-600">
                        Renda m&eacute;dia compat&iacute;vel com o ticket do neg&oacute;cio
                      </p>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-bold text-gray-700">Concorrentes: </span>12 na regi&atilde;o
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-bold text-gray-700">Popula&ccedil;&atilde;o: </span>45.000 hab
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-bold text-gray-700">Renda M&eacute;dia: </span>R$ 3.200
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section id="como-funciona" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-block rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">
                COMO FUNCIONA
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Em 3 passos, voc&ecirc; tem uma an&aacute;lise completa
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Esque&ccedil;a pesquisas manuais demoradas. Nossa IA faz o
                trabalho pesado por voc&ecirc;.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Descreva seu Neg\u00f3cio",
                  description:
                    "Informe seu nicho de mercado, ticket m\u00e9dio e principais preocupa\u00e7\u00f5es. Quanto mais detalhes, mais precisa ser\u00e1 a an\u00e1lise.",
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                },
                {
                  step: "02",
                  title: "Marque a Localiza\u00e7\u00e3o",
                  description:
                    "Informe o CEP ou clique no mapa para marcar o ponto exato. Defina o raio de an\u00e1lise entre 500m e 3km.",
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                },
                {
                  step: "03",
                  title: "Receba o Relat\u00f3rio",
                  description:
                    "Em minutos, receba um PDF profissional com an\u00e1lise de concorr\u00eancia, SWOT, demografia e plano de a\u00e7\u00e3o personalizado.",
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <Card key={item.step} padding="lg" hover className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
                    {item.icon}
                  </div>
                  <div className="mb-3 text-sm font-bold text-blue-600">PASSO {item.step}</div>
                  <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="bg-gray-50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-block rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">
                PLANOS E PRE&Ccedil;OS
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Escolha o plano ideal para voc&ecirc;
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Comece gr&aacute;tis e evolua conforme sua necessidade. Sem
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
                      ? "border-blue-600 ring-2 ring-blue-600 lg:scale-105"
                      : ""
                  }`}
                >
                  {plano.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                      Mais Popular
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
              <span className="inline-block rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">
                D&Uacute;VIDAS FREQUENTES
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Tire suas d&uacute;vidas
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Se n&atilde;o encontrar resposta, entre em contato conosco
              </p>
            </div>

            <div className="mt-12 space-y-4">
              {FAQ_ITEMS.map((item, index) => (
                <details key={index} className="group rounded-xl border border-gray-200 bg-white">
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
        <section className="bg-gradient-to-br from-blue-950 via-blue-800 to-blue-700 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Pronto para descobrir o potencial do seu ponto comercial?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
              Comece agora com uma an&aacute;lise gratuita e tome decis&otilde;es
              baseadas em dados reais.
            </p>
            <div className="mt-8">
              <Link href="/wizard">
                <Button size="lg" className="bg-amber-400 text-blue-950 hover:bg-amber-300 font-bold shadow-lg shadow-amber-400/30">
                  Analisar Meu Bairro Gr&aacute;tis Agora &rarr;
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-blue-200">
              Sem cart&atilde;o de cr&eacute;dito &middot; Cancelamento
              f&aacute;cil &middot; Dados seguros
            </p>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
      <PwaInstallPrompt />
      <Suspense><AffiliateTracker /></Suspense>
    </>
  );
}
