"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { createBriefing } from "@/lib/firestore";
import { useAuth } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { WizardFormData } from "@/components/wizard/WizardContainer";

interface StepProps {
  formData: WizardFormData;
  updateField: (field: keyof WizardFormData, value: unknown) => void;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  isFirst: boolean;
  isLast: boolean;
}

const CATEGORIA_LABELS: Record<string, string> = {
  alimentacao: "Alimentação", varejo: "Varejo", servicos: "Serviços",
  saude: "Saúde", beleza: "Beleza e Estética", educacao: "Educação",
  fitness: "Fitness e Esportes", automotivo: "Automotivo", pets: "Pets",
  construcao: "Construção e Decoração", tecnologia: "Tecnologia", outros: "Outros",
};

const PLANOS = [
  {
    value: "gratuito", label: "Grátis", desc: "Raio-X do bairro (1 página)",
    price: "R$ 0", credits: 0,
  },
  {
    value: "completo", label: "Completo", desc: "Análise profissional + SWOT + Plano de Ação",
    price: "R$ 75", credits: 3,
  },
];

export default function ResumoStep({
  formData, updateField, onBack,
}: StepProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    setError("");

    try {
      if (formData.plano === "completo") {
        const briefingId = await createBriefing({
          userId: user.uid,
          nicho: formData.categoria,
          subcategoria: formData.subcategoria,
          ticketMedio: formData.ticketMedio,
          cep: formData.cep,
          coordenadas: formData.coordenadas || { lat: 0, lng: 0 },
          raio: formData.raio,
          dor: formData.dor,
          diferencial: formData.diferencial,
          estagio: formData.estagio,
          plano: "completo",
        });

        const createCheckout = httpsCallable(functions, "createStripeCheckout");
        const result = await createCheckout({
          briefingId,
          plano: "completo",
          userId: user.uid,
        });

        const { url } = result.data as { url: string };

        if (url) {
          window.location.href = url;
        } else {
          setError("Erro ao iniciar pagamento. Tente novamente.");
        }
      } else {
        const briefingId = await createBriefing({
          userId: user.uid,
          nicho: formData.categoria,
          subcategoria: formData.subcategoria,
          ticketMedio: formData.ticketMedio,
          cep: formData.cep,
          coordenadas: formData.coordenadas || { lat: 0, lng: 0 },
          raio: formData.raio,
          dor: formData.dor,
          diferencial: formData.diferencial,
          estagio: formData.estagio,
          plano: "basico",
        });

        router.push(`/resultado?id=${briefingId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card padding="lg">
      <h2 className="text-xl font-bold text-gray-900">Resumo do Briefing</h2>
      <p className="mt-1 text-sm text-gray-500">Confira os dados antes de gerar o relatório.</p>

      <div className="mt-8 space-y-6">
        {[
          ["Nicho", `${CATEGORIA_LABELS[formData.categoria] || formData.categoria} — ${formData.subcategoria}`],
          ["Ticket Médio", `R$ ${formData.ticketMedio.toLocaleString("pt-BR")}`],
          ["Localização", `${formData.endereco || "—"} (CEP ${formData.cep})`],
          ["Raio de Análise", `${formData.raio}m`],
          ["Principal Dor", formData.dor || "—"],
          ["Diferencial", formData.diferencial || "Não informado"],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-medium text-gray-900 max-w-[60%] text-right">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <label className="mb-3 block text-sm font-medium text-gray-700">Plano</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {PLANOS.map((plan) => (
            <button
              key={plan.value}
              type="button"
              onClick={() => updateField("plano", plan.value)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                formData.plano === plan.value
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">{plan.label}</span>
                <span className="text-sm font-bold text-gray-900">{plan.price}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{plan.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={onBack}>&larr; Voltar</Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {formData.plano === "completo" ? "Redirecionando..." : "Gerando..."}
            </span>
          ) : formData.plano === "completo" ? (
            "Pagar R$ 75"
          ) : (
            "Gerar Relatório Grátis"
          )}
        </Button>
      </div>
    </Card>
  );
}
