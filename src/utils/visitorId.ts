import { v4 as uuidv4 } from 'uuid';

// Key for storing visitor ID in localStorage
const VISITOR_ID_KEY = 'chat_visitor_id';

/**
 * Get the visitor ID from localStorage or create a new one if it doesn't exist
 */
export const getOrCreateVisitorId = (): string => {
  // Try to get the visitor ID from localStorage
  const storedId = localStorage.getItem(VISITOR_ID_KEY);
  
  if (storedId) {
    return storedId;
  }
  
  // If no visitor ID exists, create a new one
  const newId = uuidv4();
  localStorage.setItem(VISITOR_ID_KEY, newId);
  
  return newId;
};

/**
 * Clear the visitor ID from localStorage
 */
export const clearVisitorId = (): void => {
  localStorage.removeItem(VISITOR_ID_KEY);
};
