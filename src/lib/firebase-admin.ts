import 'server-only';
import { getFirestore } from 'firebase-admin/firestore';
import { cert, getApps, initializeApp } from 'firebase-admin/app';

const projectId = process.env.AUTH_FIREBASE_PROJECT_ID;
const clientEmail = process.env.AUTH_FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.AUTH_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId) {
  throw new Error('Please define AUTH_FIREBASE_PROJECT_ID inside .env.local');
}

if (!process.env.FIRESTORE_EMULATOR_HOST && (!clientEmail || !privateKey)) {
  throw new Error('Please define AUTH_FIREBASE_CLIENT_EMAIL and AUTH_FIREBASE_PRIVATE_KEY inside .env.local');
}

const app = getApps()[0] ?? initializeApp(
  process.env.FIRESTORE_EMULATOR_HOST
    ? { projectId }
    : {
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    }
);

export const firestore = getFirestore(app);
