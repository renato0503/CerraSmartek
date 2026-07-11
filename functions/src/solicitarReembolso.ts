import { onCall } from "firebase-functions/v2/https";
import Stripe from "stripe";
import * as admin from "firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-06-30.acacia" as Stripe.LatestApiVersion,
});

const db = admin.firestore();

interface ReembolsoRequest {
  briefingId: string;
  motivo?: string;
  userId: string;
}

export const solicitarReembolso = onCall<ReembolsoRequest>(
  { region: "southamerica-east1", cors: true },
  async (request) => {
    const { briefingId, motivo, userId } = request.data;

    if (!briefingId || !userId) {
      throw new Error("briefingId e userId são obrigatórios");
    }

    const briefingDoc = await db.collection("briefings").doc(briefingId).get();
    if (!briefingDoc.exists) throw new Error("Relatório não encontrado");

    const briefing = briefingDoc.data();
    if (!briefing) throw new Error("Dados do briefing inválidos");

    if (briefing.status !== "concluido") {
      throw new Error("O relatório ainda não foi concluído ou já foi reembolsado");
    }

    const completedAt = briefing.completedAt?.toDate?.();
    if (completedAt) {
      const daysSinceCompletion =
        (Date.now() - completedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCompletion > 7) {
        throw new Error("Período de 7 dias para reembolso expirou");
      }
    }

    try {
      const paymentIntents = await stripe.paymentIntents.list({
        limit: 1,
      });

      const paymentIntent = paymentIntents.data.find((pi) =>
        pi.metadata?.briefingId === briefingId
      );

      if (!paymentIntent) {
        await briefingDoc.ref.update({
          status: "reembolsado",
          motivoReembolso: motivo || "Não informado",
          reembolsadoEm: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await db.collection("users").doc(userId).update({
          creditos: admin.firestore.FieldValue.increment(3),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { success: true, message: "Créditos devolvidos com sucesso" };
      }

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntent.id,
        reason: "requested_by_customer" as Stripe.RefundCreateParams.Reason,
      });

      await briefingDoc.ref.update({
        status: "reembolsado",
        motivoReembolso: motivo || "Não informado",
        stripeRefundId: refund.id,
        reembolsadoEm: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await db.collection("users").doc(userId).update({
        creditos: admin.firestore.FieldValue.increment(3),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: "Reembolso processado com sucesso", refundId: refund.id };
    } catch (error) {
      console.error("Erro no reembolso:", error);
      throw new Error("Falha ao processar reembolso. Entre em contato com suporte.");
    }
  }
);
