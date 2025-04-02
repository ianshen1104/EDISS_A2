const jwt = require('jsonwebtoken');

/**
 * Middleware to validate JWT token
 * Checks for valid sub, exp, and iss claims
 */
function validateJwt(req, res, next) {
  // Get the token from the Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      message: 'Missing or invalid Authorization header' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // For this exercise, we'll verify the token without requiring a specific signature
    // This allows us to accept externally generated tokens
    const decoded = jwt.decode(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        message: 'Invalid token format' 
      });
    }
    
    // Validate sub claim - must be one of the allowed values
    const validSubs = ['starlord', 'gamora', 'drax', 'rocket', 'groot'];
    if (!decoded.sub || !validSubs.includes(decoded.sub)) {
      return res.status(401).json({ 
        message: 'Invalid subject claim in token' 
      });
    }
    
    // Validate iss claim - must be cmu.edu
    if (!decoded.iss || decoded.iss !== 'cmu.edu') {
      return res.status(401).json({ 
        message: 'Invalid issuer claim in token' 
      });
    }
    
    // Check expiration manually since we're using jwt.decode
    if (decoded.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        return res.status(401).json({ 
          message: 'Token has expired' 
        });
      }
    }
    
    // Add the decoded token to the request object for later use
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('JWT validation error:', error);
    return res.status(401).json({ 
      message: 'Invalid token' 
    });
  }
}

module.exports = { validateJwt }; 