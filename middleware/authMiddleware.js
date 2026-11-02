/**
 * Authentication Middleware
 * Protects private API endpoints.
 * Checks whether the incoming HTTP request has an active authenticated session.
 */
const protect = (req, res, next) => {
  if (req.session && req.session.adminId) {
    // Session is valid and admin is authenticated
    return next();
  }

  // Not logged in or session expired
  return res.status(401).json({
    success: false,
    message: 'Access denied. Please log in to continue.',
  });
};

module.exports = { protect };
