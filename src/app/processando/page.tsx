"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";

const PROCESSING_MESSAGES = [
  "Consultando mapas e estabelecimentos...",
  "Analisando concorrência na região...",
  "Identificando perfis de negócios similares...",
  "Calculando densidade concorrencial...",
  "Finalizando análise...",
];

function ProcessandoContent() {
  const searchParams = useSearchParams();
  const briefingId = searchParams.get("id") || "";
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("processando");

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * 8, 90));
    }, 800);
    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    if (!briefingId) return;

    const unsub = onSnapshot(
      doc(db, "briefings", briefingId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setStatus(data.status || "processando");
          if (data.status === "concluido") {
            setProgress(100);
          }
        }
      },
      () => {
        setStatus("concluido");
        setProgress(100);
      }
    );

    return () => unsub();
  }, [briefingId]);

  return (
    <Card className="w-full max-w-lg text-center" padding="lg">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center">
        <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>

      <h1 className="text-xl font-bold text-gray-900">
        {status === "concluido"
          ? "An\u00e1lise conclu\u00edda!"
          : "Analisando seu bairro..."}
      </h1>

      <p className="mt-2 text-sm text-gray-500">
        {status === "concluido"
          ? "Seu relat\u00f3rio gratuito est\u00e1 pronto."
          : PROCESSING_MESSAGES[messageIndex]}
      </p>

      <div className="mt-6">
        <ProgressBar value={progress} showPercentage size="md" />
      </div>

      {status === "concluido" && briefingId && (
        <div className="mt-8 flex flex-col gap-3">
          <Link href={`/resultado?id=${briefingId}`}>
            <Button className="w-full">Ver Resultado</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="w-full">
              Ir para Dashboard
            </Button>
          </Link>
        </div>
      )}

      {!briefingId && (
        <div className="mt-8">
          <Link href="/">
            <Button variant="outline">Voltar ao In\u00edcio</Button>
          </Link>
        </div>
      )}
    </Card>
  );
}

export default function ProcessandoPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <Suspense
          fallback={
            <Card className="w-full max-w-lg text-center" padding="lg">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Carregando...</h1>
            </Card>
          }
        >
          <ProcessandoContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
