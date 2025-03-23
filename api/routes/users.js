const express = require('express');
const router = express.Router();
const { firebase_db, firebase_auth } = require('../../firebase/firebaseConfig');
const { collection, addDoc, getDocs, query, where, setDoc, doc, getDoc } = require("firebase/firestore");
const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");

// Add this near the top of your routes file
router.get('/test', (req, res) => {
  res.status(200).json({
    message: 'User routes are working!'
  });
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, firstName, and lastName'
      });
    }

    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      firebase_auth, 
      email, 
      password
    );
    
    const user = userCredential.user;
    
    // Store additional user information in Firestore
    const userDocRef = doc(firebase_db, "users", user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: email,
      firstName: firstName,
      lastName: lastName,
      createdAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: user.uid
    });
  } catch (error) {
    console.error('Error registering user:', error);
    
    // Handle specific Firebase authentication errors
    let errorMessage = 'Failed to register user';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email is already in use';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email format';
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Sign in with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(
      firebase_auth, 
      email, 
      password
    );
    
    const user = userCredential.user;
    
    // Get additional user information from Firestore
    const userDocRef = doc(firebase_db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          uid: user.uid,
          email: user.email,
          firstName: userData.firstName,
          lastName: userData.lastName
        }
      });
    } else {
      // User exists in Authentication but not in Firestore
      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          uid: user.uid,
          email: user.email
        }
      });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    
    // Handle specific Firebase authentication errors
    let errorMessage = 'Failed to login';
    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Invalid password';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'User not found';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid credentials';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email format';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed login attempts. Please try again later';
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
});

module.exports = router; 