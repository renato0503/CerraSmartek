import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { BriefingData, BriefingStatus } from "@/types/briefing";
import { UserData } from "@/types/user";

export async function createUserProfile(
  uid: string,
  data: { email: string; nome: string; fotoUrl?: string }
) {
  const userRef = doc(db, "users", uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    await setDoc(userRef, {
      ...data,
      creditos: 1,
      role: "user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return userRef;
}

export async function getUserProfile(uid: string): Promise<UserData | null> {
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  return {
    uid: snapshot.id,
    email: data.email,
    nome: data.nome,
    fotoUrl: data.fotoUrl,
    creditos: data.creditos,
    role: data.role,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  };
}

export async function hasCredits(uid: string, amount: number): Promise<boolean> {
  const profile = await getUserProfile(uid);
  return profile ? profile.creditos >= amount : false;
}

export async function consumeCredits(uid: string, amount: number) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    creditos: (await getUserProfile(uid))!.creditos - amount,
    updatedAt: serverTimestamp(),
  });
}

export async function createBriefing(
  data: Omit<BriefingData, "id" | "status" | "createdAt" | "updatedAt">
): Promise<string> {
  const briefingsRef = collection(db, "briefings");
  const docRef = await addDoc(briefingsRef, {
    ...data,
    status: "rascunho" as BriefingStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateBriefingStatus(
  briefingId: string,
  status: BriefingStatus,
  extraData?: Record<string, unknown>
) {
  const briefingRef = doc(db, "briefings", briefingId);
  await updateDoc(briefingRef, {
    status,
    ...extraData,
    updatedAt: serverTimestamp(),
  });
}

export async function getBriefing(briefingId: string) {
  const briefingRef = doc(db, "briefings", briefingId);
  const snapshot = await getDoc(briefingRef);

  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
  } as BriefingData & { id: string };
}
