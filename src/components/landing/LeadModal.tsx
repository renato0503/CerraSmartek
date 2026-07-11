"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { functions, db } from "@/lib/firebase";
import Button from "@/components/ui/Button";

function fmt(v: string, max: number) { return v.replace(/\D/g, "").slice(0, max); }
function fmtCep(v: string) { const d = fmt(v, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; }
function fmtPhone(v: string) { const d = fmt(v, 11); if (d.length <= 2) return d; if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`; return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; }
function fmtCnpj(v: string) { const d = fmt(v, 14); if (d.length <= 2) return d; if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`; if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`; if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`; return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`; }

const NICHOS = [
  { value: "", label: "Tipo de negócio..." },
  { value: "hamburgueria", label: "Hamburgueria" }, { value: "pizzaria", label: "Pizzaria" },
  { value: "cafeteria", label: "Cafeteria" }, { value: "restaurante", label: "Restaurante" },
  { value: "barbearia", label: "Barbearia" }, { value: "pet shop", label: "Pet Shop" },
  { value: "academia", label: "Academia" }, { value: "farmacia", label: "Farmácia" },
  { value: "mercado", label: "Mercado" }, { value: "padaria", label: "Padaria" },
  { value: "outros", label: "Outros" },
];

interface Props { open: boolean; onClose: () => void }

export default function LeadModal({ open, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [nome, setNome] = useState(""); const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState(""); const [cnpj, setCnpj] = useState("");
  const [cep, setCep] = useState(""); const [nicho, setNicho] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => setAnimating(true));
    } else {
      document.body.style.overflow = "";
      setAnimating(false);
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const validate1 = () => {
    if (!nome.trim()) { setError("Informe seu nome"); return false; }
    if (!email.trim() || !email.includes("@")) { setError("E-mail inválido"); return false; }
    if (!fmt(telefone, 11).match(/^\d{10,11}$/)) { setError("WhatsApp inválido"); return false; }
    if (fmt(cnpj, 14).length !== 14) { setError("CNPJ inválido (14 dígitos)"); return false; }
    return true;
  };
  const validate2 = () => {
    if (fmt(cep, 8).length !== 8) { setError("CEP inválido"); return false; }
    if (!nicho) { setError("Selecione o tipo de negócio"); return false; }
    return true;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate2()) return;
    setLoading(true);
    try {
      const cnpjLimpo = fmt(cnpj, 14);
      const umMes = new Date(); umMes.setMonth(umMes.getMonth() - 1);
      const existente = await getDocs(
        query(collection(db, "leads"), where("cnpj", "==", cnpjLimpo), where("createdAt", ">=", umMes))
      );
      if (!existente.empty) { setError("CNPJ já usou análise grátis nos últimos 30 dias"); setLoading(false); return; }

      let cnpjData = null;
      try { const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`); if (r.ok) cnpjData = await r.json(); } catch { /* */ }

      await addDoc(collection(db, "leads"), {
        nome: nome.trim(), email: email.trim().toLowerCase(), telefone: fmt(telefone, 11),
        cnpj: cnpjLimpo, cnpjData: cnpjData || null, cep: fmt(cep, 8), nicho,
        origem: "landing_modal", status: "novo", createdAt: serverTimestamp(),
      });

      const gen = httpsCallable(functions, "generateFreeReport");
      const result = await gen({ cep: fmt(cep, 8), nicho, raio: 1000 });
      const { briefingId } = (result.data as { briefingId: string }) || {};
      if (briefingId) router.push(`/resultado?id=${briefingId}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Erro"); }
    finally { setLoading(false); }
  };

  const inputClass = "w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 sm:items-center ${animating ? "bg-black/60" : "bg-black/0"}`} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl transition-all duration-500 ease-out sm:rounded-3xl sm:p-8 ${
          animating ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-full opacity-0 sm:scale-95"
        }`}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {step === 1 ? "Análise Gratuita do Seu Bairro" : `Olá ${nome.split(" ")[0]}, seu bairro`}
        </h2>

        <form onSubmit={submit}>
          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Nome completo</label><input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" className={inputClass} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className={inputClass} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp</label><input type="tel" value={telefone} onChange={e => setTelefone(fmtPhone(e.target.value))} placeholder="(11) 99999-0000" maxLength={15} className={inputClass} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">CNPJ</label><input type="text" value={cnpj} onChange={e => setCnpj(fmtCnpj(e.target.value))} placeholder="00.000.000/0000-00" maxLength={18} className={inputClass} /></div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="button" size="lg" onClick={() => { if (validate1()){ setStep(2); setError(""); } }}
                className="w-full bg-amber-400 font-bold text-blue-950 hover:bg-amber-300">
                Continuar &rarr;
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline">&larr; Voltar</button>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">CEP</label><input type="text" value={cep} onChange={e => setCep(fmtCep(e.target.value))} placeholder="00000-000" maxLength={9} className={inputClass} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Nicho</label><select value={nicho} onChange={e => setNicho(e.target.value)} className={inputClass}>
                  {NICHOS.map(n => <option key={n.value} value={n.value} disabled={n.value === ""}>{n.label}</option>)}
                </select></div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" size="lg" disabled={loading}
                className="w-full bg-amber-400 font-bold text-blue-950 hover:bg-amber-300">
                {loading ? <span className="flex items-center justify-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-950 border-t-transparent" />Buscando...</span> : "Analisar Grátis"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
