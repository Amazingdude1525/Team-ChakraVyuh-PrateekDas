import { forwardRef } from 'react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { Minus, Plus, Star } from 'lucide-react';
import { cx } from '../../utils';
import type { CrowdLevel, DietType, OrderStatus } from '../../types';
import { CROWD_COPY } from '../../utils';

/* ------------------------------------------------------------------ Button */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-saffron)] text-[var(--color-charcoal)] hover:bg-[var(--color-saffron-deep)] shadow-warm font-medium',
  secondary:
    'bg-[var(--color-cream)] text-[var(--color-charcoal)] border border-[var(--color-beige)] hover:border-[var(--color-brass)] hover:bg-[var(--color-paper)]',
  ghost: 'bg-transparent text-[var(--color-ink-muted)] hover:bg-[var(--color-sand)] hover:text-[var(--color-charcoal)]',
  danger: 'bg-[var(--color-wine)] text-white hover:brightness-110 shadow-warm',
  quiet: 'bg-[var(--color-sand)] text-[var(--color-charcoal)] hover:bg-[var(--color-beige-soft)]',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[13px] gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-13 px-6 text-base gap-2.5',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center rounded-[10px] transition-all duration-200 select-none',
        'disabled:opacity-45 disabled:cursor-not-allowed active:scale-[0.98]',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
        />
      )}
      {children}
    </button>
  );
});

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: ButtonVariant;
}

