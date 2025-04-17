// src/lib/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC6rqLWzwcyg9tLLJxNHANzjiamTp1AV7k",
  authDomain: "teacherscores.firebaseapp.com",
  projectId: "teacherscores",
  storageBucket: "teacherscores.firebasestorage.app",
  messagingSenderId: "466712650395",
  appId: "1:466712650395:web:73eba71f5c6fcaacb15c3e",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
