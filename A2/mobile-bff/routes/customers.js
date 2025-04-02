const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get the Customer Service URL from environment variables
const CUSTOMER_SERVICE_URL = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3000';

// Log the service URL for debugging
console.log('Customer Service URL:', CUSTOMER_SERVICE_URL);

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
    // Construct URL carefully to avoid double slashes
    let targetPath = req.url === '/' ? '' : req.url;
    const url = `${CUSTOMER_SERVICE_URL}/customers${targetPath}`;
    
    console.log(`Forwarding ${req.method} request to: ${url}`);
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    // Forward the request to the Customer Service
    const response = await axios({
      method: req.method,
      url: url,
      data: req.body,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response from Customer Service:', response.status);
    
    // Transform the response for mobile clients
    const transformedData = transformCustomerData(response.data);
    
    // Send the transformed response back to the client
    res.status(response.status).json(transformedData);
  } catch (error) {
    // Handle errors from the Customer Service
    console.error('Error connecting to Customer Service:', error.message);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
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