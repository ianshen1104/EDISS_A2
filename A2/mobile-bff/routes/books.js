const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get the Book Service URL from environment variables
const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL || 'http://localhost:3000';

// Log the service URL for debugging
console.log('Book Service URL:', BOOK_SERVICE_URL);

/**
 * Transform book data for mobile clients
 * Replace "non-fiction" genre with "3"
 */
function transformBookData(book) {
  // Apply transformation if it's a single book object
  if (book && typeof book === 'object' && book.genre) {
    if (book.genre.toLowerCase() === 'non-fiction') {
      book.genre = '3';
    }
  }
  // Process array of books
  else if (Array.isArray(book)) {
    book.forEach(item => {
      if (item.genre && item.genre.toLowerCase() === 'non-fiction') {
        item.genre = '3';
      }
    });
  }
  return book;
}

/**
 * Proxy all book requests to the Book Service
 * Transform the response for mobile clients
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
    
    // Transform the response for mobile clients
    const transformedData = transformBookData(response.data);
    
    // Send the transformed response back to the client
    res.status(response.status).json(transformedData);
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