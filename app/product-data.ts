export interface Product {
  id: string;
  imageUrl: string;
  name: string;
  description: string;
  price: number;
  /** Units available for sale. */
  stock: number;
  /** Cart line quantity (not stored on the product catalog doc). */
  quantity?: number;
}
