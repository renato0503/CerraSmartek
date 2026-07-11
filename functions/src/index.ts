import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import { onCall } from "firebase-functions/v2/https";

admin.initializeApp();

export const analyzeBairro = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const { cep, nicho, raio = 1000 } = data;

    if (!cep || !nicho) {
      throw new functions.https.HttpsError("invalid-argument", "CEP e nicho são obrigatórios");
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
      userId: context.auth?.uid || "anon",
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
  });

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
