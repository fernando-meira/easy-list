import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const clientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

let emulatorsConnected = false;

// Lazy initialization — avoids running initializeApp during SSR/prerendering
function getClientApp() {
  const app = getApps().length ? getApp() : initializeApp(clientConfig);

  if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true' && !emulatorsConnected) {
    emulatorsConnected = true;
    try {
      connectAuthEmulator(getAuth(app), 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(getFirestore(app), 'localhost', 8080);
    } catch {
      // Emulators already connected (HMR re-execution)
    }
  }

  return app;
}

export function getClientAuth() {
  return getAuth(getClientApp());
}

export function getClientDb() {
  return getFirestore(getClientApp());
}
