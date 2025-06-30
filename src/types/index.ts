export interface Product {
  barcode: string;
  name: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  imageUrl?: string;
}

export interface ShoppingList {
  id: string;
  date: string;
  supermarket: string;
  items: Product[];
  total: number;
  budget?: number;
}

export interface ProductAPIResponse {
  product?: {
    product_name?: string;
    brands?: string;
    categories_tags?: string[];
    image_url?: string;
    code: string;
  };
  status: number;
  status_verbose: string;
}