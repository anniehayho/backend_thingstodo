const { adminAuth } = require('../../firebase/firebaseConfig');
const cookieParser = require('cookie-parser');

// Middleware to verify user is authenticated
const authMiddleware = async (req, res, next) => {
  try {
    console.log('Auth middleware running');
    
    // For testing purposes, you can add a special header to skip auth
    if (req.headers['x-skip-auth'] === 'true') {
      console.log('Skipping authentication for testing');
      req.user = { uid: 'test-user-id' };
      return next();
    }
    
    let token;
    
    // First check for the auth_token cookie
    if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
      console.log('Using token from cookie');
    } 
    // Then fall back to the authorization header
    else {
      // Get the authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No Authorization header or cookie found');
        return res.status(401).json({
          success: false,
          message: 'Authorization token is required'
        });
      }

      // Extract the token from header
      token = authHeader.split(' ')[1];
      console.log('Using token from Authorization header');
    }
    
    // Verify the token with Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = { uid: decodedToken.uid };
    
    console.log('Setting user ID to:', req.user.uid);
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

module.exports = authMiddleware; 