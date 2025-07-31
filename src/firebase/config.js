// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration object
// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-auth-domain-here",
  projectId: "your-project-id-here", 
  storageBucket: "your-storage-bucket-here",
  messagingSenderId: "your-messaging-sender-id-here",
  appId: "your-app-id-here"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;