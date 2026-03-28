const express = require('express');
const { authenticate, rateLimiter } = require('./middleware');
const router = require('./routes');

const app = express();

// Health check endpoint - no middleware
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Apply middleware to API routes onlyapp.use('/api', authenticate);
app.use('/api', rateLimiter);
app.use('/api', router);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = parseInt(process.env.PORT, 10) || 3000;
if (isNaN(PORT)) {
  console.error('Invalid PORT environment variable');
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

module.exports = app;