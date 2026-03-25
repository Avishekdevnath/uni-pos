'use client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;        // % change vs previous period (positive = up, negative = down)
  trendLabel?: string;  // e.g. "vs last period"
  description?: string;
  accent?: 'default' | 'success' | 'warning' | 'danger';
  isLoading?: boolean;
}

const accentMap = {
  default: {
    icon: 'text-primary bg-primary/10',
    badge: 'bg-primary/10 text-primary',
  },
  success: {
    icon: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  },
  warning: {
    icon: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  },
  danger: {
    icon: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950',
    badge: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  },
};

export function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel = 'vs last period',
  description,
  accent = 'default',
  isLoading,
}: KpiCardProps) {
  if (isLoading) {
    return (
      <div className="p-5 h-full flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  const colors = accentMap[accent];

  const TrendIcon =
    trend === undefined || trend === 0
      ? Minus
      : trend > 0
        ? TrendingUp
        : TrendingDown;

  const trendColor =
    trend === undefined || trend === 0
      ? 'text-muted-foreground'
      : trend > 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-600 dark:text-red-400';

  return (
    <div className="p-5 h-full flex flex-col justify-between gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={cn('p-2 rounded-xl', colors.icon)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Value */}
      <div>
        <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Trend */}
      {trend !== undefined && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
          <TrendIcon className="h-3 w-3" />
          <span>{Math.abs(trend).toFixed(1)}%</span>
          <span className="text-muted-foreground font-normal">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
