import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBDt-tLCeI_-sUWfvFQc4pQ4tFTJ3-EEH0",
  authDomain: "atmava-82f85.firebaseapp.com",
  projectId: "atmava-82f85",
  storageBucket: "atmava-82f85.firebasestorage.app",
  messagingSenderId: "95065129414",
  appId: "1:95065129414:web:75c591b2479ed30dedf2c7",
  measurementId: "G-9SV4BSZXYT",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
