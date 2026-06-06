import 'server-only';

import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import { firestore } from './firebase-admin';

interface CreateVerificationRecordInput {
  email: string;
  code?: string;
  token?: string;
  expiresAt: Date;
}

interface VerificationRecord {
  id: string;
  email: string;
  code?: string;
  token?: string;
  expiresAt: Date;
  used: boolean;
  attempts: number;
}

const verificationCodesCollection = firestore.collection('verificationCodes');

function toVerificationRecord(
  id: string,
  data: FirebaseFirestore.DocumentData
): VerificationRecord {
  return {
    id,
    email: data.email,
    code: data.code,
    token: data.token,
    expiresAt: data.expiresAt instanceof Timestamp ? data.expiresAt.toDate() : data.expiresAt,
    used: Boolean(data.used),
    attempts: Number(data.attempts ?? 0),
  };
}

export async function countRecentVerificationAttempts(email: string, since: Date) {
  const snapshot = await verificationCodesCollection
    .where('email', '==', email)
    .where('createdAt', '>=', Timestamp.fromDate(since))
    .get();

  return snapshot.size;
}

export async function createVerificationRecord(input: CreateVerificationRecordInput) {
  const recordRef = verificationCodesCollection.doc();

  await recordRef.set({
    email: input.email,
    code: input.code ?? null,
    token: input.token ?? null,
    expiresAt: Timestamp.fromDate(input.expiresAt),
    createdAt: FieldValue.serverTimestamp(),
    used: false,
    attempts: 0,
  });

  return recordRef.id;
}

export async function deleteVerificationRecord(recordId: string) {
  await verificationCodesCollection.doc(recordId).delete();
}

export async function findVerificationRecordByCode(email: string, code: string) {
  const snapshot = await verificationCodesCollection
    .where('email', '==', email)
    .where('code', '==', code)
    .limit(1)
    .get();

  const doc = snapshot.docs[0];

  return doc ? toVerificationRecord(doc.id, doc.data()) : null;
}

export async function findVerificationRecordByToken(email: string, token: string) {
  const snapshot = await verificationCodesCollection
    .where('email', '==', email)
    .where('token', '==', token)
    .limit(1)
    .get();

  const doc = snapshot.docs[0];

  return doc ? toVerificationRecord(doc.id, doc.data()) : null;
}

export function isVerificationRecordUsable(record: VerificationRecord) {
  return !record.used && record.expiresAt > new Date() && record.attempts < 5;
}

export async function incrementVerificationAttempts(recordId: string) {
  await verificationCodesCollection.doc(recordId).update({
    attempts: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function markVerificationRecordUsed(recordId: string) {
  await verificationCodesCollection.doc(recordId).update({
    used: true,
    usedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}
