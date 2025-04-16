// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');
const customerRoutes = require('./routes/customers');

// Initialize app
const app = express();

// Apply middleware
app.use(cors());
app.use(express.json());

// Register routes
app.use('/customers', customerRoutes);

// Health check endpoint
app.get('/status', (req, res) => {
  res.status(200).send('OK');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Customer Service listening on port ${PORT}`);
}); 