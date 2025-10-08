export interface Product {
  _id: string;
  tenantId: string;
  categoryId?: string;
  name: string;
  description?: string;
  priceCents: number;
  imageUrl?: string;
  imagePublicId?: string;
  imageMetadata?: {
    width: number;
    height: number;
    format: string;
  };
  availabilityStatus: 'available' | 'unavailable' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  tenantId: string;
  name: string;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ProductsResponse extends ApiResponse<Product[]> {}
export interface CategoriesResponse extends ApiResponse<Category[]> {}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}



