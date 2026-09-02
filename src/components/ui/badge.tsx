import * as React from 'react';
import { cn } from '@/lib/utils';

const Badge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-white/10 text-white/80',
    success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    error: 'bg-red-500/20 text-red-300 border border-red-500/30',
    info: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  };
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = 'Badge';

export { Badge };
