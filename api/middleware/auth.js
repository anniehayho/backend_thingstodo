const { adminAuth } = require('../../firebase/firebaseConfig');

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
    
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No Authorization header or invalid format');
      return res.status(401).json({
        success: false,
        message: 'Authorization token is required'
      });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    console.log('Token received');
    
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