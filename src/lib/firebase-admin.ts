import 'server-only';
import { getFirestore } from 'firebase-admin/firestore';
import { cert, getApps, initializeApp } from 'firebase-admin/app';

const projectId = process.env.AUTH_FIREBASE_PROJECT_ID ?? 'easy-list-local';
const clientEmail = process.env.AUTH_FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.AUTH_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const hasServiceAccount = Boolean(clientEmail && privateKey);

const app = getApps()[0] ?? initializeApp(
  hasServiceAccount
    ? {
      credential: cert({
        projectId,
        clientEmail: clientEmail!,
        privateKey: privateKey!,
      }),
    }
    : { projectId }
);

export const firestore = getFirestore(app);
