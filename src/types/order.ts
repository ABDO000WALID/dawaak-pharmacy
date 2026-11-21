export interface DawaakOrderItem {
  id: string;
  nameAr: string;
  nameEn: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image: string;
  packSizeAr?: string;
  packSize?: string;
}

export interface DawaakOrder {
  id: string; // e.g. "#DWK-8492"
  orderId: string; // alias for robustness
  items: DawaakOrderItem[];
  quantities: number; // total units count
  governorate: string; // governorate id
  governorateNameAr: string;
  governorateNameEn: string;
  shippingFee: number;
  subtotal: number;
  grandTotal: number;
  total: number; // alias
  timestamp: string; // ISO string
  formattedTime: string; // e.g. "10:30 م"
  status: 'قيد التجهيز';
  statusEn: 'In Preparation';
  expectedDeliveryTime: string; // e.g. "خلال 2 أيام عمل"
  expectedDeliveryDays: number;
  customerName: string;
  customerPhone: string;
  streetAddress: string;
  paymentMethod: 'cod' | 'instapay' | 'wallet';
  requiresRx?: boolean;
}

export const ORDERS_STORAGE_KEY = 'dawaak_mock_orders';

/**
 * Retrieve saved mock orders from localStorage as a raw JSON array.
 */
export function getStoredOrders(): DawaakOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read orders from localStorage:', err);
    return [];
  }
}

/**
 * Persist an order to localStorage under dawaak_mock_orders as a raw JSON array.
 */
export function saveStoredOrder(order: DawaakOrder): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredOrders();
    const updated = [order, ...existing];
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('dawaak_orders_updated'));
  } catch (err) {
    console.error('Failed to save order to localStorage:', err);
  }
}

/**
 * Clear all stored orders from localStorage.
 */
export function clearStoredOrders(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
    window.dispatchEvent(new Event('dawaak_orders_updated'));
  } catch (err) {
    console.error('Failed to clear orders from localStorage:', err);
  }
}
