"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { getUserProfile } from "@/lib/firestore";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface BriefingItem {
  id: string;
  nicho: string;
  cep: string;
  status: string;
  createdAt: { seconds: number; nanoseconds: number } | string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-600" },
  pagamento_pendente: { label: "Pagamento Pendente", color: "bg-yellow-100 text-yellow-700" },
  pagamento_confirmado: { label: "Pagamento Confirmado", color: "bg-green-100 text-green-700" },
  processando: { label: "Processando", color: "bg-blue-100 text-blue-700" },
  dados_coletados: { label: "Dados Coletados", color: "bg-indigo-100 text-indigo-700" },
  relatorio_gerado: { label: "Relatório Gerado", color: "bg-purple-100 text-purple-700" },
  concluido: { label: "Concluído", color: "bg-green-100 text-green-700" },
  erro: { label: "Erro", color: "bg-red-100 text-red-600" },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [briefings, setBriefings] = useState<BriefingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "briefings"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: BriefingItem[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            nicho: data.nicho || "",
            cep: data.cep || "",
            status: data.status || "",
            createdAt: data.createdAt || "",
          };
        });
        setBriefings(items);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao carregar briefings:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const processingCount = briefings.filter(
    (b) => b.status === "processando" || b.status === "dados_coletados" || b.status === "relatorio_gerado"
  ).length;

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((p) => {
      if (p?.role === "admin") setIsAdmin(true);
    });
  }, [user]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const goCompare = () => {
    const ids = [...selectedIds].join(",");
    router.push(`/comparar?ids=${ids}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Relatórios</h1>
          <p className="mt-1 text-sm text-gray-500">
            {briefings.length} relatório{briefings.length !== 1 ? "s" : ""}
            {processingCount > 0 && ` · ${processingCount} em processamento`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {selectedIds.size >= 2 && (
            <Button variant="secondary" size="sm" onClick={goCompare}>
              Comparar ({selectedIds.size})
            </Button>
          )}
          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="sm">Admin</Button>
            </Link>
          )}
          <Link href="/wizard">
            <Button>Novo Relatório</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="mt-16 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : briefings.length === 0 ? (
        <Card className="mt-10 text-center" padding="lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Nenhum relatório ainda
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Crie seu primeiro relatório de inteligência de localização.
          </p>
          <div className="mt-6">
            <Link href="/wizard">
              <Button>Criar Primeiro Relatório</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {briefings.map((briefing) => {
            const status = statusMap[briefing.status] || {
              label: briefing.status,
              color: "bg-gray-100 text-gray-600",
            };

            return (
              <Link key={briefing.id} href={`/relatorio?id=${briefing.id}`}>
                <Card padding="md" hover className="h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {briefing.nicho || "Relatório"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        CEP: {briefing.cep || "—"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  {briefing.createdAt && (
                    <p className="mt-3 text-xs text-gray-400">
                      {new Date(
                        typeof briefing.createdAt === "object" &&
                        "seconds" in briefing.createdAt
                          ? (briefing.createdAt as { seconds: number }).seconds *
                              1000
                          : briefing.createdAt as string
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  {briefing.status === "processando" && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      <span className="text-xs text-blue-600">
                        Processando...
                      </span>
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
