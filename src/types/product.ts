export interface Product {
  id: string;
  _id?: string; // MongoDB ID
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  inStock: boolean;
  chatbotId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateProductInput = Omit<
  Product,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateProductInput = Partial<CreateProductInput>;
