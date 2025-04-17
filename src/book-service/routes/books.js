const express = require('express');
const db = require('../models/db');
const axios = require('axios');
const CircuitBreaker = require('opossum');
const router = express.Router();

/**
 * Validates price format - must be positive with exactly 2 decimal places
 * @param {number|string} price - The price to validate
 * @returns {boolean} Whether the price is valid
 */
const isValidPrice = (price) => {
  const priceStr = typeof price === 'number' ? price.toString() : price;
  return /^(\d+)\.(\d{2})$/.test(priceStr) && parseFloat(priceStr) > 0;
};

// Get the Recommendation Service URL from environment variables or use default
const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8082';

// Circuit breaker configuration
const CIRCUIT_TIMEOUT = 3000; // 3 seconds timeout
const RESET_TIMEOUT = 60000;  // 60 seconds before trying again

// Custom error for timeouts
class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
    this.isTimeout = true;
  }
}

// Function to intentionally simulate a slow response for testing
const simulateSlowRequest = async (isbn) => {
  console.log(`TESTING: Simulating slow request for ISBN ${isbn}`);
  return new Promise((resolve, reject) => {
    // Wait for longer than the timeout to trigger the 504 error
    setTimeout(() => {
      reject(new TimeoutError('TESTING: Simulated timeout error'));
    }, CIRCUIT_TIMEOUT + 1000);
  });
};

// Create the circuit breaker
const breaker = new CircuitBreaker(
  async (isbn) => {
    console.log(`Making request to ${RECOMMENDATION_SERVICE_URL}/recommended-titles/isbn/${isbn}`);
    
    // FOR TESTING: Uncomment this line to force a timeout
    // return simulateSlowRequest(isbn);
    
    return new Promise((resolve, reject) => {
      // Create a timeout that will abort the request if it takes too long
      const timeoutId = setTimeout(() => {
        console.log(`Request timed out after ${CIRCUIT_TIMEOUT}ms`);
        reject(new TimeoutError(`Request timed out after ${CIRCUIT_TIMEOUT}ms`));
      }, CIRCUIT_TIMEOUT);
      
      // Make the actual request
      axios.get(`${RECOMMENDATION_SERVICE_URL}/recommended-titles/isbn/${isbn}`, { 
        timeout: CIRCUIT_TIMEOUT // Axios timeout as backup
      })
      .then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        
        // Convert Axios timeout errors to our custom TimeoutError
        if (error.code === 'ECONNABORTED' || 
            error.code === 'ETIMEDOUT' || 
            error.message.includes('timeout')) {
          reject(new TimeoutError('Request timed out'));
        } else {
          reject(error);
        }
      });
    });
  },
  {
    timeout: CIRCUIT_TIMEOUT,                // If our function takes longer than 3 seconds, trigger a failure
    resetTimeout: RESET_TIMEOUT,             // After 60 seconds, try again
    errorThresholdPercentage: 1,             // Open circuit after just 1 failure
    rollingCountTimeout: 60000,              // Keep failure counts for 60 seconds
    rollingCountBuckets: 10                  // Track in 10 buckets of 6 seconds each
  }
);

// Special event handlers for the circuit breaker
breaker.on('open', () => {
  console.log('CIRCUIT BREAKER OPEN: The recommendation service is unavailable');
});

breaker.on('halfOpen', () => {
  console.log('CIRCUIT BREAKER HALF-OPEN: Trying the recommendation service again');
});

breaker.on('close', () => {
  console.log('CIRCUIT BREAKER CLOSED: The recommendation service is available');
});

breaker.on('timeout', () => {
  console.log('CIRCUIT BREAKER TIMEOUT: The recommendation service is too slow');
});

breaker.on('reject', () => {
  console.log('CIRCUIT BREAKER REJECT: Circuit is open, request was not made');
});

/**
 * Create a new book
 * POST /books
 */
router.post('/', async (req, res) => {
  const { ISBN, title, Author, description, genre, price, quantity } = req.body;

  // Validate required fields
  if (!ISBN || !title || !Author || !description || !genre || !price || !quantity) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Validate price format
  const priceValue = parseFloat(price);
  if (!isValidPrice(priceValue)) {
    return res.status(400).json({
      message: 'Invalid price format. Must be a positive number with two decimal places.'
    });
  }

  try {
    // Check for duplicate ISBN
    const [existingBooks] = await db.query('SELECT * FROM books WHERE ISBN = ?', [ISBN]);
    
    if (existingBooks.length > 0) {
      return res.status(422).json({ 
        message: 'This ISBN already exists in the system.' 
      });
    }

    // Insert new book
    await db.query(
      'INSERT INTO books (ISBN, title, Author, description, genre, price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [ISBN, title, Author, description, genre, priceValue, quantity]
    );

    // Return success with Location header (required for Gradescope)
    res
      .status(201)
      .set('Location', `${req.protocol}://${req.get('host')}/books/${ISBN}`)
      .json({
        ISBN,
        title,
        Author,
        description,
        genre,
        price: priceValue,
        quantity
      });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error });
  }
});

