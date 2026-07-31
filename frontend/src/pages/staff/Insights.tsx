import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { Clock3, Flame, TrendingUp, Zap } from 'lucide-react';
import { Card, Chip } from '../../components/ui/primitives';
import { useBranch, useMenuItems } from '../../hooks';
import { useStore } from '../../store/useStore';
import { cx, rupees } from '../../utils';

type Range = 'today' | '7days';

const COLORS = ['#F3A712', '#D95D39', '#196B45', '#A92F34', '#b08d4f', '#4a90a4'];

export default function StaffInsights() {
  const { cafeId } = useParams<{ cafeId: string }>();
  const branch = useBranch(cafeId);
  const items = useMenuItems(cafeId);
  const orders = useStore((s) => s.orders);

  const [range, setRange] = useState<Range>('today');

  const branchOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      if (o.branchId !== cafeId) return false;
      const placed = new Date(o.placedAt);
      if (range === 'today') return placed.toDateString() === now.toDateString();
      return now.getTime() - placed.getTime() < 7 * 86400000;
    });
  }, [orders, cafeId, range]);

  const completedOrders = useMemo(() => branchOrders.filter((o) => o.status === 'collected'), [branchOrders]);

  // KPIs
  const totalRevenue = completedOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = completedOrders.length;
  const avgPrepTime = useMemo(() => {
    if (completedOrders.length === 0) return 0;
    const total = completedOrders.reduce((s, o) => {
      const diff = new Date(o.pickupWindowEnd).getTime() - new Date(o.placedAt).getTime();
      return s + diff / 60000;
    }, 0);
    return Math.round(total / completedOrders.length);
  }, [completedOrders]);

  const topItemName = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of completedOrders) {
      for (const item of o.items) {
        counts[item.name] = (counts[item.name] || 0) + item.quantity;
      }
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? '—';
  }, [completedOrders]);

  // Orders by hour
  const ordersByHour = useMemo(() => {
    const hours: Record<number, number> = {};
    for (let h = 7; h <= 23; h++) hours[h] = 0;
    for (const o of branchOrders) {
      const h = new Date(o.placedAt).getHours();
      hours[h] = (hours[h] || 0) + 1;
    }
    return Object.entries(hours).map(([h, count]) => ({
      hour: `${h}:00`,
      orders: count,
    }));
  }, [branchOrders]);

  // Revenue trend (for 7-day)
  const revenueTrend = useMemo(() => {
    if (range !== '7days') return [];
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      days[d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })] = 0;
    }
    for (const o of completedOrders) {
      const key = new Date(o.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      if (key in days) days[key] += o.total;
    }
    return Object.entries(days).map(([date, revenue]) => ({ date, revenue }));
  }, [completedOrders, range]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, number> = {};
    for (const o of completedOrders) {
      for (const item of o.items) {
        const menuItem = items.find((i) => i.id === item.itemId);
        const catName = menuItem?.categoryId ?? 'Other';
        cats[catName] = (cats[catName] || 0) + item.quantity;
      }
    }
    return Object.entries(cats)
      .map(([name, value]) => ({ name: name.split('-').slice(1).join(' ') || name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [completedOrders, items]);

  // Dietary mix
  const dietaryMix = useMemo(() => {
    let veg = 0, egg = 0, nonveg = 0;
    for (const o of completedOrders) {
      for (const item of o.items) {
        if (item.diet === 'veg') veg += item.quantity;
        else if (item.diet === 'egg') egg += item.quantity;
        else nonveg += item.quantity;
      }
    }
    return [
      { name: 'Vegetarian', value: veg, color: '#196B45' },
      { name: 'Egg', value: egg, color: '#c8871c' },
      { name: 'Non-veg', value: nonveg, color: '#A92F34' },
    ].filter((d) => d.value > 0);
  }, [completedOrders]);

  // Top sellers
  const topSellers = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const o of completedOrders) {
      for (const item of o.items) {
        if (!counts[item.itemId]) counts[item.itemId] = { name: item.name, qty: 0, revenue: 0 };
        counts[item.itemId].qty += item.quantity;
        counts[item.itemId].revenue += item.unitPrice * item.quantity;
      }
    }
    return Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [completedOrders]);

  // Busiest hours
  const busiestHours = useMemo(
    () => [...ordersByHour].sort((a, b) => b.orders - a.orders).filter((h) => h.orders > 0).slice(0, 5),
    [ordersByHour],
  );

  if (!branch) return null;

  return (
    <div className="p-3 sm:p-5 max-w-[1400px] mx-auto space-y-5">
      {/* Range toggle */}
      <div className="flex items-center gap-2">
        {(['today', '7days'] as Range[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={cx(
              'px-4 h-9 rounded-[10px] text-[13px] font-medium transition-colors',
              range === r
                ? 'bg-[var(--color-charcoal)] text-white'
                : 'bg-[var(--color-cream)] text-[var(--color-ink-muted)] border border-[var(--color-beige)]',
            )}
          >
            {r === 'today' ? 'Today' : 'Last 7 days'}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Revenue', value: rupees(totalRevenue), icon: TrendingUp, accent: 'var(--color-saffron)' },
          { label: 'Orders', value: String(totalOrders), icon: Flame, accent: 'var(--color-terracotta)' },
          { label: 'Avg prep time', value: avgPrepTime ? `${avgPrepTime} min` : '—', icon: Clock3, accent: 'var(--color-brass)' },
          { label: 'Top item', value: topItemName, icon: Zap, accent: 'var(--color-veg)' },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4 flex items-start gap-3">
            <span className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0" style={{ background: kpi.accent + '18', color: kpi.accent }}>
              <kpi.icon size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[11.5px] text-[var(--color-ink-soft)]">{kpi.label}</p>
              <p className="text-[18px] font-semibold text-[var(--color-charcoal)] truncate leading-tight mt-0.5">{kpi.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Orders by hour */}
        <Card className="p-5">
          <h3 className="text-[14px] font-semibold text-[var(--color-charcoal)] mb-4">Orders by hour</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ordersByHour}>
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#948976' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#948976' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, borderColor: '#e8dcc8' }} />
              <Bar dataKey="orders" fill="#F3A712" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue trend (7-day only) or Category breakdown */}
        {range === '7days' ? (
          <Card className="p-5">
            <h3 className="text-[14px] font-semibold text-[var(--color-charcoal)] mb-4">Revenue trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8dcc8" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#948976' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#948976' }} axisLine={false} width={50} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, borderColor: '#e8dcc8' }} formatter={(v) => rupees(Number(v ?? 0))} />
                <Line type="monotone" dataKey="revenue" stroke="#D95D39" strokeWidth={2.5} dot={{ r: 4, fill: '#D95D39' }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        ) : (
          <Card className="p-5">
            <h3 className="text-[14px] font-semibold text-[var(--color-charcoal)] mb-4">Category breakdown</h3>
            {categoryBreakdown.length === 0 ? (
              <p className="text-[13px] text-[var(--color-ink-soft)] py-12 text-center">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        )}

        {/* Dietary mix */}
        <Card className="p-5">
          <h3 className="text-[14px] font-semibold text-[var(--color-charcoal)] mb-4">Dietary mix</h3>
          {dietaryMix.length === 0 ? (
            <p className="text-[13px] text-[var(--color-ink-soft)] py-12 text-center">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dietaryMix} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} label>
                  {dietaryMix.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Top sellers */}
        <Card className="p-5">
          <h3 className="text-[14px] font-semibold text-[var(--color-charcoal)] mb-4">Top sellers</h3>
          {topSellers.length === 0 ? (
            <p className="text-[13px] text-[var(--color-ink-soft)] py-12 text-center">No sales data yet</p>
          ) : (
            <div className="space-y-2">
              {topSellers.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3 text-[13px]">
                  <span className="w-6 text-center font-bold text-[var(--color-ink-soft)]">{i + 1}</span>
                  <span className="flex-1 truncate font-medium text-[var(--color-charcoal)]">{s.name}</span>
                  <span className="text-[var(--color-saffron-deep)] font-semibold">{s.qty} sold</span>
                  <span className="text-[var(--color-ink-muted)]">{rupees(s.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Busiest hours list */}
      {busiestHours.length > 0 && (
        <Card className="p-5">
          <h3 className="text-[14px] font-semibold text-[var(--color-charcoal)] mb-3">Busiest hours</h3>
          <div className="flex flex-wrap gap-2">
            {busiestHours.map((h) => (
              <Chip key={h.hour} tone="saffron">
                <Clock3 size={11} /> {h.hour} — {h.orders} orders
              </Chip>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
