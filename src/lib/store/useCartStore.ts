import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartStore, CartItem } from '@/types/cart';
import { SyntheticProduct } from '@/types/product';

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      setHasHydrated: (status: boolean) => set({ hasHydrated: status }),

      addItem: (product: SyntheticProduct, quantity: number = 1) => {
        const { items } = get();
        const existingIndex = items.findIndex(item => item.product.id === product.id);

        if (existingIndex > -1) {
          const currentQty = items[existingIndex].quantity;
          const newQty = Math.min(product.maxOrderQuantity || 5, currentQty + quantity);
          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: newQty,
          };
          set({ items: updatedItems });
        } else {
          const initialQty = Math.min(product.maxOrderQuantity || 5, Math.max(1, quantity));
          set({ items: [...items, { product, quantity: initialQty }] });
        }
      },

      removeItem: (productId: string) => {
        set({ items: get().items.filter(item => item.product.id !== productId) });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const updatedItems = get().items.map(item => {
          if (item.product.id === productId) {
            const capped = Math.min(item.product.maxOrderQuantity || 5, quantity);
            return { ...item, quantity: capped };
          }
          return item;
        });
        set({ items: updatedItems });
      },

      clearCart: () => set({ items: [] }),

      swapItem: (currentProductId: string, substituteProduct: SyntheticProduct) => {
        const { items } = get();
        const currentItem = items.find(item => item.product.id === currentProductId);
        if (!currentItem) return;

        const qty = currentItem.quantity;
        const newItems = items.map(item => {
          if (item.product.id === currentProductId) {
            return {
              product: substituteProduct,
              quantity: Math.min(substituteProduct.maxOrderQuantity || 5, qty),
            };
          }
          return item;
        });
        set({ items: newItems });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const price = item.product.salePriceEgp ?? item.product.priceEgp;
          return sum + price * item.quantity;
        }, 0);
      },

      getDeliveryFee: (freeThreshold: number = 300, standardFee: number = 25) => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        return subtotal >= freeThreshold ? 0 : standardFee;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        return subtotal + get().getDeliveryFee();
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      hasPrescriptionItems: () => {
        return get().items.some(item => item.product.prescriptionRequired);
      },
    }),
    {
      name: 'dawaak-cart-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
