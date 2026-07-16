import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const metaEnv = (import.meta as any).env || {};

// Safe, fallback configuration for Firebase
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "mock-api-key-only-for-local",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "algeria-firewatch.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "algeria-firewatch",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "algeria-firewatch.appspot.com",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:1234567890:web:1234567890"
};

// Check if Firebase is fully configured with a non-placeholder api key
export const isFirebaseConfigured = 
  metaEnv.VITE_FIREBASE_API_KEY && 
  metaEnv.VITE_FIREBASE_API_KEY !== "mock-api-key-only-for-local";

let app;
let auth: any = null;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("[Firebase] Successfully initialized real client SDK.");
  } catch (error) {
    console.error("[Firebase] Initialization failed. Falling back to local mock client.", error);
  }
} else {
  console.log("[Firebase] Real configuration missing. Using client-side simulation for sandbox preview.");
}

export { auth, db };
