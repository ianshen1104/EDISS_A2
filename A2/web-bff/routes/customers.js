const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get the Customer Service URL from environment variables
const CUSTOMER_SERVICE_URL = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3000';

/**
 * Proxy all customer requests to the Customer Service
 */
router.all('/*', async (req, res) => {
  try {
    // Forward the request to the Customer Service
    const response = await axios({
      method: req.method,
      url: `${CUSTOMER_SERVICE_URL}/customers${req.url === '/' ? '' : req.url}`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Send the response back to the client with the appropriate status code
    res.status(response.status).json(response.data);
  } catch (error) {
    // Handle errors from the Customer Service
    if (error.response) {
      // Forward the error response
      res.status(error.response.status).json(error.response.data);
    } else {
      // Handle connection errors
      res.status(500).json({ 
        message: 'Error connecting to Customer Service',
        error: error.message 
      });
    }
  }
});

module.exports = router; 