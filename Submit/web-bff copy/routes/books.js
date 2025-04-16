const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get the Book Service URL from environment variables
const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL || 'http://localhost:3000';

// Log the service URL for debugging
console.log('Book Service URL:', BOOK_SERVICE_URL);

/**
 * Proxy all book requests to the Book Service
 */
router.all('/*', async (req, res) => {
  try {
    // Construct URL carefully to avoid double slashes
    let targetPath = req.url === '/' ? '' : req.url;
    const url = `${BOOK_SERVICE_URL}/books${targetPath}`;
    
    console.log(`Forwarding ${req.method} request to: ${url}`);
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    // Forward the request to the Book Service
    const response = await axios({
      method: req.method,
      url: url,
      data: req.body,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response from Book Service:', response.status);
    
    // Send the response back to the client with the appropriate status code
    res.status(response.status).json(response.data);
  } catch (error) {
    // Handle errors from the Book Service
    console.error('Error connecting to Book Service:', error.message);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
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