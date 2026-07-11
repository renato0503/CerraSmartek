"use client";

import { useState, useEffect, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("pwa_dismissed");
    if (stored) return;

    const handler = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setVisible(false));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible) return null;

  const install = async () => {
    if (!promptRef.current) return;
    await promptRef.current.prompt();
    const { outcome } = await promptRef.current.userChoice;
    setVisible(false);
    if (outcome === "dismissed") {
      localStorage.setItem("pwa_dismissed", "1");
    }
  };

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-xl sm:inset-x-auto sm:right-4 sm:w-80">
      <button onClick={() => { setVisible(false); localStorage.setItem("pwa_dismissed", "1"); }}
        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">&times;</button>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Instalar App</p>
          <p className="mt-0.5 text-xs text-gray-500">Adicione à tela inicial para acesso rápido.</p>
          <button onClick={install}
            className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}
