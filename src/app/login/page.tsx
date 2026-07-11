"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";

function LoginContent() {
  const { user, loading, signInGoogle, signInEmail, signUpEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [tab, setTab] = useState<"login" | "cadastro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.push(redirect);
  }, [user, router, redirect]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Preencha todos os campos"); return; }
    if (password.length < 6) { setError("Senha deve ter pelo menos 6 caracteres"); return; }

    setSubmitting(true);
    try {
      if (tab === "login") {
        await signInEmail(email, password);
      } else {
        await signUpEmail(email, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro";
      if (msg.includes("invalid-credential") || msg.includes("wrong-password")) setError("E-mail ou senha inválidos");
      else if (msg.includes("email-already-in-use")) setError("Este e-mail já está cadastrado");
      else if (msg.includes("invalid-email")) setError("E-mail inválido");
      else if (msg.includes("weak-password")) setError("Senha muito fraca (mínimo 6 caracteres)");
      else setError("Erro ao processar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center">
            <Image src="/images/prevoya_logo.png" alt="Prévoya" width={160} height={40} className="mx-auto h-10 w-auto" />
            <h1 className="mt-6 text-2xl font-bold text-gray-900">Bem-vindo à Prévoya</h1>
            <p className="mt-2 text-sm text-gray-500">Entre ou crie sua conta gratuita</p>
          </div>

          <div className="mt-8 flex rounded-xl bg-gray-100 p-1">
            {(["login", "cadastro"] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {t === "login" ? "Entrar" : "Criar Conta"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com" autoComplete="email"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" autoComplete={tab === "login" ? "current-password" : "new-password"}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <Button type="submit" size="lg" disabled={submitting} className="w-full">
              {submitting ? (
                <span className="flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{tab === "login" ? "Entrando..." : "Criando..."}</span>
              ) : tab === "login" ? "Entrar" : "Criar Conta"}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400">ou</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <div className="mt-6">
            <Button variant="outline" size="lg" className="w-full" onClick={signInGoogle}>
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuar com Google
            </Button>
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            Ao continuar, você concorda com os Termos de Uso e Política de Privacidade.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
