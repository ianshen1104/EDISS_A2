const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get the Customer Service URL from environment variables
const CUSTOMER_SERVICE_URL = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3000';

/**
 * Transform customer data for mobile clients
 * Remove address fields
 */
function transformCustomerData(customer) {
  // Apply transformation if it's a single customer object
  if (customer && typeof customer === 'object') {
    // Remove address fields
    const { address, address2, city, state, zipcode, ...filteredCustomer } = customer;
    return filteredCustomer;
  }
  // Process array of customers
  else if (Array.isArray(customer)) {
    return customer.map(item => {
      const { address, address2, city, state, zipcode, ...filteredItem } = item;
      return filteredItem;
    });
  }
  return customer;
}

/**
 * Proxy all customer requests to the Customer Service
 * Transform the response for mobile clients
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
    
    // Transform the response for mobile clients
    const transformedData = transformCustomerData(response.data);
    
    // Send the transformed response back to the client
    res.status(response.status).json(transformedData);
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