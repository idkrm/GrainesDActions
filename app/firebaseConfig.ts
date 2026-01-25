// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBiNzSslt9n2FwRaDzOcHl6hZxWHV9vyYY",
  authDomain: "graines-d-actions-but3.firebaseapp.com",
  projectId: "graines-d-actions-but3",
  storageBucket: "graines-d-actions-but3.firebasestorage.app",
  messagingSenderId: "289602420144",
  appId: "1:289602420144:web:2da39e3dfacafb2829aa75"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getFirestore(app);