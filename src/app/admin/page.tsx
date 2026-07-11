"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, limit, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from "firebase/firestore";
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
  notas: string;
  proximoContato: string;
  createdAt: { toDate: () => Date };
}

const LEAD_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  novo: { label: "Novo", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  em_contato: { label: "Em Contato", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  qualificado: { label: "Qualificado", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  fechado: { label: "Fechado", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  perdido: { label: "Perdido", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

interface Metrics {
  totalReports: number;
  todayReports: number;
  completedReports: number;
  errorReports: number;
  totalLeads: number;
  newLeadsToday: number;
  nichos: { nicho: string; count: number; pct: number }[];
  ceps: { cep: string; count: number }[];
  statusDistribution: { status: string; label: string; count: number }[];
  recentReports: { id: string; cep: string; nicho: string; status: string; createdAt: string }[];
  recentErrors: { id: string; erro: string; createdAt: string }[];
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<"metrics" | "leads">("metrics");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadFilter, setLeadFilter] = useState("todos");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [errorMsg, setErrorMsg] = useState("");

  const [newLead, setNewLead] = useState({ nome: "", email: "", telefone: "", cep: "", nicho: "", cnpj: "", origem: "manual" });

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((profile) => {
      if (profile?.role === "admin") {
        setIsAdmin(true);
        loadMetrics();
        loadLeads();
      }
      setChecking(false);
    }).catch(() => {
      setErrorMsg("Erro ao verificar permissões.");
      setChecking(false);
    });
  }, [user]);

  const loadMetrics = async () => {
    try {
      setErrorMsg("");
      const [briefingsSnap, leadsSnap] = await Promise.all([
        getDocs(query(collection(db, "briefings"), limit(500))),
        getDocs(query(collection(db, "leads"), limit(500))),
      ]);

      const briefings = briefingsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>));
      const leadsData = leadsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>));

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const nichos = new Map<string, number>();
      const ceps = new Map<string, number>();
      const statusDist = new Map<string, number>();
      let todayCount = 0;
      const recent: Metrics["recentReports"] = [];
      const errors: Metrics["recentErrors"] = [];
      let completed = 0;
      let errorCount = 0;

      briefings.forEach((b) => {
        const nicho = String(b.nicho || b.subcategoria || "outros");
        nichos.set(nicho, (nichos.get(nicho) || 0) + 1);
        const cep = String(b.cep || "N/A");
        ceps.set(cep, (ceps.get(cep) || 0) + 1);
        const status = String(b.status || "rascunho");
        statusDist.set(status, (statusDist.get(status) || 0) + 1);
        const createdAt = (b.createdAt as { toDate?: () => Date })?.toDate?.() || new Date();
        if (createdAt >= todayStart) todayCount++;
        if (status === "concluido") completed++;
        if (status === "erro") { errorCount++; errors.push({ id: String(b.id), erro: String(b.erro || "Desconhecido"), createdAt: createdAt.toISOString() }); }
        recent.push({ id: String(b.id).slice(0, 12), cep, nicho, status, createdAt: createdAt.toLocaleDateString("pt-BR") });
      });
      recent.sort((a, b) => new Date(b.createdAt.split("/").reverse().join("-")).getTime() - new Date(a.createdAt.split("/").reverse().join("-")).getTime());

      let leadsToday = 0;
      leadsData.forEach((l) => {
        const ct = (l.createdAt as { toDate?: () => Date })?.toDate?.() || new Date();
        if (ct >= todayStart) leadsToday++;
      });

      const total = briefings.length;
      const sortedNichos = [...nichos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

      setMetrics({
        totalReports: total,
        todayReports: todayCount,
        completedReports: completed,
        errorReports: errorCount,
        totalLeads: leadsData.length,
        newLeadsToday: leadsToday,
        nichos: sortedNichos.map(([n, c]) => ({ nicho: n, count: c, pct: total > 0 ? Math.round((c / total) * 100) : 0 })),
        ceps: [...ceps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([cep, count]) => ({ cep, count })),
        statusDistribution: [...statusDist.entries()].sort(([, a], [, b]) => b - a).map(([status, count]) => ({ status, count, label: STATUS_LABELS[status] || status })),
        recentReports: recent.slice(0, 10),
        recentErrors: errors.slice(0, 8),
      });
    } catch (err: any) {
      console.error("Erro ao carregar métricas:", err);
      setErrorMsg(err?.message || "Erro ao carregar métricas.");
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    setLeadsLoading(true);
    setErrorMsg("");
    try {
      const snap = await getDocs(query(collection(db, "leads"), limit(500)));
      const loaded = snap.docs.map((d) => {
        const data = d.data();
        return { id: d.id, nome: data.nome || "", email: data.email || "", telefone: data.telefone || "", cep: data.cep || "", nicho: data.nicho || "", cnpj: data.cnpj || "", cnpjData: data.cnpjData || null, origem: data.origem || "", status: data.status || "novo", notas: data.notas || "", proximoContato: data.proximoContato || "", createdAt: data.createdAt?.toDate ? { toDate: () => data.createdAt.toDate() } : { toDate: () => new Date() } } as Lead;
      });
      setLeads(loaded);
    } catch (err: any) {
      console.error("Erro ao carregar leads:", err);
      setErrorMsg(err?.message || "Erro ao carregar leads.");
    } finally {
      setLeadsLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    await updateDoc(doc(db, "leads", leadId), { status: newStatus, updatedAt: serverTimestamp() });
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l));
    if (selectedLead?.id === leadId) setSelectedLead((p) => p ? { ...p, status: newStatus } : null);
  };

  const saveNote = async () => {
    if (!selectedLead) return;
    await updateDoc(doc(db, "leads", selectedLead.id), { notas: noteText, updatedAt: serverTimestamp() });
    setLeads((prev) => prev.map((l) => l.id === selectedLead.id ? { ...l, notas: noteText } : l));
    setSelectedLead((p) => p ? { ...p, notas: noteText } : null);
    setEditingNote(false);
  };

  const updateLeadField = async (field: string, value: string) => {
    if (!selectedLead) return;
    await updateDoc(doc(db, "leads", selectedLead.id), { [field]: value, updatedAt: serverTimestamp() });
    setLeads((prev) => prev.map((l) => l.id === selectedLead.id ? { ...l, [field]: value } : l));
    setSelectedLead((p) => p ? { ...p, [field]: value } : null);
  };

  const addLead = async () => {
    if (!newLead.nome || !newLead.email) return;
    try {
      const docRef = await addDoc(collection(db, "leads"), {
        ...newLead,
        status: "novo",
        notas: "",
        proximoContato: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const created: Lead = {
        id: docRef.id,
        ...newLead,
        status: "novo",
        notas: "",
        proximoContato: "",
        cnpjData: null,
        createdAt: { toDate: () => new Date() },
      };
      setLeads((prev) => [created, ...prev]);
      setShowAddModal(false);
      setNewLead({ nome: "", email: "", telefone: "", cep: "", nicho: "", cnpj: "", origem: "manual" });
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao adicionar lead.");
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return;
    await deleteDoc(doc(db, "leads", leadId));
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    if (selectedLead?.id === leadId) setSelectedLead(null);
  };

  const bulkAction = async (newStatus: string) => {
    const batch = writeBatch(db);
    selectedIds.forEach((id) => batch.update(doc(db, "leads", id), { status: newStatus, updatedAt: serverTimestamp() }));
    await batch.commit();
    setLeads((prev) => prev.map((l) => selectedIds.has(l.id) ? { ...l, status: newStatus } : l));
    setSelectedIds(new Set());
    setBulkMode(false);
  };

  const exportLeads = () => {
    const csv = ["Nome,Email,Telefone,CEP,Nicho,CNPJ,Status,Origem,Notas", ...leads.map((l) => `"${l.nome}","${l.email}","${l.telefone}","${l.cep}","${l.nicho}","${l.cnpj}","${l.status}","${l.origem}","${(l.notas || "").replace(/"/g, "\"\"")}"`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "leads-prevoya.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (leadFilter !== "todos") result = result.filter((l) => l.status === leadFilter);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter((l) => l.nome.toLowerCase().includes(s) || l.email.toLowerCase().includes(s) || l.telefone.includes(s) || (l.cnpj || "").includes(s) || (l.nicho || "").toLowerCase().includes(s));
    }
    return result;
  }, [leads, leadFilter, searchTerm]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => { counts[l.status] = (counts[l.status] || 0) + 1; });
    return counts;
  }, [leads]);

  if (authLoading || (checking && user)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthGuard>
        <Header />
        <main className="flex flex-1 items-center justify-center px-4 py-20">
          <Card className="w-full max-w-md text-center" padding="lg">
            <h2 className="text-xl font-bold text-gray-900">Sessão encerrada</h2>
            <p className="mt-2 text-gray-500">Você foi desconectado.</p>
            <Link href="/login"><Button className="mt-6">Fazer Login</Button></Link>
          </Card>
        </main>
        <Footer />
      </AuthGuard>
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

  return (
    <AuthGuard>
      <Header />
      <main className="mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
            <p className="mt-0.5 text-sm text-gray-500">Painel de controle</p>
          </div>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {(["metrics", "leads"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
                {t === "metrics" ? "Métricas" : "Leads (CRM)"}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => { setErrorMsg(""); loadMetrics(); loadLeads(); }} className="ml-4 text-red-600 underline hover:no-underline font-medium">Tentar novamente</button>
          </div>
        )}

        {tab === "metrics" && (
          <>
            {loading ? (
              <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
            ) : metrics ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                  {[
                    { label: "Total Relatórios", value: metrics.totalReports, icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
                    { label: "Hoje", value: metrics.todayReports, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
                    { label: "Concluídos", value: metrics.completedReports, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
                    { label: "Erros", value: metrics.errorReports, icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", warn: metrics.errorReports > 0 },
                    { label: "Total Leads", value: metrics.totalLeads, icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
                    { label: "Leads Hoje", value: metrics.newLeadsToday, icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
                  ].map((card) => (
                    <Card key={card.label} padding="md" className="relative overflow-hidden">
                      <div className="absolute right-3 top-3 text-gray-200">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d={card.icon} /></svg>
                      </div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">{card.value}</p>
                      {card.warn && card.value > 0 && <span className="absolute bottom-2 left-4 h-1.5 w-1.5 rounded-full bg-red-500" />}
                    </Card>
                  ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card padding="lg">
                    <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-900">Top Nichos</h3><span className="text-xs text-gray-400">{metrics.totalReports} relatórios</span></div>
                    <div className="space-y-3">
                      {metrics.nichos.map((n) => (
                        <div key={n.nicho} className="group"><div className="mb-1 flex items-center justify-between text-sm"><span className="font-medium capitalize text-gray-700">{n.nicho}</span><span className="text-gray-400">{n.count} ({n.pct}%)</span></div>
                          <div className="h-2 w-full rounded-full bg-gray-100"><div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all group-hover:from-blue-600 group-hover:to-blue-700" style={{ width: `${Math.max(n.pct, 2)}%` }} /></div>
                        </div>
                      ))}
                      {metrics.nichos.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Nenhum dado ainda</p>}
                    </div>
                  </Card>
                  <Card padding="lg">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Pipeline de Status</h3>
                    <div className="space-y-2.5">
                      {metrics.statusDistribution.map((s) => {
                        const max = Math.max(...metrics.statusDistribution.map((x) => x.count), 1);
                        const pct = Math.round((s.count / max) * 100);
                        const colors: Record<string, string> = { concluido: "bg-green-500", erro: "bg-red-500", processando: "bg-blue-500", pagamento_confirmado: "bg-yellow-500", pagamento_pendente: "bg-orange-400", rascunho: "bg-gray-400", dados_coletados: "bg-indigo-400", relatorio_gerado: "bg-teal-500", reembolsado: "bg-pink-400" };
                        return (<div key={s.status} className="flex items-center gap-3"><span className="w-24 text-xs font-medium text-gray-600 text-right">{s.label}</span><div className="flex-1 h-5 rounded bg-gray-100"><div className={`h-5 rounded transition-all ${colors[s.status] || "bg-gray-400"}`} style={{ width: `${pct}%` }} /></div><span className="w-8 text-xs font-bold text-gray-700 text-left">{s.count}</span></div>);
                      })}
                    </div>
                  </Card>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card padding="lg">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Relatórios Recentes</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm"><thead><tr className="border-b border-gray-100"><th className="pb-2 font-medium text-gray-400">ID</th><th className="pb-2 font-medium text-gray-400">CEP</th><th className="pb-2 font-medium text-gray-400">Nicho</th><th className="pb-2 font-medium text-gray-400">Status</th><th className="pb-2 font-medium text-gray-400">Data</th></tr></thead>
                        <tbody>{metrics.recentReports.map((r) => (<tr key={r.id} className="border-b border-gray-50"><td className="py-2 font-mono text-xs text-gray-500">{r.id}</td><td className="py-2 text-xs text-gray-700">{r.cep}</td><td className="py-2 text-xs text-gray-700 capitalize">{r.nicho}</td><td className="py-2"><span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">{STATUS_LABELS[r.status] || r.status}</span></td><td className="py-2 text-xs text-gray-400">{r.createdAt}</td></tr>))}</tbody>
                      </table>
                    </div>
                  </Card>
                  <Card padding="lg">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Erros Recentes{metrics.recentErrors.length > 0 && <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">{metrics.recentErrors.length}</span>}</h3>
                    {metrics.recentErrors.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400"><svg className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><p className="mt-2 text-sm">Nenhum erro recente</p></div>
                    ) : (
                      <div className="max-h-80 space-y-2 overflow-y-auto">{metrics.recentErrors.map((err) => (<div key={err.id} className="rounded-lg bg-red-50 border border-red-100 p-3"><div className="flex items-start justify-between gap-2"><span className="text-xs font-mono text-red-400">{err.id}</span><span className="text-xs text-red-300">{new Date(err.createdAt).toLocaleString("pt-BR")}</span></div><p className="mt-1 text-sm text-red-700">{err.erro}</p></div>))}</div>
                    )}
                  </Card>
                </div>
              </div>
            ) : (
              <Card padding="lg" className="text-center py-12 text-gray-400"><p>Não foi possível carregar as métricas.</p><Button variant="outline" size="sm" className="mt-4" onClick={loadMetrics}>Tentar novamente</Button></Card>
            )}
          </>
        )}

        {tab === "leads" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input
                    type="text"
                    placeholder="Buscar leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <button onClick={() => setBulkMode(!bulkMode)} className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${bulkMode ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>Seleção</button>
                <button onClick={exportLeads} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Exportar CSV</button>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button onClick={() => setViewMode("kanban")} className={`px-3 py-2 text-sm ${viewMode === "kanban" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"}`}>Kanban</button>
                  <button onClick={() => setViewMode("table")} className={`px-3 py-2 text-sm ${viewMode === "table" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"}`}>Tabela</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono">{filteredLeads.length} de {leads.length} leads</span>
                <Button size="sm" onClick={() => setShowAddModal(true)}>
                  + Novo Lead
                </Button>
              </div>
            </div>

            {bulkMode && selectedIds.size > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-sm">
                <span className="font-medium text-blue-700">{selectedIds.size} selecionados</span>
                {Object.entries(LEAD_STATUS).map(([k, v]) => (
                  <button key={k} onClick={() => bulkAction(k)} className="rounded px-2 py-0.5 text-xs border border-blue-300 bg-white text-blue-700 hover:bg-blue-100">{v.label}</button>
                ))}
                <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-gray-500 hover:text-gray-700">Limpar</button>
              </div>
            )}

            {/* Status filter strip */}
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[{ key: "todos", label: "Todos", color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
                ...Object.entries(LEAD_STATUS).map(([k, v]) => ({ key: k, label: v.label, color: v.color, bg: v.bg })),
              ].map(({ key, label, color, bg }) => {
                const count = key === "todos" ? leads.length : (statusCounts[key] || 0);
                return (
                  <button key={key} onClick={() => { setLeadFilter(key); setSelectedLead(null); }}
                    className={`rounded-xl border p-3 text-left transition-all hover:shadow-md ${bg} ${leadFilter === key ? "ring-2 ring-blue-500 shadow-lg" : ""}`}>
                    <p className={`text-xs font-semibold ${color}`}>{label}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{count}</p>
                  </button>
                );
              })}
            </div>

            {/* Kanban view */}
            {viewMode === "kanban" && (
              <div className="grid gap-4 lg:grid-cols-5">
                {Object.entries(LEAD_STATUS).map(([statusKey, statusInfo]) => {
                  const statusLeads = filteredLeads.filter((l) => l.status === statusKey);
                  return (
                    <div key={statusKey} className="min-h-[200px]">
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`text-xs font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                        <span className="text-xs text-gray-400">{statusLeads.length}</span>
                      </div>
                      <div className="space-y-2">
                        {statusLeads.map((lead) => (
                          <button key={lead.id} onClick={() => { if (bulkMode) { const next = new Set(selectedIds); next.has(lead.id) ? next.delete(lead.id) : next.add(lead.id); setSelectedIds(next); } else setSelectedLead(selectedLead?.id === lead.id ? null : lead); }}
                            className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all hover:shadow-md ${bulkMode && selectedIds.has(lead.id) ? "border-blue-400 bg-blue-100 ring-2 ring-blue-400" : selectedLead?.id === lead.id ? "border-blue-400 bg-blue-50 shadow-md" : "bg-white border-gray-200 hover:border-gray-300"}`}>
                            <div className="flex items-start justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">{lead.nome}</p>
                              {bulkMode && <span className={`ml-1 h-4 w-4 flex-shrink-0 rounded border-2 ${selectedIds.has(lead.id) ? "border-blue-500 bg-blue-500" : "border-gray-300"}`} />}
                            </div>
                            {lead.nicho && <p className="text-xs text-gray-400 capitalize truncate mt-0.5">{lead.nicho}</p>}
                            <p className="text-xs text-gray-300 mt-1">{lead.createdAt?.toDate?.().toLocaleDateString("pt-BR")}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table view */}
            {viewMode === "table" && (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-gray-200 bg-gray-50">
                    {bulkMode && <th className="w-10 px-3 py-3" />}
                    <th className="px-4 py-3 font-semibold text-gray-600">Nome</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">E-mail</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">WhatsApp</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">CNPJ</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Nicho</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">CEP</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                  </tr></thead>
                  <tbody>
                    {filteredLeads.map((lead) => {
                      const s = LEAD_STATUS[lead.status] || { label: lead.status, color: "text-gray-500", bg: "bg-gray-50" };
                      return (
                        <tr key={lead.id} className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedLead?.id === lead.id ? "bg-blue-50" : ""}`} onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}>
                          {bulkMode && <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => { const next = new Set(selectedIds); selectedIds.has(lead.id) ? next.delete(lead.id) : next.add(lead.id); setSelectedIds(next); }} className="rounded" /></td>}
                          <td className="px-4 py-3 font-medium text-gray-900">{lead.nome}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{lead.email}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs hidden sm:table-cell">
                            {lead.telefone ? <a href={`https://wa.me/55${lead.telefone}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>{lead.telefone}</a> : "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell">{lead.cnpj || "—"}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs capitalize hidden lg:table-cell">{lead.nicho || "—"}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs hidden lg:table-cell">{lead.cep || "—"}</td>
                          <td className="px-4 py-3">
                            <select value={lead.status} onChange={(e) => { e.stopPropagation(); updateLeadStatus(lead.id, e.target.value); }} className={`rounded border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 ${s.bg} ${s.color}`}>
                              {Object.entries(LEAD_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredLeads.length === 0 && <div className="py-10 text-center text-gray-400 text-sm">Nenhum lead encontrado</div>}
              </div>
            )}

            {/* Lead detail panel */}
            {selectedLead && (
              <Card padding="lg" className="border-blue-200 bg-blue-50/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{selectedLead.nome}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${LEAD_STATUS[selectedLead.status]?.bg} ${LEAD_STATUS[selectedLead.status]?.color}`}>{LEAD_STATUS[selectedLead.status]?.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedLead.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => deleteLead(selectedLead.id)} className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50 transition-colors">Excluir</button>
                    <button onClick={() => setSelectedLead(null)} className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <span className="text-xs text-gray-400">WhatsApp</span>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedLead.telefone ? <a href={`https://wa.me/55${selectedLead.telefone}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedLead.telefone}</a> : <input type="text" placeholder="Adicionar telefone" className="mt-1 w-full rounded border border-gray-200 px-2 py-1 text-sm" onBlur={(e) => { if (e.target.value !== selectedLead.telefone) updateLeadField("telefone", e.target.value); }} />}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">CNPJ</span>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.cnpj || "—"}</p>
                    {selectedLead.cnpjData && <p className="text-xs text-gray-500 mt-0.5">{String((selectedLead.cnpjData as any).razao_social || "")}</p>}
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Nicho</span>
                    <input type="text" defaultValue={selectedLead.nicho || ""} placeholder="Adicionar nicho" className="mt-1 w-full rounded border border-gray-200 px-2 py-1 text-sm" onBlur={(e) => { if (e.target.value !== (selectedLead.nicho || "")) updateLeadField("nicho", e.target.value); }} />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">CEP</span>
                    <input type="text" defaultValue={selectedLead.cep || ""} placeholder="Adicionar CEP" className="mt-1 w-full rounded border border-gray-200 px-2 py-1 text-sm" onBlur={(e) => { if (e.target.value !== (selectedLead.cep || "")) updateLeadField("cep", e.target.value); }} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1">
                  <span className="text-xs text-gray-400">Origem: <strong className="text-gray-700">{selectedLead.origem || "—"}</strong></span>
                  <span className="text-xs text-gray-400">Criado: <strong className="text-gray-700">{selectedLead.createdAt?.toDate?.().toLocaleDateString("pt-BR")}</strong></span>
                </div>

                {/* Notes */}
                <div className="mt-4 border-t border-blue-100 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Notas</span>
                    <button onClick={() => { setEditingNote(true); setNoteText(selectedLead.notas || ""); }} className="text-xs text-blue-600 hover:underline">Editar</button>
                  </div>
                  {editingNote ? (
                    <div className="space-y-2">
                      <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="Adicionar notas sobre este lead..." />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveNote}>Salvar</Button>
                        <button onClick={() => setEditingNote(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedLead.notas || "Nenhuma nota."}</p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs font-medium text-gray-500 self-center mr-2">Mover para:</span>
                  {Object.entries(LEAD_STATUS).map(([k, v]) => (
                    <button key={k} onClick={() => updateLeadStatus(selectedLead.id, k)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border hover:opacity-80 ${v.bg} ${v.color} ${selectedLead.status === k ? "ring-2 ring-gray-400" : ""}`}>{v.label}</button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Add lead modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card padding="lg" className="w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Novo Lead</h3>
                <button onClick={() => setShowAddModal(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="space-y-3">
                <input type="text" placeholder="Nome *" value={newLead.nome} onChange={(e) => setNewLead((p) => ({ ...p, nome: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <input type="email" placeholder="Email *" value={newLead.email} onChange={(e) => setNewLead((p) => ({ ...p, email: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <input type="text" placeholder="WhatsApp" value={newLead.telefone} onChange={(e) => setNewLead((p) => ({ ...p, telefone: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <input type="text" placeholder="CEP" value={newLead.cep} onChange={(e) => setNewLead((p) => ({ ...p, cep: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <input type="text" placeholder="Nicho" value={newLead.nicho} onChange={(e) => setNewLead((p) => ({ ...p, nicho: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <input type="text" placeholder="CNPJ" value={newLead.cnpj} onChange={(e) => setNewLead((p) => ({ ...p, cnpj: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={addLead} disabled={!newLead.nome || !newLead.email}>Criar Lead</Button>
                <button onClick={() => setShowAddModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              </div>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </AuthGuard>
  );
}

const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  pagamento_pendente: "Pag. Pendente",
  pagamento_confirmado: "Pag. Confirmado",
  processando: "Processando",
  dados_coletados: "Dados Coletados",
  relatorio_gerado: "Relatório Gerado",
  concluido: "Concluído",
  erro: "Erro",
  reembolsado: "Reembolsado",
};
