const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');

const taskRoutes = require('./api/routes/tasks');
const userRoutes = require('./api/routes/users');

const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

// Routes which should handle requests
app.use('/tasks', taskRoutes);
app.use('/users', userRoutes);

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