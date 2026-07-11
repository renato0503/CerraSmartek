"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface ConcorrenteItem {
  place_id: string;
  nome: string;
  endereco: string;
  rating: number;
  total_ratings: number;
}

interface ResultData {
  concorrentes: ConcorrenteItem[];
  endereco: string;
  cep: string;
  nicho: string;
  coordenadas: { lat: number; lng: number };
}

function ResultadoContent() {
  const searchParams = useSearchParams();
  const briefingId = searchParams.get("id") || "";
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!briefingId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const docRef = doc(db, "briefings", briefingId);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const d = snap.data();
          setData({
            concorrentes: d.concorrentes || [],
            endereco: d.endereco || "",
            cep: d.cep || "",
            nicho: d.nicho || d.subcategoria || "",
            coordenadas: d.coordenadas || { lat: 0, lng: 0 },
          });
        }
      } catch (err) {
        console.error("Erro ao carregar resultado:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [briefingId]);

  const generatePDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Prévoya - Raio-X do Bairro", 20, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Endereço: ${data?.endereco || "—"}`, 20, 45);
    doc.text(`Nicho: ${data?.nicho || "—"}`, 20, 53);
    doc.text(`CEP: ${data?.cep || "—"}`, 20, 61);
    doc.text(`Concorrentes encontrados: ${data?.concorrentes?.length || 0}`, 20, 69);

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 75, 190, 75);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Concorrentes na Região", 20, 88);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    let y = 100;
    const headers = ["Nome", "Rating", "Avaliações", "Endereço"];
    const colWidths = [55, 20, 25, 75];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    headers.forEach((h, i) => {
      doc.text(h, 20 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y);
    });

    y += 7;
    doc.setFont("helvetica", "normal");

    (data?.concorrentes || []).slice(0, 10).forEach((c) => {
      if (y > 270) {
        doc.addPage();
        y = 25;
      }

      const row = [
        c.nome.substring(0, 30),
        c.rating ? `★ ${c.rating.toFixed(1)}` : "—",
        String(c.total_ratings || 0),
        c.endereco.substring(0, 40),
      ];

      doc.setFontSize(8);
      row.forEach((cell, i) => {
        doc.text(cell, 20 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y);
      });

      y += 6;
    });

    y += 15;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Quer o relatório completo?", 20, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "Acesse prevoya.web.app e gere o relatório completo com SWOT, demografia e plano de ação por apenas R$ 75.",
      20,
      y + 7
    );

    doc.save(`prevoya-raio-x-${data?.cep || "bairro"}.pdf`);
  };

  return (
    <div className="mx-auto max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
          &larr; Voltar ao Início
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !data ? (
        <Card className="text-center" padding="lg">
          <h2 className="text-lg font-semibold text-gray-900">
            Nenhum resultado encontrado
          </h2>
          <p className="mt-2 text-gray-500">
            O briefing pode ter expirado ou não foi encontrado.
          </p>
          <div className="mt-6">
            <Link href="/">
              <Button variant="outline">Nova Análise</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Raio-X do Bairro
              </h1>
              <p className="mt-1 text-sm text-gray-500">{data.endereco}</p>
            </div>
            <Button onClick={generatePDF}>Baixar PDF Grátis</Button>
          </div>

          <Card padding="lg">
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {data.concorrentes.length}
                </p>
                <p className="text-xs text-blue-600">Concorrentes</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-2xl font-bold text-green-700">
                  {data.concorrentes.filter((c) => c.rating >= 4).length}
                </p>
                <p className="text-xs text-green-600">Bem Avaliados (4+)</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">
                  {data.concorrentes.length > 0
                    ? (
                        data.concorrentes.reduce(
                          (acc, c) => acc + c.rating,
                          0
                        ) / data.concorrentes.length
                      ).toFixed(1)
                    : "—"}
                </p>
                <p className="text-xs text-amber-600">Rating Médio</p>
              </div>
            </div>

            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Estabelecimentos Encontrados
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 pr-4 font-semibold text-gray-600">Nome</th>
                    <th className="pb-3 pr-4 font-semibold text-gray-600">Rating</th>
                    <th className="pb-3 pr-4 font-semibold text-gray-600">Avaliações</th>
                    <th className="pb-3 font-semibold text-gray-600">Endereço</th>
                  </tr>
                </thead>
                <tbody>
                  {data.concorrentes.map((c) => (
                    <tr key={c.place_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-900">{c.nome}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1">
                          <span className="text-amber-500">★</span>
                          {c.rating > 0 ? c.rating.toFixed(1) : "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{c.total_ratings}</td>
                      <td className="py-3 text-gray-500">{c.endereco}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center text-white">
            <h3 className="text-xl font-bold">Quer a análise completa?</h3>
            <p className="mt-2 text-sm text-blue-100">
              Relatório profissional com SWOT, demografia, análise de avaliações online e plano de ação personalizado.
            </p>
            <div className="mt-4">
              <Link href="/wizard">
                <Button className="bg-white text-blue-700 hover:bg-blue-50">
                  Gerar Relatório Completo — R$ 75
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultadoPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1">
        <Suspense
          fallback={
            <div className="flex w-full justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          }
        >
          <ResultadoContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
