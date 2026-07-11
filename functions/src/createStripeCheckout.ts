import { onCall } from "firebase-functions/v2/https";

const BASE_URL = process.env.BASE_URL || "https://prevoya.web.app";

function getStripe() {
  const Stripe = require("stripe");
  return new Stripe(process.env.STRIPE_SECRET_KEY || "");
}

const PRICES: Record<string, { amount: number; label: string; credits: number }> = {
  basico: { amount: 2500, label: "Análise Básica", credits: 1 },
  completo: { amount: 7500, label: "Análise Completa", credits: 3 },
  pro: { amount: 20000, label: "Plano Pro (10/mês)", credits: 10 },
};

export const createStripeCheckout = onCall<
  { briefingId: string; plano: string; userId: string },
  Promise<{ url: string | null }>
>(
  { region: "southamerica-east1", cors: true },
  async (request) => {
    const { briefingId, plano, userId } = request.data;

    if (!briefingId || !plano || !userId) {
      throw new Error("briefingId, plano e userId são obrigatórios");
    }

    const price = PRICES[plano];
    if (!price) throw new Error(`Plano inválido: ${plano}`);

    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: { name: price.label },
              unit_amount: price.amount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${BASE_URL}/processando?id=${briefingId}`,
        cancel_url: `${BASE_URL}/wizard`,
        metadata: { briefingId, userId, credits: String(price.credits) },
      });

      return { url: session.url };
    } catch (error) {
      console.error("Erro ao criar checkout Stripe:", error);
      throw new Error("Falha ao criar sessão de pagamento");
    }
  }
);
