type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'accent' | 'default';

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-pos-green/10 text-pos-green border-pos-green/20',
  red: 'bg-pos-red/10 text-pos-red border-pos-red/20',
  amber: 'bg-pos-amber/10 text-pos-amber border-pos-amber/20',
  blue: 'bg-pos-blue/10 text-pos-blue border-pos-blue/20',
  accent: 'bg-accent/10 text-accent border-accent/20',
  default: 'bg-surface3 text-text2 border-border2',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide border ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
