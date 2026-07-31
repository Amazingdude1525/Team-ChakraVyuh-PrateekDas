import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import { ConfirmDialog } from '../ui/Overlay';
import { BRANCHES } from '../../data/cafes';
import type { CartItem } from '../../types';

/**
 * The cart holds one cafe at a time — a single order cannot be split across two
 * counters, because it is collected from one of them. This provider is the one
 * place that enforces that, so every "Add" button in the app behaves the same:
 * it either adds, or it asks whether to start a new cart.
 */

interface CartGuardValue {
  /** Adds the line, prompting first if the cart belongs to a different cafe. */
  requestAdd: (line: Omit<CartItem, 'lineId'>) => void;
}

const CartGuardContext = createContext<CartGuardValue | null>(null);

export function CartGuardProvider({ children }: { children: ReactNode }) {
  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const clearCart = useStore((s) => s.clearCart);

  const [pending, setPending] = useState<Omit<CartItem, 'lineId'> | null>(null);

  const commit = useCallback(
    (line: Omit<CartItem, 'lineId'>) => {
      addToCart(line);
      toast.success(`${line.name} added`, { id: `add-${line.itemId}` });
    },
    [addToCart],
  );

  const requestAdd = useCallback(
    (line: Omit<CartItem, 'lineId'>) => {
      const currentBranch = cart[0]?.branchId;
      if (currentBranch && currentBranch !== line.branchId) {
        setPending(line);
        return;
      }
      commit(line);
    },
    [cart, commit],
  );

  const value = useMemo(() => ({ requestAdd }), [requestAdd]);

  const currentBranchName =
    BRANCHES.find((b) => b.id === cart[0]?.branchId)?.name ?? 'another cafe';
  const nextBranchName = BRANCHES.find((b) => b.id === pending?.branchId)?.name ?? 'this cafe';

  return (
    <CartGuardContext.Provider value={value}>
      {children}

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        title="Start a new cart?"
        body={`Your cart has items from ${currentBranchName}. An order is collected from one counter, so adding ${nextBranchName} items will clear what is there now.`}
        confirmLabel="Clear and add"
        cancelLabel="Keep my cart"
        destructive
        onConfirm={() => {
          if (!pending) return;
          clearCart();
          commit(pending);
          setPending(null);
        }}
      />
    </CartGuardContext.Provider>
  );
}

export function useCartGuard(): CartGuardValue {
  const ctx = useContext(CartGuardContext);
  if (!ctx) throw new Error('useCartGuard must be used inside CartGuardProvider');
  return ctx;
}
