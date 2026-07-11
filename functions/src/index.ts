import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";

admin.initializeApp();

export const analyzeBairro = onCall(
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
  { region: "southamerica-east1", cors: true },
  async (request) => {
    const { briefingId } = request.data;
    if (!briefingId) throw new Error("briefingId obrigatório");

    const doc = await admin.firestore().collection("briefings").doc(briefingId).get();
    if (!doc.exists) throw new Error("Briefing não encontrado");

    const briefing = doc.data();
    return {
      status: briefing?.status || "erro",
      concorrentes: briefing?.concorrentes || [],
      endereco: briefing?.endereco || "",
      pdfUrl: briefing?.pdfUrl || null,
      aiReport: briefing?.aiReport || null,
    };
  }
);
