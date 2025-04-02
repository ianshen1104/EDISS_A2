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
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
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
    
    // exp claim is automatically checked by jwt.verify
    
    // Add the decoded token to the request object for later use
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired' 
      });
    }
    
    return res.status(401).json({ 
      message: 'Invalid token' 
    });
  }
}

module.exports = { validateJwt }; 