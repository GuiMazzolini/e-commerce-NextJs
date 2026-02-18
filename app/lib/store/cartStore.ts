import { create } from "zustand";
import { Product } from "../../product-data";
import { updateCartQuantity, removeCartItem } from "../api/cart";

type LoadingMap = Record<string, boolean>;

interface CartState {
  cartProducts: Product[];
  loading: LoadingMap;
  setCart: (products: Product[]) => void;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  isLoading: (productId: string) => boolean;
  setLoading: (productId: string, value: boolean) => void;
  clearLoading: (productId: string) => void;
  getSubtotal: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cartProducts: [],
  loading: {},

  setCart: (products) => set({ cartProducts: products }),

  setLoading: (productId: string, value: boolean) => {
    set((state) => ({
      loading: {
        ...state.loading,
        [productId]: value,
      },
    }));
  },

  clearLoading: (productId: string) => {
    set((state) => {
      const { [productId]: _, ...rest } = state.loading;
      return { loading: rest };
    });
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

  isLoading: (productId) => {
    return !!get().loading[productId];
  },

  getSubtotal: () => {
    return get().cartProducts.reduce(
      (sum, p) => sum + p.price * (p.quantity || 1),
      0
    );
  },

  getTotalItems: () => {
    return get().cartProducts.reduce(
      (sum, p) => sum + (p.quantity || 1),
      0
    );
  },
}));
