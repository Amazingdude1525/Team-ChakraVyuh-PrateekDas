import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  Copy,
  Link2,
  Lock,
  Plus,
  Send,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  Button,
  Card,
  Chip,
  DietMark,
  EmptyState,
  JaaliDivider,
  SectionHeading,
} from '../../components/ui/primitives';
import { ConfirmDialog, Sheet } from '../../components/ui/Overlay';
import { CafeMark } from '../../components/student/cards';
import { useBranch, useMenuItems, useTick } from '../../hooks';
import { useStore } from '../../store/useStore';
import { cx, rupees } from '../../utils';
import NotFound from '../public/NotFound';

/** Names used when simulating someone else joining the group. */
const GUESTS = ['Rohan Gupta', 'Meera Suresh', 'Ananya Joshi', 'Karthik Menon', 'Ishita Banerjee'];

export default function GroupOrder() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const now = useTick(1000);

  const group = useStore((s) => s.groupOrders.find((g) => g.id === groupId));
  const student = useStore((s) => s.student);
  const joinGroupOrder = useStore((s) => s.joinGroupOrder);
  const addGroupItem = useStore((s) => s.addGroupItem);
  const removeGroupItem = useStore((s) => s.removeGroupItem);
  const lockGroupOrder = useStore((s) => s.lockGroupOrder);
  const placeOrder = useStore((s) => s.placeOrder);

  const branch = useBranch(group?.branchId);
  const items = useMenuItems(group?.branchId);

  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const msLeft = group ? new Date(group.expiresAt).getTime() - now : 0;
  const expired = msLeft <= 0;

  // The window closing locks the group, exactly as a real timer would.
  useEffect(() => {
    if (group && !group.locked && expired) lockGroupOrder(group.id);
  }, [group, expired, lockGroupOrder]);

  const byParticipant = useMemo(() => {
    if (!group) return [];
    return group.participants.map((p) => ({
      participant: p,
      lines: group.items.filter((i) => i.participantName === p.name),
    }));
  }, [group]);

  const total = useMemo(
    () => (group ? group.items.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0) : 0),
    [group],
  );

  if (!group || !branch) return <NotFound />;

  const minutes = Math.max(0, Math.floor(msLeft / 60000));
  const seconds = Math.max(0, Math.floor((msLeft % 60000) / 1000));
  const canEdit = !group.locked && !expired && !group.submittedOrderId;

  function copyLink() {
    const url = `${window.location.origin}/app/group-order/${group!.id}`;
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true);
        toast.success('Link copied — send it to your group');
        setTimeout(() => setCopied(false), 2000);
      },
      () => toast.error('Could not copy — the code is on screen'),
    );
  }

  function simulateJoin() {
    const taken = new Set(group!.participants.map((p) => p.name));
    const next = GUESTS.find((g) => !taken.has(g));
    if (!next) {
      toast('Everyone has already joined');
      return;
    }
    joinGroupOrder(group!.id, next);
    toast.success(`${next.split(' ')[0]} joined the group`);
  }

  function submit() {
    const order = placeOrder({
      branchId: group!.branchId,
      studentName: group!.payerName,
      phone: student?.phone ?? '98765 43210',
      pickupLocation: student?.defaultPickupLocation ?? 'AB-1, Ground Floor',
      paymentMethod: 'upi',
      cutlery: true,
      items: group!.items,
      isGroupOrder: true,
      groupId: group!.id,
      note: `Group order — ${group!.participants.length} people`,
    });
    lockGroupOrder(group!.id);
    toast.success(`Group order placed — token ${order.token}`);
    navigate(`/app/order-confirmed/${order.id}`);
  }

  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-5 space-y-5">
      <SectionHeading
        title="Group order"
        subtitle="One ticket, one token, itemised per person"
        serif
      />

      {/* Code + countdown */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <CafeMark branch={branch} size={48} />

          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-[var(--color-charcoal)] truncate">
              {branch.name}
            </h2>
            <p className="text-[12px] text-[var(--color-ink-soft)] truncate">
              Collect from {branch.pickupPoint}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="px-3 py-2 rounded-[10px] bg-[var(--color-charcoal)] text-[var(--color-saffron)] font-mono font-bold text-[15px] tracking-wider">
              {group.code}
            </div>
            <Button variant="secondary" size="sm" onClick={copyLink}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        </div>

        <JaaliDivider className="my-4" />

        {/* Countdown */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11.5px] text-[var(--color-ink-soft)] mb-0.5">
              {group.submittedOrderId
                ? 'Submitted'
                : group.locked || expired
                  ? 'Window closed'
                  : 'Window closes in'}
            </div>
            <div
              className={cx(
                'font-display text-[26px] leading-none tabular-nums',
                expired || group.locked
                  ? 'text-[var(--color-ink-soft)]'
                  : minutes < 2
                    ? 'text-[var(--color-wine)]'
                    : 'text-[var(--color-charcoal)]',
              )}
            >
              {group.locked || expired
                ? 'Locked'
                : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11.5px] text-[var(--color-ink-soft)] mb-0.5">Running total</div>
            <div className="font-display text-[26px] leading-none text-[var(--color-charcoal)] tabular-nums">
              {rupees(total)}
            </div>
          </div>
        </div>
      </Card>

      {/* Who pays — stated plainly so nobody is surprised at the counter */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-[12px] bg-[var(--color-saffron-tint)]">
        <Wallet size={16} className="text-[var(--color-saffron-deep)] shrink-0 mt-px" />
        <p className="text-[12.5px] text-[var(--color-charcoal)] leading-relaxed">
          <span className="font-medium">{group.payerName} pays the whole bill</span> and collects
          the order. Settle up between yourselves afterwards.
        </p>
      </div>

      {/* Participants */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <h2 className="text-[14px] font-semibold text-[var(--color-charcoal)]">
            {group.participants.length}{' '}
            {group.participants.length === 1 ? 'person' : 'people'} in the group
          </h2>
          {canEdit && (
            <Button size="sm" variant="ghost" onClick={simulateJoin}>
              <UserPlus size={14} />
              Simulate join
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5">
          <AnimatePresence>
            {group.participants.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-[var(--color-paper)] border border-[var(--color-beige)]"
              >
                <span className="w-7 h-7 rounded-full bg-[var(--color-charcoal)] text-[var(--color-saffron)] text-[11px] font-semibold flex items-center justify-center">
                  {p.initials}
                </span>
                <span className="text-[12.5px] text-[var(--color-charcoal)]">
                  {p.name.split(' ')[0]}
                </span>
                {p.isCreator && <Chip tone="saffron">Creator</Chip>}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Card>

      {/* Per-person items */}
      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold text-[var(--color-charcoal)]">
          What everyone is having
        </h2>

        {byParticipant.map(({ participant, lines }) => {
          const personTotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
          return (
            <Card key={participant.id} className="p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-[var(--color-charcoal)] text-[var(--color-saffron)] text-[12px] font-semibold flex items-center justify-center shrink-0">
                    {participant.initials}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[13.5px] font-medium text-[var(--color-charcoal)] truncate">
                      {participant.name}
                    </h3>
                    <p className="text-[11.5px] text-[var(--color-ink-soft)]">
                      {lines.length} {lines.length === 1 ? 'item' : 'items'} · {rupees(personTotal)}
                    </p>
                  </div>
                </div>

                {canEdit && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setAddingFor(participant.name)}
                    className="shrink-0"
                  >
                    <Plus size={14} />
                    Add
                  </Button>
                )}
              </div>

              {lines.length === 0 ? (
                <p className="text-[12.5px] text-[var(--color-ink-soft)] py-2">
                  Nothing added yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {lines.map((line) => (
                    <li key={line.lineId} className="flex items-center gap-2.5">
                      <DietMark diet={line.diet} />
                      <span className="text-[13px] text-[var(--color-charcoal)] min-w-0 flex-1 truncate">
                        {line.quantity}× {line.name}
                        <span className="text-[11.5px] text-[var(--color-ink-soft)]">
                          {' '}
                          ({line.variantLabel})
                        </span>
                      </span>
                      <span className="text-[13px] tabular-nums shrink-0">
                        {rupees(line.unitPrice * line.quantity)}
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => removeGroupItem(group.id, line.lineId)}
                          aria-label={`Remove ${line.name}`}
                          className="text-[var(--color-ink-soft)] hover:text-[var(--color-wine)] shrink-0"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </section>

      {group.items.length === 0 && (
        <Card>
          <EmptyState
            compact
            icon={<Users size={22} />}
            title="Nothing in the group order yet"
            body="Add items under your own name, and share the link so everyone else can do the same."
          />
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {canEdit ? (
          <>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => lockGroupOrder(group.id)}
            >
              <Lock size={16} />
              Lock the order
            </Button>
            <Button
              size="lg"
              fullWidth
              disabled={group.items.length === 0}
              onClick={() => setConfirmSubmit(true)}
            >
              <Send size={16} />
              Submit to kitchen
            </Button>
          </>
        ) : group.submittedOrderId ? (
          <Link to={`/app/orders/${group.submittedOrderId}`} className="w-full">
            <Button size="lg" fullWidth>
              View the order
              <ArrowRight size={16} />
            </Button>
          </Link>
        ) : (
          <Button
            size="lg"
            fullWidth
            disabled={group.items.length === 0}
            onClick={() => setConfirmSubmit(true)}
          >
            <Send size={16} />
            Submit to kitchen
          </Button>
        )}
      </div>

      <Link
        to={`/app/cafe/${branch.id}`}
        className="flex items-center justify-center gap-1.5 text-[12.5px] text-[var(--color-terracotta)] hover:underline"
      >
        <Link2 size={13} />
        Browse the full {branch.shortName} menu
      </Link>

      {/* Add-item sheet */}
      <Sheet
        open={!!addingFor}
        onClose={() => setAddingFor(null)}
        title={addingFor ? `Add for ${addingFor.split(' ')[0]}` : undefined}
        description={`From ${branch.name}`}
        size="lg"
      >
        <div className="space-y-1.5 pb-1">
          {items
            .filter((i) => i.available)
            .slice(0, 40)
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  const v = item.variants[0];
                  addGroupItem(group.id, {
                    itemId: item.id,
                    branchId: item.branchId,
                    name: item.name,
                    variantId: v.id,
                    variantLabel: v.label,
                    unitPrice: v.price,
                    quantity: 1,
                    diet: item.diet,
                    participantName: addingFor!,
                  });
                  toast.success(`${item.name} added for ${addingFor!.split(' ')[0]}`);
                  setAddingFor(null);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-[11px] border border-[var(--color-beige)] hover:border-[var(--color-saffron)] hover:bg-[var(--color-saffron-tint)]/40 transition-colors text-left"
              >
                <DietMark diet={item.diet} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] text-[var(--color-charcoal)] truncate">
                    {item.name}
                  </span>
                  <span className="block text-[11.5px] text-[var(--color-ink-soft)]">
                    {item.variants[0].label} · ~{item.prepMinutes} min
                  </span>
                </span>
                <span className="text-[13.5px] font-semibold shrink-0">
                  {rupees(item.basePrice)}
                </span>
              </button>
            ))}
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={submit}
        title="Send this to the kitchen?"
        body={`${group.items.length} items for ${group.participants.length} people, ${rupees(total)} in total. ${group.payerName} pays and collects. Nothing can be added after this.`}
        confirmLabel="Submit order"
      />
    </div>
  );
}
