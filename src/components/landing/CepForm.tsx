"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { functions, db } from "@/lib/firebase";
import Button from "@/components/ui/Button";

function fmtDigits(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}
function fmtCep(v: string) {
  const d = fmtDigits(v, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}
function fmtPhone(v: string) {
  const d = fmtDigits(v, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function fmtCnpj(v: string) {
  const d = fmtDigits(v, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

const NICHOS_RAPIDOS = [
  { value: "", label: "Tipo de negócio..." },
  { value: "hamburgueria", label: "Hamburgueria" },
  { value: "pizzaria", label: "Pizzaria" },
  { value: "cafeteria", label: "Cafeteria" },
  { value: "restaurante", label: "Restaurante" },
  { value: "barbearia", label: "Barbearia" },
  { value: "pet shop", label: "Pet Shop" },
  { value: "academia", label: "Academia" },
  { value: "farmacia", label: "Farmácia" },
  { value: "mercado", label: "Mercado" },
  { value: "padaria", label: "Padaria" },
  { value: "outros", label: "Outros" },
];

interface LeadFormData {
  nome: string; email: string; telefone: string;
  cnpj: string; cep: string; nicho: string;
}

export default function CepForm({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"dados" | "localizacao">("dados");
  const [form, setForm] = useState<LeadFormData>({
    nome: "", email: "", telefone: "", cnpj: "", cep: "", nicho: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field: keyof LeadFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep1 = () => {
    if (!form.nome.trim()) { setError("Informe seu nome"); return false; }
    if (!form.email.trim() || !form.email.includes("@")) { setError("E-mail inválido"); return false; }
    if (!fmtDigits(form.telefone, 11).match(/^\d{10,11}$/)) { setError("WhatsApp inválido (DDD + número)"); return false; }
    if (fmtDigits(form.cnpj, 14).length !== 14) { setError("CNPJ inválido (14 dígitos)"); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (fmtDigits(form.cep, 8).length !== 8) { setError("CEP inválido (8 dígitos)"); return false; }
    if (!form.nicho) { setError("Selecione o tipo de negócio"); return false; }
    return true;
  };

  const handleNext = () => { if (validateStep1()) setStep("localizacao"); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setLoading(true);

    try {
      const cnpjLimpo = fmtDigits(form.cnpj, 14);

      const umMesAtras = new Date();
      umMesAtras.setMonth(umMesAtras.getMonth() - 1);
      const existente = await getDocs(
        query(
          collection(db, "leads"),
          where("cnpj", "==", cnpjLimpo),
          where("createdAt", ">=", umMesAtras)
        )
      );

      if (!existente.empty) {
        setError("Este CNPJ já gerou uma análise gratuita nos últimos 30 dias. Entre em contato para liberar.");
        setLoading(false);
        return;
      }

      let cnpjData = null;
      try {
        const apiRes = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
        if (apiRes.ok) cnpjData = await apiRes.json();
      } catch { /* segue sem dados */ }

      await addDoc(collection(db, "leads"), {
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        telefone: fmtDigits(form.telefone, 11),
        cnpj: cnpjLimpo,
        cnpjData: cnpjData || null,
        cep: fmtDigits(form.cep, 8),
        nicho: form.nicho,
        origem: "landing_page",
        status: "novo",
        createdAt: serverTimestamp(),
      });

      const genFn = httpsCallable(functions, "generateFreeReport");
      const result = await genFn({
        cep: fmtDigits(form.cep, 8),
        nicho: form.nicho,
        raio: 1000,
      });
      const { briefingId } = (result.data as { briefingId: string }) || {};

      if (briefingId) router.push(`/resultado?id=${briefingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar análise");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {step === "dados" ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-white">Preencha seus dados para receber a análise gratuita:</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="text" value={form.nome} onChange={(e) => updateField("nome", e.target.value)}
              placeholder="Nome completo"
              className="rounded-xl border-0 bg-white/15 px-4 py-3 text-white placeholder-blue-200 backdrop-blur focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)}
              placeholder="Seu melhor e-mail"
              className="rounded-xl border-0 bg-white/15 px-4 py-3 text-white placeholder-blue-200 backdrop-blur focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <input type="tel" value={form.telefone} onChange={(e) => updateField("telefone", fmtPhone(e.target.value))}
              placeholder="(11) 99999-0000" maxLength={15}
              className="rounded-xl border-0 bg-white/15 px-4 py-3 text-white placeholder-blue-200 backdrop-blur focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <input type="text" value={form.cnpj} onChange={(e) => updateField("cnpj", fmtCnpj(e.target.value))}
              placeholder="00.000.000/0000-00" maxLength={18}
              className="rounded-xl border-0 bg-white/15 px-4 py-3 text-white placeholder-blue-200 backdrop-blur focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <Button type="button" size="lg" onClick={handleNext}
            className="w-full bg-amber-400 font-bold text-blue-950 hover:bg-amber-300 shadow-lg shadow-amber-400/30">
            Continuar &rarr;
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setStep("dados")} className="text-sm text-blue-200 hover:text-white">&larr; Voltar</button>
            <p className="text-sm font-medium text-white">{form.nome}, agora informe CEP e nicho:</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input type="text" value={form.cep} onChange={(e) => updateField("cep", fmtCep(e.target.value))}
              placeholder="Seu CEP" maxLength={9}
              className="flex-1 rounded-xl border-0 bg-white/15 px-4 py-3 text-white placeholder-blue-200 backdrop-blur focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <select value={form.nicho} onChange={(e) => updateField("nicho", e.target.value)}
              className="flex-1 rounded-xl border-0 bg-white/15 px-4 py-3 text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-amber-400">
              {NICHOS_RAPIDOS.map((n) => (
                <option key={n.value} value={n.value} disabled={n.value === ""} className="text-gray-900">{n.label}</option>
              ))}
            </select>
            <Button type="submit" size="lg" disabled={loading}
              className="whitespace-nowrap bg-amber-400 font-bold text-blue-950 hover:bg-amber-300 shadow-lg shadow-amber-400/30">
              {loading ? <span className="flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-950 border-t-transparent" />Buscando...</span> : "Analisar Grátis"}
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </form>
  );
}
