"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import AuthGuard from "@/components/layout/AuthGuard";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function CompararContent() {
  const searchParams = useSearchParams();
  const ids = (searchParams.get("ids") || "").split(",").filter(Boolean);
  const { user } = useAuth();
  const [reports, setReports] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || ids.length === 0) { setLoading(false); return; }

    Promise.all(
      ids.map((id) =>
        getDocs(
          query(collection(db, "briefings"), where("__name__", "==", id))
        )
      )
    ).then((snaps) => {
      const items = snaps.flatMap((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
      setReports(items);
      setLoading(false);
    });
  }, [user, ids]);

  const viabilityRank = { ALTA: 4, MEDIA: 3, BAIXA: 2, NAO_RECOMENDADA: 1 };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  if (ids.length < 2) {
    return (
      <Card className="mx-auto max-w-lg text-center" padding="lg">
        <h2 className="text-lg font-semibold text-gray-900">Selecione 2 ou mais relatórios</h2>
        <p className="mt-2 text-sm text-gray-500">Use a checkbox no dashboard e clique em "Comparar".</p>
        <Link href="/dashboard"><Button variant="outline" className="mt-6">Voltar ao Dashboard</Button></Link>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Comparativo de Bairros</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="pb-3 pr-4 font-semibold text-gray-600">Critério</th>
              {reports.map((r) => (
                <th key={String(r.id)} className="pb-3 px-4 font-semibold text-gray-900">
                  {String(r.nicho || r.subcategoria || "")}<br />
                  <span className="text-xs font-normal text-gray-500">{String(r.cep || "")}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(["nicho", "cep", "endereco", "raio"] as const).map((field) => (
              <tr key={field} className="border-b border-gray-100">
                <td className="py-3 pr-4 font-medium text-gray-500 capitalize">{field === "nicho" ? "Nicho" : field === "endereco" ? "Endereço" : field === "raio" ? "Raio" : "CEP"}</td>
                {reports.map((r) => (
                  <td key={String(r.id)} className="py-3 px-4 text-gray-900">
                    {field === "raio" ? `${String(r.raio || "")}m` : String(r[field] || "—")}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-b border-gray-100 bg-gray-50">
              <td className="py-3 pr-4 font-medium text-gray-700">Viabilidade</td>
              {reports.map((r) => {
                const ai = (r.aiReport as Record<string, unknown>) || {};
                const resumo = (ai.resumo_executivo as Record<string, string>) || {};
                const nota = resumo.nota_viabilidade || "—";
                return (
                  <td key={String(r.id)} className="py-3 px-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      nota === "ALTA" ? "bg-green-100 text-green-700" : nota === "MEDIA" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                    }`}>{nota}</span>
                  </td>
                );
              })}
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-gray-700">Concorrentes</td>
              {reports.map((r) => {
                const ai = (r.aiReport as Record<string, unknown>) || {};
                const conc = (ai.analise_concorrencia as Record<string, unknown>) || {};
                return <td key={String(r.id)} className="py-3 px-4 text-gray-900">{String(conc.total_concorrentes || "—")}</td>;
              })}
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-gray-700">Densidade</td>
              {reports.map((r) => {
                const ai = (r.aiReport as Record<string, unknown>) || {};
                const conc = (ai.analise_concorrencia as Record<string, unknown>) || {};
                return <td key={String(r.id)} className="py-3 px-4 text-gray-900">{String(conc.densidade_concorrencial || "—")}</td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <Link href="/dashboard"><Button variant="outline">Voltar</Button></Link>
      </div>
    </div>
  );
}

export default function CompararPage() {
  return (
    <AuthGuard>
      <Header />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
          <CompararContent />
        </Suspense>
      </main>
      <Footer />
    </AuthGuard>
  );
}
