import { SyntheticProduct } from './product';

export interface CartItem {
  product: SyntheticProduct;
  quantity: number;
}

export interface CartStore {
  items: CartItem[];
  hasHydrated: boolean;
  setHasHydrated: (status: boolean) => void;
  addItem: (product: SyntheticProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  swapItem: (currentProductId: string, substituteProduct: SyntheticProduct) => void;
  getSubtotal: () => number;
  getDeliveryFee: (freeThreshold?: number, standardFee?: number) => number;
  getTotal: () => number;
  getItemCount: () => number;
  hasPrescriptionItems: () => boolean;
}
