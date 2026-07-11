"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs, where, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { getUserProfile } from "@/lib/firestore";
import AuthGuard from "@/components/layout/AuthGuard";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cep: string;
  nicho: string;
  cnpj: string;
  cnpjData: Record<string, unknown> | null;
  origem: string;
  status: string;
  createdAt: { toDate: () => Date };
}

const LEAD_STATUS: Record<string, { label: string; color: string }> = {
  novo: { label: "Novo", color: "bg-blue-100 text-blue-700" },
  em_contato: { label: "Em Contato", color: "bg-yellow-100 text-yellow-700" },
  qualificado: { label: "Qualificado", color: "bg-green-100 text-green-700" },
  fechado: { label: "Fechado", color: "bg-purple-100 text-purple-700" },
  perdido: { label: "Perdido", color: "bg-red-100 text-red-700" },
};

interface Metrics {
  totalReports: number;
  todayReports: number;
  topNichos: { nicho: string; count: number }[];
  topBairros: { cep: string; count: number }[];
  statusDistribution: Record<string, number>;
  recentErrors: { id: string; erro: string; createdAt: string }[];
}

export default function AdminPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<"metrics" | "leads">("metrics");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    getUserProfile(user.uid).then((profile) => {
      if (profile?.role === "admin") {
        setIsAdmin(true);
        loadMetrics();
      }
      setChecking(false);
    });
  }, [user]);

  const loadMetrics = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "briefings"), orderBy("createdAt", "desc"), limit(200))
      );

      const briefings = snap.docs.map((d) => {
        const data = d.data();
        return { id: d.id, ...data };
      }) as Array<{ id: string; [key: string]: unknown }>;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const nichos = new Map<string, number>();
      const bairros = new Map<string, number>();
      const statusDist: Record<string, number> = {};
      let todayCount = 0;
      const recentErrors: Metrics["recentErrors"] = [];

      briefings.forEach((b) => {
        const nicho = String(b.nicho || b.subcategoria || "outros");
        nichos.set(nicho, (nichos.get(nicho) || 0) + 1);

        const cep = String(b.cep || "N/A");
        bairros.set(cep, (bairros.get(cep) || 0) + 1);

        const status = String(b.status || "rascunho");
        statusDist[status] = (statusDist[status] || 0) + 1;

        const createdAt = (b.createdAt as { toDate?: () => Date })?.toDate?.() || new Date();
        if (createdAt >= today) todayCount++;

        if (status === "erro") {
          recentErrors.push({
            id: b.id,
            erro: String(b.erro || "Desconhecido"),
            createdAt: createdAt.toISOString(),
          });
        }
      });

      setMetrics({
        totalReports: briefings.length,
        todayReports: todayCount,
        topNichos: [...nichos.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([nicho, count]) => ({ nicho, count })),
        topBairros: [...bairros.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([cep, count]) => ({ cep, count })),
        statusDistribution: statusDist,
        recentErrors: recentErrors.slice(0, 10),
      });
    } catch (err) {
      console.error("Erro ao carregar métricas:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    setLeadsLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "leads"), orderBy("createdAt", "desc"), limit(100))
      );
      setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as Lead)));
    } catch (err) {
      console.error("Erro ao carregar leads:", err);
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => { if (isAdmin && tab === "leads") loadLeads(); }, [tab, isAdmin]);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    await updateDoc(doc(db, "leads", leadId), { status: newStatus, updatedAt: serverTimestamp() });
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  if (checking || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AuthGuard>
        <Header />
        <main className="flex flex-1 items-center justify-center px-4 py-20">
          <Card className="w-full max-w-md text-center" padding="lg">
            <h2 className="text-xl font-bold text-gray-900">Acesso Restrito</h2>
            <p className="mt-2 text-gray-500">Você não tem permissão para acessar esta página.</p>
            <Link href="/dashboard"><Button variant="outline" className="mt-6">Dashboard</Button></Link>
          </Card>
        </main>
        <Footer />
      </AuthGuard>
    );
  }

  const statusLabels: Record<string, string> = {
    rascunho: "Rascunho", pagamento_pendente: "Pag. Pendente",
    pagamento_confirmado: "Pag. Confirmado", processando: "Processando",
    dados_coletados: "Dados Coletados", relatorio_gerado: "Relatório Gerado",
    concluido: "Concluído", erro: "Erro", reembolsado: "Reembolsado",
  };

  return (
    <AuthGuard>
      <Header />
      <main className="mx-auto max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
            <p className="mt-1 text-sm text-gray-500">Métricas e CRM de leads</p>
          </div>
          <div className="flex gap-2">
            {(["metrics", "leads"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t === "metrics" ? "Métricas" : "Leads (CRM)"}
              </button>
            ))}
          </div>
        </div>

        {tab === "metrics" && (
          <>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : metrics ? (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Relatórios", value: metrics.totalReports, color: "bg-blue-50 text-blue-700" },
                { label: "Hoje", value: metrics.todayReports, color: "bg-green-50 text-green-700" },
                { label: "Erros", value: metrics.recentErrors.length, color: "bg-red-50 text-red-700" },
                { label: "Concluídos", value: metrics.statusDistribution["concluido"] || 0, color: "bg-purple-50 text-purple-700" },
              ].map((card) => (
                <Card key={card.label} padding="md">
                  <div className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${card.color}`}>
                    {card.label}
                  </div>
                  <p className="mt-3 text-3xl font-bold text-gray-900">{card.value}</p>
                </Card>
              ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <Card padding="lg">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Top Nichos</h3>
                <div className="space-y-2">
                  {metrics.topNichos.map((n) => (
                    <div key={n.nicho} className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-sm capitalize text-gray-700">{n.nicho}</span>
                      <span className="text-sm font-semibold text-gray-900">{n.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card padding="lg">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Top CEPs</h3>
                <div className="space-y-2">
                  {metrics.topBairros.map((b) => (
                    <div key={b.cep} className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-sm text-gray-700">{b.cep}</span>
                      <span className="text-sm font-semibold text-gray-900">{b.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card padding="lg">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Status</h3>
                <div className="space-y-2">
                  {Object.entries(metrics.statusDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-sm text-gray-700">{statusLabels[status] || status}</span>
                        <span className="text-sm font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </Card>

              <Card padding="lg">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Erros Recentes</h3>
                {metrics.recentErrors.length === 0 ? (
                  <p className="text-sm text-green-600">Nenhum erro recente</p>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {metrics.recentErrors.map((err) => (
                      <div key={err.id} className="rounded-lg bg-red-50 p-3">
                        <p className="text-xs text-gray-500">{err.id.slice(0, 12)}...</p>
                        <p className="text-sm text-red-700">{err.erro}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        ) : null}
          </>
        )}

        {tab === "leads" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {leads.length} leads capturados
              </h2>
              <Button variant="outline" size="sm" onClick={loadLeads} disabled={leadsLoading}>
                {leadsLoading ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 font-semibold text-gray-600">Nome</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">E-mail</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">WhatsApp</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">CNPJ</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Nicho</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">CEP</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsLoading ? (
                    <tr><td colSpan={7} className="py-10 text-center text-gray-400">Carregando...</td></tr>
                  ) : leads.length === 0 ? (
                    <tr><td colSpan={7} className="py-10 text-center text-gray-400">Nenhum lead ainda</td></tr>
                  ) : (
                    leads.map((lead) => {
                      const s = LEAD_STATUS[lead.status] || { label: lead.status, color: "bg-gray-100" };
                      const data = lead.cnpjData as Record<string, unknown> | null;
                      return (
                        <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{lead.nome}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{lead.email}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs hidden sm:table-cell">
                            <a href={`https://wa.me/55${lead.telefone}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {lead.telefone}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell">
                            <div>{lead.cnpj}</div>
                            {data && (
                              <div className="mt-1 text-gray-400">
                                {String(data.razao_social || data.nome_fantasia || "").slice(0, 30)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs capitalize hidden lg:table-cell">{lead.nicho}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs hidden lg:table-cell">{lead.cep}</td>
                          <td className="px-4 py-3">
                            <select
                              value={lead.status}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                              className="rounded border border-gray-200 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {Object.entries(LEAD_STATUS).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
      <Footer />
    </AuthGuard>
  );
}
