const express = require('express');
const db = require('../models/db');
const { publishCustomerRegistered } = require('../utils/kafka');
const router = express.Router();

// Constants and validation helpers
const US_STATE_CODES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]);

/**
 * Validates email format 
 * @param {string} email - The email to validate
 * @returns {boolean} Whether the email is valid
 */
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Create a new customer
 * POST /customers
 */
router.post('/', async (req, res) => {
  const { userId, name, phone, address, address2, city, state, zipcode } = req.body;

  // Validate required fields
  if (!userId || !name || !phone || !address || !city || !state || !zipcode) {
    return res.status(400).json({ 
      message: 'All required fields must be provided' 
    });
  }

  // Validate email format
  if (!isValidEmail(userId)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Validate state code
  if (!US_STATE_CODES.has(state)) {
    return res.status(400).json({ message: 'Invalid US state abbreviation' });
  }

  try {
    // Check for existing user
    const [existingUsers] = await db.query(
      'SELECT * FROM customers WHERE userId = ?',
      [userId]
    );
    
    if (existingUsers.length > 0) {
      return res.status(422).json({ 
        message: 'This user ID already exists in the system.' 
      });
    }

    // Insert new customer
    const [result] = await db.query(
      'INSERT INTO customers (userId, name, phone, address, address2, city, state, zipcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, name, phone, address, address2, city, state, zipcode]
    );

    const customerId = result.insertId;
    
    // Prepare customer data for response and Kafka message
    const customerData = {
      id: customerId,
      userId,
      name,
      phone,
      address,
      address2,
      city,
      state,
      zipcode
    };

    // Publish customer registered event to Kafka
    // We're doing this asynchronously without waiting for the result
    // to avoid slowing down the API response
    publishCustomerRegistered(customerData)
      .then(success => {
        if (!success) {
          console.error('Failed to publish customer event to Kafka for userId:', userId);
        }
      })
      .catch(error => {
        console.error('Error when publishing to Kafka:', error);
      });

    // Return success with Location header (required for Gradescope)
    res
      .status(201)
      .set('Location', `${req.protocol}://${req.get('host')}/customers/${customerId}`)
      .json(customerData);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error });
  }
});

/**
 * Get a customer by numeric ID
 * GET /customers/:id
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  // Validate ID format (must be numeric)
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ message: 'Invalid customer ID' });
  }

  try {
    const [customers] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);

    if (customers.length === 0) {
      return res.status(404).json({ message: 'ID not found' });
    }

    res.status(200).json(customers[0]);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error });
  }
});

/**
 * Get a customer by email (userId)
 * GET /customers?userId=email@example.com
 */
router.get('/', async (req, res) => {
  const { userId } = req.query;

  // Validate userId
  if (!userId || !isValidEmail(userId)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    const [customers] = await db.query('SELECT * FROM customers WHERE userId = ?', [userId]);

    if (customers.length === 0) {
      return res.status(404).json({ message: 'User-ID not found' });
    }

    res.status(200).json(customers[0]);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error });
  }
});

module.exports = router; 