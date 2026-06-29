import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "../../product-data";
import {
  addCartItem,
  updateCartQuantity,
  removeCartItem,
  fetchCartItems,
  mergeGuestCart,
} from "../api/cart";

type LoadingMap = Record<string, boolean>;

interface CartState {
  cartProducts: Product[];
  guestCart: Product[];
  isAuthenticated: boolean;
  loading: LoadingMap;

  setAuthenticated: (value: boolean) => Promise<void>;
  setCart: (products: Product[]) => void;
  fetchCart: () => Promise<void>;
  addToCart: (product: Product) => Promise<void>;
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
      guestCart: [],
      isAuthenticated: false,
      loading: {},

      setAuthenticated: async (value) => {
        set({ isAuthenticated: value });

        if (!value) {
          set({ cartProducts: get().guestCart });
          return;
        }
        const guestItems = get().guestCart;
        if (guestItems.length > 0) {
          set({ guestCart: [] });
          try {
            const merged = await mergeGuestCart(
              guestItems.map((p) => ({
                productId: p.id,
                quantity: p.quantity || 1,
              }))
            );
            set({ cartProducts: merged });
            return;
          } catch (err) {
            console.error("Failed to merge guest cart:", err);
          }
        }

        await get().fetchCart();
      },

      setCart: (products) => set({ cartProducts: products }),

      fetchCart: async () => {
        if (!get().isAuthenticated) {
          set({ cartProducts: get().guestCart });
          return;
        }
        try {
          const cartProducts = await fetchCartItems();
          set({ cartProducts });
        } catch (err) {
          console.error("Failed to fetch cart:", err);
        }
      },

      addToCart: async (product) => {
        if (!get().isAuthenticated) {
          const current = get().guestCart;
          const index = current.findIndex((p) => p.id === product.id);
          const next =
            index >= 0
              ? current.map((p, i) =>
                  i === index ? { ...p, quantity: (p.quantity || 1) + 1 } : p
                )
              : [...current, { ...product, quantity: 1 }];
          set({ guestCart: next, cartProducts: next });
          return;
        }

        const { setLoading, clearLoading } = get();
        setLoading(product.id, true);
        try {
          const updated = await addCartItem(product.id);
          set({ cartProducts: updated });
        } catch (err) {
          console.error("Failed to add item:", err);
        } finally {
          clearLoading(product.id);
        }
      },

      updateQuantity: async (productId, quantity) => {
        if (!get().isAuthenticated) {
          const next = get()
            .guestCart.map((p) => (p.id === productId ? { ...p, quantity } : p))
            .filter((p) => (p.quantity || 0) > 0);
          set({ guestCart: next, cartProducts: next });
          return;
        }

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
        if (!get().isAuthenticated) {
          const next = get().guestCart.filter((p) => p.id !== productId);
          set({ guestCart: next, cartProducts: next });
          return;
        }

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
    }),
    {
      name: "styleshop-guest-cart",
      partialize: (state) => ({ guestCart: state.guestCart }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.isAuthenticated) {
          state.cartProducts = state.guestCart;
        }
      },
    }
  )
);
