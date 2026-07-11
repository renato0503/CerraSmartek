import * as admin from "firebase-admin";

const db = admin.firestore();

const RATE_LIMITS = {
  reportsPerHour: 5,
  freeReportsPerDay: 3,
};

export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  message?: string;
  remaining: number;
}> {
  const now = admin.firestore.Timestamp.now();
  const oneHourAgo = new admin.firestore.Timestamp(
    now.seconds - 3600,
    now.nanoseconds
  );

  const rateRef = db.collection("rateLimits").doc(userId);

  const recentDocs = await db
    .collection("rateLimits")
    .doc(userId)
    .collection("requests")
    .where("timestamp", ">=", oneHourAgo)
    .count()
    .get();

  const currentCount = recentDocs.data().count;

  if (currentCount >= RATE_LIMITS.reportsPerHour) {
    return {
      allowed: false,
      message: `Limite de ${RATE_LIMITS.reportsPerHour} relatórios/hora atingido. Aguarde.`,
      remaining: 0,
    };
  }

  await rateRef.collection("requests").add({
    timestamp: now,
  });

  return {
    allowed: true,
    remaining: RATE_LIMITS.reportsPerHour - currentCount - 1,
  };
}

export async function checkFreeLimit(ip: string): Promise<boolean> {
  const now = admin.firestore.Timestamp.now();
  const oneDayAgo = new admin.firestore.Timestamp(
    now.seconds - 86400,
    now.nanoseconds
  );

  const recentFreeDocs = await db
    .collection("rateLimits")
    .doc(`ip_${ip}`)
    .collection("freeRequests")
    .where("timestamp", ">=", oneDayAgo)
    .count()
    .get();

  const currentCount = recentFreeDocs.data().count;

  if (currentCount >= RATE_LIMITS.freeReportsPerDay) {
    return false;
  }

  await db
    .collection("rateLimits")
    .doc(`ip_${ip}`)
    .collection("freeRequests")
    .add({ timestamp: now });

  return true;
}
