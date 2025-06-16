
import { productService } from "@/services/productService";
import { Product } from "@/types/product";
import { chatbotService } from "@/services/chatbotService";
import { Chatbot } from "@/types/chatbot";

// Define available functions
export const availableFunctions = {
  getProducts: async (chatbotId: string): Promise<Product[]> => {
    try {
      return await productService.getProducts(chatbotId);
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  },
  
  getProduct: async (productId: string): Promise<Product | null> => {
    try {
      return await productService.getProduct(productId);
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  },

  getChatbot: async (chatbotId: string): Promise<Chatbot | null> => {
    try {
      return await chatbotService.getChatbot(chatbotId);
    } catch (error) {
      console.error("Error fetching chatbot:", error);
      return null;
    }
  }
};

// Function to format product information for display
export const formatProductsForDisplay = (products: Product[]): string => {
  if (!products || products.length === 0) {
    return "There are no products available at the moment.";
  }
  
  return products.map(product => (
    `• ${product.name}: ${product.description}. Price: $${product.price.toFixed(2)}. ` + 
    `${product.inStock ? 'In stock' : 'Out of stock'}`
  )).join('\n\n');
};

// Format chatbot details for display
export const formatChatbotForDisplay = (chatbot: Chatbot | null): string => {
  if (!chatbot) {
    return "Chatbot information is not available.";
  }
  
  return `Chatbot: ${chatbot.name}
Description: ${chatbot.description || 'No description provided'}
Model: ${chatbot.model}
Messages exchanged: ${chatbot.stats.totalMessages}
Active users: ${chatbot.stats.activeUsers}`;
};

// Parse function calls from LLM response
export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export const parseFunctionCall = (content: string): FunctionCall | null => {
  try {
    // Look for function call patterns like: <function_call name="getProducts" arguments={"chatbotId":"123"}>
    const functionCallMatch = content.match(/<function_call name="([^"]+)" arguments=({[^>]+})>/);
    
    if (functionCallMatch) {
      const name = functionCallMatch[1];
      const args = JSON.parse(functionCallMatch[2]);
      
      return { name, arguments: args };
    }
    
    return null;
  } catch (error) {
    console.error("Error parsing function call:", error);
    return null;
  }
};
