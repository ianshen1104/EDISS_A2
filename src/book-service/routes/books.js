const express = require('express');
const db = require('../models/db');
const axios = require('axios');
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
const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:80';

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
 * Get related books for a specified ISBN
 * GET /books/:ISBN/related-books
 */
router.get('/:ISBN/related-books', async (req, res) => {
  const { ISBN } = req.params;

  try {
    // Make a request to the recommendation service
    try {
      const response = await axios.get(`${RECOMMENDATION_SERVICE_URL}/recommendations/${ISBN}`);
      
      // If there are related books, return them with 200 status
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return res.status(200).json(response.data);
      } else {
        // If no related books are found, return 204 No Content
        return res.status(204).send();
      }
    } catch (recommendationError) {
      console.error('Error from recommendation service:', recommendationError.message);
      return res.status(500).json({ 
        message: 'Error connecting to recommendation service',
        error: recommendationError.message 
      });
    }
  } catch (error) {
    console.error('Database error:', error.message);
    return res.status(500).json({ message: 'Database error', error });
  }
});

module.exports = router; 