import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, ChefHat, Clock, CheckCircle2, RefreshCw, WifiOff,
  Package, Utensils, Plus, Pencil, Percent, TrendingUp,
  Users, Ban
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Order, OrderItem, MenuItem, Vendor } from '../../lib/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../lib/constants';
import VegIndicator from '../../components/ui/VegIndicator';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

type OrderWithItems = Order & {
  order_items: (OrderItem & { menu_item: MenuItem })[];
};

type CounterTab = 'orders' | 'menu' | 'insights';

// ============ RELATIVE TIME HOOK ============
function useRelativeTime(dateStr: string) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function ElapsedBadge({ createdAt }: { createdAt: string }) {
  const text = useRelativeTime(createdAt);
  const diff = (Date.now() - new Date(createdAt).getTime()) / 1000;
  const color = diff > 600 ? '#EF4444' : diff > 300 ? '#F59E0B' : '#9A9AB0';
  return (
    <span className="flex items-center gap-1 text-xs font-medium" style={{ color }}>
      <Clock size={11} /> {text}
    </span>
  );
}

// ============ MAIN COUNTER COMPONENT ============
export default function Counter() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CounterTab>('orders');
  const [orderFilter, setOrderFilter] = useState<'placed' | 'preparing' | 'ready' | 'completed'>('placed');
  const [isConnected, setIsConnected] = useState(true);
  const [disabledButtons, setDisabledButtons] = useState<Set<string>>(new Set());

  // Menu management state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [dailyInsights, setDailyInsights] = useState<any[]>([]);

  const channelRef = useRef<any>(null);

  // ============ DATA FETCHING ============
  const fetchVendor = useCallback(async () => {
    const { data } = await supabase.from('vendors').select('*').eq('id', vendorId!).single();
    if (data) setVendor(data as Vendor);
  }, [vendorId]);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_item:menu_items(*))')
      .eq('vendor_id', vendorId!)
      .in('status', ['placed', 'preparing', 'ready', 'completed'])
      .order('created_at', { ascending: true });
    if (data) setOrders(data as any);
    setLoading(false);
  }, [vendorId]);

  const fetchMenuItems = useCallback(async () => {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('vendor_id', vendorId!)
      .order('category')
      .order('name');
    if (data) setMenuItems(data as MenuItem[]);
  }, [vendorId]);

  const fetchDailyInsights = useCallback(async () => {
    const { data } = await supabase
      .from('daily_item_sales')
      .select('*')
      .eq('vendor_id', vendorId!)
      .order('total_sold', { ascending: false })
      .limit(20);
    if (data) setDailyInsights(data);
  }, [vendorId]);

  // ============ REALTIME ============
  useEffect(() => {
    if (!vendorId) return;

    fetchVendor();
    fetchOrders();
    fetchMenuItems();

    const channel = supabase
      .channel(`counter-${vendorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `vendor_id=eq.${vendorId}` }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items', filter: `vendor_id=eq.${vendorId}` }, () => fetchMenuItems())
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, fetchVendor, fetchOrders, fetchMenuItems]);

  // ============ ORDER ACTIONS (debounced) ============
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (disabledButtons.has(orderId)) return;

    setDisabledButtons(prev => new Set(prev).add(orderId));

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update order status');
    } else {
      toast.success(`→ ${ORDER_STATUS_LABELS[newStatus as keyof typeof ORDER_STATUS_LABELS]}`);
      fetchOrders();
    }

    // Re-enable after 800ms debounce
    setTimeout(() => {
      setDisabledButtons(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }, 800);
  };

  // ============ VENDOR OPEN/CLOSE TOGGLE ============
  const toggleVendorOpen = async () => {
    if (!vendor) return;
    const { error } = await supabase
      .from('vendors')
      .update({ is_open: !vendor.is_open })
      .eq('id', vendor.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      setVendor({ ...vendor, is_open: !vendor.is_open });
      toast.success(vendor.is_open ? 'Cafe marked as CLOSED' : 'Cafe is now OPEN');
    }
  };

  // ============ MENU ITEM AVAILABILITY TOGGLE ============
  const toggleItemAvailability = async (item: MenuItem) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ available: !item.available })
      .eq('id', item.id);

    if (error) {
      toast.error('Failed to update item');
    } else {
      toast.success(item.available ? `${item.name} marked Sold Out` : `${item.name} is Available`);
      fetchMenuItems();
    }
  };

  // ============ MENU ITEM EDIT ============
  const saveMenuItemEdit = async (itemData: Partial<MenuItem> & { id?: string }) => {
    if (itemData.id) {
      // Update existing
      const { error } = await supabase
        .from('menu_items')
        .update({
          name: itemData.name,
          description: itemData.description,
          category: itemData.category,
          veg: itemData.veg,
          price_full: itemData.price_full,
          price_half: itemData.price_half,
        })
        .eq('id', itemData.id);

      if (error) {
        toast.error('Failed to update item');
        return;
      }
      toast.success('Item updated');
    } else {
      // Insert new
      const { error } = await supabase
        .from('menu_items')
        .insert({
          vendor_id: vendorId!,
          name: itemData.name || 'New Item',
          description: itemData.description || null,
          category: itemData.category || 'Other',
          veg: itemData.veg ?? true,
          price_full: itemData.price_full || 0,
          price_half: itemData.price_half || null,
        });

      if (error) {
        toast.error('Failed to add item');
        return;
      }
      toast.success('New item added');
    }
    fetchMenuItems();
    setEditingItem(null);
    setShowAddItem(false);
  };

  // ============ FLASH DISCOUNT ============
  const setFlashDiscount = async (menuItemId: string, percent: number) => {
    const { error } = await (supabase as any).rpc('set_flash_discount', {
      p_menu_item_id: menuItemId,
      p_discount_percent: percent,
    });

    if (error) {
      toast.error(error.message || 'Cannot set flash discount');
    } else {
      toast.success(percent > 0 ? `Flash ${percent}% OFF activated!` : 'Discount removed');
      fetchMenuItems();
    }
  };

  // ============ FILTER ============
  const filteredOrders = orders.filter(o => o.status === orderFilter);
  const statusCounts = {
    placed: orders.filter(o => o.status === 'placed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  const getNextStatus = (current: string): string | null => {
    const flow = ['placed', 'preparing', 'ready', 'completed'];
    const idx = flow.indexOf(current);
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ============ RECONNECTION BANNER ============ */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ y: -40 }}
            animate={{ y: 0 }}
            exit={{ y: -40 }}
            className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-2 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <WifiOff size={16} /> Reconnecting to live orders...
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ HEADER ============ */}
      <div className="sticky top-0 z-40 bg-primary text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/select-role')} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-base font-bold flex items-center gap-2">
                {vendor?.name || 'Counter'}
                {/* Open/Close toggle */}
                <button
                  onClick={toggleVendorOpen}
                  className={`ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    vendor?.is_open
                      ? 'bg-green-400/20 text-green-100 hover:bg-green-400/30'
                      : 'bg-red-400/20 text-red-200 hover:bg-red-400/30'
                  }`}
                >
                  {vendor?.is_open ? '● OPEN' : '○ CLOSED'}
                </button>
              </h1>
              <p className="text-xs opacity-80">{vendor?.location}</p>
            </div>
          </div>
          <button onClick={() => { fetchOrders(); fetchMenuItems(); }} className="p-2 rounded-lg hover:bg-white/10 cursor-pointer">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Main tabs */}
        <div className="max-w-5xl mx-auto px-4 pb-2 flex gap-1">
          {([
            { key: 'orders' as const, icon: Package, label: 'Orders' },
            { key: 'menu' as const, icon: Utensils, label: 'Menu' },
            { key: 'insights' as const, icon: TrendingUp, label: 'Insights' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === 'insights') fetchDailyInsights();
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-t-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-background text-primary'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <tab.icon size={15} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* ============ ORDERS TAB ============ */}
        {activeTab === 'orders' && (
          <div>
            {/* Status filter pills */}
            <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
              {([
                { key: 'placed' as const, label: 'New', emoji: '🔔' },
                { key: 'preparing' as const, label: 'Preparing', emoji: '🍳' },
                { key: 'ready' as const, label: 'Ready', emoji: '✅' },
                { key: 'completed' as const, label: 'Done', emoji: '📦' },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setOrderFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    orderFilter === tab.key
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white text-text-secondary border border-border-light hover:border-primary'
                  }`}
                >
                  {tab.emoji} {tab.label}
                  {statusCounts[tab.key] > 0 && (
                    <span className={`min-w-[20px] h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      orderFilter === tab.key ? 'bg-white/25 text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      {statusCounts[tab.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Order cards */}
            <div className="px-4 pb-8 space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map(order => {
                  const nextStatus = getNextStatus(order.status);
                  return (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: 100 }}
                      transition={{ type: 'spring', damping: 22, stiffness: 250 }}
                      className="bg-white rounded-2xl p-4 shadow-card border border-border-light"
                    >
                      {/* Card header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="bg-primary text-white font-black text-xl px-3.5 py-1.5 rounded-xl shadow-sm">
                            #{order.token_number || '—'}
                          </span>
                          <div>
                            <ElapsedBadge createdAt={order.created_at} />
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: ORDER_STATUS_COLORS[order.status] + '15',
                                  color: ORDER_STATUS_COLORS[order.status],
                                }}
                              >
                                {ORDER_STATUS_LABELS[order.status]}
                              </span>
                              {order.payment_status === 'captured' && (
                                <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-semibold">
                                  💳 Paid
                                </span>
                              )}
                              {order.is_group_order && (
                                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                                  <Users size={10} /> Group
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="font-bold text-text-primary text-lg">₹{order.total_amount}</span>
                      </div>

                      {/* Customer note */}
                      {order.customer_note && (
                        <div className="bg-amber-50 rounded-lg px-3 py-2 mb-3 text-xs text-amber-700">
                          <span className="font-semibold">Note:</span> {order.customer_note}
                        </div>
                      )}

                      {/* Items */}
                      <div className="space-y-1.5 mb-4">
                        {order.order_items.map(item => (
                          <div key={item.id} className="flex items-center gap-2 text-sm">
                            <VegIndicator veg={item.menu_item?.veg ?? true} size="sm" />
                            <span className="flex-1 text-text-primary truncate font-medium">
                              {item.menu_item?.name || 'Item'}
                            </span>
                            <span className="text-text-muted capitalize text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {item.size}
                            </span>
                            <span className="font-bold text-text-primary">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        {nextStatus && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => updateOrderStatus(order.id, nextStatus)}
                            disabled={disabledButtons.has(order.id)}
                            isLoading={disabledButtons.has(order.id)}
                          >
                            {nextStatus === 'preparing' && <ChefHat size={16} />}
                            {nextStatus === 'ready' && <CheckCircle2 size={16} />}
                            {nextStatus === 'completed' && <CheckCircle2 size={16} />}
                            → {ORDER_STATUS_LABELS[nextStatus as keyof typeof ORDER_STATUS_LABELS]}
                          </Button>
                        )}
                        {order.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateOrderStatus(order.id, 'cancelled_other')}
                            className="text-nonveg hover:bg-red-50"
                            disabled={disabledButtons.has(order.id)}
                          >
                            <Ban size={14} /> Cancel
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Empty state */}
              {filteredOrders.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <span className="text-5xl mb-4 block">
                    {orderFilter === 'placed' ? '☕' : orderFilter === 'preparing' ? '🍳' : orderFilter === 'ready' ? '✨' : '📦'}
                  </span>
                  <h3 className="text-lg font-bold text-text-primary mb-1">
                    {orderFilter === 'placed' ? 'No new orders' : `No ${orderFilter} orders`}
                  </h3>
                  <p className="text-sm text-text-muted">
                    {orderFilter === 'placed'
                      ? "You're all caught up — nice work! 🎉"
                      : `No orders in ${orderFilter} state right now.`}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* ============ MENU MANAGEMENT TAB ============ */}
        {activeTab === 'menu' && (
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-text-primary">
                Menu Items ({menuItems.length})
              </h2>
              <Button size="sm" onClick={() => setShowAddItem(true)}>
                <Plus size={14} /> Add Item
              </Button>
            </div>

            {/* Flash discount info */}
            {vendor?.closing_time && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
                <Percent size={14} className="inline mr-1" />
                <strong>Flash Discounts</strong> are available within 45 min of closing time ({vendor.closing_time.slice(0, 5)}).
                Server-enforced time gate.
              </div>
            )}

            {/* Menu grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {menuItems.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  className={`bg-white rounded-xl p-3 border transition-all ${
                    item.available ? 'border-border-light' : 'border-red-200 bg-red-50/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Image / emoji */}
                    <div className="w-14 h-14 rounded-lg bg-primary-light flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        item.veg ? '🥗' : '🍗'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <VegIndicator veg={item.veg} size="sm" />
                        <span className="font-semibold text-sm text-text-primary truncate">{item.name}</span>
                      </div>
                      <p className="text-xs text-text-muted">{item.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-text-primary">₹{item.price_full}</span>
                        {item.price_half && <span className="text-xs text-text-muted">Half ₹{item.price_half}</span>}
                        {item.flash_discount_percent > 0 && (
                          <span className="text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded">
                            {item.flash_discount_percent}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {/* Availability toggle */}
                      <button
                        onClick={() => toggleItemAvailability(item)}
                        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                          item.available ? 'bg-green-400' : 'bg-red-300'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          item.available ? 'left-5.5' : 'left-0.5'
                        }`} />
                      </button>
                      <span className="text-[10px] font-semibold text-text-muted">
                        {item.available ? 'Available' : 'Sold Out'}
                      </span>
                      {/* Edit */}
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1 text-text-muted hover:text-primary cursor-pointer"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ============ DAILY INSIGHTS TAB ============ */}
        {activeTab === 'insights' && (
          <div className="px-4 py-4">
            <h2 className="text-base font-bold text-text-primary mb-1">Today's Sales</h2>
            <p className="text-xs text-text-muted mb-4">Items sold today, ranked by volume</p>

            {dailyInsights.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <TrendingUp size={48} className="mx-auto mb-3 opacity-20" />
                <p>No sales data for today yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dailyInsights.map((item, i) => (
                  <motion.div
                    key={item.menu_item_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-xl p-3 border border-border-light flex items-center gap-3"
                  >
                    <span className="text-lg font-black text-text-muted w-8 text-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-text-primary truncate">{item.item_name}</p>
                      <p className="text-xs text-text-muted">{item.category} · {item.order_count} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{item.total_sold} sold</p>
                      <p className="text-xs text-text-muted">₹{Math.round(item.total_revenue)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============ EDIT ITEM MODAL ============ */}
      <Modal
        isOpen={!!editingItem || showAddItem}
        onClose={() => { setEditingItem(null); setShowAddItem(false); }}
        title={editingItem ? 'Edit Item' : 'Add New Item'}
      >
        <MenuItemForm
          item={editingItem}
          onSave={saveMenuItemEdit}
          onCancel={() => { setEditingItem(null); setShowAddItem(false); }}
          onFlashDiscount={editingItem ? setFlashDiscount : undefined}
        />
      </Modal>
    </div>
  );
}

// ============ MENU ITEM EDIT FORM ============
function MenuItemForm({
  item,
  onSave,
  onCancel,
  onFlashDiscount,
}: {
  item: MenuItem | null;
  onSave: (data: Partial<MenuItem> & { id?: string }) => void;
  onCancel: () => void;
  onFlashDiscount?: (menuItemId: string, percent: number) => void;
}) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [category, setCategory] = useState(item?.category || '');
  const [veg, setVeg] = useState(item?.veg ?? true);
  const [priceFull, setPriceFull] = useState(String(item?.price_full || ''));
  const [priceHalf, setPriceHalf] = useState(String(item?.price_half || ''));
  const [flashPercent, setFlashPercent] = useState(String(item?.flash_discount_percent || 0));

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-text-secondary mb-1 block">Item Name</label>
        <input
          value={name} onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Item name"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-text-secondary mb-1 block">Description</label>
        <input
          value={description} onChange={e => setDescription(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Optional description"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1 block">Category</label>
          <input
            value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. Starters"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1 block">Type</label>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setVeg(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer ${veg ? 'bg-veg text-white' : 'bg-gray-100 text-text-secondary'}`}
            >
              🟢 Veg
            </button>
            <button
              onClick={() => setVeg(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer ${!veg ? 'bg-nonveg text-white' : 'bg-gray-100 text-text-secondary'}`}
            >
              🔴 Non-Veg
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1 block">Price Full (₹)</label>
          <input
            type="number" value={priceFull} onChange={e => setPriceFull(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1 block">Price Half (₹)</label>
          <input
            type="number" value={priceHalf} onChange={e => setPriceHalf(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Optional"
          />
        </div>
      </div>

      {/* Flash discount (only for existing items) */}
      {item && onFlashDiscount && (
        <div className="border-t border-border-light pt-4">
          <label className="text-sm font-medium text-text-secondary mb-1 block">
            <Percent size={13} className="inline mr-1" /> Flash Discount %
          </label>
          <div className="flex gap-2">
            <input
              type="number" min="0" max="50" value={flashPercent}
              onChange={e => setFlashPercent(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onFlashDiscount(item.id, Number(flashPercent))}
            >
              {Number(flashPercent) > 0 ? 'Set Discount' : 'Remove'}
            </Button>
          </div>
          <p className="text-[10px] text-text-muted mt-1">Server enforces: only within 45 min of closing.</p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={() => {
          onSave({
            id: item?.id,
            name,
            description: description || null,
            category: category || null,
            veg,
            price_full: Number(priceFull),
            price_half: priceHalf ? Number(priceHalf) : null,
          });
        }}>
          {item ? 'Save Changes' : 'Add Item'}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
