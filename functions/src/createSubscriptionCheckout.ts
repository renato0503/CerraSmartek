import { onCall } from "firebase-functions/v2/https";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-06-30.acacia" as Stripe.LatestApiVersion,
});

const BASE_URL = process.env.BASE_URL || "https://prevoya.web.app";

export const createSubscriptionCheckout = onCall(
  { region: "southamerica-east1", cors: true },
  async (request) => {
    const { plano, userId, email } = request.data;

    const PRICE_IDS: Record<string, string> = {
      growth: process.env.STRIPE_PRICE_GROWTH || "",
      scale: process.env.STRIPE_PRICE_SCALE || "",
    };

    const priceId = PRICE_IDS[plano];
    if (!priceId) throw new Error(`Plano inválido: ${plano}`);

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: email,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${BASE_URL}/dashboard?subscription=success`,
        cancel_url: `${BASE_URL}/#planos`,
        metadata: { userId, plano },
      });

      return { url: session.url };
    } catch (error) {
      console.error("Erro ao criar subscription:", error);
      throw new Error("Falha ao criar assinatura");
    }
  }
);
