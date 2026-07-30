interface VegIndicatorProps {
  veg: boolean;
  size?: 'sm' | 'md';
}

export default function VegIndicator({ veg, size = 'md' }: VegIndicatorProps) {
  const dim = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const dot = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <div
      className={`${dim} border-2 rounded-sm flex items-center justify-center flex-shrink-0`}
      style={{ borderColor: veg ? '#0F8A0F' : '#E23744' }}
      title={veg ? 'Vegetarian' : 'Non-Vegetarian'}
    >
      <div
        className={`${dot} rounded-full`}
        style={{ backgroundColor: veg ? '#0F8A0F' : '#E23744' }}
      />
    </div>
  );
}
