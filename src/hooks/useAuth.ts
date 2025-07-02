import { useAuth as useClerkAuth } from "@clerk/clerk-react";

export function useAuth() {
  const { getToken, userId, isLoaded, isSignedIn } = useClerkAuth();

  // Function to get the token for API requests
  const getAuthToken = async (): Promise<string | null> => {
    try {
      if (!isLoaded || !isSignedIn) {
        // For development purposes, return a mock token when not signed in
        return "mock_jwt_token_for_development";
      }

      // Get the token from Clerk
      const token = await getToken();
      return token;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  };

  return {
    getAuthToken,
    userId,
    isLoaded,
    isSignedIn
  };
}
