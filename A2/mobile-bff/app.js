// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');
const { validateClientType } = require('./middleware/headers');
const { validateJwt } = require('./middleware/auth');
const bookRoutes = require('./routes/books');
const customerRoutes = require('./routes/customers');

// Initialize app
const app = express();

// Apply middleware
app.use(cors());
app.use(express.json());

// Apply validation middleware to all routes except /status
app.use((req, res, next) => {
  if (req.path === '/status') {
    return next();
  }
  
  // Validate client type and JWT token
  validateClientType(req, res, (err) => {
    if (err) return next(err);
    validateJwt(req, res, next);
  });
});

// Register routes
app.use('/books', bookRoutes);
app.use('/customers', customerRoutes);

// Health check endpoint
app.get('/status', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Mobile BFF listening on port ${PORT}`);
}); 