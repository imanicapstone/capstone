import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCoJLseuy4VCxNIk5FYLZ32aIZ95DVN4vI",
  authDomain: "fina-42ef2.firebaseapp.com",
  projectId: "fina-42ef2",
  storageBucket: "fina-42ef2.firebasestorage.app",
  messagingSenderId: "335183941120",
  appId: "1:335183941120:web:531c56a9c0e1ca124dd2e5",
  measurementId: "G-FZZHFVXK5F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export default app;