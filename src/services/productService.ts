import { apiRequest } from "@/utils/api";

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  inStock: boolean;
  chatbotId: string;
}

export const productService = {
  // Get all products for a chatbot
  getProducts: async (chatbotId: string) => {
    return apiRequest<any[]>(`/products/chatbot/${chatbotId}`);
  },

  // Create a new product
  createProduct: async (data: CreateProductDTO) => {
    return apiRequest<any>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update a product
  updateProduct: async (productId: string, data: Partial<CreateProductDTO>) => {
    return apiRequest<any>(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete a product
  deleteProduct: async (productId: string) => {
    return apiRequest<any>(`/products/${productId}`, {
      method: "DELETE",
    });
  },

  // Get a single product
  getProduct: async (productId: string) => {
    return apiRequest<any>(`/products/${productId}`);
  },
};
