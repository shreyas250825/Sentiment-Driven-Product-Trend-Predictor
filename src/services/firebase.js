// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "AIzaSyCaGy3xpzASecXKdqSNou-y3WKt38TEdSE",
  authDomain: "sentiment-trend-predictor.firebaseapp.com",
  projectId: "sentiment-trend-predictor",
  storageBucket: "sentiment-trend-predictor.appspot.com",
  messagingSenderId: "870762352797",
  appId: "1:870762352797:web:771bec3713a4db5ce08474",
  measurementId: "G-BNTTQZXJF3"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);   // <-- Firestore instance

export { auth, db };  // <-- Now you can import db in App.js
export default app;
