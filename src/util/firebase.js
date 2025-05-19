// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCHCcrPQHHpnZJEEJLGOWLdbpotYrkkidk",
  authDomain: "strive-11ef5.firebaseapp.com",
  projectId: "strive-11ef5",
  storageBucket: "strive-11ef5.firebasestorage.app",
  messagingSenderId: "959681649429",
  appId: "1:959681649429:web:eab5f40135dedc172a271c",
  measurementId: "G-VHTRL3GDCS",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
