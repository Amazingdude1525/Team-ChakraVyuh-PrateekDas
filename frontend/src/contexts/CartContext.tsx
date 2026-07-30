import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartItem, MenuItem } from '../lib/types';
import toast from 'react-hot-toast';

interface CartContextType {
  items: CartItem[];
  vendorId: string | null;
  vendorName: string | null;
  itemCount: number;
  total: number;
  addItem: (menuItem: MenuItem, size: 'full' | 'half', vendorId: string, vendorName: string) => void;
  removeItem: (menuItemId: string, size: 'full' | 'half') => void;
  updateQuantity: (menuItemId: string, size: 'full' | 'half', quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'vitebites_cart';
const VENDOR_STORAGE_KEY = 'vitebites_cart_vendor';

function loadCartFromStorage(): { items: CartItem[]; vendorId: string | null; vendorName: string | null } {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    const vendor = localStorage.getItem(VENDOR_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const vendorData = vendor ? JSON.parse(vendor) : null;
      return {
        items: parsed,
        vendorId: vendorData?.id || null,
        vendorName: vendorData?.name || null,
      };
    }
  } catch {
    // ignore
  }
  return { items: [], vendorId: null, vendorName: null };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadCartFromStorage();
    setItems(stored.items);
    setVendorId(stored.vendorId);
    setVendorName(stored.vendorName);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    localStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify({ id: vendorId, name: vendorName }));
  }, [items, vendorId, vendorName]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const total = items.reduce((sum, item) => {
    const price = item.size === 'half' && item.menu_item.price_half
      ? item.menu_item.price_half
      : item.menu_item.price_full;
    return sum + price * item.quantity;
  }, 0);

  const addItem = (menuItem: MenuItem, size: 'full' | 'half', newVendorId: string, newVendorName: string) => {
    // Enforce single-vendor cart
    if (vendorId && vendorId !== newVendorId) {
      toast((t) => (
        <div className="flex flex-col gap-2">
          <p className="font-medium">Replace cart items?</p>
          <p className="text-sm text-text-secondary">
            Your cart has items from <strong>{vendorName}</strong>. Adding this will clear those items.
          </p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium"
              onClick={() => {
                setItems([{ menu_item: menuItem, size, quantity: 1, vendor_id: newVendorId }]);
                setVendorId(newVendorId);
                setVendorName(newVendorName);
                toast.dismiss(t.id);
                toast.success('Cart updated!');
              }}
            >
              Replace
            </button>
            <button
              className="px-3 py-1.5 bg-gray-200 rounded-lg text-sm font-medium"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      ), { duration: 10000 });
      return;
    }

    setVendorId(newVendorId);
    setVendorName(newVendorName);

    setItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.menu_item.id === menuItem.id && i.size === size
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }

      return [...prev, { menu_item: menuItem, size, quantity: 1, vendor_id: newVendorId }];
    });

    toast.success(`Added ${menuItem.name} (${size})`, { duration: 1500 });
  };

  const removeItem = (menuItemId: string, size: 'full' | 'half') => {
    setItems(prev => {
      const filtered = prev.filter(
        i => !(i.menu_item.id === menuItemId && i.size === size)
      );
      if (filtered.length === 0) {
        setVendorId(null);
        setVendorName(null);
      }
      return filtered;
    });
  };

  const updateQuantity = (menuItemId: string, size: 'full' | 'half', quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId, size);
      return;
    }

    setItems(prev =>
      prev.map(item =>
        item.menu_item.id === menuItemId && item.size === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setVendorId(null);
    setVendorName(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        vendorId,
        vendorName,
        itemCount,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
