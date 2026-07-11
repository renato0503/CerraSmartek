"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { WizardFormData } from "@/components/wizard/WizardContainer";

interface StepProps {
  formData: WizardFormData;
  updateField: (field: keyof WizardFormData, value: unknown) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const CATEGORIAS = [
  { value: "", label: "Selecione uma categoria..." },
  { value: "alimentacao", label: "Alimentação" },
  { value: "varejo", label: "Varejo" },
  { value: "servicos", label: "Serviços" },
  { value: "saude", label: "Saúde" },
  { value: "beleza", label: "Beleza e Estética" },
  { value: "educacao", label: "Educação" },
  { value: "fitness", label: "Fitness e Esportes" },
  { value: "automotivo", label: "Automotivo" },
  { value: "pets", label: "Pets" },
  { value: "construcao", label: "Construção e Decoração" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "outros", label: "Outros" },
];

export default function NichoForm({ formData, updateField, onNext, isFirst }: StepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.categoria) newErrors.categoria = "Selecione uma categoria";
    if (!formData.subcategoria.trim()) newErrors.subcategoria = "Informe a subcategoria";
    if (!formData.ticketMedio || formData.ticketMedio <= 0)
      newErrors.ticketMedio = "Informe um valor maior que zero";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <Card padding="lg">
      <h2 className="text-xl font-bold text-gray-900">Qual &eacute; o seu nicho de mercado?</h2>
      <p className="mt-1 text-sm text-gray-500">
        Quanto mais espec&iacute;fico, mais precisa ser&aacute; a an&aacute;lise de concorr&ecirc;ncia.
      </p>

      <div className="mt-8 space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Categoria
          </label>
          <select
            value={formData.categoria}
            onChange={(e) => updateField("categoria", e.target.value)}
            className={`w-full rounded-lg border ${
              errors.categoria ? "border-red-500" : "border-gray-300"
            } px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          >
            {CATEGORIAS.map((cat) => (
              <option key={cat.value} value={cat.value} disabled={cat.value === ""}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.categoria && (
            <p className="mt-1 text-sm text-red-600">{errors.categoria}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Subcategoria
          </label>
          <input
            type="text"
            value={formData.subcategoria}
            onChange={(e) => updateField("subcategoria", e.target.value)}
            placeholder="Ex: Hamburgueria, Pet Shop, Barbearia..."
            className={`w-full rounded-lg border ${
              errors.subcategoria ? "border-red-500" : "border-gray-300"
            } px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
          {errors.subcategoria && (
            <p className="mt-1 text-sm text-red-600">{errors.subcategoria}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Ticket M&eacute;dio (R$)
          </label>
          <input
            type="number"
            value={formData.ticketMedio || ""}
            onChange={(e) => updateField("ticketMedio", Number(e.target.value))}
            placeholder="Valor médio gasto por cliente"
            min={0}
            step={1}
            className={`w-full rounded-lg border ${
              errors.ticketMedio ? "border-red-500" : "border-gray-300"
            } px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
          {errors.ticketMedio && (
            <p className="mt-1 text-sm text-red-600">{errors.ticketMedio}</p>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={undefined} disabled className="invisible">
          Voltar
        </Button>
        <Button onClick={handleNext}>Pr&oacute;ximo &rarr;</Button>
      </div>
    </Card>
  );
}
