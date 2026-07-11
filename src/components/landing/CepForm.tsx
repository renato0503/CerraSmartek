"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { httpsCallable, getFunctions } from "firebase/functions";
import { functions } from "@/lib/firebase";
import Button from "@/components/ui/Button";

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
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

export default function CepForm({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [cep, setCep] = useState("");
  const [nicho, setNicho] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) {
      setError("CEP inválido — precisa ter 8 dígitos");
      return;
    }

    if (!nicho) {
      setError("Selecione o tipo de negócio");
      return;
    }

    setLoading(true);

    try {
      const generateFreeReportFn = httpsCallable<
        { cep: string; nicho: string; raio?: number },
        { briefingId: string }
      >(functions, "generateFreeReport");

      const result = await generateFreeReportFn({ cep: cepLimpo, nicho, raio: 1000 });
      const { briefingId } = result.data;

      if (briefingId) {
        router.push(`/resultado?id=${briefingId}`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao gerar análise";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={cep}
          onChange={(e) => {
            setCep(formatCep(e.target.value));
            setError("");
          }}
          placeholder="Seu CEP"
          maxLength={9}
          className="flex-1 rounded-xl border-0 bg-white/15 px-4 py-3 text-white placeholder-blue-200 backdrop-blur focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <select
          value={nicho}
          onChange={(e) => {
            setNicho(e.target.value);
            setError("");
          }}
          className="flex-1 rounded-xl border-0 bg-white/15 px-4 py-3 text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {NICHOS_RAPIDOS.map((n) => (
            <option key={n.value} value={n.value} disabled={n.value === ""} className="text-gray-900">
              {n.label}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="whitespace-nowrap bg-amber-400 font-bold text-blue-950 hover:bg-amber-300 shadow-lg shadow-amber-400/30"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-950 border-t-transparent" />
              Buscando...
            </span>
          ) : (
            "Analisar Gr\u00e1tis"
          )}
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-300">{error}</p>
      )}
    </form>
  );
}
