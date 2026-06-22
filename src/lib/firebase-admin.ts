import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const rawKey = process.env.FIREBASE_PRIVATE_KEY ?? '';

const privateKey = rawKey
  .replace(/^"+|"+$/g, '')  // strip wrapping quotes if any
  .replace(/\\n/g, '\n');   // convert escaped newlines

const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });

export const adminDb = getFirestore(adminApp);