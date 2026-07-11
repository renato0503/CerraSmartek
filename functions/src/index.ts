import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";

admin.initializeApp();

export { onDocumentCreated } from "firebase-functions/v2/firestore";
export { onCall } from "firebase-functions/v2/https";
export { onRequest } from "firebase-functions/v2/https";

export { triggerReport } from "./triggerReport";
export { aiReportWriter } from "./aiReportWriter";
export { pdfGenerator } from "./pdfGenerator";
export { createStripeCheckout } from "./createStripeCheckout";
export { stripeWebhook } from "./stripeWebhook";

export const searchPlaces = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const { coordenadas, raio, nicho } = request.data;
    const { placesWorker } = await import("./workers/placesWorker");
    const concorrentes = await placesWorker({ coordenadas, raio, nicho });
    return { concorrentes };
  }
);

export const getDemographicData = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const { cep, raio } = request.data;
    const { ibgeWorker } = await import("./workers/ibgeWorker");
    const demografia = await ibgeWorker({ cep, raio });
    return { demografia };
  }
);

export const generateFreeReport = onCall(
  { region: "southamerica-east1", cors: true },
  async (request) => {
    const { cep, nicho, raio = 1000 } = request.data;

    if (!cep || !nicho) {
      throw new Error("CEP e nicho são obrigatórios");
    }

    const { geocodeCep } = await import("./utils/geocoding");
    const { placesWorker } = await import("./workers/placesWorker");

    const coordenadas = await geocodeCep(cep);

    const concorrentes = await placesWorker({
      coordenadas: { lat: coordenadas.lat, lng: coordenadas.lng },
      raio,
      nicho,
    });

    const briefingRef = await admin.firestore().collection("briefings").add({
      cep,
      nicho,
      coordenadas: { lat: coordenadas.lat, lng: coordenadas.lng },
      endereco: coordenadas.endereco,
      raio,
      subcategoria: nicho,
      ticketMedio: 0,
      dor: "",
      diferencial: "",
      estagio: "validar",
      plano: "basico",
      status: "concluido",
      concorrentes,
      userId: request.auth?.uid || "anon",
      origem: "landing_page",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      concorrentes,
      briefingId: briefingRef.id,
      endereco: coordenadas.endereco,
      coordenadas: { lat: coordenadas.lat, lng: coordenadas.lng },
    };
  }
);

export const getReportStatus = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const { briefingId } = request.data;
    if (!briefingId) throw new Error("briefingId obrigatório");

    const doc = await admin.firestore().collection("briefings").doc(briefingId).get();
    if (!doc.exists) throw new Error("Briefing não encontrado");

    const data = doc.data();
    return {
      status: data?.status || "erro",
      concorrentes: data?.concorrentes || [],
      endereco: data?.endereco || "",
      pdfUrl: data?.pdfUrl || null,
      aiReport: data?.aiReport || null,
    };
  }
);
