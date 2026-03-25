import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  span?: 'default' | 'col-2' | 'row-2' | 'col-2-row-2';
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4',
        'sm:grid-cols-2',
        'xl:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({ children, className, span = 'default' }: BentoCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card text-card-foreground shadow-sm',
        'transition-all duration-200 ease-out',
        'hover:shadow-md hover:scale-[1.01]',
        {
          'sm:col-span-2': span === 'col-2' || span === 'col-2-row-2',
          'sm:row-span-2': span === 'row-2' || span === 'col-2-row-2',
          'xl:col-span-2': span === 'col-2' || span === 'col-2-row-2',
          'xl:row-span-2': span === 'row-2' || span === 'col-2-row-2',
        },
        className,
      )}
    >
      {children}
    </div>
  );
}
