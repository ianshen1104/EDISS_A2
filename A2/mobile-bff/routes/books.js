const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get the Book Service URL from environment variables
const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL || 'http://localhost:3000';

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
    // Forward the request to the Book Service
    const response = await axios({
      method: req.method,
      url: `${BOOK_SERVICE_URL}/books${req.url === '/' ? '' : req.url}`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Transform the response for mobile clients
    const transformedData = transformBookData(response.data);
    
    // Send the transformed response back to the client
    res.status(response.status).json(transformedData);
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