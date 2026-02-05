import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBZiAMJrhBrtlkokgJKCVKHICHzmtpdMek",
  authDomain: "self-statistics-system-v1.firebaseapp.com",
  projectId: "self-statistics-system-v1",
  storageBucket: "self-statistics-system-v1.firebasestorage.app",
  messagingSenderId: "601138758715",
  appId: "1:601138758715:web:2ffc0248482051777ac81e",
  measurementId: "G-37SVGE4F5F"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Optional: Force account selection every time
//googleProvider.setCustomParameters({ prompt: 'select_account' });
