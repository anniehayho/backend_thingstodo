// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");
const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const firebase_app = initializeApp(firebaseConfig);
const firebase_auth = getAuth(firebase_app);
const firebase_db = getFirestore(firebase_app);

// Initialize Firebase Admin (for server-side token verification)
// Note: In production, use a service account JSON file or environment variables
// admin.initializeApp({
//   credential: admin.credential.cert(require('../path/to/serviceAccountKey.json'))
// });
admin.initializeApp({
  // credential: admin.credential.cert(require('../firebase/serviceAccountKey.json')),
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  // If running locally without service account, this will use Application Default Credentials
});

const adminAuth = admin.auth();

// Export all Firebase services properly
module.exports = {
  firebase_db,
  firebase_auth,
  firebase_app,
  adminAuth
};