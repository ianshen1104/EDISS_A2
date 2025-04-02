const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get the Book Service URL from environment variables
const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL || 'http://localhost:3000';

/**
 * Proxy all book requests to the Book Service
 */
router.all('/*', async (req, res) => {
  try {
    // Forward the request to the Book Service
    const response = await axios({
      method: req.method,
      url: `${BOOK_SERVICE_URL}/books${req.url === '/' ? '' : req.url}`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Send the response back to the client with the appropriate status code
    res.status(response.status).json(response.data);
  } catch (error) {
    // Handle errors from the Book Service
    if (error.response) {
      // Forward the error response
      res.status(error.response.status).json(error.response.data);
    } else {
      // Handle connection errors
      res.status(500).json({ 
        message: 'Error connecting to Book Service',
        error: error.message 
      });
    }
  }
});

module.exports = router; 