"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const stored = localStorage.getItem("pwa_dismissed");
      if (!stored) setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setShowPrompt(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!showPrompt || dismissed) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa_dismissed", "1");
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-xl sm:left-auto sm:right-4 sm:w-80">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Instalar App</p>
          <p className="mt-0.5 text-xs text-gray-500">
            Adicione à tela inicial para acesso rápido.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstall}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