/**
 * Update a book by ISBN
 * PUT /books/:ISBN
 */
router.put('/:ISBN', async (req, res) => {
  const { ISBN } = req.params;
  const { title, Author, description, genre, price, quantity, ISBN: bodyISBN } = req.body;

  // Validate required fields
  if (!title || !Author || !description || !genre || !price || !quantity) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Validate ISBN match between URL and body (if provided)
  if (bodyISBN && bodyISBN !== ISBN) {
    return res.status(400).json({ 
      message: 'ISBN in request body does not match URL' 
    });
  }

  // Validate price format
  const priceValue = parseFloat(price);
  if (!isValidPrice(priceValue)) {
    return res.status(400).json({
      message: 'Invalid price format. Must be a positive number with two decimal places.'
    });
  }

  try {
    // Update book
    const [result] = await db.query(
      'UPDATE books SET title=?, Author=?, description=?, genre=?, price=?, quantity=? WHERE ISBN=?',
      [title, Author, description, genre, priceValue, quantity, ISBN]
    );

    // Check if book was found
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ISBN not found' });
    }

    // Return updated book
    res.status(200).json({
      ISBN,
      title,
      Author,
      description,
      genre,
      price: priceValue,
      quantity
    });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error });
  }
});

/**
 * Get a book by ISBN
 * Supports both /books/:ISBN and /books/isbn/:ISBN routes
 */
router.get(['/isbn/:ISBN', '/:ISBN'], async (req, res) => {
  const { ISBN } = req.params;

  try {
    const [books] = await db.query('SELECT * FROM books WHERE ISBN = ?', [ISBN]);
    
    if (books.length === 0) {
      return res.status(404).json({ message: 'ISBN not found' });
    }

    // Ensure price is returned as a number
    books[0].price = parseFloat(books[0].price);

    res.status(200).json(books[0]);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error });
  }
});

/**
 * Get related books for a specified ISBN with circuit breaker
 * GET /books/:ISBN/related-books
 */
router.get('/:ISBN/related-books', async (req, res) => {
  const { ISBN } = req.params;

  try {
    // Check if the circuit is already open before making the request
    if (breaker.status.state === 'open') {
      console.log('Circuit is OPEN - immediately returning 503');
      return res.status(503).json({
        message: 'Recommendation service is currently unavailable',
        error: 'Circuit breaker is open'
      });
    }

    try {
      console.log(`Making request to recommendation service for ISBN ${ISBN}`);
      
      // Create a timeout for the whole operation
      const requestPromise = breaker.fire(ISBN);
      
      // Race against a timeout
      const response = await requestPromise;
      
      // If there are related books, return them with 200 status
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log(`Successful response with ${response.data.length} recommendations`);
        return res.status(200).json(response.data);
      } else {
        // If no related books are found, return 204 No Content
        console.log('No recommendations found - returning 204');
        return res.status(204).send();
      }
    } catch (error) {
      console.error('Error from recommendation service:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Is timeout:', error.isTimeout);
      console.error('Error code:', error.code);
      
      // Explicit check for our custom TimeoutError first
      if (error instanceof TimeoutError || error.isTimeout === true) {
        console.log('Explicit timeout detected - returning 504');
        return res.status(504).json({
          message: 'Recommendation service timed out',
          error: 'Request timed out after 3 seconds'
        });
      }
      
      // Check for timeout errors from Axios or other libraries
      if (error.code === 'ETIMEDOUT' || 
          error.code === 'ESOCKETTIMEDOUT' || 
          error.message.includes('timeout') ||
          (error.cause && error.cause.code === 'ECONNABORTED')) {
        console.log('Timeout from library detected - returning 504');
        return res.status(504).json({
          message: 'Recommendation service timed out',
          error: 'Request timed out after 3 seconds'
        });
      }
      
      // Check for opossum's own timeout event
      if (error.message && error.message.includes('CircuitBreaker timeout')) {
        console.log('Circuit breaker timeout detected - returning 504');
        return res.status(504).json({
          message: 'Recommendation service timed out',
          error: 'Request timed out after 3 seconds'
        });
      }
      
      // If the circuit rejected the request (circuit is open)
      if (error.message && error.message.includes('Breaker is open')) {
        console.log('Circuit rejection detected - returning 503');
        return res.status(503).json({
          message: 'Recommendation service is currently unavailable',
          error: 'Circuit breaker is open'
        });
      }
      
      // DNS or connection errors
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.log('Connection error detected - returning 500');
        return res.status(500).json({
          message: 'Error connecting to recommendation service',
          error: error.message
        });
      }
      
      // Any other error - log more details to help debug
      console.log('Unhandled error type:', typeof error);
      console.log('Error constructor:', error.constructor.name);
      console.log('Error properties:', Object.keys(error));
      
      return res.status(500).json({
        message: 'Error from recommendation service',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error.message);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router; 