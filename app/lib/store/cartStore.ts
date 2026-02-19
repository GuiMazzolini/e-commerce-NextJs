import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartProducts: [],
      loading: {},

      setCart: (products) => set({ cartProducts: products }),

      setLoading: (productId, value) => {
        set((state) => ({
          loading: {
            ...state.loading,
            [productId]: value,
          },
        }));
      },

      clearLoading: (productId) => {
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

      isLoading: (productId) => !!get().loading[productId],

      getSubtotal: () =>
        get().cartProducts.reduce(
          (sum, p) => sum + p.price * (p.quantity || 1),
          0
        ),

      getTotalItems: () =>
        get().cartProducts.reduce(
          (sum, p) => sum + (p.quantity || 1),
          0
        ),
    }),
    {
      name: "cart-storage",

      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        cartProducts: state.cartProducts,
      }),
    }
  )
);
