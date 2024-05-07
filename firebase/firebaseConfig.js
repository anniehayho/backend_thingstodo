// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC04fD6y-CQjFX1zpVuAN_JVH8tCkgI268",
  authDomain: "todoapp-17161.firebaseapp.com",
  projectId: "todoapp-17161",
  storageBucket: "todoapp-17161.appspot.com",
  messagingSenderId: "463689943404",
  appId: "1:463689943404:web:e4c59d277309558f9acb49",
  measurementId: "G-912S45EKK6"
};

// Initialize Firebase
const firebase_app = initializeApp(firebaseConfig);
const firebase_auth = getAuth(firebase_app);
const firebase_db = getFirestore(firebase_app);

export default { firebase_app, firebase_auth, firebase_db };