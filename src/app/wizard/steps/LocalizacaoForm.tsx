"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import MapPicker from "@/components/ui/MapPicker";
import Input from "@/components/ui/Input";
import type { WizardFormData } from "@/components/wizard/WizardContainer";

interface StepProps {
  formData: WizardFormData;
  updateField: (field: keyof WizardFormData, value: unknown) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const RAIO_OPTIONS = [
  { value: 500, label: "500m" },
  { value: 1000, label: "1km" },
  { value: 2000, label: "2km" },
  { value: 3000, label: "3km" },
];

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
}

export default function LocalizacaoForm({
  formData,
  updateField,
  onNext,
  onBack,
}: StepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCep, setLoadingCep] = useState(false);

  const handleCepBlur = async () => {
    const cepLimpo = formData.cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();

      if (!data.erro) {
        const endereco = `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`;
        updateField("endereco", endereco);
      }
    } catch {
      // silencioso
    } finally {
      setLoadingCep(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const cepLimpo = formData.cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) newErrors.cep = "CEP inválido (8 dígitos)";
    if (!formData.coordenadas) newErrors.coordenadas = "Clique no mapa para marcar o ponto";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <Card padding="lg">
      <h2 className="text-xl font-bold text-gray-900">Onde fica o ponto comercial?</h2>
      <p className="mt-1 text-sm text-gray-500">
        Informe o CEP e clique no mapa para marcar a localiza&ccedil;&atilde;o exata.
      </p>

      <div className="mt-8 space-y-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="CEP"
              value={formData.cep}
              onChange={(e) => updateField("cep", formatCep(e.target.value))}
              onBlur={handleCepBlur}
              placeholder="00000-000"
              maxLength={9}
              error={errors.cep}
            />
          </div>
          {loadingCep && (
            <div className="flex items-end pb-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          )}
        </div>
        {formData.endereco && (
          <p className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
            {formData.endereco}
          </p>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Marque o ponto no mapa
          </label>
          <MapPicker
            onLocationSelect={(coords) => {
              updateField("coordenadas", coords);
            }}
            selectedPosition={
              formData.coordenadas
                ? [formData.coordenadas.lat, formData.coordenadas.lng]
                : null
            }
          />
          {errors.coordenadas && (
            <p className="mt-1 text-sm text-red-600">{errors.coordenadas}</p>
          )}
          {formData.coordenadas && (
            <p className="mt-2 text-sm text-gray-500">
              Coordenadas: {formData.coordenadas.lat.toFixed(6)},{" "}
              {formData.coordenadas.lng.toFixed(6)}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Raio de An&aacute;lise: {formData.raio}m
          </label>
          <div className="flex gap-2">
            {RAIO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField("raio", opt.value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  formData.raio === opt.value
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={500}
            max={3000}
            step={500}
            value={formData.raio}
            onChange={(e) => updateField("raio", Number(e.target.value))}
            className="mt-3 w-full accent-blue-600"
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
