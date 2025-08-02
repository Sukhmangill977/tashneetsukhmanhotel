
// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAtu_mPlFBb7cA6yabga8rjT7T2dqbr4TA",
  authDomain: "hotel-management-131b5.firebaseapp.com",
  projectId: "hotel-management-131b5",
  storageBucket: "hotel-management-131b5.firebasestorage.app",
  messagingSenderId: "144273767863",
  appId: "1:144273767863:web:3b363a63d56a234a5a7c32"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;