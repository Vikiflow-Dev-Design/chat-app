// Middleware to check if the user is an admin
const adminAuth = (req, res, next) => {
  // Check if user has admin role
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

module.exports = adminAuth;
