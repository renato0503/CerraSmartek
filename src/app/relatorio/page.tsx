"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/layout/AuthGuard";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";

function ReportContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              &larr; Voltar aos Relat&oacute;rios
            </Link>
          </div>

          <Card padding="lg">
            <h1 className="text-2xl font-bold text-gray-900">
              Relatório {id ? `#${id.slice(0, 8)}` : ""}
            </h1>
            <p className="mt-2 text-gray-500">
              Em breve: visualiza&ccedil;&atilde;o completa do relat&oacute;rio
              com gr&aacute;ficos, SWOT e plano de a&ccedil;&atilde;o.
            </p>

            <div className="mt-6 space-y-4">
              <ProgressBar
                value={30}
                label="Progresso do Relatório"
                showPercentage
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    Resumo Executivo
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">Em breve...</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    Análise de Concorrência
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">Em breve...</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    Demografia
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">Em breve...</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    Matriz SWOT
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">Em breve...</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button disabled>Baixar PDF</Button>
              <Link href="/dashboard">
                <Button variant="outline">Voltar</Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ReportDetailPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        }
      >
        <ReportContent />
      </Suspense>
    </AuthGuard>
  );
}
