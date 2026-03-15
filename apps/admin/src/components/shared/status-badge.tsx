import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  draft: 'bg-amber-100 text-amber-800 border-amber-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  refunded: 'bg-purple-100 text-purple-800 border-purple-200',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status.toLowerCase()] ?? 'bg-gray-100 text-gray-800 border-gray-200';
  return (
    <Badge variant="outline" className={cn(style, 'capitalize', className)}>
      {status}
    </Badge>
  );
}
