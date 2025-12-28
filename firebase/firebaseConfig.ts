import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBiNzSslt9n2FwRaDzOcHl6hZxWHV9vyYY",
    authDomain: "graines-d-actions-but3.firebaseapp.com",
    projectId: "graines-d-actions-but3",
    storageBucket: "graines-d-actions-but3.firebasestorage.app",
    messagingSenderId: "289602420144",
    appId: "1:289602420144:web:2da39e3dfacafb2829aa75",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
