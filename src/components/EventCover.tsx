import { eventInitials, formatDateBadge } from '@/lib/format';

interface EventCoverProps {
  name: string;
  imageUrl?: string | null;
  date?: string | null;
  className?: string;
}

/**
 * Shared event cover: photo or brand gradient with the event initials,
 * plus the short date badge on the top-left. Used across home, event lists
 * and the buyer dashboard so covers always look identical.
 */
export function EventCover({ name, imageUrl, date, className = 'aspect-[16/10]' }: EventCoverProps) {
  return (
    <div className={`relative ${className}`}>
      {imageUrl ? (
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          role="img"
          aria-label={name}
        />
      ) : (
        <div className="absolute inset-0 brand-hero-gradient flex items-center justify-center">
          <span className="font-display font-bold text-4xl text-primary-foreground/90">{eventInitials(name)}</span>
        </div>
      )}
      {date && (
        <span className="absolute top-3 left-3 rounded-full bg-card/95 px-3 py-1 text-xs font-display font-semibold text-foreground shadow">
          {formatDateBadge(date)}
        </span>
      )}
    </div>
  );
}
