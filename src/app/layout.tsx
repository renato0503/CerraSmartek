import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prévoya | Descubra se Vale a Pena Abrir seu Negócio Neste Endereço",
  description:
    "Análise profissional de concorrência, demografia e viabilidade comercial em minutos. Relatório gerado por IA com metodologia de consultorias de elite. Comece grátis.",
  keywords: [
    "análise de localização",
    "viabilidade comercial",
    "ponto comercial",
    "estudo de concorrência",
    "inteligência de mercado",
    "análise demográfica",
    "IBGE",
    "relatório de viabilidade",
  ],
  authors: [{ name: "Prévoya" }],
  creator: "Prévoya",
  publisher: "Prévoya",
  metadataBase: new URL("https://prevoya.web.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Prévoya | Descubra se o Ponto Comercial é Realmente Bom Antes de Investir",
    description:
      "Análise profissional de concorrência, demografia e viabilidade comercial em minutos. Comece grátis.",
    url: "https://prevoya.web.app",
    siteName: "Prévoya",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prévoya | Inteligência de Localização para Negócios",
    description:
      "Análise profissional de viabilidade comercial em minutos.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A2540" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Prévoya" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Prévoya",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "Ferramenta de inteligência de localização para análise de viabilidade comercial, concorrência e demografia.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "BRL",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Prévoya",
              url: "https://prevoya.web.app",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "sales",
                email: "contato@prevoya.com.br",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} flex min-h-screen flex-col bg-white text-gray-900 antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
