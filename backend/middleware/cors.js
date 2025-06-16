/**
 * Custom CORS middleware to ensure consistent CORS configuration across all routes
 */
const corsMiddleware = (req, res, next) => {
  // Define allowed origins
  const allowedOrigins =
    process.env.NODE_ENV === "production"
      ? [
          process.env.FRONTEND_URL,
          "https://chat-agency-spark.vercel.app",
          "https://vikiai.vikiflow.com",
        ]
      : [
          "http://localhost:3000",
          "http://localhost:5173",
          "http://localhost:8080",
        ];

  // Get the origin from the request headers
  const origin = req.headers.origin;

  console.log("Request origin:", origin);
  console.log("Allowed origins:", allowedOrigins);
  console.log("NODE_ENV:", process.env.NODE_ENV);

  // Check if the origin is allowed
  if (allowedOrigins.includes(origin)) {
    // Set the specific origin instead of wildcard when credentials are used
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (process.env.NODE_ENV !== "production") {
    // In development, if origin is not in the allowed list but we're in dev mode,
    // set the specific origin instead of wildcard to support credentials
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      // For requests without origin, use wildcard (but credentials won't work)
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  } else {
    // In production, if origin is not in allowed list, set to the first allowed origin
    // This is a fallback to ensure CORS headers are always set
    res.setHeader(
      "Access-Control-Allow-Origin",
      process.env.FRONTEND_URL || allowedOrigins[0]
    );
  }

  // Set other CORS headers
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Continue to the next middleware
  next();
};

module.exports = corsMiddleware;
