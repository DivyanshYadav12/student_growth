import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-transparent px-2.5 py-1 text-xs font-medium leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border-border text-foreground',
        success: 'bg-emerald-500/10 text-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
        warning: 'bg-amber-500/10 text-amber-300 dark:bg-amber-950 dark:text-amber-300',
        info: 'bg-sky-500/10 text-sky-300 dark:bg-sky-950 dark:text-sky-300',
        muted: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants> & {
  /** Backwards-compatible semantic tone used by the first frontend iteration. */
  tone?: 'default' | 'success' | 'warning' | 'info' | 'muted';
};

function Badge({ className, variant, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant: tone ?? variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
