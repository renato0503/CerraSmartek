import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

interface TriggerReportParams {
  briefingId: string;
}

export async function triggerReport(params: TriggerReportParams) {
  const triggerReportFn = httpsCallable<TriggerReportParams, { status: string }>(
    functions,
    "triggerReport"
  );
  const result = await triggerReportFn(params);
  return result.data;
}

export async function generateFreeReport(params: { cep: string; nicho: string }) {
  const generateFn = httpsCallable<{ cep: string; nicho: string }, unknown>(
    functions,
    "generateFreeReport"
  );
  const result = await generateFn(params);
  return result.data;
}

export async function getReportStatus(briefingId: string) {
  const getStatusFn = httpsCallable<{ briefingId: string }, unknown>(
    functions,
    "getReportStatus"
  );
  const result = await getStatusFn({ briefingId });
  return result.data;
}
