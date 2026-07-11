"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AuthGuard from "@/components/layout/AuthGuard";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";

function ReportContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getDoc(doc(db, "briefings", id))
      .then((snap) => {
        if (snap.exists()) setData(snap.data());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const status = String(data?.status || "");
  const pdfUrl = typeof data?.pdfUrl === "string" ? data.pdfUrl : "";
  const nicho = String(data?.nicho || data?.subcategoria || "");
  const endereco = String(data?.endereco || `CEP ${data?.cep || ""}`);
  const raio = String(data?.raio || "");
  const aiReport = (data?.aiReport as Record<string, unknown>) || {};
  const resumo = (aiReport.resumo_executivo as Record<string, string>) || {};
  const concorrencia: Record<string, string | number | string[]> = (aiReport.analise_concorrencia || {}) as Record<string, string | number | string[]>;
  const reputacao: Record<string, string | number | string[]> = (aiReport.analise_reputacao || {}) as Record<string, string | number | string[]>;

  const concAnalise = typeof concorrencia.analise === "string" ? concorrencia.analise : "";
  const concTotal = typeof concorrencia.total_concorrentes !== "undefined" ? String(concorrencia.total_concorrentes) : "0";
  const concDensidade = typeof concorrencia.densidade_concorrencial !== "undefined" ? String(concorrencia.densidade_concorrencial) : "—";
  const concOps = Array.isArray(concorrencia.oportunidades) ? (concorrencia.oportunidades as string[]) : [];

  const repInsight = typeof reputacao.insight === "string" ? reputacao.insight : "";
  const repSatisfacao = typeof reputacao.satisfacao_media_regiao !== "undefined" ? String(reputacao.satisfacao_media_regiao) : "—";

  const swot = (aiReport.swot as Record<string, string[]>) || {};
  const plano = (aiReport.plano_acao as Record<string, unknown>) || {};
  const planoDiferenciacao = typeof plano.diferenciacao === "string" ? plano.diferenciacao : "";

  const viabilityColor: Record<string, string> = { ALTA: "bg-green-100 text-green-700", MEDIA: "bg-yellow-100 text-yellow-700", BAIXA: "bg-red-100 text-red-700", NAO_RECOMENDADA: "bg-red-100 text-red-700" };
  const isProcessing = ["processando", "dados_coletados", "relatorio_gerado", "pagamento_confirmado", "pagamento_pendente"].includes(status);
  const progressValue = status === "processando" ? 25 : status === "dados_coletados" ? 50 : status === "relatorio_gerado" ? 75 : status === "concluido" ? 100 : 0;

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-800">&larr; Voltar aos Relatórios</Link>
      </div>

      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatório {nicho}</h1>
            <p className="mt-1 text-sm text-gray-500">{endereco} · Raio {raio}m</p>
          </div>
          {pdfUrl ? <a href={pdfUrl} target="_blank" rel="noopener noreferrer"><Button>Baixar PDF</Button></a>
            : isProcessing ? <Button disabled><span className="flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Processando...</span></Button>
            : null}
        </div>

        {isProcessing && (
          <Card padding="lg"><ProgressBar value={progressValue} label="Gerando relatório" showPercentage size="md" /></Card>
        )}

        {resumo.nota_viabilidade && (
          <Card padding="lg">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Resumo Executivo</h2>
            <span className={`mb-3 inline-block rounded-full px-3 py-1 text-sm font-bold ${viabilityColor[resumo.nota_viabilidade] || "bg-gray-100"}`}>{resumo.nota_viabilidade}</span>
            <p className="text-gray-700">{resumo.justificativa}</p>
            <p className="mt-3 font-medium text-blue-700">{resumo.recomendacao_principal}</p>
          </Card>
        )}

        {concAnalise && (
          <Card padding="lg">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Análise de Concorrência</h2>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-3 text-center"><p className="text-2xl font-bold text-gray-900">{concTotal}</p><p className="text-xs text-gray-500">Total</p></div>
              <div className="rounded-lg bg-gray-50 p-3 text-center"><p className="text-2xl font-bold text-gray-900">{concDensidade}</p><p className="text-xs text-gray-500">Densidade</p></div>
            </div>
            <p className="text-gray-700">{concAnalise}</p>
            {concOps.map((o, i) => <span key={i} className="mr-2 rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">{o}</span>)}
          </Card>
        )}

        {repInsight && (
          <Card padding="lg">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Análise de Reputação</h2>
            <p className="font-medium text-gray-700">Satisfação média: {repSatisfacao}</p>
            <p className="mt-3 text-gray-700">{repInsight}</p>
          </Card>
        )}

        {(swot.forcas?.length || swot.fraquezas?.length) ? (
          <Card padding="lg">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Matriz SWOT</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["forcas", "fraquezas", "oportunidades", "ameacas"] as const).map((key) => {
                const titles = { forcas: "Forças", fraquezas: "Fraquezas", oportunidades: "Oportunidades", ameacas: "Ameaças" };
                const colors = { forcas: "bg-green-50 text-green-800", fraquezas: "bg-red-50 text-red-800", oportunidades: "bg-blue-50 text-blue-800", ameacas: "bg-yellow-50 text-yellow-800" };
                return (
                  <div key={key} className={`rounded-lg p-4 ${colors[key]}`}>
                    <h3 className="mb-2 font-semibold">{titles[key]}</h3>
                    <ul className="list-disc space-y-1 pl-5 text-sm">{(swot[key] || []).map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : null}

        {(Array.isArray(plano.curto_prazo) || plano.diferenciacao) ? (
          <Card padding="lg">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Plano de Ação</h2>
            {Array.isArray(plano.curto_prazo) && <div className="mb-4"><h3 className="font-semibold text-gray-900">Curto Prazo</h3><ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">{(plano.curto_prazo as string[]).map((a, i) => <li key={i}>{a}</li>)}</ul></div>}
            {planoDiferenciacao && <p className="rounded-lg bg-blue-50 p-3 text-sm font-medium text-blue-700">{planoDiferenciacao}</p>}
          </Card>
        ) : null}
      </div>
    </div>
  );
}

export default function ReportDetailPage() {
  return (
    <AuthGuard>
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
          <ReportContent />
        </Suspense>
      </main>
      <Footer />
    </AuthGuard>
  );
}
