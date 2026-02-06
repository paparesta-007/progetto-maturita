// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore/lite";
import { getAuth } from "firebase/auth/web-extension";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCpoclR3tf09cVzBcgbJ-Vh1jPhb1I_L30",
  authDomain: "progetto-maturita-151f8.firebaseapp.com",
  projectId: "progetto-maturita-151f8",
  storageBucket: "progetto-maturita-151f8.firebasestorage.app",
  messagingSenderId: "600528754486",
  appId: "1:600528754486:web:f243864c90469c2ade8597",
  measurementId: "G-DQ8W6XNGQB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth=getAuth(app);
export const db=getFirestore(app);

export default app;
