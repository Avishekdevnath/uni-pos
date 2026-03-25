import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/use-auth';
import { useCart } from '../hooks/use-cart';
import {
  ApiError,
  addOrderItem,
  completeOrder,
  createDraftOrder,
  fetchProducts,
  type PosOrder,
} from '../lib/api';
import {
  clearCheckoutIntent,
  getOrCreateCheckoutIntent,
  setCheckoutIntentOrderId,
} from '../lib/idempotency';

function currency(amount: number, code: string) {
  return `${code} ${amount.toFixed(2)}`;
}

export function TerminalHome() {
  const { user, branch, tenant, role, permissions, logout } = useAuth();
  const { state, dispatch, totals } = useCart();
  const [search, setSearch] = useState('');
  const [receipt, setReceipt] = useState<PosOrder | null>(null);

  const cartSignature = useMemo(
    () =>
      JSON.stringify(
        state.items.map((item) => ({
          p: item.productId,
          q: item.quantity,
          u: item.unitPrice,
        })),
      ),
    [state.items],
  );

  const productQuery = useQuery({
    queryKey: ['pos-products', branch?.id, search],
    enabled: !!branch?.id,
    queryFn: () =>
      fetchProducts({
        branchId: branch?.id,
        search,
        page: 1,
        pageSize: 20,
      }),
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!branch?.id) {
        throw new Error('No branch available for checkout.');
      }

      if (state.items.length === 0) {
        throw new Error('Cart is empty. Add products first.');
      }

      const intent = getOrCreateCheckoutIntent(cartSignature);
      let orderId = intent.orderId;

      if (!orderId) {
        const order = await createDraftOrder({
          branch_id: branch.id,
          client_event_id: crypto.randomUUID(),
        });

        orderId = order.id;
        setCheckoutIntentOrderId(cartSignature, orderId);

        for (const item of state.items) {
          await addOrderItem(order.id, {
            product_id: item.productId,
            quantity: item.quantity,
          });
        }
      }

      if (!orderId) {
        throw new Error('Failed to initialize checkout order.');
      }

      try {
        const completed = await completeOrder(
          orderId,
          {
            client_event_id: intent.key,
            payments: [
              {
                method: 'cash',
                amount: totals.subtotal,
                cash_tendered: totals.subtotal,
                client_event_id: intent.key,
              },
            ],
          },
          intent.key,
        );

        return completed;
      } finally {
        clearCheckoutIntent();
      }
    },
    onSuccess: (order) => {
      setReceipt(order);
      dispatch({ type: 'SET_COMPLETED_ORDER', orderId: order.id });
      dispatch({ type: 'SET_PHASE', phase: 'receipt' });
      dispatch({ type: 'CLEAR_CART' });
    },
  });

  const products = productQuery.data?.items ?? [];
  const checkoutError = (() => {
    if (!checkoutMutation.error) {
      return null;
    }

    if (checkoutMutation.error instanceof ApiError && checkoutMutation.error.status === 409) {
      return 'Checkout conflict detected. Please refresh cart and verify last receipt before retrying.';
    }

    return checkoutMutation.error instanceof Error ? checkoutMutation.error.message : 'Checkout failed.';
  })();

  return (
    <div className="terminal">
      <header className="terminal-header">
        <div>
          <h2>uniPOS Terminal</h2>
          <p className="muted">
            {branch?.name ?? 'No Branch'} • {tenant?.name ?? 'No Tenant'}
          </p>
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      <div className="grid">
        <section className="card">
          <h3>Cashier Session</h3>
          <p><strong>User:</strong> {user?.fullName ?? '-'}</p>
          <p><strong>Role:</strong> {role?.name ?? '-'}</p>
          <p><strong>Permissions:</strong> {permissions.length}</p>
        </section>

        <section className="card">
          <h3>Product Discovery</h3>
          <input
            placeholder="Search name/SKU/barcode"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="stack" style={{ marginTop: 10 }}>
            {productQuery.isLoading && <p className="muted">Loading products...</p>}
            {!productQuery.isLoading && products.length === 0 && (
              <p className="muted">No products found.</p>
            )}
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() =>
                  dispatch({
                    type: 'ADD_ITEM',
                    item: {
                      productId: product.id,
                      name: product.name,
                      quantity: 1,
                      unitPrice: Number(product.price),
                    },
                  })
                }
              >
                + {product.name} ({currency(Number(product.price), tenant?.defaultCurrency ?? 'BDT')})
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>Cart + Checkout</h3>
          {state.items.length === 0 && <p className="muted">Cart is empty.</p>}
          <div className="stack">
            {state.items.map((item) => (
              <div key={item.productId}>
                <p>
                  <strong>{item.name}</strong>
                </p>
                <p className="muted">
                  {item.quantity} × {currency(item.unitPrice, tenant?.defaultCurrency ?? 'BDT')}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() =>
                      dispatch({
                        type: 'UPDATE_QTY',
                        productId: item.productId,
                        quantity: item.quantity + 1,
                      })
                    }
                  >
                    +
                  </button>
                  <button
                    onClick={() =>
                      dispatch({
                        type: 'UPDATE_QTY',
                        productId: item.productId,
                        quantity: item.quantity - 1,
                      })
                    }
                  >
                    -
                  </button>
                  <button onClick={() => dispatch({ type: 'REMOVE_ITEM', productId: item.productId })}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 12 }}>
            <strong>Items:</strong> {totals.itemCount}
          </p>
          <p>
            <strong>Subtotal:</strong> {currency(totals.subtotal, tenant?.defaultCurrency ?? 'BDT')}
          </p>

          {checkoutError && <p className="error">{checkoutError}</p>}

          <button
            disabled={checkoutMutation.isPending || totals.itemCount === 0}
            onClick={() => checkoutMutation.mutate()}
          >
            {checkoutMutation.isPending ? 'Processing...' : 'Complete Cash Sale'}
          </button>
        </section>

        <section className="card">
          <h3>Receipt Snapshot</h3>
          {!receipt && <p className="muted">No completed sale yet in this session.</p>}
          {receipt && (
            <>
              <p><strong>Order ID:</strong> {receipt.id}</p>
              <p><strong>Order Number:</strong> {receipt.orderNumber ?? '-'}</p>
              <p><strong>Status:</strong> {receipt.status}</p>
              <p>
                <strong>Total:</strong> {currency(Number(receipt.totalAmount), tenant?.defaultCurrency ?? 'BDT')}
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
