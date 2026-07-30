import { getCrowdLevel, CROWD_CONFIG } from '../../lib/constants';

interface CrowdBadgeProps {
  activeOrderCount: number;
  compact?: boolean;
}

export default function CrowdBadge({ activeOrderCount, compact = false }: CrowdBadgeProps) {
  const level = getCrowdLevel(activeOrderCount);
  const config = CROWD_CONFIG[level];

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        {config.emoji}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.emoji} {config.label}
    </span>
  );
}
