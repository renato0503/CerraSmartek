import * as admin from "firebase-admin";

const CACHE_TTL_DAYS = 30;
const db = admin.firestore();

export async function checkCache(key: string) {
  const doc = await db.collection("cacheBairros").doc(key).get();
  if (!doc.exists) return null;

  const data = doc.data();
  if (!data) return null;

  const cacheAge = Date.now() - (data.dataCache?.toDate()?.getTime() || 0);
  const maxAge = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

  if (cacheAge < maxAge) {
    return { concorrentes: data.concorrentes, demografia: data.demografia };
  }

  return null;
}

export async function saveCache(
  key: string,
  data: { concorrentes?: unknown[]; demografia?: unknown }
) {
  await db.collection("cacheBairros").doc(key).set({
    ...data,
    dataCache: admin.firestore.FieldValue.serverTimestamp(),
  });
}
