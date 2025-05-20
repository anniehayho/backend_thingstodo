const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const taskRoutes = require('./api/routes/tasks');
const userRoutes = require('./api/routes/users');

const cors = require('cors');

// Get base path from environment or use empty string (root)
const BASE_PATH = process.env.BASE_PATH || '';

const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL || 'https://thingstodo-frontend.web.app'] 
  : ['http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Debug middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`Request path: ${req.path}, Original URL: ${req.originalUrl}`);
  next();
});

// Root path to check if API is running - handle both root and BASE_PATH root
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Backend API is running',
    status: 'online',
    endpoints: {
      tasks: '/tasks',
      users: '/users'
    }
  });
});

// Also set up the BASE_PATH root if specified
if (BASE_PATH) {
  app.get(BASE_PATH + '/', (req, res) => {
    res.status(200).json({
      message: 'Backend API is running via BASE_PATH',
      status: 'online',
      endpoints: {
        tasks: BASE_PATH + '/tasks',
        users: BASE_PATH + '/users'
      }
    });
  });
}

// CORS handling
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});

// Routes which should handle requests - at root level
app.use('/tasks', taskRoutes);
app.use('/users', userRoutes);

// Also set up routes at BASE_PATH if specified
if (BASE_PATH) {
  app.use(BASE_PATH + '/tasks', taskRoutes);
  app.use(BASE_PATH + '/users', userRoutes);
}

// Handle errors
app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

module.exports = app;