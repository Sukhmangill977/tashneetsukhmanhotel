
// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAaY39hkYO254wOXqrSaHq4Ls5av3jO4dc",
  authDomain: "property-management-c6223.firebaseapp.com",
  projectId: "property-management-c6223",
  storageBucket: "property-management-c6223.firebasestorage.app",
  messagingSenderId: "592510097676",
  appId: "1:592510097676:web:4e66b518c54196a1585129"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;