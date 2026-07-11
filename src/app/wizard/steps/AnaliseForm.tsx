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

const ESTAGIOS = [
  { value: "", label: "Selecione o estágio..." },
  { value: "ideia", label: "Ainda é uma ideia" },
  { value: "abrir", label: "Quero abrir o negócio" },
  { value: "expandir", label: "Quero expandir" },
  { value: "validar", label: "Já tenho ponto, quero validar" },
];

export default function AnaliseForm({ formData, updateField, onNext, onBack }: StepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.dor.trim()) newErrors.dor = "Informe sua principal preocupação";
    if (!formData.estagio) newErrors.estagio = "Selecione o estágio do negócio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <Card padding="lg">
      <h2 className="text-xl font-bold text-gray-900">Conte sobre o seu neg&oacute;cio</h2>
      <p className="mt-1 text-sm text-gray-500">
        Essas informa&ccedil;&otilde;es ajudam a IA a gerar insights mais relevantes para voc&ecirc;.
      </p>

      <div className="mt-8 space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Est&aacute;gio do Neg&oacute;cio
          </label>
          <select
            value={formData.estagio}
            onChange={(e) => updateField("estagio", e.target.value)}
            className={`w-full rounded-lg border ${
              errors.estagio ? "border-red-500" : "border-gray-300"
            } px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          >
            {ESTAGIOS.map((est) => (
              <option key={est.value} value={est.value} disabled={est.value === ""}>
                {est.label}
              </option>
            ))}
          </select>
          {errors.estagio && (
            <p className="mt-1 text-sm text-red-600">{errors.estagio}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Principal Medo/Dor
          </label>
          <textarea
            rows={3}
            value={formData.dor}
            onChange={(e) => updateField("dor", e.target.value)}
            placeholder="Ex: Tenho medo de não ter movimento suficiente na região, ou de que já existam muitos concorrentes..."
            className={`w-full rounded-lg border ${
              errors.dor ? "border-red-500" : "border-gray-300"
            } px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
          {errors.dor && (
            <p className="mt-1 text-sm text-red-600">{errors.dor}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Diferencial Competitivo{" "}
            <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <textarea
            rows={2}
            value={formData.diferencial}
            onChange={(e) => updateField("diferencial", e.target.value)}
            placeholder="O que vai te diferenciar da concorrência?"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          &larr; Voltar
        </Button>
        <Button onClick={handleNext}>Pr&oacute;ximo &rarr;</Button>
      </div>
    </Card>
  );
}
