"use client";

import dynamic from "next/dynamic";

const WizardContent = dynamic(
  () => import("@/components/wizard/WizardContainer"),
  { ssr: false }
);

import AuthGuard from "@/components/layout/AuthGuard";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function WizardPage() {
  return (
    <AuthGuard>
      <Header />
      <main className="flex-1">
        <WizardContent />
      </main>
      <Footer />
    </AuthGuard>
  );
}
