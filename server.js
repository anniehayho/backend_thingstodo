const http = require('http');
const app = require('./app');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  return app(req, res);
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`BASE_PATH: ${process.env.BASE_PATH || 'not set'}`);
});