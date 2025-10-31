// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBTNeRuUkjnS6crmNdqpvw2BOigtoMA3qw",
  authDomain: "eco-matrix-7101f.firebaseapp.com",
  projectId: "eco-matrix-7101f",
  storageBucket: "eco-matrix-7101f.firebasestorage.app",
  messagingSenderId: "47977418993",
  appId: "1:47977418993:web:99a81c0e1eb6ae7cd41950",
  measurementId: "G-JN1BYGRTFE",
};

const app = initializeApp(firebaseConfig);

// Optional: Enable analytics only if supported (avoids SSR errors)
isSupported().then((yes) => yes && getAnalytics(app));

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
