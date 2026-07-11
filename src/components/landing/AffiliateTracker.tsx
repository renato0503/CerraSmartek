"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AffiliateTracker() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  useEffect(() => {
    if (!ref) return;

    const stored = localStorage.getItem("prevoya_affiliate");
    if (stored) return;

    localStorage.setItem("prevoya_affiliate", ref);
    localStorage.setItem("prevoya_affiliate_ts", String(Date.now()));

    setDoc(
      doc(db, "affiliates", `click_${Date.now()}_${ref}`),
      {
        affiliateId: ref,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
      },
      { merge: true }
    ).catch(() => {});
  }, [ref]);

  return null;
}
