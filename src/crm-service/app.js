// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const { startConsumer } = require('./utils/kafka');

// Initialize app
const app = express();

// Health check endpoint
app.get('/status', (req, res) => {
  res.status(200).send('OK');
});

// Start Kafka consumer
startConsumer()
  .then(() => {
    console.log('CRM Service Kafka consumer started successfully');
  })
  .catch(error => {
    console.error('Failed to start Kafka consumer:', error);
    // Exit the process if we can't connect to Kafka
    process.exit(1);
  });

// Start server (only for health checks)
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`CRM Service listening on port ${PORT}`);
}); 