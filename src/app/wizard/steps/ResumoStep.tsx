"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  alimentacao: "Alimentação",
  varejo: "Varejo",
  servicos: "Serviços",
  saude: "Saúde",
  beleza: "Beleza e Estética",
  educacao: "Educação",
  fitness: "Fitness e Esportes",
  automotivo: "Automotivo",
  pets: "Pets",
  construcao: "Construção e Decoração",
  tecnologia: "Tecnologia",
  outros: "Outros",
};

const PLANO_LABELS: Record<string, string> = {
  gratuito: "Grátis (1 página)",
  completo: "Completo (R$ 75)",
  pro: "Pro (R$ 200/mês)",
};

export default function ResumoStep({
  formData,
  updateField,
  onBack,
  onSubmit,
}: StepProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit();
    setSubmitting(false);
    router.push("/dashboard");
  };

  return (
    <Card padding="lg">
      <h2 className="text-xl font-bold text-gray-900">
        Revise os dados do briefing
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Confira se tudo est&aacute; correto antes de gerar o relat&oacute;rio.
      </p>

      <div className="mt-8 space-y-6">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-700">Nicho de Mercado</h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-500">Categoria:</span>
            <span className="font-medium text-gray-900">
              {CATEGORIA_LABELS[formData.categoria] || formData.categoria}
            </span>
            <span className="text-gray-500">Subcategoria:</span>
            <span className="font-medium text-gray-900">
              {formData.subcategoria}
            </span>
            <span className="text-gray-500">Ticket Médio:</span>
            <span className="font-medium text-gray-900">
              R$ {formData.ticketMedio.toLocaleString("pt-BR")}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-700">Localização</h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-500">CEP:</span>
            <span className="font-medium text-gray-900">{formData.cep}</span>
            <span className="text-gray-500">Endereço:</span>
            <span className="font-medium text-gray-900">
              {formData.endereco || "—"}
            </span>
            <span className="text-gray-500">Raio:</span>
            <span className="font-medium text-gray-900">{formData.raio}m</span>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-700">Contexto do Negócio</h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-500">Principal dor:</span>
            <span className="font-medium text-gray-900">
              {formData.dor || "—"}
            </span>
            <span className="text-gray-500">Diferencial:</span>
            <span className="font-medium text-gray-900">
              {formData.diferencial || "—"}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Plano
          </label>
          <div className="flex gap-2">
            {[
              { value: "gratuito", label: "Grátis" },
              { value: "completo", label: "Completo" },
            ].map((plan) => (
              <button
                key={plan.value}
                type="button"
                onClick={() => updateField("plano", plan.value)}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                  formData.plano === plan.value
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div>{plan.label}</div>
                <div className="mt-0.5 text-xs opacity-70">
                  {PLANO_LABELS[plan.value]}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          &larr; Voltar
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Salvando...
            </span>
          ) : (
            "Gerar Relatório"
          )}
        </Button>
      </div>
    </Card>
  );
}
