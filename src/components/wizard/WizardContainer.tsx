"use client";

import { useReducer, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { createBriefing } from "@/lib/firestore";
import type { Coordinates } from "@/types/briefing";
import NichoForm from "@/app/wizard/steps/NichoForm";
import LocalizacaoForm from "@/app/wizard/steps/LocalizacaoForm";
import AnaliseForm from "@/app/wizard/steps/AnaliseForm";
import ResumoStep from "@/app/wizard/steps/ResumoStep";
import StepIndicator from "@/components/wizard/StepIndicator";

export interface WizardFormData {
  categoria: string;
  subcategoria: string;
  ticketMedio: number;
  cep: string;
  coordenadas: Coordinates | null;
  endereco: string;
  raio: number;
  dor: string;
  diferencial: string;
  estagio: string;
  plano: "gratuito" | "completo" | "pro";
}

type WizardAction =
  | { type: "SET_FIELD"; field: keyof WizardFormData; value: unknown }
  | { type: "SET_STEP"; step: number }
  | { type: "RESET" };

const initialState: WizardFormData = {
  categoria: "",
  subcategoria: "",
  ticketMedio: 0,
  cep: "",
  coordenadas: null,
  endereco: "",
  raio: 1000,
  dor: "",
  diferencial: "",
  estagio: "",
  plano: "gratuito",
};

function wizardReducer(state: WizardFormData, action: WizardAction): WizardFormData {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_STEP":
      return state;
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const STEPS = [
  { id: "nicho", label: "Nicho" },
  { id: "localizacao", label: "Localização" },
  { id: "contexto", label: "Contexto" },
  { id: "resumo", label: "Resumo" },
];

export default function WizardContainer() {
  const { user } = useAuth();
  const [formData, dispatch] = useReducer(wizardReducer, initialState);
  const [currentStep, setCurrentStep] = useReducer(
    (_: number, action: number) => action,
    0
  );

  const updateField = useCallback(
    (field: keyof WizardFormData, value: unknown) => {
      dispatch({ type: "SET_FIELD", field, value });
    },
    []
  );

  const handleNext = useCallback(() => {
    setCurrentStep(Math.min(currentStep + 1, STEPS.length - 1));
  }, [currentStep]);

  const handleBack = useCallback(() => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    if (!user) return;

    try {
      await createBriefing({
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
        plano: formData.plano === "gratuito" ? "basico" : formData.plano,
      });

      handleNext();
    } catch (error) {
      console.error("Erro ao salvar briefing:", error);
      alert("Erro ao salvar. Tente novamente.");
    }
  }, [user, formData, handleNext]);

  const stepProps = {
    formData,
    updateField,
    onNext: handleNext,
    onBack: handleBack,
    onSubmit: handleSubmit,
    isFirst: currentStep === 0,
    isLast: currentStep === STEPS.length - 1,
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <StepIndicator steps={STEPS} current={currentStep} />

      <div className="mt-10">
        {currentStep === 0 && <NichoForm {...stepProps} />}
        {currentStep === 1 && <LocalizacaoForm {...stepProps} />}
        {currentStep === 2 && <AnaliseForm {...stepProps} />}
        {currentStep === 3 && <ResumoStep {...stepProps} />}
      </div>
    </div>
  );
}
