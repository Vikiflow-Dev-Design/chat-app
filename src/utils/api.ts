// Base API URL from environment variables
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Determine if we're in development mode
const isDevelopment =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// Log the API URL for debugging
console.log("API Base URL:", API_BASE_URL);
console.log("Environment:", isDevelopment ? "Development" : "Production");

// For development purposes, use a mock token
// In production, you would get this from your auth provider
const MOCK_TOKEN = "mock_jwt_token_for_development";

interface RequestOptions extends RequestInit {
  token?: string;
  useBaseUrl?: boolean; // Whether to prepend the base URL
}

/**
 * Makes an authenticated API request
 */
export async function apiRequest<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  try {
    // Use the provided token or fall back to the mock token
    const token = options.token || MOCK_TOKEN;

    // Create headers with authentication
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    // Determine if we should use the base URL
    const useBaseUrl = options.useBaseUrl !== false; // Default to true

    // Construct the full URL
    const fullUrl =
      useBaseUrl && !url.startsWith("http")
        ? `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`
        : url;

    // Make the request with appropriate CORS settings
    console.log(`Making API request to: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: "include",
      mode: "cors",
    });

    // Handle non-successful responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    // Parse and return the response data
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}
