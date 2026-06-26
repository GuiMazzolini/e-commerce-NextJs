import { create } from "zustand";
import { Product } from "../../product-data";
import { addCartItem, updateCartQuantity, removeCartItem, fetchCartItems } from "../api/cart";

type LoadingMap = Record<string, boolean>;

interface CartState {
  cartProducts: Product[];
  loading: LoadingMap;

  setCart: (products: Product[]) => void;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;

  isLoading: (productId: string) => boolean;
  setLoading: (productId: string, value: boolean) => void;
  clearLoading: (productId: string) => void;

  getSubtotal: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  cartProducts: [],
  loading: {},

  setCart: (products) => set({ cartProducts: products }),

  fetchCart: async () => {
    try {
      const cartProducts = await fetchCartItems();
      set({ cartProducts });
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
  },

  addToCart: async (productId) => {
    const { setLoading, clearLoading } = get();
    setLoading(productId, true);
    try {
      const updated = await addCartItem(productId);
      set({ cartProducts: updated });
    } catch (err) {
      console.error("Failed to add item:", err);
    } finally {
      clearLoading(productId);
    }
  },

  updateQuantity: async (productId, quantity) => {
    const { setLoading, clearLoading } = get();
    setLoading(productId, true);
    try {
      const updated = await updateCartQuantity(productId, quantity);
      set({ cartProducts: updated });
    } catch (error) {
      console.error("Failed to update quantity:", error);
    } finally {
      clearLoading(productId);
    }
  },

  removeFromCart: async (productId) => {
    const { setLoading, clearLoading } = get();
    setLoading(productId, true);
    try {
      const updated = await removeCartItem(productId);
      set({ cartProducts: updated });
    } catch (error) {
      console.error("Failed to remove item:", error);
    } finally {
      clearLoading(productId);
    }
  },

  setLoading: (productId, value) =>
    set((state) => ({
      loading: { ...state.loading, [productId]: value },
    })),

  clearLoading: (productId) =>
    set((state) => {
      const { [productId]: _, ...rest } = state.loading;
      return { loading: rest };
    }),

  isLoading: (productId) => !!get().loading[productId],

  getSubtotal: () =>
    get().cartProducts.reduce(
      (sum, p) => sum + p.price * (p.quantity || 1),
      0
    ),

  getTotalItems: () =>
    get().cartProducts.reduce((sum, p) => sum + (p.quantity || 1), 0),
}));