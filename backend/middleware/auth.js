const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // Get token from header
  const authHeader = req.header("Authorization");

  // Check if token exists
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  // For development purposes, accept a mock token
  if (token === "mock_jwt_token_for_development") {
    // Set a mock user ID for development - using a valid MongoDB ObjectId format
    req.user = { id: "64a1b2c3d4e5f6a7b8c9d0e1" };
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user ID to request
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};
