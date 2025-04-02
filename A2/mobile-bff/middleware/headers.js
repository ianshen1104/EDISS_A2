/**
 * Middleware to validate X-Client-Type header
 * Only allows "iOS" or "Android" client types for the mobile BFF
 */
function validateClientType(req, res, next) {
  const clientType = req.headers['x-client-type'];
  
  if (!clientType) {
    return res.status(400).json({ 
      message: 'Missing X-Client-Type header'
    });
  }
  
  if (clientType !== 'iOS' && clientType !== 'Android') {
    return res.status(400).json({ 
      message: 'Invalid client type. Expected "iOS" or "Android"'
    });
  }
  
  next();
}

module.exports = { validateClientType }; 