import * as admin from "firebase-admin";

const db = admin.firestore();

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

export async function withRetry<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      console.warn(
        `[Retry] ${context} - tentativa ${attempt}/${MAX_RETRIES}: ${lastError.message}`
      );

      if (attempt === MAX_RETRIES) break;

      const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Todas as tentativas falharam");
}

export async function moveToDeadLetter(
  collection: string,
  docId: string,
  data: Record<string, unknown>,
  error: Error
) {
  await db
    .collection("failedJobs")
    .doc(`${collection}_${docId}_${Date.now()}`)
    .set({
      originalCollection: collection,
      originalDocId: docId,
      data,
      error: error.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      retryCount: (data._retryCount as number) || 0,
    });
}

export async function notifyAdminError(context: string, error: Error) {
  console.error(`[CRITICAL] ${context}:`, error.message);
}
