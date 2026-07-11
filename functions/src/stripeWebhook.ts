import { onRequest } from "firebase-functions/v2/https";
import Stripe from "stripe";
import * as admin from "firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-06-30.acacia" as Stripe.LatestApiVersion,
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export const stripeWebhook = onRequest(
  { region: "southamerica-east1" },
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;

    if (!sig) {
      res.status(400).send("Missing stripe-signature header");
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, WEBHOOK_SECRET);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      res.status(400).send("Webhook signature verification failed");
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { briefingId, userId, credits } = session.metadata || {};

      if (briefingId) {
        await admin
          .firestore()
          .collection("briefings")
          .doc(briefingId)
          .update({
            status: "pagamento_confirmado",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        if (userId && credits) {
          await admin
            .firestore()
            .collection("users")
            .doc(userId)
            .update({
              creditos: admin.firestore.FieldValue.increment(-Number(credits)),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
      }
    }

    res.json({ received: true });
  }
);
