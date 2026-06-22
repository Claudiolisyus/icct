import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "studio-2059469557-de397",
  appId: "1:280067000835:web:213273423d75913df01c36",
  apiKey: "AIzaSyDyGJEYEvB96r6Glu6XCT36cthjd5KiiMQ",
  authDomain: "studio-2059469557-de397.firebaseapp.com",
  storageBucket: "studio-2059469557-de397.appspot.com",
  measurementId: "",
  messagingSenderId: "280067000835"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);