export function IconButton({ label, variant = 'ghost', className, children, ...rest }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 active:scale-95',
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------- Card */

export function Card({
  className,
  children,
  as: Tag = 'div',
  ...rest
}: { className?: string; children: ReactNode; as?: 'div' | 'article' | 'section' } & Record<string, unknown>) {
  return (
    <Tag
      className={cx(
        'bg-[var(--color-cream)] border border-[var(--color-beige)] rounded-[16px] shadow-warm',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------- Chip */

export function Chip({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'saffron' | 'veg' | 'wine' | 'terracotta' | 'brass';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-[var(--color-sand)] text-[var(--color-ink-muted)]',
    saffron: 'bg-[var(--color-saffron-tint)] text-[var(--color-saffron-deep)]',
    veg: 'bg-[var(--color-veg-tint)] text-[var(--color-veg)]',
    wine: 'bg-[var(--color-wine-tint)] text-[var(--color-wine)]',
    terracotta: 'bg-[var(--color-terracotta-tint)] text-[var(--color-terracotta)]',
    brass: 'bg-[#f6efe1] text-[var(--color-brass)]',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- Diet mark */

const DIET_STYLE: Record<DietType, { color: string; label: string }> = {
  veg: { color: 'var(--color-veg)', label: 'Vegetarian' },
  egg: { color: 'var(--color-egg)', label: 'Contains egg' },
  nonveg: { color: 'var(--color-nonveg)', label: 'Non-vegetarian' },
};

export function DietMark({ diet, className }: { diet: DietType; className?: string }) {
  const s = DIET_STYLE[diet];
  return (
    <span
      role="img"
      aria-label={s.label}
      title={s.label}
      style={{ color: s.color, borderColor: s.color }}
      className={cx('diet-mark', diet === 'nonveg' && 'diet-mark-nonveg', className)}
    />
  );
}

/* ------------------------------------------------------------- Status pill */

const STATUS_STYLE: Record<OrderStatus, { label: string; className: string }> = {
  placed: { label: 'Placed', className: 'bg-[var(--color-saffron-tint)] text-[var(--color-saffron-deep)]' },
  preparing: { label: 'Preparing', className: 'bg-[var(--color-terracotta-tint)] text-[var(--color-terracotta)]' },
  ready: { label: 'Ready for pickup', className: 'bg-[var(--color-veg-tint)] text-[var(--color-veg)]' },
  collected: { label: 'Collected', className: 'bg-[var(--color-sand)] text-[var(--color-ink-muted)]' },
  cancelled: { label: 'Cancelled', className: 'bg-[var(--color-wine-tint)] text-[var(--color-wine)]' },
};

export function StatusPill({ status, className }: { status: OrderStatus; className?: string }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={cx(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold',
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  );
}

/* -------------------------------------------------------------- Crowd chip */

export function CrowdChip({ level, showHint }: { level: CrowdLevel; showHint?: boolean }) {
  const styles: Record<CrowdLevel, string> = {
    low: 'bg-[var(--color-veg-tint)] text-[var(--color-veg)]',
    moderate: 'bg-[var(--color-saffron-tint)] text-[var(--color-saffron-deep)]',
    busy: 'bg-[var(--color-wine-tint)] text-[var(--color-wine)]',
  };
  const dots: Record<CrowdLevel, number> = { low: 1, moderate: 2, busy: 3 };

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium',
        styles[level],
      )}
      title={CROWD_COPY[level].hint}
    >
      <span aria-hidden className="flex gap-[2px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-current"
            style={{ height: 6 + i * 3, opacity: i < dots[level] ? 1 : 0.22 }}
          />
        ))}
      </span>
      {CROWD_COPY[level].label}
      {showHint && <span className="font-normal opacity-80">· {CROWD_COPY[level].hint}</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ Rating */

export function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-[var(--color-ink-muted)]">
      <Star size={13} className="fill-[var(--color-saffron)] text-[var(--color-saffron)]" />
      <span className="font-semibold text-[var(--color-charcoal)]">{rating.toFixed(1)}</span>
      {count != null && <span>({count.toLocaleString('en-IN')})</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ Inputs */

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: string }>(
  function Input({ className, error, ...rest }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={!!error}
        className={cx(
          'w-full h-11 px-3.5 rounded-[10px] bg-[var(--color-cream)] text-[var(--color-charcoal)]',
          'border transition-colors placeholder:text-[var(--color-ink-soft)]',
          error ? 'border-[var(--color-wine)]' : 'border-[var(--color-beige)] focus:border-[var(--color-saffron)]',
          className,
        )}
        {...rest}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cx(
          'w-full px-3.5 py-2.5 rounded-[10px] bg-[var(--color-cream)] text-[var(--color-charcoal)] text-sm',
          'border border-[var(--color-beige)] focus:border-[var(--color-saffron)] transition-colors resize-y',
          'placeholder:text-[var(--color-ink-soft)]',
          className,
        )}
        {...rest}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={cx(
          'w-full h-11 px-3 rounded-[10px] bg-[var(--color-cream)] text-[var(--color-charcoal)] text-sm',
          'border border-[var(--color-beige)] focus:border-[var(--color-saffron)] transition-colors',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    );
  },
);

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-[var(--color-charcoal)]">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] text-[var(--color-wine)]">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-[var(--color-ink-soft)]">{hint}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ Switch */

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 text-left group"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[var(--color-charcoal)]">{label}</span>
        {description && (
          <span className="block text-[12px] text-[var(--color-ink-soft)] mt-0.5">{description}</span>
        )}
      </span>
      <span
        aria-hidden
        className={cx(
          'relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200',
          checked ? 'bg-[var(--color-veg)]' : 'bg-[var(--color-beige)]',
        )}
      >
        <span
          className={cx(
            'absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-[26px]' : 'translate-x-[3px]',
          )}
        />
      </span>
    </button>
  );
}

/* ------------------------------------------------------- Segmented control */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cx(
        'inline-flex p-1 gap-1 rounded-[12px] bg-[var(--color-sand)] border border-[var(--color-beige)]',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cx(
              'rounded-[9px] font-medium transition-all duration-200 whitespace-nowrap',
              size === 'sm' ? 'px-3 h-8 text-[12px]' : 'px-4 h-9 text-[13px]',
              active
                ? 'bg-[var(--color-cream)] text-[var(--color-charcoal)] shadow-warm'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-charcoal)]',
            )}
          >
            {opt.label}
            {opt.count != null && (
              <span className={cx('ml-1.5 tabular-nums', active ? 'opacity-70' : 'opacity-55')}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------- Stepper */

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 20,
  size = 'md',
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'h-8' : 'h-9';
  const btn = size === 'sm' ? 'w-8' : 'w-9';
  return (
    <div
      className={cx(
        'inline-flex items-center rounded-[10px] border border-[var(--color-saffron)] bg-[var(--color-saffron-tint)] overflow-hidden',
        dim,
      )}
    >
      <button
        type="button"
        aria-label="Reduce quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cx(
          btn,
          'h-full flex items-center justify-center text-[var(--color-saffron-deep)] hover:bg-[var(--color-saffron)]/25 disabled:opacity-40 transition-colors',
        )}
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <span className="min-w-[24px] text-center text-sm font-semibold text-[var(--color-charcoal)] tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cx(
          btn,
          'h-full flex items-center justify-center text-[var(--color-saffron-deep)] hover:bg-[var(--color-saffron)]/25 disabled:opacity-40 transition-colors',
        )}
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* -------------------------------------------------------- Layout furniture */

export function SectionHeading({
  title,
  subtitle,
  action,
  serif,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  serif?: boolean;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-3">
      <div className="min-w-0">
        <h2
          className={cx(
            'text-[var(--color-charcoal)]',
            serif ? 'font-display text-[26px] leading-tight' : 'text-[17px] font-semibold',
          )}
        >
          {title}
        </h2>
        {subtitle && <p className="text-[13px] text-[var(--color-ink-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function JaaliDivider({ className }: { className?: string }) {
  return <div aria-hidden className={cx('jaali-divider w-full', className)} />;
}

/* -------------------------------------------------------- States: skeleton */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx('shimmer rounded-[10px]', className)} />;
}

export function CardSkeleton() {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-11 h-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </Card>
  );
}

/* ----------------------------------------------------------- Empty / error */

export function EmptyState({
  icon,
  title,
  body,
  action,
  compact,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cx('text-center', compact ? 'py-8 px-4' : 'py-14 px-6')}>
      <div className="w-14 h-14 mx-auto rounded-full bg-[var(--color-sand)] flex items-center justify-center text-[var(--color-brass)] mb-4">
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold text-[var(--color-charcoal)]">{title}</h3>
      <p className="text-[13px] text-[var(--color-ink-muted)] mt-1.5 max-w-sm mx-auto leading-relaxed">
        {body}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
