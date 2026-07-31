import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { Button, IconButton } from './primitives';
import { cx } from '../../utils';

/**
 * Overlay primitives.
 *
 * `Sheet` is responsive by design: it rises from the bottom on phones (where a
 * wide dialog would be unusable) and settles as a centred panel from the `sm`
 * breakpoint up. Both share one focus-trap and escape-to-close implementation.
 */

function useOverlayBehaviour(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocus.current = document.activeElement as HTMLElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    // Move focus into the panel so keyboard users land inside it.
    const focusTimer = window.setTimeout(() => {
      const target = ref.current?.querySelector<HTMLElement>(
        '[data-autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      target?.focus();
    }, 60);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;

      const focusable = Array.from(
        ref.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      window.clearTimeout(focusTimer);
      restoreFocus.current?.focus?.();
    };
  }, [open, onClose]);

  return ref;
}

function Scrim({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-40 bg-[#2b2113]/45 backdrop-blur-[2px]"
    />
  );
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  /** Sticky action row pinned to the bottom of the panel. */
  footer?: ReactNode;
  size?: 'md' | 'lg';
}

export function Sheet({ open, onClose, title, description, children, footer, size = 'md' }: SheetProps) {
  const ref = useOverlayBehaviour(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <>
          <Scrim onClose={onClose} />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 40, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={cx(
              'fixed z-50 bg-[var(--color-cream)] flex flex-col shadow-warm-lg',
              // Phone: bottom sheet. Tablet and up: centred panel.
              'inset-x-0 bottom-0 max-h-[88vh] rounded-t-[22px] border-t border-[var(--color-beige)]',
              'sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
              'sm:rounded-[18px] sm:border sm:max-h-[85vh] sm:w-[calc(100%-3rem)]',
              size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-md',
            )}
          >
            {/* Grab handle, phone only */}
            <div aria-hidden className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-[var(--color-beige)]" />
            </div>

            {title && (
              <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-3 sm:pt-5 shrink-0">
                <div className="min-w-0">
                  <h2 className="text-[17px] font-semibold text-[var(--color-charcoal)]">{title}</h2>
                  {description && (
                    <p className="text-[13px] text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
                <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1 shrink-0">
                  <X size={18} />
                </IconButton>
              </div>
            )}

            <div className="overflow-y-auto thin-scrollbar px-5 pb-5 flex-1">{children}</div>

            {footer && (
              <div className="shrink-0 border-t border-[var(--color-beige)] bg-[var(--color-cream)] px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:rounded-b-[18px]">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Side drawer — used for the landing cafe preview and the counter order detail. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useOverlayBehaviour(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <>
          <Scrim onClose={onClose} />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 44 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 36 }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className={cx(
              'fixed z-50 bg-[var(--color-cream)] flex flex-col shadow-warm-lg',
              'inset-x-0 bottom-0 max-h-[88vh] rounded-t-[22px] border-t border-[var(--color-beige)]',
              // From `sm` up it docks to the right edge, full height.
              'sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:w-[420px] sm:max-h-none sm:rounded-none sm:rounded-l-[20px] sm:border-l sm:border-t-0',
            )}
          >
            <div aria-hidden className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-[var(--color-beige)]" />
            </div>

            {title && (
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--color-beige)] shrink-0">
                <h2 className="text-[16px] font-semibold text-[var(--color-charcoal)]">{title}</h2>
                <IconButton label="Close" onClick={onClose} className="-mr-2">
                  <X size={18} />
                </IconButton>
              </div>
            )}

            <div className="overflow-y-auto thin-scrollbar flex-1">{children}</div>

            {footer && (
              <div className="shrink-0 border-t border-[var(--color-beige)] px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      description={body}
      footer={
        <div className="flex gap-2.5">
          <Button variant="secondary" fullWidth onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            fullWidth
            data-autofocus
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="pb-1" />
    </Sheet>
  );
}
