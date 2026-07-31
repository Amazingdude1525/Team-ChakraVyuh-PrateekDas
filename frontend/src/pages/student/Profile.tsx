import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle, LogOut, Mail, RotateCcw } from 'lucide-react';
import {
  Button,
  Card,
  Field,
  Input,
  JaaliDivider,
  SectionHeading,
  Select,
  Switch,
} from '../../components/ui/primitives';
import { ConfirmDialog } from '../../components/ui/Overlay';
import { useStore } from '../../store/useStore';
import { cx } from '../../utils';
import type { DietType } from '../../types';

const PICKUP_LOCATIONS = [
  'AB-1, Ground Floor',
  'AB-1, Second Floor',
  'AB-2, Ground Floor',
  'Special Block, Foyer',
  'Library entrance',
  'Hostel Block A',
  'Hostel Block C',
];

export default function Profile() {
  const navigate = useNavigate();
  const student = useStore((s) => s.student);
  const updateStudent = useStore((s) => s.updateStudent);
  const signOut = useStore((s) => s.signOut);
  const resetPrototype = useStore((s) => s.resetPrototype);

  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const loginStudent = useStore((s) => s.loginStudent);

  if (!student) {
    loginStudent();
    return null;
  }

  const initials = student.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-5 space-y-5">
      {/* Identity */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <span className="w-16 h-16 rounded-full bg-[var(--color-charcoal)] text-[var(--color-saffron)] font-display text-[24px] flex items-center justify-center shrink-0">
            {initials}
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-[24px] leading-tight text-[var(--color-charcoal)] truncate">
              {student.name}
            </h1>
            <p className="text-[12.5px] text-[var(--color-ink-muted)] flex items-center gap-1.5 mt-1 truncate">
              <Mail size={12} className="shrink-0" />
              <span className="truncate">{student.email}</span>
            </p>
            <p className="text-[12.5px] text-[var(--color-ink-soft)] mt-0.5">
              {student.registrationNumber}
            </p>
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card className="p-5">
        <SectionHeading title="Your details" subtitle="Used to pre-fill checkout" />

        <div className="space-y-4">
          <Field label="Name" htmlFor="p-name">
            <Input
              id="p-name"
              value={student.name}
              onChange={(e) => updateStudent({ name: e.target.value })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Registration number" htmlFor="p-reg">
              <Input
                id="p-reg"
                value={student.registrationNumber}
                onChange={(e) => updateStudent({ registrationNumber: e.target.value.toUpperCase() })}
              />
            </Field>

            <Field label="Phone" htmlFor="p-phone">
              <Input
                id="p-phone"
                type="tel"
                inputMode="tel"
                value={student.phone}
                onChange={(e) => updateStudent({ phone: e.target.value })}
              />
            </Field>
          </div>

          <Field
            label="Default pickup location"
            htmlFor="p-loc"
            hint="Where you usually collect from, so checkout starts in the right place."
          >
            <Select
              id="p-loc"
              value={student.defaultPickupLocation}
              onChange={(e) => updateStudent({ defaultPickupLocation: e.target.value })}
            >
              {PICKUP_LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {/* Food preferences */}
      <Card className="p-5">
        <SectionHeading title="Food preferences" subtitle="Used to filter what you see first" />

        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[var(--color-charcoal)] mb-2">
              Dietary preference
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 'any', label: 'Show everything' },
                  { value: 'veg', label: 'Vegetarian only' },
                  { value: 'egg', label: 'Eggetarian' },
                  { value: 'nonveg', label: 'Non-vegetarian' },
                ] as { value: DietType | 'any'; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={student.dietPreference === opt.value}
                  onClick={() => updateStudent({ dietPreference: opt.value })}
                  className={cx(
                    'px-3.5 h-9 rounded-full text-[12.5px] border transition-colors',
                    student.dietPreference === opt.value
                      ? 'border-[var(--color-veg)] bg-[var(--color-veg-tint)] text-[var(--color-veg)] font-medium'
                      : 'border-[var(--color-beige)] text-[var(--color-ink-muted)] hover:border-[var(--color-brass)]',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[var(--color-charcoal)] mb-2">
              Spice level
            </label>
            <div className="flex flex-wrap gap-2">
              {(['mild', 'medium', 'hot'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  aria-pressed={student.spicePreference === level}
                  onClick={() => updateStudent({ spicePreference: level })}
                  className={cx(
                    'px-3.5 h-9 rounded-full text-[12.5px] border capitalize transition-colors',
                    student.spicePreference === level
                      ? 'border-[var(--color-terracotta)] bg-[var(--color-terracotta-tint)] text-[var(--color-terracotta)] font-medium'
                      : 'border-[var(--color-beige)] text-[var(--color-ink-muted)] hover:border-[var(--color-brass)]',
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-5 space-y-4">
        <SectionHeading title="Notifications" />
        <Switch
          checked={student.notifyOrderUpdates}
          onChange={(v) => updateStudent({ notifyOrderUpdates: v })}
          label="Order updates"
          description="When the kitchen starts your order and when it is ready to collect."
        />
        <JaaliDivider />
        <Switch
          checked={student.notifyDiscounts}
          onChange={(v) => updateStudent({ notifyDiscounts: v })}
          label="Surplus deals"
          description="When a counter marks down food near closing time."
        />
      </Card>

      {/* Accessibility */}
      <Card className="p-5 space-y-4">
        <SectionHeading title="Accessibility" />
        <Switch
          checked={student.reduceMotion}
          onChange={(v) => {
            updateStudent({ reduceMotion: v });
            toast.success(v ? 'Motion reduced' : 'Motion restored');
          }}
          label="Reduce motion"
          description="Turns off the parallax scene and entrance animations."
        />
        <JaaliDivider />
        <Switch
          checked={student.largeText}
          onChange={(v) => {
            updateStudent({ largeText: v });
            document.documentElement.dataset.largeText = String(v);
          }}
          label="Larger text"
          description="Increases the base text size across every screen."
        />
      </Card>

      {/* Account actions */}
      <Card className="p-5">
        <SectionHeading title="Account" />

        <div className="space-y-2.5">
          <Button variant="secondary" fullWidth onClick={() => setConfirmSignOut(true)}>
            <LogOut size={16} />
            Sign out
          </Button>

          <Button variant="ghost" fullWidth onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} />
            Reset prototype data
          </Button>
        </div>

        <div className="flex items-start gap-2.5 mt-4 p-3 rounded-[11px] bg-[var(--color-paper)]">
          <AlertTriangle size={15} className="text-[var(--color-brass)] shrink-0 mt-px" />
          <p className="text-[11.5px] text-[var(--color-ink-muted)] leading-relaxed">
            Resetting clears every order, review, favourite and menu edit stored in this browser and
            puts the demo data back to its starting state.
          </p>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        onConfirm={() => {
          signOut();
          navigate('/', { replace: true });
        }}
        title="Sign out?"
        body="Your cart and orders stay in this browser, so signing back in picks up where you left off."
        confirmLabel="Sign out"
      />

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetPrototype();
          document.documentElement.dataset.largeText = 'false';
          toast.success('Prototype reset');
          navigate('/', { replace: true });
        }}
        title="Reset everything?"
        body="This wipes orders, reviews, favourites, menu edits and staff changes from this browser. It cannot be undone."
        confirmLabel="Reset it all"
        destructive
      />
    </div>
  );
}
