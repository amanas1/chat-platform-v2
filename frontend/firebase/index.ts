import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/**
 * FIREBASE CONFIGURATION
 * 
 * Replace the placeholders below with your actual configuration from
 * the Google Cloud Console / Firebase Console.
 * 
 * URL: https://console.firebase.google.com/
 */
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app: any;
let auth: any;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (e) {
  console.warn("Firebase failed to init:", e);
  auth = { onAuthStateChanged: () => () => {}, currentUser: null };
}

export { auth };
export default app;
