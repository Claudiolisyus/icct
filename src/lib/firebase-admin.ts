import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from './serviceAccountKey.json';

const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount as any),
    });

export const adminDb = getFirestore(adminApp);