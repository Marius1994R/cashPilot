// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAkjFOtCOHhZxbB_D_5lLsxccDgEsZV5JQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cashpilot-2003e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cashpilot-2003e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cashpilot-2003e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "953051666821",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:953051666821:web:73107f4cee7df56c188cec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;