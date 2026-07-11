import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { placesWorker } from "./workers/placesWorker";
import { geocodeCep } from "./utils/geocoding";

admin.initializeApp();

export { onDocumentCreated } from "firebase-functions/v2/firestore";
export { onCall } from "firebase-functions/v2/https";
export { onRequest } from "firebase-functions/v2/https";

export const searchPlaces = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const { coordenadas, raio, nicho } = request.data;
    const concorrentes = await placesWorker({ coordenadas, raio, nicho });
    return { concorrentes };
  }
);

export const getPlaceDetails = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    return { message: "getPlaceDetails - em breve" };
  }
);

export const getDemographicData = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    return { message: "getDemographicData - em breve" };
  }
);

export const triggerReport = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    return { status: "triggered" };
  }
);

export const generateFreeReport = onCall<
  { cep: string; nicho: string; raio?: number },
  Promise<{ concorrentes: unknown[]; briefingId: string; endereco: string; coordenadas: { lat: number; lng: number } }>
>(
  { region: "southamerica-east1", cors: true },
  async (request) => {
    const { cep, nicho, raio = 1000 } = request.data;

    if (!cep || !nicho) {
      throw new Error("CEP e nicho são obrigatórios");
    }

    const coordenadas = await geocodeCep(cep);

    const concorrentes = await placesWorker({
      coordenadas: { lat: coordenadas.lat, lng: coordenadas.lng },
      raio,
      nicho,
    });

    const briefingRef = await admin.firestore().collection("briefings").add({
      cep,
      nicho,
      coordenadas,
      raio,
      subcategoria: nicho,
      ticketMedio: 0,
      dor: "",
      diferencial: "",
      estagio: "validar",
      plano: "basico",
      status: "concluido",
      concorrentes,
      endereco: coordenadas.endereco,
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
    };
  }
);

export const createStripeCheckout = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    return { url: "" };
  }
);

export const stripeWebhook = onCall(
  { region: "southamerica-east1" },
  async () => {
    return { received: true };
  }
);
