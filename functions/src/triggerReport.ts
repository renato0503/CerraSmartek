import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { placesWorker } from "./workers/placesWorker";
import { ibgeWorker } from "./workers/ibgeWorker";
import { sentimentWorker } from "./workers/sentimentWorker";
import { checkCache, saveCache } from "./utils/cache";

const db = admin.firestore();

export const triggerReport = onDocumentCreated(
  { document: "briefings/{briefingId}", region: "southamerica-east1" },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const briefing = snapshot.data();
    if (!briefing || briefing.status !== "pagamento_confirmado") return;

    const briefingId = event.params.briefingId;

    await snapshot.ref.update({
      status: "processando",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      const coordenadas = briefing.coordenadas || { lat: 0, lng: 0 };
      const raio = briefing.raio || 1000;
      const nicho = briefing.nicho || briefing.subcategoria || "";

      const cacheKey = `${briefing.cep || ""}_${raio}_${nicho}`;
      const cached = await checkCache(cacheKey);

      let concorrentes;
      let demografia;

      if (cached) {
        concorrentes = cached.concorrentes;
        demografia = cached.demografia;
      } else {
        [concorrentes, demografia] = await Promise.all([
          placesWorker({ coordenadas, raio, nicho }),
          ibgeWorker({ cep: briefing.cep || "", raio }),
        ]);

        await saveCache(cacheKey, { concorrentes, demografia });
      }

      const sentimentos = await sentimentWorker(concorrentes);

      await snapshot.ref.update({
        concorrentes,
        demografia,
        sentimentos,
        status: "dados_coletados",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await db.collection("aiQueue").add({
        briefingId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro no pipeline:", error);
      await snapshot.ref.update({
        status: "erro",
        erro: error instanceof Error ? error.message : "Erro desconhecido",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
);
